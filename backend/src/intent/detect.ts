import { GoalAnswers } from "../triage/types.js";

type PrimaryGoal = GoalAnswers["primaryGoal"];

// اولویت‌بندی عمدی: اگر متن کاربر با چند دسته هم‌زمان همخوانی داشت،
// دسته‌ی بالاتر در این لیست انتخاب می‌شود (مثلاً «استرس» بر «عادت‌سازی» ارجحیت دارد).
const KEYWORDS: { goal: PrimaryGoal; keywords: string[] }[] = [
  {
    goal: "weight_loss",
    keywords: ["وزن", "چاق", "لاغر", "چربی", "رژیم", "شکم"],
  },
  {
    goal: "sleep",
    keywords: ["خواب", "بی‌خوابی", "بیخوابی", "بیدار", "خستگی خواب"],
  },
  {
    goal: "stress",
    keywords: ["استرس", "اضطراب", "نگران", "فشار روحی", "تنش"],
  },
  {
    goal: "energy",
    keywords: ["انرژی", "خسته", "بی‌حال", "بی حال", "بی‌حالی", "کسل"],
  },
  {
    goal: "habit_building",
    keywords: ["عادت", "نظم", "روتین", "برنامه‌ریزی", "برنامه ریزی"],
  },
];

export interface IntentResult {
  goal: PrimaryGoal | null;
  matchedKeyword: string | null;
}

export function detectIntent(text: string): IntentResult {
  const normalized = text.trim();

  if (!normalized) {
    return { goal: null, matchedKeyword: null };
  }

  for (const { goal, keywords } of KEYWORDS) {
    const matchedKeyword = keywords.find((kw) => normalized.includes(kw));
    if (matchedKeyword) {
      return { goal, matchedKeyword };
    }
  }

  return { goal: null, matchedKeyword: null };
}
