import { useEffect, useState } from "react";
import { ChatRoundDots, ChevronLeft, History, Sparkles } from "reicon-react";
import { Link } from "react-router-dom";
import { getActions } from "../api/client";
import { ActionItem } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { CATEGORY_META, STATUS_META } from "../lib/actionMeta";

function ActionCard({ action }: { action: ActionItem }) {
  const category = CATEGORY_META[action.category];
  const status = STATUS_META[action.status];
  const Icon = category.icon;

  return (
    <Link
      to={`/actions/${action.id}`}
      className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm transition-colors hover:bg-muted"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{action.title}</p>
        <p className="mt-0.5 truncate text-sm text-helper-foreground">{category.label}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
        {status.label}
      </span>
      <ChevronLeft size={18} className="shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActions()
      .then(setActions)
      .catch((e) => setError(e instanceof Error ? e.message : "خطای ناشناخته"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
      <div className="rounded-xl bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">سلام {user?.name} 👋</h2>
        <p className="mt-2 text-base leading-relaxed text-helper-foreground">
          این‌جا برنامه و اقدام‌هایی که چت‌بات برات آماده کرده رو می‌بینی. هر وقت خواستی می‌تونی بیای و ببینی‌شون.
        </p>
      </div>

      {loading && <p className="px-1 text-base text-helper-foreground">در حال بارگذاری...</p>}
      {error && <p className="px-1 text-base text-destructive">{error}</p>}

      {!loading && actions.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl bg-card p-6 text-center shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
            <Sparkles size={28} />
          </span>
          <p className="text-base leading-relaxed text-helper-foreground">
            هنوز برنامه‌ای برات آماده نشده. برو با چت‌بات صحبت کن تا نیازت رو بشناسه و اقدام‌های مناسب رو بهت پیشنهاد بده.
          </p>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground"
          >
            <ChatRoundDots size={18} />
            برو به چت‌بات
          </Link>
        </div>
      )}

      {!loading && actions.length > 0 && (
        <div className="flex flex-col gap-3">
          {actions.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      )}

      <Link
        to="/archive"
        className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm transition-colors hover:bg-muted"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <History size={20} />
        </span>
        <span className="flex-1 font-semibold">آرشیو گفتگوهام</span>
        <ChevronLeft size={18} className="shrink-0 text-muted-foreground" />
      </Link>
    </div>
  );
}
