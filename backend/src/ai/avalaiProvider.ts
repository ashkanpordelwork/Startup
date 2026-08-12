import { detectIntent as ruleDetectIntent } from "../intent/detect.js";
import { FALLBACK_REFLECTION, getIntentReflection } from "../intent/templates.js";
import { ruleBasedProvider } from "./ruleBasedProvider.js";
import {
  AdaptActionInput,
  AdaptActionResult,
  AiProvider,
  AnswerQuestionInput,
  IntentDetectionResult,
} from "./types.js";

/**
 * Real AI provider backed by AvalAI's OpenAI-compatible endpoint, using
 * DeepSeek as the default (cheapest capable) model. Falls back to the
 * rule-based provider whenever the API call fails or the key is missing —
 * this is the "graceful degradation" behavior agreed on for network
 * instability from Iran (see product decisions doc, onboarding flow §6.1).
 */

const AVALAI_BASE_URL = "https://api.avalai.ir/v1";
const DEFAULT_MODEL = "deepseek-chat";

const SYSTEM_PROMPT = `تو یه دستیار همراه و صبور در یک اپ سلامت/سبک‌زندگی فارسی‌زبان هستی، نه یک پزشک.
قوانین سخت‌گیرانه‌ای که همیشه باید رعایت کنی:
- هیچ‌وقت تشخیص پزشکی نده یا وانمود نکن پزشکی.
- هیچ‌وقت پیشنهاد نده کاربر یه هدف یا اقدام رو کنار بذاره یا حذف کنه — فقط می‌تونی بگی ساده‌ترش کنه.
- لحنت حمایتی، غیرقضاوتی، و فارسی محاوره‌ای (نه رسمی) باشه.
- کوتاه و مشخص جواب بده، نه طولانی و کلی‌گو.
- اگه کاربر نشونه‌ای از پرچم قرمز پزشکی (بارداری، دیابت، فشار خون، سابقه‌ی اختلال خوردن) نشون داد، لحنت رو محتاطانه کن.`;

/**
 * The open-ended onboarding checklist (product-business-decisions §12).
 * Every field here maps 1:1 to a field the rule-based triage engine
 * (computeTrack) needs — this list is the contract between the free
 * conversation and the existing, unchanged triage logic.
 */
const ONBOARDING_CHECKLIST = `این‌ها چیزهاییه که باید تا آخر مکالمه، از دل صحبت طبیعی (نه سوال‌پیچی)، بفهمی:

پرچم‌های قرمز (اجباری — باید حتماً هرکدوم رو بپرسی، ولی نه همه‌شونو یه‌جا اول کار؛ هرجا طبیعی بود بپرس و توی جوابت بهش اشاره کن):
- آیا باردار است (فقط اگر زن است)
- آیا دیابت/بیماری کلیوی/قلبی/فشار خون دارد
- آیا سابقه‌ی اختلال خوردن دارد
- آیا داروی متابولیک مصرف می‌کند
- آیا تحت نظر پزشک است
- سنش زیر ۱۸ یا بالای ۶۵ است

بقیه (اجباری، ولی زمان‌بندی و ترتیب پرسیدن کاملاً با خودته):
- خواب: میانگین ساعت خواب، منظم بودن خواب، حس بیدار شدن، آیا بی‌خوابی دارد
- استرس: سطح استرس، آیا اخیراً تغییر بزرگی در زندگی داشته، آیا استرس باعث پرخوری می‌شود
- تاریخچه‌ی رژیم: چندبار رژیم گرفته، آیا سابقه‌ی یویو دارد، آیا الان یک گروه غذایی رو حذف کرده (اگه بله، کدوم گروه‌ها)
- فعالیت: سطح فعالیت فعلی، آیا آسیب/محدودیت حرکتی دارد
- هدف: هدف اصلی‌اش چیه (کاهش وزن/انرژی/خواب/استرس/عادت‌سازی)، انگیزه‌اش درونیه یا بیرونی (مثلاً برای خودش می‌خواد یا برای دیگران)

وقتی همه‌ی این‌ها رو (حداقل به‌اندازه‌ی کافی) فهمیدی، در پایان پیامت این خط رو دقیقاً همین‌شکلی (توی خط جدا) بنویس:
[READY_TO_BUILD]
این خط هیچ‌وقت به کاربر نشون داده نمی‌شه، فقط یه علامت داخلیه. قبلش توی همون پیام، صریح از کاربر بپرس: «فکر کنم به‌اندازه‌ی کافی فهمیدم — می‌خوای الان برات یه پلن اختصاصی بسازم؟»`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callAvalAI(messages: ChatMessage[], maxTokens = 300): Promise<string> {
  const apiKey = process.env.AVALAI_API_KEY;
  if (!apiKey) {
    throw new Error("AVALAI_API_KEY is not set");
  }

  const response = await fetch(`${AVALAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.AVALAI_MODEL || DEFAULT_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.6,
    }),
    // Avoid hanging the request forever if AvalAI is unreachable (Iran network instability)
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`AvalAI request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AvalAI response had no content");
  }
  return content.trim();
}

async function detectIntent(text: string): Promise<IntentDetectionResult> {
  // Intent detection stays rule-based even in the AI provider: it's a cheap,
  // low-risk keyword match, and keeping it deterministic avoids burning an
  // API call (and the associated latency/cost) on every single message.
  const { goal, matchedKeyword } = ruleDetectIntent(text);

  if (goal) {
    return { goal, matchedKeyword, reflection: getIntentReflection(goal) };
  }

  // Ambiguous input ("نمی‌دونم چمه، فقط حالم خوب نیست") — this is exactly the
  // case that needs a real model, not a keyword list. Ask one short, open,
  // empathetic follow-up question to help narrow down the topic.
  try {
    const clarifyingQuestion = await callAvalAI(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `کاربر توی همون قدم اول گفته: "${text}" — این خیلی کلی/مبهمه و به هیچ‌کدوم از حوزه‌های خواب، استرس، انرژی، وزن، یا عادت‌سازی مستقیم اشاره نکرده. به‌جای فرم زدن، فقط یک سوال کوتاه و کنجکاوانه (نه چندتا) بپرس که کمکش کنه خودش حوزه‌ی اصلی مشکلش رو پیدا کنه — مثلاً درباره‌ی خواب، انرژی روزانه، یا استرس بپرس. فقط خود سوال رو بنویس، بدون مقدمه یا توضیح اضافه.`,
        },
      ],
      120
    );
    return { goal: null, matchedKeyword: null, reflection: FALLBACK_REFLECTION, clarifyingQuestion };
  } catch (err) {
    console.error("[avalaiProvider] detectIntent clarifying-question fallback:", err);
    return { goal: null, matchedKeyword: null, reflection: FALLBACK_REFLECTION };
  }
}

async function answerQuestion(input: AnswerQuestionInput): Promise<string> {
  try {
    return await callAvalAI([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `کاربر درباره‌ی اقدام «${input.actionTitle}» (دسته: ${input.category}) این سوال رو پرسیده: ${input.question}`,
      },
    ]);
  } catch (err) {
    console.error("[avalaiProvider] answerQuestion fallback to rule-based:", err);
    return ruleBasedProvider.answerQuestion(input);
  }
}

async function adaptAction(input: AdaptActionInput): Promise<AdaptActionResult> {
  try {
    const reasonText = input.reason === "too_hard" ? "خیلی سخته" : "داره باهاش کلنجار می‌ره";
    const raw = await callAvalAI([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `کاربر گفته اقدام «${input.title}» (دسته: ${input.category}) براش ${reasonText}. یه نسخه‌ی خیلی ساده‌تر و کوچیک‌تر از همین اقدام پیشنهاد بده. خروجی رو دقیقاً به این فرمت JSON بده و چیز دیگه‌ای ننویس: {"summary": "...", "steps": ["...", "..."], "reply": "..."}`,
      },
    ]);
    const parsed = JSON.parse(raw) as AdaptActionResult;
    if (!parsed.summary || !Array.isArray(parsed.steps) || !parsed.reply) {
      throw new Error("Malformed adaptAction JSON from AvalAI");
    }
    return parsed;
  } catch (err) {
    console.error("[avalaiProvider] adaptAction fallback to rule-based:", err);
    return ruleBasedProvider.adaptAction(input);
  }
}

async function converseOnboarding(
  history: { role: "user" | "assistant"; text: string }[]
): Promise<{ reply: string; readyToBuildPlan: boolean }> {
  const messages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${ONBOARDING_CHECKLIST}` },
    ...history.map((h) => ({ role: h.role, content: h.text }) as ChatMessage),
  ];
  const raw = await callAvalAI(messages, 350);
  const readyToBuildPlan = raw.includes("[READY_TO_BUILD]");
  const reply = raw.replace("[READY_TO_BUILD]", "").trim();
  return { reply, readyToBuildPlan };
}

const EXTRACTION_SCHEMA_PROMPT = `از روی کل مکالمه‌ی زیر، این JSON رو دقیقاً با همین ساختار پر کن. اگه چیزی صریح گفته نشده بود، منطقی‌ترین حدس رو از روی context بزن (نه مقدار تصادفی). فقط خود JSON رو برگردون، هیچ توضیح یا متن اضافه‌ای ننویس:

{
  "redFlags": {
    "isPregnant": boolean,
    "hasDiabetesKidneyHeartOrBP": boolean,
    "hasEatingDisorderHistory": boolean,
    "onMetabolicMedication": boolean,
    "underDoctorSupervision": boolean,
    "ageUnder18OrOver65": boolean
  },
  "sleep": {
    "avgSleepHours": number,
    "sleepConsistency": "consistent" | "somewhat" | "inconsistent",
    "wakeUpFeeling": "rested" | "neutral" | "exhausted",
    "hasInsomnia": boolean
  },
  "stress": {
    "stressLevel": "low" | "moderate" | "high",
    "majorLifeChangeRecently": boolean,
    "emotionalEating": boolean
  },
  "dietHistory": {
    "previousDietsCount": number,
    "hasYoyoWeightHistory": boolean,
    "currentlyEliminatingFoodGroup": boolean
  },
  "activity": {
    "currentActivityLevel": "sedentary" | "light" | "moderate" | "active",
    "hasInjuryOrMobilityLimitation": boolean
  },
  "goal": {
    "primaryGoal": "weight_loss" | "energy" | "sleep" | "stress" | "habit_building",
    "motivation": "intrinsic" | "extrinsic"
  }
}`;

async function extractIntakeAnswers(
  history: { role: "user" | "assistant"; text: string }[]
): Promise<import("../triage/types.js").IntakeAnswers> {
  const transcript = history.map((h) => `${h.role === "user" ? "کاربر" : "دستیار"}: ${h.text}`).join("\n");
  const raw = await callAvalAI(
    [
      { role: "system", content: EXTRACTION_SCHEMA_PROMPT },
      { role: "user", content: `مکالمه:\n${transcript}` },
    ],
    600
  );
  const parsed = JSON.parse(raw) as import("../triage/types.js").IntakeAnswers;
  if (!parsed.redFlags || !parsed.sleep || !parsed.stress || !parsed.dietHistory || !parsed.activity || !parsed.goal) {
    throw new Error("Malformed IntakeAnswers JSON from AvalAI extraction");
  }
  return parsed;
}

export const avalaiProvider: AiProvider = {
  detectIntent,
  answerQuestion,
  adaptAction,
  converseOnboarding,
  extractIntakeAnswers,
};
