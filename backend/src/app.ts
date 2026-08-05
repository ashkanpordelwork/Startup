import cors from "cors";
import express from "express";
import { initDb } from "./db.js";
import { adminRouter } from "./routes/admin.js";
import { dailyLogRouter } from "./routes/dailyLog.js";
import { intakeRouter } from "./routes/intake.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use(async (_req, res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error("Database init failed:", err);
    res.status(500).json({ error: "database unavailable" });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/intake", intakeRouter);
app.use("/api/daily-log", dailyLogRouter);
app.use("/api/admin", adminRouter);
