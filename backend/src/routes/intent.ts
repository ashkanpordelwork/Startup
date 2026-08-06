import { Router } from "express";
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
