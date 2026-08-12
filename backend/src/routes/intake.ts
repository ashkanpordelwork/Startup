import { Router } from "express";
import { buildPlanFromAnswers } from "../actions/buildPlan.js";
import { IntakeAnswers } from "../triage/types.js";

export const intakeRouter = Router();

intakeRouter.post("/", async (req, res) => {
  const { answers } = req.body as { answers: IntakeAnswers };
  const userId = req.userId!;

  if (!answers) {
    return res.status(400).json({ error: "answers is required" });
  }

  const result = await buildPlanFromAnswers(userId, answers);
  res.status(201).json(result);
});
