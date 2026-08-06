import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getAiProvider } from "../ai/index.js";
import { ActionCategory } from "../actions/templates.js";
import { sql } from "../db.js";

export const chatRouter = Router();

chatRouter.get("/messages", async (req, res) => {
  const userId = req.userId!;
  const actionId = typeof req.query.actionId === "string" ? req.query.actionId : null;

  const rows = actionId
    ? await sql`
        SELECT id, role, text, related_action_id as "actionId", created_at as "createdAt"
        FROM chat_messages WHERE user_id = ${userId} AND related_action_id = ${actionId}
        ORDER BY created_at ASC
      `
    : await sql`
        SELECT id, role, text, related_action_id as "actionId", created_at as "createdAt"
        FROM chat_messages WHERE user_id = ${userId}
        ORDER BY created_at ASC
      `;

  res.json(rows);
});

chatRouter.post("/messages", async (req, res) => {
  const userId = req.userId!;
  const { role, text, actionId } = req.body as { role?: string; text?: string; actionId?: string };

  if (!role || (role !== "user" && role !== "bot") || !text) {
    return res.status(400).json({ error: "role (user|bot) and text are required" });
  }

  const id = uuidv4();
  await sql`
    INSERT INTO chat_messages (id, user_id, role, text, related_action_id)
    VALUES (${id}, ${userId}, ${role}, ${text}, ${actionId ?? null})
  `;

  res.status(201).json({ id, role, text, actionId: actionId ?? null });
});

chatRouter.post("/ask", async (req, res) => {
  const userId = req.userId!;
  const { actionId, question } = req.body as { actionId?: string; question?: string };

  if (!actionId || !question?.trim()) {
    return res.status(400).json({ error: "actionId and question are required" });
  }

  const actionRows = await sql`
    SELECT category, title FROM action_items WHERE id = ${actionId} AND user_id = ${userId}
  `;
  const action = actionRows[0];
  if (!action) {
    return res.status(404).json({ error: "action not found" });
  }

  const reply = await getAiProvider().answerQuestion({
    category: action.category as ActionCategory,
    actionTitle: action.title as string,
    question,
  });

  await sql`
    INSERT INTO chat_messages (id, user_id, role, text, related_action_id)
    VALUES (${uuidv4()}, ${userId}, 'user', ${question}, ${actionId})
  `;
  await sql`
    INSERT INTO chat_messages (id, user_id, role, text, related_action_id)
    VALUES (${uuidv4()}, ${userId}, 'bot', ${reply}, ${actionId})
  `;

  res.json({ reply });
});
