export interface RedFlagAnswers {
  isPregnant: boolean;
  hasDiabetesKidneyHeartOrBP: boolean;
  hasEatingDisorderHistory: boolean;
  onMetabolicMedication: boolean;
  underDoctorSupervision: boolean;
  ageUnder18OrOver65: boolean;
}

export interface SleepAnswers {
  avgSleepHours: number;
  sleepConsistency: "consistent" | "somewhat" | "inconsistent";
  wakeUpFeeling: "rested" | "neutral" | "exhausted";
  hasInsomnia: boolean;
}

export interface StressAnswers {
  stressLevel: "low" | "moderate" | "high";
  majorLifeChangeRecently: boolean;
  emotionalEating: boolean;
}

export interface DietHistoryAnswers {
  previousDietsCount: number;
  hasYoyoWeightHistory: boolean;
  currentlyEliminatingFoodGroup: boolean;
}

export interface ActivityAnswers {
  currentActivityLevel: "sedentary" | "light" | "moderate" | "active";
  hasInjuryOrMobilityLimitation: boolean;
}

export interface GoalAnswers {
  primaryGoal: "weight_loss" | "energy" | "sleep" | "stress" | "habit_building";
  motivation: "intrinsic" | "extrinsic";
}

export interface IntakeAnswers {
  redFlags: RedFlagAnswers;
  sleep: SleepAnswers;
  stress: StressAnswers;
  dietHistory: DietHistoryAnswers;
  activity: ActivityAnswers;
  goal: GoalAnswers;
}

export interface IntakeResult {
  userId: string;
  intakeId: string;
  track: string;
  message: string;
  steps: string[];
  reasonCodes: string[];
}

export interface DailyLogEntry {
  id: string;
  date: string;
  habitCompleted: boolean;
  note: string | null;
  createdAt: string;
}

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

export interface IntentResult {
  goal: GoalAnswers["primaryGoal"] | null;
  matchedKeyword: string | null;
  reflection: string;
}
