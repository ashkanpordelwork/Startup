import { useEffect, useState } from "react";
import { ArrowUp, ChatRoundDots, CheckCircle, CloseCircle } from "reicon-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAction, reportAction } from "../api/client";
import { ActionItem, ReportKind } from "../api/types";
import { Button } from "@/components/ui/button";
import { CATEGORY_META, STATUS_META } from "../lib/actionMeta";
import { toPersianDigits } from "@/lib/numerals";

const REPORT_OPTIONS: { kind: ReportKind; label: string; icon: typeof CheckCircle }[] = [
  { kind: "done", label: "تمومش کردم", icon: CheckCircle },
  { kind: "progress", label: "پیشرفت خوبی داشتم", icon: ArrowUp },
  { kind: "problem", label: "باهاش مشکل دارم", icon: CloseCircle },
  { kind: "limitation", label: "محدودیتی دارم", icon: CloseCircle },
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSubmitting(false);
      setSelectedKind(null);
    }
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-base text-helper-foreground">در حال بارگذاری...</div>;
  }

  if (!action) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-base text-destructive">{error ?? "این اقدام پیدا نشد."}</p>
        <Link to="/profile" className="text-base text-primary">
          برگشت به پروفایل
        </Link>
      </div>
    );
  }

  const category = CATEGORY_META[action.category];
  const status = STATUS_META[action.status];
  const CategoryIcon = category.icon;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
      <div className="rounded-xl bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
            <CategoryIcon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
              {status.label}
            </span>
            <h1 className="mt-2 text-xl font-semibold leading-snug">{action.title}</h1>
          </div>
        </div>
        <p className="mt-3 text-base leading-relaxed text-helper-foreground">{action.summary}</p>
      </div>

      <div className="rounded-xl bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">قدم‌های عملی</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {action.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {toPersianDigits(i + 1)}
              </span>
              <span className="text-base leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">وضعیتت با این اقدام چطوره؟</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPORT_OPTIONS.map((opt) => (
            <Button
              key={opt.kind}
              variant="outline"
              className="gap-1.5 rounded-full border-primary text-sm text-primary hover:bg-secondary"
              disabled={submitting}
              onClick={() => handleReport(opt.kind)}
            >
              <opt.icon size={16} />
              {submitting && selectedKind === opt.kind ? "در حال ثبت..." : opt.label}
            </Button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="اگه توضیح بیشتری داری، اینجا بنویس (اختیاری)..."
          rows={3}
          className="mt-3 w-full resize-none rounded-md border border-input bg-background p-3 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {reply && (
          <div className="mt-3 rounded-bubble rounded-ee-md bg-secondary px-4 py-3 text-base leading-relaxed">
            {reply}
          </div>
        )}
        {error && <p className="mt-2 text-base text-destructive">{error}</p>}
      </div>

      <Button
        variant="outline"
        className="gap-2 border-primary text-primary hover:bg-secondary"
        onClick={() => navigate(`/?actionId=${action.id}&topic=${encodeURIComponent(action.title)}`)}
      >
        <ChatRoundDots size={18} />
        سوال دارم، برو چت‌بات
      </Button>
    </div>
  );
}
