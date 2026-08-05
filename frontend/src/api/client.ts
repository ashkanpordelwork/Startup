import {
  AdminConversation,
  AdminStats,
  DailyLogEntry,
  IntakeAnswers,
  IntakeResult,
  IntentResult,
} from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function detectIntent(text: string) {
  return request<IntentResult>("/intent", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function submitIntake(userId: string | null, answers: IntakeAnswers) {
  return request<IntakeResult>("/intake", {
    method: "POST",
    body: JSON.stringify({ userId, answers }),
  });
}

export function getLatestIntake(userId: string) {
  return request<{ track: string; message: string; createdAt: string }>(`/intake/${userId}`);
}

export function postDailyLog(userId: string, date: string, habitCompleted: boolean) {
  return request<DailyLogEntry>("/daily-log", {
    method: "POST",
    body: JSON.stringify({ userId, date, habitCompleted }),
  });
}

export function getDailyLogs(userId: string) {
  return request<DailyLogEntry[]>(`/daily-log/${userId}`);
}

export function getAdminConversations() {
  return request<AdminConversation[]>("/admin/conversations");
}

export function getAdminStats() {
  return request<AdminStats>("/admin/stats");
}
