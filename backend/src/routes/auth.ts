import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { normalizeIranPhone } from "../auth/phone.js";
import {
  generateOtpCode,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  sendOtpSms,
} from "../auth/otp.js";
import { signAuthToken } from "../auth/jwt.js";
import { sql } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

authRouter.post("/otp/request", async (req, res) => {
  const { phone: rawPhone } = req.body as { phone?: string };
  if (!rawPhone) {
    return res.status(400).json({ error: "phone is required" });
  }

  const phone = normalizeIranPhone(rawPhone);
  if (!phone) {
    return res.status(400).json({ error: "invalid Iranian mobile number" });
  }

  const recent = await sql`
    SELECT created_at FROM otp_codes
    WHERE phone = ${phone} AND consumed = false
    ORDER BY created_at DESC LIMIT 1
  `;
  if (recent.length > 0) {
    const secondsSince = (Date.now() - new Date(recent[0].created_at as string).getTime()) / 1000;
    if (secondsSince < OTP_RESEND_COOLDOWN_SECONDS) {
      return res.status(429).json({
        error: "otp already sent recently",
        retryAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSince),
      });
    }
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  await sql`
    INSERT INTO otp_codes (id, phone, code, expires_at)
    VALUES (${uuidv4()}, ${phone}, ${code}, ${expiresAt.toISOString()})
  `;

  sendOtpSms(phone, code);

  res.status(201).json({ phone, expiresInSeconds: OTP_TTL_SECONDS });
});

authRouter.post("/otp/verify", async (req, res) => {
  const { phone: rawPhone, code } = req.body as { phone?: string; code?: string };
  if (!rawPhone || !code) {
    return res.status(400).json({ error: "phone and code are required" });
  }

  const phone = normalizeIranPhone(rawPhone);
  if (!phone) {
    return res.status(400).json({ error: "invalid Iranian mobile number" });
  }

  const rows = await sql`
    SELECT id, code, attempts, expires_at FROM otp_codes
    WHERE phone = ${phone} AND consumed = false
    ORDER BY created_at DESC LIMIT 1
  `;
  const otp = rows[0];

  if (!otp) {
    return res.status(400).json({ error: "no active otp for this phone" });
  }
  if (new Date(otp.expires_at as string).getTime() < Date.now()) {
    return res.status(400).json({ error: "otp expired" });
  }
  if ((otp.attempts as number) >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: "too many attempts, request a new code" });
  }

  if (otp.code !== code) {
    await sql`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ${otp.id}`;
    return res.status(400).json({ error: "incorrect code" });
  }

  await sql`UPDATE otp_codes SET consumed = true WHERE id = ${otp.id}`;

  const existingUser = await sql`SELECT id, name FROM users WHERE phone = ${phone}`;

  let userId: string;
  let name: string | null;
  let isNewUser: boolean;

  if (existingUser.length > 0) {
    userId = existingUser[0].id as string;
    name = existingUser[0].name as string | null;
    isNewUser = false;
  } else {
    userId = uuidv4();
    name = null;
    isNewUser = true;
    await sql`INSERT INTO users (id, phone) VALUES (${userId}, ${phone})`;
  }

  const token = signAuthToken({ userId, phone });

  res.json({
    token,
    userId,
    phone,
    name,
    needsName: isNewUser || !name,
  });
});

authRouter.post("/complete-profile", requireAuth, async (req, res) => {
  const { name } = req.body as { name?: string };
  const trimmedName = name?.trim();

  if (!trimmedName) {
    return res.status(400).json({ error: "name is required" });
  }

  await sql`UPDATE users SET name = ${trimmedName} WHERE id = ${req.userId}`;

  res.json({ userId: req.userId, phone: req.phone, name: trimmedName });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const rows = await sql`SELECT id, phone, name FROM users WHERE id = ${req.userId}`;
  const user = rows[0];
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }
  res.json({ userId: user.id, phone: user.phone, name: user.name });
});
