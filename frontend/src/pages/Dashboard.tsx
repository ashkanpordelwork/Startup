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
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
      <div className="rounded-xl bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">پیگیری روزانه</h2>
        {loading ? (
          <p className="mt-4 text-base text-helper-foreground">در حال بارگذاری...</p>
        ) : (
          <>
            <p className="mt-3 text-base leading-relaxed text-helper-foreground">
              {loggedToday
                ? `امروز را ${loggedToday.habitCompleted ? "انجام‌شده" : "انجام‌نشده"} ثبت کرده‌اید.`
                : "آیا امروز عادت مدنظرتون رو انجام دادید؟"}
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                disabled={submitting}
                onClick={() => markToday(false)}
              >
                <CloseCircle size={18} />
                انجام ندادم
              </Button>
              <Button className="flex-1 gap-2" disabled={submitting} onClick={() => markToday(true)}>
                <CheckCircle size={18} />
                انجام دادم
              </Button>
            </div>
          </>
        )}
        {error && <p className="mt-3 text-base text-destructive">{error}</p>}
      </div>

      <div className="rounded-xl bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">تاریخچه</h2>
        {logs.length === 0 && !loading && (
          <p className="mt-3 text-base text-helper-foreground">هنوز رکوردی ثبت نشده.</p>
        )}
        <ul className="mt-3 flex flex-col gap-2.5">
          {logs.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-base"
            >
              <span className="flex items-center gap-2 text-helper-foreground">
                <CalendarDays size={18} />
                {toPersianDigits(l.date)}
              </span>
              <span
                className={
                  l.habitCompleted
                    ? "flex items-center gap-1.5 font-medium text-primary"
                    : "flex items-center gap-1.5 font-medium text-muted-foreground"
                }
              >
                {l.habitCompleted ? <CheckCircle size={18} /> : <CloseCircle size={18} />}
                {l.habitCompleted ? "انجام‌شده" : "انجام‌نشده"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
