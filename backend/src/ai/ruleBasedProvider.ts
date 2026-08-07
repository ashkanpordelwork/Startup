import { detectIntent } from "../intent/detect.js";
import { getIntentReflection } from "../intent/templates.js";
import { ActionCategory } from "../actions/templates.js";
import { AdaptActionInput, AdaptActionResult, AiProvider, AnswerQuestionInput, IntentDetectionResult } from "./types.js";

const RATIONALE: Record<ActionCategory, string> = {
  diet: "این اقدام رو به این شکل انتخاب کردیم چون رژیم‌های سخت‌گیرانه معمولاً پایدار نمی‌مونن؛ هدف تغییر واقعیه، نه یه محدودیت موقت.",
  activity: "این نوع فعالیت رو انتخاب کردیم چون با شرایط فعلیت هم‌خونی داره و می‌تونی به‌صورت مداوم انجامش بدی — پیوستگی مهم‌تر از شدته.",
  sleep: "خواب پایه‌ی خیلی از تغییرات دیگه‌ست، برای همین قبل از هر چیز دیگه‌ای روی ثبات خوابت تمرکز کردیم.",
  lifestyle: "این اقدام بر اساس چیزی که درباره‌ی سبک زندگیت گفتی انتخاب شده تا واقعاً قابل‌اجرا باشه، نه فقط یه توصیه‌ی کلی.",
};

const FREQUENCY_GUIDANCE =
  "بهتره این رو به‌صورت پایدار و پیوسته انجام بدی، نه یکباره و پرفشار. جزئیات دقیق‌تر توی همون صفحه‌ی اقدام نوشته شده.";

const DEFAULT_ANSWER =
  "این سوالت رو یادداشت کردم. اگه احساس می‌کنی این اقدام برات سخته، از همون صفحه‌ی اقدام روی «سخته، کمکم کن» بزن تا باهم مسیر رو ساده‌ترش کنیم — قرار نیست جا بزنیم، قرار قدم‌ها رو متناسب کنیم.";

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

const SOFTENED: Record<ActionCategory, { summary: string; steps: string[] }> = {
  diet: {
    summary: "قدم کوچیک‌تر: فقط با یک تغییر کوچیک در یک وعده شروع کن.",
    steps: ["فقط یک وعده در روز رو کمی سالم‌تر کن.", "بقیه‌ی وعده‌ها رو فعلاً همون‌طوری که هست نگه دار."],
  },
  activity: {
    summary: "قدم کوچیک‌تر: با مدت و شدت کمتر شروع کن.",
    steps: ["هفته‌ای فقط ۲ روز، ۱۰ تا ۱۵ دقیقه فعالیت سبک انجام بده.", "هر وقت آماده بودی، کم‌کم زمان رو زیاد کن."],
  },
  sleep: {
    summary: "قدم کوچیک‌تر: فقط روی یک ساعت مشخص برای خواب تمرکز کن.",
    steps: ["فقط سعی کن هر شب نزدیک یک ساعت مشخص بخوابی، حتی اگه دقیق نباشه.", "فعلاً به بقیه‌ی جزئیات فکر نکن."],
  },
  lifestyle: {
    summary: "قدم کوچیک‌تر: یک قدم کوچیک در هفته.",
    steps: ["فقط یک تغییر کوچیک رو برای این هفته انتخاب کن.", "بقیه رو برای هفته‌های بعد بذار."],
  },
};

function adaptReply(reason: AdaptActionInput["reason"], actionTitle: string): string {
  if (reason === "too_hard") {
    return `حق داری، این ممکنه فعلاً سنگین باشه. هدف عوض نمی‌شه، فقط مسیر رسیدن به «${actionTitle}» رو یه قدم کوچیک‌تر کردم که بتونی همین حالا شروع کنی.`;
  }
  return `طبیعیه که وسط راه به مانع بخوری. عقب نمی‌ریم؛ فقط قدم «${actionTitle}» رو کوچیک‌تر کردم تا بتونی ادامه بدی.`;
}

class RuleBasedAiProvider implements AiProvider {
  async detectIntent(text: string): Promise<IntentDetectionResult> {
    const { goal, matchedKeyword } = detectIntent(text);
    return { goal, matchedKeyword, reflection: getIntentReflection(goal) };
  }

  async answerQuestion({ category, question }: AnswerQuestionInput): Promise<string> {
    const text = question.trim();

    if (includesAny(text, ["چرا", "دلیل"])) {
      return RATIONALE[category];
    }
    if (includesAny(text, ["چقدر", "چند بار", "چند روز", "چند وقت"])) {
      return FREQUENCY_GUIDANCE;
    }
    return DEFAULT_ANSWER;
  }

  async adaptAction({ category, title, reason }: AdaptActionInput): Promise<AdaptActionResult> {
    const softened = SOFTENED[category];
    return {
      summary: softened.summary,
      steps: softened.steps,
      reply: adaptReply(reason, title),
    };
  }
}

export const ruleBasedProvider = new RuleBasedAiProvider();
