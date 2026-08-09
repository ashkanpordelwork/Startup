import { avalaiProvider } from "./avalaiProvider.js";
import { ruleBasedProvider } from "./ruleBasedProvider.js";
import { AiProvider } from "./types.js";

export type { AiProvider } from "./types.js";

/**
 * Single seam for swapping in a real AI later. Add a new provider file
 * (e.g. ai/anthropicProvider.ts) implementing AiProvider, then branch on
 * process.env.AI_PROVIDER here — no route or frontend code needs to change,
 * since everything already talks to the AiProvider interface, not to
 * rule-based logic directly.
 */
export function getAiProvider(): AiProvider {
  switch (process.env.AI_PROVIDER) {
    case "avalai":
      return avalaiProvider;
    default:
      return ruleBasedProvider;
  }
}
