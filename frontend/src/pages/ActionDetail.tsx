import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChatRoundDots, CheckCircle, Lifebuoy, RefreshCircle } from "reicon-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAction, reportAction } from "../api/client";
import { ActionItem, ReportKind } from "../api/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_META, STATUS_META } from "../lib/actionMeta";
import { toPersianDigits } from "@/lib/numerals";

const REPORT_OPTIONS: { kind: ReportKind; label: string; icon: typeof CheckCircle }[] = [
  { kind: "done", label: "انجامش دادم", icon: CheckCircle },
  { kind: "progress", label: "دارم پیش می‌رم", icon: ArrowUp },
  { kind: "struggling", label: "سخته، کمکم کن", icon: Lifebuoy },
];

export default function ActionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [action, setAction] = useState<ActionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [selectedKind, setSelectedKind] = useState<ReportKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);
  const updateFlashTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!id) return;
    getAction(id)
      .then(setAction)
      .catch((e) => setError(e instanceof Error ? e.message : "خطای ناشناخته"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReport(kind: ReportKind) {
    if (!id) return;
    setSelectedKind(kind);
    setSubmitting(true);
    setError(null);
    try {
      const result = await reportAction(id, kind, note.trim() || undefined);
      setReply(result.reply);
      const updated = await getAction(id);
      setAction(updated);
      setNote("");
      if (kind === "struggling") {
        setJustUpdated(true);
        clearTimeout(updateFlashTimer.current);
        updateFlashTimer.current = setTimeout(() => setJustUpdated(false), 1200);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSubmitting(false);
      setSelectedKind(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="animate-fade-in-up rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
          <Skeleton className="mt-4 h-4 w-full" />
        </div>
        <div className="animate-fade-in-up rounded-xl bg-card p-5 shadow-sm" style={{ animationDelay: "80ms" }}>
          <Skeleton className="h-4 w-28" />
          <div className="mt-3 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-base text-destructive">{error ?? "این اقدام پیدا نشد."}</p>
        <Link to="/" className="text-base text-brand">
          برگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const category = CATEGORY_META[action.category];
  const status = STATUS_META[action.status];
  const CategoryIcon = category.icon;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
      <div className="animate-fade-in-up rounded-xl bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${category.chipClassName}`}>
            <CategoryIcon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
              {status.label}
            </span>
            <h1 className="mt-2 text-lg font-semibold leading-snug">{action.title}</h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-helper-foreground transition-opacity duration-300">
          {action.summary}
        </p>
      </div>

      <div
        className={`animate-fade-in-up rounded-xl bg-card p-5 shadow-sm transition-shadow duration-500 ${
          justUpdated ? "ring-2 ring-brand/40" : ""
        }`}
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="text-sm font-semibold">قدم‌های عملی</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {action.steps.map((step, i) => (
            <li key={`${step}-${i}`} className="flex animate-fade-in-up items-start gap-3" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {toPersianDigits(i + 1)}
              </span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="animate-fade-in-up rounded-xl bg-card p-5 shadow-sm" style={{ animationDelay: "140ms" }}>
        <h2 className="text-sm font-semibold">وضعیتت با این اقدام چطوره؟</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPORT_OPTIONS.map((opt) => (
            <Button
              key={opt.kind}
              variant="outline"
              className="gap-1.5 rounded-full text-sm"
              disabled={submitting}
              onClick={() => handleReport(opt.kind)}
            >
              {submitting && selectedKind === opt.kind ? (
                <RefreshCircle size={16} className="animate-spin" />
              ) : (
                <opt.icon size={16} />
              )}
              {submitting && selectedKind === opt.kind ? "در حال ثبت..." : opt.label}
            </Button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="اگه توضیح بیشتری داری، اینجا بنویس (اختیاری)..."
          rows={3}
          className="mt-3 w-full resize-none rounded-md border border-input bg-background p-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {reply && (
          <div className="mt-3 animate-fade-in-up rounded-bubble bg-secondary px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
            {reply}
          </div>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <Button
        variant="outline"
        className="animate-fade-in-up gap-2"
        style={{ animationDelay: "200ms" }}
        onClick={() => navigate(`/chat?actionId=${action.id}&topic=${encodeURIComponent(action.title)}`)}
      >
        <ChatRoundDots size={18} />
        سوال دارم، برو چت‌بات
      </Button>
    </div>
  );
}
