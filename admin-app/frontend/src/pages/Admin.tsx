import { useEffect, useState } from "react";
import { getAdminConversations, getAdminStats } from "../api/client";
import { AdminConversation, AdminStats } from "../api/types";

export default function Admin() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAdminConversations(), getAdminStats()])
      .then(([c, s]) => {
        setConversations(c);
        setStats(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      {error && <p className="error-text">{error}</p>}

      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">کل کاربران</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.usersWithDailyLogs}</div>
            <div className="stat-label">کاربران با لاگ روزانه</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(stats.dailyLogCompletionRate * 100)}%</div>
            <div className="stat-label">نرخ استفاده از پیگیری</div>
          </div>
          {stats.trackCounts.map((t) => (
            <div className="stat-card" key={t.track}>
              <div className="stat-value">{t.count}</div>
              <div className="stat-label">{t.track}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="step-title">کاربران و مسیر تریاژ</div>
        <table>
          <thead>
            <tr>
              <th>شناسه کاربر</th>
              <th>تاریخ ثبت‌نام</th>
              <th>آخرین مسیر</th>
              <th>تاریخ آخرین پرسش‌نامه</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.userId}>
                <td>{c.userId.slice(0, 8)}…</td>
                <td>{c.userCreatedAt}</td>
                <td>{c.track ?? "—"}</td>
                <td>{c.intakeCreatedAt ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {conversations.length === 0 && <p>هنوز کاربری ثبت نشده.</p>}
      </div>
    </div>
  );
}
