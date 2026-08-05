import cors from "cors";
import express from "express";
import "./db.js";
import { adminRouter } from "./routes/admin.js";
import { dailyLogRouter } from "./routes/dailyLog.js";
import { intakeRouter } from "./routes/intake.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/intake", intakeRouter);
app.use("/api/daily-log", dailyLogRouter);
app.use("/api/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
