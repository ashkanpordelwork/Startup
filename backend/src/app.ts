import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { initDb } from "./db.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { actionsRouter } from "./routes/actions.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { intakeRouter } from "./routes/intake.js";
import { intentRouter } from "./routes/intent.js";
import { meRouter } from "./routes/me.js";
import { plansRouter } from "./routes/plans.js";

export const app = express();

app.use(cors());
app.use(express.json());

async function requireDb(_req: Request, res: Response, next: NextFunction) {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error("Database init failed:", err);
    res.status(500).json({ error: "database unavailable" });
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/intent", requireDb, requireAuth, intentRouter);
app.use("/api/auth", requireDb, authRouter);
app.use("/api/intake", requireDb, requireAuth, intakeRouter);
app.use("/api/plans", requireDb, requireAuth, plansRouter);
app.use("/api/me", requireDb, requireAuth, meRouter);
app.use("/api/actions", requireDb, requireAuth, actionsRouter);
app.use("/api/chat", requireDb, requireAuth, chatRouter);
