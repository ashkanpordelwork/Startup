import { describe, expect, it } from "vitest";
import { Track } from "../triage/types.js";
import { getActionTemplates } from "./templates.js";

describe("getActionTemplates", () => {
  const tracks = [
    Track.TRACK_0_RED_FLAG,
    Track.TRACK_1_SLEEP_STRESS,
    Track.TRACK_2_DIET_HISTORY,
    Track.TRACK_3_MOBILITY,
    Track.TRACK_4_BASELINE,
  ];

  it("returns at least one action template per track", () => {
    for (const t of tracks) {
      expect(getActionTemplates(t).length).toBeGreaterThan(0);
    }
  });

  it("every action template has a title, summary, and non-empty steps", () => {
    for (const t of tracks) {
      for (const template of getActionTemplates(t)) {
        expect(template.title.length).toBeGreaterThan(3);
        expect(template.summary.length).toBeGreaterThan(3);
        expect(template.steps.length).toBeGreaterThan(0);
        for (const step of template.steps) {
          expect(step.length).toBeGreaterThan(3);
        }
      }
    }
  });
});
