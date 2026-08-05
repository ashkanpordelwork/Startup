import { Router } from "express";
import { db } from "../db.js";

export const adminRouter = Router();

adminRouter.get("/conversations", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id as userId, u.created_at as userCreatedAt,
              ir.computed_track as track, ir.message, ir.created_at as intakeCreatedAt
       FROM users u
       LEFT JOIN intake_responses ir ON ir.id = (
         SELECT id FROM intake_responses
         WHERE user_id = u.id
         ORDER BY created_at DESC LIMIT 1
       )
       ORDER BY u.created_at DESC`
    )
    .all();
  res.json(rows);
});

adminRouter.get("/stats", (_req, res) => {
  const trackCounts = db
    .prepare(
      `SELECT computed_track as track, COUNT(*) as count
       FROM (
         SELECT user_id, computed_track,
                ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
         FROM intake_responses
       )
       WHERE rn = 1
       GROUP BY computed_track`
    )
    .all();

  const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
  const usersWithLogs = (
    db.prepare("SELECT COUNT(DISTINCT user_id) as c FROM daily_logs").get() as { c: number }
  ).c;

  res.json({
    totalUsers,
    usersWithDailyLogs: usersWithLogs,
    dailyLogCompletionRate: totalUsers > 0 ? usersWithLogs / totalUsers : 0,
    trackCounts,
  });
});
