import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDailyLogs, postDailyLog } from "../api/client";
import { DailyLogEntry } from "../api/types";
import { getStoredUserId } from "../userId";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const userId = getStoredUserId();
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getDailyLogs(userId)
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  async function markToday(completed: boolean) {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      await postDailyLog(userId, todayISO(), completed);
      const updated = await getDailyLogs(userId);
      setLogs(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSubmitting(false);
    }
  }

  if (!userId) {
    return (
      <div className="card">
        <p>ابتدا باید پرسش‌نامه را تکمیل کنید.</p>
        <Link to="/">رفتن به پرسش‌نامه</Link>
      </div>
    );
  }

  const today = todayISO();
  const loggedToday = logs.find((l) => l.date === today);

  return (
    <div className="card">
      <div className="step-title">پیگیری روزانه</div>
      {loading && <p>در حال بارگذاری...</p>}
      {!loading && (
        <>
          <p>
            {loggedToday
              ? `امروز را ${loggedToday.habitCompleted ? "انجام‌شده" : "انجام‌نشده"} ثبت کرده‌اید.`
              : "آیا امروز عادت مدنظرتون رو انجام دادید؟"}
          </p>
          <div className="nav-buttons">
            <button className="secondary" disabled={submitting} onClick={() => markToday(false)}>
              انجام ندادم
            </button>
            <button className="primary" disabled={submitting} onClick={() => markToday(true)}>
              انجام دادم
            </button>
          </div>
        </>
      )}
      {error && <p className="error-text">{error}</p>}

      <div className="step-title" style={{ marginTop: "1.5rem" }}>
        تاریخچه
      </div>
      {logs.length === 0 && !loading && <p>هنوز رکوردی ثبت نشده.</p>}
      <ul className="log-list">
        {logs.map((l) => (
          <li key={l.id}>
            <span>{l.date}</span>
            <span>{l.habitCompleted ? "✅ انجام‌شده" : "❌ انجام‌نشده"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
