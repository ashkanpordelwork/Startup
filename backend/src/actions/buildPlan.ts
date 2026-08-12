import { v4 as uuidv4 } from "uuid";
import { getPlanTitle } from "./planTitles.js";
import { getActionTemplates } from "./templates.js";
import { sql } from "../db.js";
import { computeTrack } from "../triage/rules.js";
import { IntakeAnswers } from "../triage/types.js";

/**
 * Shared by both the legacy structured-form submit (routes/intake.ts) and
 * the new free-chat onboarding (routes/intent.ts /converse + /build-plan) —
 * the triage/plan-building logic itself is untouched either way, only the
 * path that produces `answers` differs (form vs AI extraction).
 */
export async function buildPlanFromAnswers(userId: string, answers: IntakeAnswers) {
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

  return {
    planId,
    title,
    status: "draft" as const,
    track: result.track,
    message: result.message,
    steps: result.steps,
    reasonCodes: result.reasonCodes,
    actions,
  };
}
