import { GoalAnswers, Track } from "../triage/types.js";

const GOAL_TITLES: Record<GoalAnswers["primaryGoal"], string> = {
  weight_loss: "برنامه کاهش وزن",
  energy: "برنامه افزایش انرژی",
  sleep: "برنامه تنظیم خواب شبانه",
  stress: "برنامه مدیریت استرس",
  habit_building: "برنامه‌ی شروع زندگی با دیسیپلین",
};

const TRACK_FALLBACK_TITLES: Record<Track, string> = {
  [Track.TRACK_0_RED_FLAG]: "برنامه‌ی احتیاط و شروع آرام",
  [Track.TRACK_1_SLEEP_STRESS]: "برنامه‌ی خواب و استرس",
  [Track.TRACK_2_DIET_HISTORY]: "برنامه‌ی پایدارسازی عادت غذایی",
  [Track.TRACK_3_MOBILITY]: "برنامه‌ی کم‌ضربه",
  [Track.TRACK_4_BASELINE]: "برنامه‌ی شروع پایه",
};

export function getPlanTitle(goal: GoalAnswers["primaryGoal"] | undefined, track: Track): string {
  if (goal && GOAL_TITLES[goal]) {
    return GOAL_TITLES[goal];
  }
  return TRACK_FALLBACK_TITLES[track];
}
