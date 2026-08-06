import { ActionCategory } from "./templates.js";

export type RefineFeedback = "simplify" | "remove" | "keep";

interface SoftenedVariant {
  summary: string;
  steps: string[];
}

const SOFTENED: Record<ActionCategory, SoftenedVariant> = {
  diet: {
    summary: "نسخه‌ی ساده‌تر: فقط با یک تغییر کوچیک در یک وعده شروع کن.",
    steps: ["فقط یک وعده در روز رو کمی سالم‌تر کن.", "بقیه‌ی وعده‌ها رو فعلاً همون‌طوری که هست نگه دار."],
  },
  activity: {
    summary: "نسخه‌ی ساده‌تر: با مدت و شدت کمتر شروع کن.",
    steps: ["هفته‌ای فقط ۲ روز، ۱۰ تا ۱۵ دقیقه فعالیت سبک انجام بده.", "هر وقت آماده بودی، کم‌کم زمان رو زیاد کن."],
  },
  sleep: {
    summary: "نسخه‌ی ساده‌تر: فقط روی یک ساعت مشخص برای خواب تمرکز کن.",
    steps: ["فقط سعی کن هر شب نزدیک یک ساعت مشخص بخوابی، حتی اگه دقیق نباشه.", "فعلاً به بقیه‌ی جزئیات فکر نکن."],
  },
  lifestyle: {
    summary: "نسخه‌ی ساده‌تر: یک قدم کوچیک در هفته.",
    steps: ["فقط یک تغییر کوچیک رو برای این هفته انتخاب کن.", "بقیه رو برای هفته‌های بعد بذار."],
  },
};

export function getSoftenedVariant(category: ActionCategory): SoftenedVariant {
  return SOFTENED[category];
}

export function getRefineReply(feedback: RefineFeedback, actionTitle: string): string {
  switch (feedback) {
    case "remove":
      return `باشه، «${actionTitle}» رو از برنامه‌ت برداشتم.`;
    case "simplify":
      return `حق داری، این ممکنه فعلاً سنگین باشه. برات یه نسخه‌ی ساده‌تر از «${actionTitle}» گذاشتم که راحت‌تر شروع بشه.`;
    case "keep":
      return `باشه، «${actionTitle}» رو همین‌طوری نگه می‌داریم.`;
  }
}
