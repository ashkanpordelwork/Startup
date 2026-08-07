import { AdminConversation, AdminStats } from "./types";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getAdminConversations() {
  return request<AdminConversation[]>("/admin/conversations");
}

export function getAdminStats() {
  return request<AdminStats>("/admin/stats");
}
