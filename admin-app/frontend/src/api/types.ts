export interface AdminConversation {
  userId: string;
  userCreatedAt: string;
  track: string | null;
  message: string | null;
  intakeCreatedAt: string | null;
}

export interface AdminStats {
  totalUsers: number;
  usersWithDailyLogs: number;
  dailyLogCompletionRate: number;
  trackCounts: { track: string; count: number }[];
}
