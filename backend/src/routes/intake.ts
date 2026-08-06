import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { sql } from "../db.js";
import { computeTrack } from "../triage/rules.js";
import { IntakeAnswers } from "../triage/types.js";

export const intakeRouter = Router();

intakeRouter.post("/", async (req, res) => {
  const { userId, answers } = req.body as { userId?: string; answers: IntakeAnswers };

  if (!answers) {
    return res.status(400).json({ error: "answers is required" });
  }

  const resolvedUserId = userId ?? uuidv4();

  const existing = await sql`SELECT id FROM users WHERE id = ${resolvedUserId}`;
  if (existing.length === 0) {
    await sql`INSERT INTO users (id) VALUES (${resolvedUserId})`;
  }

  const result = computeTrack(answers);
  const intakeId = uuidv4();

  await sql`
    INSERT INTO intake_responses (id, user_id, raw_answers, computed_track, message)
    VALUES (${intakeId}, ${resolvedUserId}, ${JSON.stringify(answers)}, ${result.track}, ${result.message})
  `;

  res.status(201).json({
    userId: resolvedUserId,
    intakeId,
    track: result.track,
    message: result.message,
    steps: result.steps,
    reasonCodes: result.reasonCodes,
  });
});

intakeRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const rows = await sql`
    SELECT id, computed_track as track, message, created_at as "createdAt"
    FROM intake_responses WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return res.status(404).json({ error: "no intake found for this user" });
  }
  res.json(row);
});
