import { useEffect, useState } from "react";
import { ChevronLeft } from "reicon-react";
import { Link, useParams } from "react-router-dom";
import { getPlan } from "../api/client";
import { PlanDetail as PlanDetailType } from "../api/types";
import { CATEGORY_META, STATUS_META } from "../lib/actionMeta";
import { TRACK_LABELS } from "../lib/trackMeta";
import { toPersianDigits } from "../lib/numerals";

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<PlanDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPlan(id)
      .then(setPlan)
      .catch((e) => setError(e instanceof Error ? e.message : "خطای ناشناخته"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-base text-helper-foreground">در حال بارگذاری...</div>;
  }

  if (!plan) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-base text-destructive">{error ?? "این برنامه پیدا نشد."}</p>
        <Link to="/" className="text-base text-brand">
          برگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
      <div className="rounded-xl bg-card p-5 shadow-sm">
        <span className="inline-block rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-brand">
          {TRACK_LABELS[plan.track] ?? plan.track}
        </span>
        <h1 className="mt-2 text-xl font-semibold leading-snug">{plan.title}</h1>
        <p className="mt-2 text-base leading-relaxed text-helper-foreground">
          این برنامه شامل {toPersianDigits(plan.actions.length)} زیرپلن هستش. روی هرکدوم بزن تا جزئیاتش رو ببینی.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {plan.actions.map((action) => {
          const category = CATEGORY_META[action.category];
          const status = STATUS_META[action.status];
          const Icon = category.icon;
          return (
            <Link
              key={action.id}
              to={`/actions/${action.id}`}
              className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm transition-colors hover:bg-muted/60"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${category.chipClassName}`}>
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{action.title}</p>
                <p className="mt-0.5 truncate text-sm text-helper-foreground">
                  {category.label} · <span className={status.textClassName}>{status.label}</span>
                </p>
              </div>
              <ChevronLeft size={18} className="shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
