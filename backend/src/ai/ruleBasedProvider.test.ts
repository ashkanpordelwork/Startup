import { describe, expect, it } from "vitest";
import { ActionCategory } from "../actions/templates.js";
import { ruleBasedProvider } from "./ruleBasedProvider.js";

const CATEGORIES: ActionCategory[] = ["diet", "activity", "sleep", "lifestyle"];

describe("ruleBasedProvider.detectIntent", () => {
  it("detects a goal and returns a matching reflection", async () => {
    const result = await ruleBasedProvider.detectIntent("می‌خوام وزن کم کنم");
    expect(result.goal).toBe("weight_loss");
    expect(result.reflection.length).toBeGreaterThan(5);
  });
});

describe("ruleBasedProvider.answerQuestion", () => {
  it("gives a non-empty answer for every category regardless of question phrasing", async () => {
    for (const category of CATEGORIES) {
      for (const question of ["چرا این پیشنهاد شد؟", "چند بار در هفته؟", "یه سوال کاملاً نامرتبط"]) {
        const reply = await ruleBasedProvider.answerQuestion({ category, actionTitle: "t", question });
        expect(reply.length).toBeGreaterThan(5);
      }
    }
  });
});

describe("ruleBasedProvider.adaptAction", () => {
  it("never removes the action — always returns a smaller but concrete next step", async () => {
    for (const category of CATEGORIES) {
      for (const reason of ["too_hard", "struggling"] as const) {
        const result = await ruleBasedProvider.adaptAction({ category, title: "هدف نمونه", reason });
        expect(result.steps.length).toBeGreaterThan(0);
        expect(result.summary.length).toBeGreaterThan(5);
        expect(result.reply.length).toBeGreaterThan(5);
        expect(result.reply).toContain("هدف نمونه");
      }
    }
  });
});
