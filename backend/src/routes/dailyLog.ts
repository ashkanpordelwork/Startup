import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";

export const dailyLogRouter = Router();

dailyLogRouter.post("/", (req, res) => {
  const { userId, date, habitCompleted, note } = req.body as {
    userId?: string;
    date?: string;
    habitCompleted?: boolean;
    note?: string;
  };

  if (!userId || !date || typeof habitCompleted !== "boolean") {
    return res.status(400).json({ error: "userId, date and habitCompleted are required" });
  }

  const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
  if (!userExists) {
    return res.status(404).json({ error: "user not found" });
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO daily_logs (id, user_id, log_date, habit_completed, note)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, date, habitCompleted ? 1 : 0, note ?? null);

  res.status(201).json({ id, userId, date, habitCompleted, note: note ?? null });
});

dailyLogRouter.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const rows = db
    .prepare(
      `SELECT id, log_date as date, habit_completed as habitCompleted, note, created_at as createdAt
       FROM daily_logs WHERE user_id = ? ORDER BY log_date DESC`
    )
    .all(userId);

  res.json(rows.map((r: any) => ({ ...r, habitCompleted: !!r.habitCompleted })));
});
