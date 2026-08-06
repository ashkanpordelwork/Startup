import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { initDb } from "./db.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { authRouter } from "./routes/auth.js";
import { dailyLogRouter } from "./routes/dailyLog.js";
import { intakeRouter } from "./routes/intake.js";
import { intentRouter } from "./routes/intent.js";

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
app.use("/api/intent", intentRouter);
app.use("/api/auth", requireDb, authRouter);
app.use("/api/intake", requireDb, requireAuth, intakeRouter);
app.use("/api/daily-log", requireDb, requireAuth, dailyLogRouter);
