import { clearToken, getToken } from "../auth/token";
import {
  ActionItem,
  ActionReportResult,
  AdaptResult,
  AuthUser,
  ChatMessage,
  IntakeAnswers,
  IntakeResult,
  IntentResult,
  OtpRequestResult,
  OtpVerifyResult,
  PlanDetail,
  PlanSummary,
  ReportKind,
  Suggestion,
  TodayAction,
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

export function getPlans() {
  return request<PlanSummary[]>("/plans");
}

export function getTodayActions() {
  return request<TodayAction[]>("/me/today");
}

export function getSuggestions() {
  return request<Suggestion[]>("/me/suggestions");
}

export function applySuggestion(actionId: string) {
  return request<{ reply: string; action: ActionItem }>(`/me/suggestions/${actionId}/apply`, { method: "POST" });
}

export function declineSuggestion(actionId: string) {
  return request<{ ok: boolean }>(`/me/suggestions/${actionId}/decline`, { method: "POST" });
}

export function getPlan(id: string) {
  return request<PlanDetail>(`/plans/${id}`);
}

export function confirmPlan(id: string) {
  return request<{ id: string; status: string }>(`/plans/${id}/confirm`, { method: "POST" });
}

export function adaptPlanAction(planId: string, actionId: string) {
  return request<AdaptResult>(`/plans/${planId}/adapt`, {
    method: "POST",
    body: JSON.stringify({ actionId }),
  });
}

export function getAction(id: string) {
  return request<ActionItem>(`/actions/${id}`);
}

export function reportAction(id: string, kind: ReportKind, note?: string) {
  return request<ActionReportResult>(`/actions/${id}/report`, {
    method: "POST",
    body: JSON.stringify({ kind, note }),
  });
}

export function getChatMessages(actionId?: string) {
  const query = actionId ? `?actionId=${encodeURIComponent(actionId)}` : "";
  return request<ChatMessage[]>(`/chat/messages${query}`);
}

export function postChatMessage(role: "user" | "bot", text: string, actionId?: string) {
  return request<ChatMessage>("/chat/messages", {
    method: "POST",
    body: JSON.stringify({ role, text, actionId }),
  });
}

export function askAboutAction(actionId: string, question: string) {
  return request<{ reply: string }>("/chat/ask", {
    method: "POST",
    body: JSON.stringify({ actionId, question }),
  });
}
