import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle, CloseCircle } from "reicon-react";
import { getDailyLogs, postDailyLog } from "../api/client";
import { DailyLogEntry } from "../api/types";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/numerals";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDailyLogs()
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function markToday(completed: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      await postDailyLog(todayISO(), completed);
      const updated = await getDailyLogs();
      setLogs(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSubmitting(false);
    }
  }

  const today = todayISO();
  const loggedToday = logs.find((l) => l.date === today);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">پیگیری روزانه</h2>
        {loading ? (
          <p className="mt-3 text-sm text-helper-foreground">در حال بارگذاری...</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-helper-foreground">
              {loggedToday
                ? `امروز را ${loggedToday.habitCompleted ? "انجام‌شده" : "انجام‌نشده"} ثبت کرده‌اید.`
                : "آیا امروز عادت مدنظرتون رو انجام دادید؟"}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 gap-1.5"
                disabled={submitting}
                onClick={() => markToday(false)}
              >
                <CloseCircle size={16} />
                انجام ندادم
              </Button>
              <Button className="flex-1 gap-1.5" disabled={submitting} onClick={() => markToday(true)}>
                <CheckCircle size={16} />
                انجام دادم
              </Button>
            </div>
          </>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">تاریخچه</h2>
        {logs.length === 0 && !loading && (
          <p className="mt-2 text-sm text-helper-foreground">هنوز رکوردی ثبت نشده.</p>
        )}
        <ul className="mt-2 flex flex-col gap-2">
          {logs.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-1.5 text-helper-foreground">
                <CalendarDays size={16} />
                {toPersianDigits(l.date)}
              </span>
              <span
                className={
                  l.habitCompleted
                    ? "flex items-center gap-1 font-medium text-primary"
                    : "flex items-center gap-1 font-medium text-muted-foreground"
                }
              >
                {l.habitCompleted ? <CheckCircle size={16} /> : <CloseCircle size={16} />}
                {l.habitCompleted ? "انجام‌شده" : "انجام‌نشده"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
