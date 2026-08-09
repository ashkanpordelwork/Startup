import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { sql } from "../db.js";

export const actionsRouter = Router();

export type ReportKind = "done" | "progress" | "struggling";
const REPORT_KINDS: ReportKind[] = ["done", "progress", "struggling"];

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

actionsRouter.get("/:id", async (req, res) => {
  const userId = req.userId!;
  const rows = await sql`
    SELECT id, category, title, summary, steps, status, created_at
    FROM action_items WHERE id = ${req.params.id} AND user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) {
    return res.status(404).json({ error: "action not found" });
  }
  res.json(toActionDto(row));
});

actionsRouter.post("/:id/report", async (req, res) => {
  const userId = req.userId!;
  const { kind, note } = req.body as { kind?: string; note?: string };

  if (!kind || !REPORT_KINDS.includes(kind as ReportKind)) {
    return res.status(400).json({ error: "kind must be one of: " + REPORT_KINDS.join(", ") });
  }

  const actionRows = await sql`
    SELECT id, category, title FROM action_items WHERE id = ${req.params.id} AND user_id = ${userId}
  `;
  const action = actionRows[0];
  if (!action) {
    return res.status(404).json({ error: "action not found" });
  }

  let reply: string;
  const updatedAction = null;

  if (kind === "struggling") {
    // «سخته» دیگر بی‌صدا و فوری اقدام را ساده نمی‌کند — طبق تصمیم محصول
    // (product-business-decisions §6.2)، فقط همدلانه ثبت می‌شود. تشخیص الگو
    // (چند بار پشت‌سرهم) و پیشنهاد واقعیِ قابل‌تایید در /me/suggestions است.
    reply = "باشه، طبیعیه. یادداشت کردم — اگه چندبار دیگه هم اینو بزنی، خودم یه پیشنهاد برات آماده می‌کنم.";
  } else if (kind === "done") {
    await sql`UPDATE action_items SET status = 'done', updated_at = now() WHERE id = ${req.params.id}`;
    reply =
      "آفرین که این اقدام رو انجام دادی! این پیشرفت رو یادداشت کردم. می‌تونی برای مرحله‌ی بعدی توی همین صفحه سراغ اقدام دیگه‌ای بری.";
  } else {
    reply = "خوشحالم که پیشرفت داری. همین‌طور ادامه بده — قدم‌های کوچیک و پیوسته از تغییرات ناگهانی مؤثرترن.";
  }

  const reportId = uuidv4();
  await sql`
    INSERT INTO action_reports (id, action_id, user_id, kind, note, reply)
    VALUES (${reportId}, ${req.params.id}, ${userId}, ${kind}, ${note ?? null}, ${reply})
  `;

  const userText = note ? `درباره‌ی «${action.title}»: ${note}` : `درباره‌ی «${action.title}»: ${kindLabel(kind as ReportKind)}`;
  await sql`
    INSERT INTO chat_messages (id, user_id, role, text, related_action_id)
    VALUES (${uuidv4()}, ${userId}, 'user', ${userText}, ${req.params.id})
  `;
  await sql`
    INSERT INTO chat_messages (id, user_id, role, text, related_action_id)
    VALUES (${uuidv4()}, ${userId}, 'bot', ${reply}, ${req.params.id})
  `;

  res.status(201).json({ reportId, reply, action: updatedAction });
});

function kindLabel(kind: ReportKind): string {
  switch (kind) {
    case "done":
      return "انجامش دادم";
    case "progress":
      return "دارم پیش می‌رم";
    case "struggling":
      return "سخته، کمکم کن";
  }
}
