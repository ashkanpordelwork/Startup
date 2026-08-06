import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
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
