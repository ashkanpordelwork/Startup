import { clearToken, getToken } from "../auth/token";
import {
  AuthUser,
  DailyLogEntry,
  IntakeAnswers,
  IntakeResult,
  IntentResult,
  OtpRequestResult,
  OtpVerifyResult,
} from "./types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    clearToken();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Request failed: ${res.status}`, res.status);
  }
  return res.json();
}

export function requestOtp(phone: string) {
  return request<OtpRequestResult>("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, code: string) {
  return request<OtpVerifyResult>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

export function completeProfile(name: string) {
  return request<AuthUser>("/auth/complete-profile", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getMe() {
  return request<AuthUser>("/auth/me");
}

export function detectIntent(text: string) {
  return request<IntentResult>("/intent", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function submitIntake(answers: IntakeAnswers) {
  return request<IntakeResult>("/intake", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export function getLatestIntake() {
  return request<{ track: string; message: string; createdAt: string }>("/intake/latest");
}

export function postDailyLog(date: string, habitCompleted: boolean) {
  return request<DailyLogEntry>("/daily-log", {
    method: "POST",
    body: JSON.stringify({ date, habitCompleted }),
  });
}

export function getDailyLogs() {
  return request<DailyLogEntry[]>("/daily-log");
}
