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

export type PlanStatus = "draft" | "confirmed";

export interface IntakeResult {
  planId: string;
  title: string;
  status: PlanStatus;
  track: string;
  message: string;
  steps: string[];
  reasonCodes: string[];
  actions: ActionItem[];
}

export interface PlanSummary {
  id: string;
  title: string;
  track: string;
  status: PlanStatus;
  createdAt: string;
  actionsCount: number;
}

export interface PlanDetail {
  id: string;
  title: string;
  track: string;
  status: PlanStatus;
  createdAt: string;
  actions: ActionItem[];
}

export type ActionCategory = "diet" | "activity" | "sleep" | "lifestyle";
export type ActionStatus = "in_progress" | "done";

export interface ActionItem {
  id: string;
  category: ActionCategory;
  title: string;
  summary: string;
  steps: string[];
  status: ActionStatus;
  createdAt?: string;
}

export type ReportKind = "done" | "progress" | "struggling";

export interface ActionReportResult {
  reportId: string;
  reply: string;
  action: ActionItem | null;
}

export interface TodayAction extends ActionItem {
  planId: string;
  planTitle: string;
}

export interface AdaptResult {
  reply: string;
  action: ActionItem;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  actionId: string | null;
  createdAt: string;
}

export interface IntentResult {
  goal: GoalAnswers["primaryGoal"] | null;
  matchedKeyword: string | null;
  reflection: string;
}

export interface AuthUser {
  userId: string;
  phone: string;
  name: string | null;
}

export interface OtpRequestResult {
  phone: string;
  expiresInSeconds: number;
}

export interface OtpVerifyResult {
  token: string;
  userId: string;
  phone: string;
  name: string | null;
  needsName: boolean;
}
