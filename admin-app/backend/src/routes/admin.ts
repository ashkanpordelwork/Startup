import { Router } from "express";
import { sql } from "../db.js";

export const adminRouter = Router();

adminRouter.get("/conversations", async (_req, res) => {
  const rows = await sql`
    SELECT u.id as "userId", u.created_at as "userCreatedAt",
           ir.computed_track as track, ir.message, ir.created_at as "intakeCreatedAt"
    FROM users u
    LEFT JOIN intake_responses ir ON ir.id = (
      SELECT id FROM intake_responses
      WHERE user_id = u.id
      ORDER BY created_at DESC LIMIT 1
    )
    ORDER BY u.created_at DESC
  `;
  res.json(rows);
});

adminRouter.get("/stats", async (_req, res) => {
  const trackCountsRows = await sql`
    SELECT computed_track as track, COUNT(*) as count
    FROM (
      SELECT user_id, computed_track,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM intake_responses
    ) t
    WHERE rn = 1
    GROUP BY computed_track
  `;

  const totalUsersRows = await sql`SELECT COUNT(*) as c FROM users`;
  const usersWithLogsRows = await sql`SELECT COUNT(DISTINCT user_id) as c FROM daily_logs`;

  const totalUsers = Number(totalUsersRows[0].c);
  const usersWithLogs = Number(usersWithLogsRows[0].c);

  res.json({
    totalUsers,
    usersWithDailyLogs: usersWithLogs,
    dailyLogCompletionRate: totalUsers > 0 ? usersWithLogs / totalUsers : 0,
    trackCounts: trackCountsRows.map((r) => ({ track: r.track, count: Number(r.count) })),
  });
});
