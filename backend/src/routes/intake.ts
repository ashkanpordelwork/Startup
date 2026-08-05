import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { computeTrack } from "../triage/rules.js";
import { IntakeAnswers } from "../triage/types.js";

export const intakeRouter = Router();

intakeRouter.post("/", (req, res) => {
  const { userId, answers } = req.body as { userId?: string; answers: IntakeAnswers };

  if (!answers) {
    return res.status(400).json({ error: "answers is required" });
  }

  const resolvedUserId = userId ?? uuidv4();

  const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(resolvedUserId);
  if (!userExists) {
    db.prepare("INSERT INTO users (id) VALUES (?)").run(resolvedUserId);
  }

  const result = computeTrack(answers);
  const intakeId = uuidv4();

  db.prepare(
    `INSERT INTO intake_responses (id, user_id, raw_answers, computed_track, message)
     VALUES (?, ?, ?, ?, ?)`
  ).run(intakeId, resolvedUserId, JSON.stringify(answers), result.track, result.message);

  res.status(201).json({
    userId: resolvedUserId,
    intakeId,
    track: result.track,
    message: result.message,
    reasonCodes: result.reasonCodes,
  });
});

intakeRouter.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const row = db
    .prepare(
      `SELECT id, computed_track as track, message, created_at as createdAt
       FROM intake_responses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(userId);

  if (!row) {
    return res.status(404).json({ error: "no intake found for this user" });
  }
  res.json(row);
});
