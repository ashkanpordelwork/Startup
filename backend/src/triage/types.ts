export enum Track {
  TRACK_0_RED_FLAG = "TRACK_0_RED_FLAG",
  TRACK_1_SLEEP_STRESS = "TRACK_1_SLEEP_STRESS",
  TRACK_2_DIET_HISTORY = "TRACK_2_DIET_HISTORY",
  TRACK_3_MOBILITY = "TRACK_3_MOBILITY",
  TRACK_4_BASELINE = "TRACK_4_BASELINE",
}

// A) Red flags
export interface RedFlagAnswers {
  isPregnant: boolean;
  hasDiabetesKidneyHeartOrBP: boolean;
  hasEatingDisorderHistory: boolean;
  onMetabolicMedication: boolean;
  underDoctorSupervision: boolean;
  ageUnder18OrOver65: boolean;
}

// B) Sleep
export interface SleepAnswers {
  avgSleepHours: number;
  sleepConsistency: "consistent" | "somewhat" | "inconsistent";
  wakeUpFeeling: "rested" | "neutral" | "exhausted";
  hasInsomnia: boolean;
}

// C) Stress
export interface StressAnswers {
  stressLevel: "low" | "moderate" | "high";
  majorLifeChangeRecently: boolean;
  emotionalEating: boolean;
}

// D) Diet history
export interface DietHistoryAnswers {
  previousDietsCount: number;
  hasYoyoWeightHistory: boolean;
  currentlyEliminatingFoodGroup: boolean;
}

// E) Activity
export interface ActivityAnswers {
  currentActivityLevel: "sedentary" | "light" | "moderate" | "active";
  hasInjuryOrMobilityLimitation: boolean;
}

// F) Goal
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

export interface TrackResult {
  track: Track;
  message: string;
  steps: string[];
  reasonCodes: string[];
}
