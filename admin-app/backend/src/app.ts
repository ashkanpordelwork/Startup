import cors from "cors";
import express from "express";
import { adminRouter } from "./routes/admin.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/admin", adminRouter);
