import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { sql } from "../db.js";

export const dailyLogRouter = Router();

dailyLogRouter.post("/", async (req, res) => {
  const { date, habitCompleted, note } = req.body as {
    date?: string;
    habitCompleted?: boolean;
    note?: string;
  };
  const userId = req.userId!;

  if (!date || typeof habitCompleted !== "boolean") {
    return res.status(400).json({ error: "date and habitCompleted are required" });
  }

  const id = uuidv4();
  await sql`
    INSERT INTO daily_logs (id, user_id, log_date, habit_completed, note)
    VALUES (${id}, ${userId}, ${date}, ${habitCompleted}, ${note ?? null})
  `;

  res.status(201).json({ id, userId, date, habitCompleted, note: note ?? null });
});

dailyLogRouter.get("/", async (req, res) => {
  const userId = req.userId!;
  const rows = await sql`
    SELECT id, log_date as date, habit_completed as "habitCompleted", note, created_at as "createdAt"
    FROM daily_logs WHERE user_id = ${userId} ORDER BY log_date DESC
  `;

  res.json(rows);
});
