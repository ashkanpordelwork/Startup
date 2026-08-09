import { Router } from "express";
import { sql } from "../db.js";

export const meRouter = Router();

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
