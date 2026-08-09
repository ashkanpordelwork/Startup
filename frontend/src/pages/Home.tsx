import { CSSProperties, useEffect, useState } from "react";
import { ArrowUp, CheckCircle, ChevronLeft, Lifebuoy, Plus, RefreshCircle, Sparkles } from "reicon-react";
import { Link, useNavigate } from "react-router-dom";
import { getPlans, getTodayActions, reportAction } from "../api/client";
import { PlanSummary, ReportKind, TodayAction } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { TRACK_LABELS } from "../lib/trackMeta";
import { toPersianDigits } from "../lib/numerals";

const CHECKIN_OPTIONS: { kind: ReportKind; label: string; icon: typeof CheckCircle; primary: boolean }[] = [
  { kind: "done", label: "انجامش دادم", icon: CheckCircle, primary: true },
  { kind: "progress", label: "در حال انجامه", icon: ArrowUp, primary: true },
  { kind: "struggling", label: "سخته", icon: Lifebuoy, primary: false },
];

/**
 * Centralized daily check-in — every active action across all plans, reportable
 * with one tap, without opening each action's own page. (product decision §6.2)
 */
function CheckInCard() {
  const [actions, setActions] = useState<TodayAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    getTodayActions()
      .then(setActions)
      .catch(() => {
        /* silently skip the card if this fails — Home's plan list is the source of truth */
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleReport(action: TodayAction, kind: ReportKind) {
    setReportingId(action.id);
    try {
      const result = await reportAction(action.id, kind);
      setReplies((r) => ({ ...r, [action.id]: result.reply }));
      if (kind === "done") {
        setTimeout(() => setActions((prev) => prev.filter((a) => a.id !== action.id)), 900);
      } else if (result.action) {
        const updated = result.action;
        setActions((prev) => prev.map((a) => (a.id === action.id ? { ...a, ...updated } : a)));
      }
    } catch {
      // non-fatal: user can retry the tap, or report from the action's own detail page
    } finally {
      setReportingId(null);
    }
  }

  if (loading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }
  if (actions.length === 0) return null;

  return (
    <div className="glass-dark animate-fade-in-up rounded-xl p-5" style={{ borderRadius: "var(--radius-lg)" }}>
      <p className="mb-1 text-base font-bold">چک‌این امروز</p>
      <p className="mb-4 text-xs opacity-70">
        {toPersianDigits(actions.length)} اقدام فعال داری — هرکدوم رو که انجام دادی، همین‌جا بزن
      </p>
      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.id} className="space-y-2 border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
            <p className="text-sm font-semibold">{action.title}</p>
            <div className="flex flex-wrap gap-2">
              {CHECKIN_OPTIONS.map((opt) => (
                <button
                  key={opt.kind}
                  type="button"
                  disabled={reportingId === action.id}
                  onClick={() => handleReport(action, opt.kind)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    opt.primary ? "bg-white text-primary" : "border border-white/25 text-white/80"
                  }`}
                >
                  {reportingId === action.id ? (
                    <RefreshCircle size={14} className="animate-spin" />
                  ) : (
                    <opt.icon size={14} />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
            {replies[action.id] && <p className="text-xs leading-relaxed opacity-80">{replies[action.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, style }: { plan: PlanSummary; style?: CSSProperties }) {
  return (
    <Link
      to={`/plans/${plan.id}`}
      style={style}
      className="flex animate-fade-in-up items-center gap-3 rounded-xl bg-card p-4 shadow-sm transition-[background-color,transform] duration-150 hover:bg-muted/60 active:scale-[0.98]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand">
        <Sparkles size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{plan.title}</p>
        <p className="mt-0.5 truncate text-sm text-helper-foreground">
          {TRACK_LABELS[plan.track] ?? plan.track} · {toPersianDigits(plan.actionsCount)} اقدام
          {plan.status === "draft" && <span className="text-amber-600"> · پیش‌نویس</span>}
        </p>
      </div>
      <ChevronLeft size={18} className="shrink-0 text-muted-foreground" />
    </Link>
  );
}

function PlanCardSkeleton({ style }: { style?: CSSProperties }) {
  return (
    <div style={style} className="flex animate-fade-in-up items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlans()
      .then((result) => {
        setPlans(result);
        if (result.length === 0) {
          navigate("/chat", { replace: true });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "خطای ناشناخته"))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
      <div className="animate-fade-in-up glass-light rounded-xl p-5" style={{ borderRadius: "var(--radius-lg)" }}>
        <h2 className="text-base font-bold text-foreground">سلام {user?.name}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          این‌جا برنامه‌هایی که با چت‌بات ساختی رو می‌بینی. هر وقت خواستی می‌تونی برنامه‌ی جدید هم بسازی.
        </p>
      </div>

      <CheckInCard />

      {error && <p className="px-1 text-sm text-destructive">{error}</p>}

      <Link
        to="/chat"
        className="flex animate-fade-in-up items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.97]"
        style={{ animationDelay: "60ms" }}
      >
        <Plus size={18} />
        پلن جدید
      </Link>

      <div className="flex flex-col gap-3">
        {loading
          ? [0, 1].map((i) => <PlanCardSkeleton key={i} style={{ animationDelay: `${120 + i * 60}ms` }} />)
          : plans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} style={{ animationDelay: `${120 + i * 60}ms` }} />
            ))}
      </div>
    </div>
  );
}
