import { Router } from "express";
import { buildPlanFromAnswers } from "../actions/buildPlan.js";
import { getAiProvider } from "../ai/index.js";

export const intentRouter = Router();

intentRouter.post("/", async (req, res) => {
  const { text } = req.body as { text?: string };

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const result = await getAiProvider().detectIntent(text);
  res.json(result);
});

/**
 * Lets the frontend decide, once at load, whether the new free-chat
 * onboarding (§12) is available — the rule-based provider can't hold an
 * open conversation, so we fall back to the structured question bank.
 */
intentRouter.get("/ai-status", (_req, res) => {
  res.json({ available: process.env.AI_PROVIDER === "avalai" });
});

type HistoryEntry = { role: "user" | "assistant"; text: string };

intentRouter.post("/converse", async (req, res) => {
  const { history } = req.body as { history?: HistoryEntry[] };
  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "history is required" });
  }
  try {
    const result = await getAiProvider().converseOnboarding(history);
    res.json(result);
  } catch (err) {
    console.error("[intent] converse failed:", err);
    res.status(503).json({ error: "AI unavailable" });
  }
});

intentRouter.post("/build-plan", async (req, res) => {
  const { history } = req.body as { history?: HistoryEntry[] };
  const userId = req.userId!;
  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "history is required" });
  }
  try {
    const answers = await getAiProvider().extractIntakeAnswers(history);
    const result = await buildPlanFromAnswers(userId, answers);
    res.status(201).json(result);
  } catch (err) {
    console.error("[intent] build-plan failed:", err);
    res.status(503).json({ error: "could not build plan from conversation" });
  }
});
