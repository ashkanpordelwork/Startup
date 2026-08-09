import { useEffect, useState } from "react";
import { Bell, CheckCircle, RefreshCircle, Sparkles, X } from "reicon-react";
import { applySuggestion, declineSuggestion, getSuggestions } from "../api/client";
import { Suggestion } from "../api/types";
import { Button } from "@/components/ui/button";

/**
 * Interim home for pattern-detected suggestions. The full notification system
 * (single-per-day priority ordering, SMS for billing events, etc.) isn't built
 * yet — see implementation-checklist.md — so for now this page doubles as the
 * dedicated "suggestion" surface described in product-business-decisions §6.2.
 */
export default function Notifications() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [resultText, setResultText] = useState<Record<string, string>>({});

  useEffect(() => {
    getSuggestions()
      .then(setSuggestions)
      .catch(() => {
        /* non-fatal — empty state below still renders correctly */
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleApply(s: Suggestion) {
    setBusyId(s.actionId);
    try {
      const result = await applySuggestion(s.actionId);
      setResultText((r) => ({ ...r, [s.actionId]: result.reply }));
      setResolvedIds((ids) => [...ids, s.actionId]);
    } catch {
      // leave the card as-is so the user can retry
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(s: Suggestion) {
    setBusyId(s.actionId);
    try {
      await declineSuggestion(s.actionId);
      setResolvedIds((ids) => [...ids, s.actionId]);
    } finally {
      setBusyId(null);
    }
  }

  const pending = suggestions.filter((s) => !resolvedIds.includes(s.actionId));

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <RefreshCircle size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-brand">
          <Bell size={28} />
        </span>
        <p className="text-sm leading-relaxed text-helper-foreground">فعلاً پیشنهاد تازه‌ای نداری — همه‌چیز روبه‌راهه.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
      {pending.map((s) => (
        <div key={s.actionId} className="glass-light space-y-3 rounded-xl p-4" style={{ borderRadius: "var(--radius-lg)" }}>
          <div className="flex items-start gap-2.5">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-brand" />
            <p className="text-sm leading-relaxed text-foreground">{s.noticedText}</p>
          </div>
          <p className="rounded-lg bg-secondary px-3 py-2 text-xs leading-relaxed text-secondary-foreground">
            پیشنهاد: {s.previewSummary}
          </p>
          {resultText[s.actionId] ? (
            <p className="text-xs text-muted-foreground">{resultText[s.actionId]}</p>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gap-1.5 rounded-full" disabled={busyId === s.actionId} onClick={() => handleApply(s)}>
                {busyId === s.actionId ? <RefreshCircle size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                بله، امتحانش کن
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 rounded-full"
                disabled={busyId === s.actionId}
                onClick={() => handleDecline(s)}
              >
                <X size={14} />
                نه، فعلاً همینو ادامه بده
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
