import { GoalAnswers } from "../triage/types.js";

type PrimaryGoal = GoalAnswers["primaryGoal"];

const REFLECTION_TEMPLATES: Record<PrimaryGoal, string> = {
  weight_loss: "متوجه شدم می‌خوای روی کاهش وزن کار کنی. برای اینکه بهترین توصیه رو بهت بدم، چند سؤال کوتاه می‌پرسم.",
  sleep: "متوجه شدم دغدغه‌ات بهبود خوابه. برای اینکه بهترین توصیه رو بهت بدم، چند سؤال کوتاه می‌پرسم.",
  stress: "متوجه شدم می‌خوای استرس رو مدیریت کنی. برای اینکه بهترین توصیه رو بهت بدم، چند سؤال کوتاه می‌پرسم.",
  energy: "متوجه شدم می‌خوای انرژی بیشتری داشته باشی. برای اینکه بهترین توصیه رو بهت بدم، چند سؤال کوتاه می‌پرسم.",
  habit_building: "متوجه شدم می‌خوای یه عادت جدید بسازی. برای اینکه بهترین توصیه رو بهت بدم، چند سؤال کوتاه می‌پرسم.",
};

export const FALLBACK_REFLECTION =
  "متوجه شدم. برای اینکه دقیقاً بفهمم چطور می‌تونم کمکت کنم، چند سؤال کوتاه می‌پرسم.";

export function getIntentReflection(goal: PrimaryGoal | null): string {
  if (!goal) return FALLBACK_REFLECTION;
  return REFLECTION_TEMPLATES[goal];
}
