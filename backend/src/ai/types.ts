import { ActionCategory } from "../actions/templates.js";
import { GoalAnswers } from "../triage/types.js";

export interface IntentDetectionResult {
  goal: GoalAnswers["primaryGoal"] | null;
  matchedKeyword: string | null;
  reflection: string;
  /**
   * When set, the goal was ambiguous — the caller should show this as a bot
   * message and wait for another free-text reply instead of moving to the
   * structured question bank (product-business-decisions §6.1, "کاوش آزاد").
   * Only ever set by AI-backed providers; the rule-based provider has no way
   * to generate a genuinely relevant follow-up question.
   */
  clarifyingQuestion?: string;
}

export interface AnswerQuestionInput {
  category: ActionCategory;
  actionTitle: string;
  question: string;
}

export type AdaptReason = "too_hard" | "struggling";

export interface AdaptActionInput {
  category: ActionCategory;
  title: string;
  reason: AdaptReason;
}

export interface AdaptActionResult {
  summary: string;
  steps: string[];
  reply: string;
}

/**
 * Everything the product treats as "the AI" goes through this interface.
 * Today it's backed by rule-based/keyword logic (RuleBasedAiProvider); swapping
 * in a real model later means implementing this same interface and switching
 * the provider in ai/index.ts — no caller (routes, frontend) needs to change.
 */
export interface ConverseResult {
  reply: string;
  readyToBuildPlan: boolean;
}

export interface AiProvider {
  detectIntent(text: string): Promise<IntentDetectionResult>;
  answerQuestion(input: AnswerQuestionInput): Promise<string>;
  adaptAction(input: AdaptActionInput): Promise<AdaptActionResult>;
  /**
   * Free-form onboarding conversation (product-business-decisions §12).
   * Only meaningfully implemented by AI-backed providers — the rule-based
   * provider throws, since it has no way to hold an open conversation; the
   * frontend falls back to the old structured bottom-sheet flow in that case.
   */
  converseOnboarding(history: { role: "user" | "assistant"; text: string }[]): Promise<ConverseResult>;
  /**
   * Turns a free-form conversation into the structured IntakeAnswers object
   * the existing rule-based triage engine (computeTrack) already consumes.
   * AI is only a translator here — the triage decision logic itself is
   * untouched (§12: "AI فقط لایه‌ی رابط/مترجم است").
   */
  extractIntakeAnswers(
    history: { role: "user" | "assistant"; text: string }[]
  ): Promise<import("../triage/types.js").IntakeAnswers>;
}
