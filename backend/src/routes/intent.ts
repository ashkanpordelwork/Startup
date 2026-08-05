import { Router } from "express";
import { detectIntent } from "../intent/detect.js";
import { getIntentReflection } from "../intent/templates.js";

export const intentRouter = Router();

intentRouter.post("/", (req, res) => {
  const { text } = req.body as { text?: string };

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const result = detectIntent(text);

  res.json({
    goal: result.goal,
    matchedKeyword: result.matchedKeyword,
    reflection: getIntentReflection(result.goal),
  });
});
