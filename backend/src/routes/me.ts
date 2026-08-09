import { Router } from "express";
import { getAiProvider } from "../ai/index.js";
import { ActionCategory } from "../actions/templates.js";
import { sql } from "../db.js";

export const meRouter = Router();

const STRUGGLING_THRESHOLD = 3;

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

/**
 * Powers the daily check-in card on Home: every in_progress action across
 * ALL of the user's plans, in one call — so the user can report status
 * without opening each ActionDetail page separately.
 * (product decision §6.2: "چک‌این روزانه" — centralized, not per-action.)
 */
meRouter.get("/today", async (req, res) => {
  const userId = req.userId!;
  const rows = await sql`
    SELECT
      a.id,
      a.category,
      a.title,
      a.summary,
      a.status,
      i.id as "planId",
      i.title as "planTitle"
    FROM action_items a
    JOIN intake_responses i ON i.id = a.intake_id
    WHERE a.user_id = ${userId} AND a.status = 'in_progress'
    ORDER BY a.created_at ASC
  `;

  res.json(
    rows.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      summary: r.summary,
      status: r.status,
      planId: r.planId,
      planTitle: r.planTitle,
    }))
  );
});

/**
 * Pattern detection: an action qualifies for a suggestion when its most
 * recent N reports are ALL "struggling" (consecutive, not just N-of-total).
 * Runs on-demand rather than as a background job — fine at this scale, and
 * avoids needing a scheduler for the MVP.
 */
meRouter.get("/suggestions", async (req, res) => {
  const userId = req.userId!;
  const actions = await sql`
    SELECT id, category, title FROM action_items WHERE user_id = ${userId} AND status = 'in_progress'
  `;

  const suggestions = [];
  for (const action of actions) {
    const recentReports = await sql`
      SELECT kind FROM action_reports
      WHERE action_id = ${action.id as string}
      ORDER BY created_at DESC
      LIMIT ${STRUGGLING_THRESHOLD}
    `;
    const allStruggling =
      recentReports.length === STRUGGLING_THRESHOLD && recentReports.every((r) => r.kind === "struggling");
    if (!allStruggling) continue;

    // Generate the preview once per fetch. Not cached — acceptable at MVP scale
    // since this endpoint is only called when the user opens the suggestions view,
    // not polled continuously.
    const preview = await getAiProvider().adaptAction({
      category: action.category as ActionCategory,
      title: action.title as string,
      reason: "struggling",
    });
    suggestions.push({
      actionId: action.id,
      actionTitle: action.title,
      noticedText: `دیدم ${STRUGGLING_THRESHOLD} بار پشت‌سرهم «${action.title}» برات سخت بوده.`,
      previewSummary: preview.summary,
    });
  }

  res.json(suggestions);
});

meRouter.post("/suggestions/:actionId/apply", async (req, res) => {
  const userId = req.userId!;
  const rows = await sql`
    SELECT id, category, title FROM action_items WHERE id = ${req.params.actionId} AND user_id = ${userId}
  `;
  const action = rows[0];
  if (!action) return res.status(404).json({ error: "action not found" });

  const adapted = await getAiProvider().adaptAction({
    category: action.category as ActionCategory,
    title: action.title as string,
    reason: "struggling",
  });
  await sql`
    UPDATE action_items SET summary = ${adapted.summary}, steps = ${JSON.stringify(adapted.steps)}, updated_at = now()
    WHERE id = ${req.params.actionId}
  `;
  const updatedRows = await sql`
    SELECT id, category, title, summary, steps, status, created_at FROM action_items WHERE id = ${req.params.actionId}
  `;
  res.json({ reply: adapted.reply, action: toActionDto(updatedRows[0]) });
});

meRouter.post("/suggestions/:actionId/decline", async (_req, res) => {
  // No state change needed yet — pattern re-evaluates from report history on
  // next fetch. A future iteration could add a "snoozed_until" column to
  // suppress re-showing for ~2 weeks per the re-triage flow decision.
  res.json({ ok: true });
});
