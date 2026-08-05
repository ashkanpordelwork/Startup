const STORAGE_KEY = "lifestyle_bot_user_id";

export function getStoredUserId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredUserId(userId: string): void {
  localStorage.setItem(STORAGE_KEY, userId);
}
