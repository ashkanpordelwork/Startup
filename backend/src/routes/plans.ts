import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getRefineReply, getSoftenedVariant, RefineFeedback } from "../actions/refine.js";
import { ActionCategory } from "../actions/templates.js";
import { sql } from "../db.js";

export const plansRouter = Router();

const REFINE_FEEDBACKS: RefineFeedback[] = ["simplify", "remove", "keep"];

function toActionDto(row: Record<string, unknown>) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    summary: row.summary,
    steps: JSON.parse(row.steps as string),
    status: row.status,
    createdAt: row.created_at,
  };
}

plansRouter.get("/", async (req, res) => {
  const userId = req.userId!;
  const plans = await sql`
    SELECT id, title, computed_track as track, status, created_at as "createdAt"
    FROM intake_responses WHERE user_id = ${userId} ORDER BY created_at DESC
  `;

  const counts = await sql`
    SELECT intake_id, COUNT(*) as c FROM action_items
    WHERE user_id = ${userId} AND status != 'removed'
    GROUP BY intake_id
  `;
  const countByPlan = new Map(counts.map((c) => [c.intake_id as string, Number(c.c)]));

  res.json(
    plans.map((p) => ({
      id: p.id,
      title: p.title,
      track: p.track,
      status: p.status,
      createdAt: p.createdAt,
      actionsCount: countByPlan.get(p.id as string) ?? 0,
    }))
  );
});

plansRouter.get("/:id", async (req, res) => {
  const userId = req.userId!;
  const planRows = await sql`
    SELECT id, title, computed_track as track, status, created_at as "createdAt"
    FROM intake_responses WHERE id = ${req.params.id} AND user_id = ${userId}
  `;
  const plan = planRows[0];
  if (!plan) {
    return res.status(404).json({ error: "plan not found" });
  }

  const actionRows = await sql`
    SELECT id, category, title, summary, steps, status, created_at
    FROM action_items WHERE intake_id = ${req.params.id} AND status != 'removed'
    ORDER BY created_at ASC
  `;

  res.json({
    id: plan.id,
    title: plan.title,
    track: plan.track,
    status: plan.status,
    createdAt: plan.createdAt,
    actions: actionRows.map(toActionDto),
  });
});

plansRouter.post("/:id/confirm", async (req, res) => {
  const userId = req.userId!;
  const rows = await sql`
    UPDATE intake_responses SET status = 'confirmed'
    WHERE id = ${req.params.id} AND user_id = ${userId}
    RETURNING id, status
  `;
  if (rows.length === 0) {
    return res.status(404).json({ error: "plan not found" });
  }
  res.json({ id: rows[0].id, status: rows[0].status });
});

plansRouter.post("/:id/refine", async (req, res) => {
  const userId = req.userId!;
  const { actionId, feedback } = req.body as { actionId?: string; feedback?: string };

  if (!actionId || !feedback || !REFINE_FEEDBACKS.includes(feedback as RefineFeedback)) {
    return res.status(400).json({ error: "actionId and feedback (simplify|remove|keep) are required" });
  }

  const planRows = await sql`SELECT id FROM intake_responses WHERE id = ${req.params.id} AND user_id = ${userId}`;
  if (planRows.length === 0) {
    return res.status(404).json({ error: "plan not found" });
  }

  const actionRows = await sql`
    SELECT id, category, title FROM action_items
    WHERE id = ${actionId} AND intake_id = ${req.params.id} AND user_id = ${userId}
  `;
  const action = actionRows[0];
  if (!action) {
    return res.status(404).json({ error: "action not found" });
  }

  const kind = feedback as RefineFeedback;
  const reply = getRefineReply(kind, action.title as string);
  let updatedAction = null;

  if (kind === "remove") {
    await sql`UPDATE action_items SET status = 'removed', updated_at = now() WHERE id = ${actionId}`;
  } else if (kind === "simplify") {
    const softened = getSoftenedVariant(action.category as ActionCategory);
    await sql`
      UPDATE action_items SET summary = ${softened.summary}, steps = ${JSON.stringify(softened.steps)}, updated_at = now()
      WHERE id = ${actionId}
    `;
    const updatedRows = await sql`
      SELECT id, category, title, summary, steps, status, created_at FROM action_items WHERE id = ${actionId}
    `;
    updatedAction = toActionDto(updatedRows[0]);
  }

  await sql`
    INSERT INTO chat_messages (id, user_id, role, text, related_action_id)
    VALUES (${uuidv4()}, ${userId}, 'bot', ${reply}, ${actionId})
  `;

  res.json({ reply, action: updatedAction, removed: kind === "remove" });
});
