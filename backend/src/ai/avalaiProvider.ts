import { detectIntent as ruleDetectIntent } from "../intent/detect.js";
import { getIntentReflection } from "../intent/templates.js";
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
  return { goal, matchedKeyword, reflection: getIntentReflection(goal) };
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

export const avalaiProvider: AiProvider = {
  detectIntent,
  answerQuestion,
  adaptAction,
};
