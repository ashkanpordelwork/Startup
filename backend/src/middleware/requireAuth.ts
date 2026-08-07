import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../auth/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      phone?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return res.status(401).json({ error: "authentication required" });
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({ error: "invalid or expired token" });
  }

  req.userId = payload.userId;
  req.phone = payload.phone;
  next();
}
