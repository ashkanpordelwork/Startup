import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { sql } from "../db.js";

export const dailyLogRouter = Router();

dailyLogRouter.post("/", async (req, res) => {
  const { userId, date, habitCompleted, note } = req.body as {
    userId?: string;
    date?: string;
    habitCompleted?: boolean;
    note?: string;
  };

  if (!userId || !date || typeof habitCompleted !== "boolean") {
    return res.status(400).json({ error: "userId, date and habitCompleted are required" });
  }

  const existing = await sql`SELECT id FROM users WHERE id = ${userId}`;
  if (existing.length === 0) {
    return res.status(404).json({ error: "user not found" });
  }

  const id = uuidv4();
  await sql`
    INSERT INTO daily_logs (id, user_id, log_date, habit_completed, note)
    VALUES (${id}, ${userId}, ${date}, ${habitCompleted}, ${note ?? null})
  `;

  res.status(201).json({ id, userId, date, habitCompleted, note: note ?? null });
});

dailyLogRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const rows = await sql`
    SELECT id, log_date as date, habit_completed as "habitCompleted", note, created_at as "createdAt"
    FROM daily_logs WHERE user_id = ${userId} ORDER BY log_date DESC
  `;

  res.json(rows);
});
