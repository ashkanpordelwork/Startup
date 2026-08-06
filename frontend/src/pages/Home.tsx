import { CSSProperties, useEffect, useState } from "react";
import { ChevronLeft, Plus, Sparkles } from "reicon-react";
import { Link, useNavigate } from "react-router-dom";
import { getPlans } from "../api/client";
import { PlanSummary } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { TRACK_LABELS } from "../lib/trackMeta";
import { toPersianDigits } from "../lib/numerals";

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
      <div className="animate-fade-in-up rounded-xl bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">سلام {user?.name} 👋</h2>
        <p className="mt-2 text-base leading-relaxed text-helper-foreground">
          این‌جا برنامه‌هایی که با چت‌بات ساختی رو می‌بینی. هر وقت خواستی می‌تونی برنامه‌ی جدید هم بسازی.
        </p>
      </div>

      {error && <p className="px-1 text-base text-destructive">{error}</p>}

      <Link
        to="/chat"
        className="flex animate-fade-in-up items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-base font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.97]"
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
