import { useEffect, useState } from "react";
import { ChevronLeft } from "reicon-react";
import { Link, useParams } from "react-router-dom";
import { getPlan } from "../api/client";
import { PlanDetail as PlanDetailType } from "../api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_META, STATUS_META } from "../lib/actionMeta";
import { TRACK_LABELS } from "../lib/trackMeta";
import { toPersianDigits } from "../lib/numerals";

function ActionRowSkeleton({ delay }: { delay: number }) {
  return (
    <div className="flex animate-fade-in-up items-center gap-3 rounded-xl bg-card p-4 shadow-sm" style={{ animationDelay: `${delay}ms` }}>
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

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
    return (
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="animate-fade-in-up rounded-xl bg-card p-5 shadow-sm">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="mt-3 h-6 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <ActionRowSkeleton key={i} delay={80 + i * 60} />
          ))}
        </div>
      </div>
    );
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
      <div className="animate-fade-in-up rounded-xl bg-card p-5 shadow-sm">
        <span className="inline-block rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-brand">
          {TRACK_LABELS[plan.track] ?? plan.track}
        </span>
        <h1 className="mt-2 text-xl font-semibold leading-snug">{plan.title}</h1>
        <p className="mt-2 text-base leading-relaxed text-helper-foreground">
          این برنامه شامل {toPersianDigits(plan.actions.length)} زیرپلن هستش. روی هرکدوم بزن تا جزئیاتش رو ببینی.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {plan.actions.map((action, i) => {
          const category = CATEGORY_META[action.category];
          const status = STATUS_META[action.status];
          const Icon = category.icon;
          return (
            <Link
              key={action.id}
              to={`/actions/${action.id}`}
              style={{ animationDelay: `${80 + i * 60}ms` }}
              className="flex animate-fade-in-up items-center gap-3 rounded-xl bg-card p-4 shadow-sm transition-[background-color,transform] duration-150 hover:bg-muted/60 active:scale-[0.98]"
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
