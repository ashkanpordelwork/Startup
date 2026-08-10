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
export interface AiProvider {
  detectIntent(text: string): Promise<IntentDetectionResult>;
  answerQuestion(input: AnswerQuestionInput): Promise<string>;
  adaptAction(input: AdaptActionInput): Promise<AdaptActionResult>;
}
