import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getPlanTitle } from "../actions/planTitles.js";
import { getActionTemplates } from "../actions/templates.js";
import { sql } from "../db.js";
import { computeTrack } from "../triage/rules.js";
import { IntakeAnswers } from "../triage/types.js";

export const intakeRouter = Router();

intakeRouter.post("/", async (req, res) => {
  const { answers } = req.body as { answers: IntakeAnswers };
  const userId = req.userId!;

  if (!answers) {
    return res.status(400).json({ error: "answers is required" });
  }

  const result = computeTrack(answers);
  const planId = uuidv4();
  const title = getPlanTitle(answers.goal?.primaryGoal, result.track);

  await sql`
    INSERT INTO intake_responses (id, user_id, raw_answers, computed_track, message, title, status)
    VALUES (${planId}, ${userId}, ${JSON.stringify(answers)}, ${result.track}, ${result.message}, ${title}, 'draft')
  `;

  const templates = getActionTemplates(result.track);
  const actions = [];
  for (const template of templates) {
    const actionId = uuidv4();
    await sql`
      INSERT INTO action_items (id, user_id, intake_id, category, title, summary, steps)
      VALUES (${actionId}, ${userId}, ${planId}, ${template.category}, ${template.title}, ${template.summary}, ${JSON.stringify(template.steps)})
    `;
    actions.push({
      id: actionId,
      category: template.category,
      title: template.title,
      summary: template.summary,
      steps: template.steps,
      status: "in_progress" as const,
    });
  }

  res.status(201).json({
    planId,
    title,
    status: "draft",
    track: result.track,
    message: result.message,
    steps: result.steps,
    reasonCodes: result.reasonCodes,
    actions,
  });
});
