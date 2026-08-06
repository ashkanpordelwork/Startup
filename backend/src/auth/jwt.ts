import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set — using an insecure default. Set it before deploying.");
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-insecure-secret-change-me";
const JWT_EXPIRES_IN = "30d";

export interface AuthTokenPayload {
  userId: string;
  phone: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}
