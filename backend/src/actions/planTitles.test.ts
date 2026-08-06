import { describe, expect, it } from "vitest";
import { Track } from "../triage/types.js";
import { getPlanTitle } from "./planTitles.js";

describe("getPlanTitle", () => {
  it("uses the goal-based title when a goal is provided", () => {
    expect(getPlanTitle("weight_loss", Track.TRACK_4_BASELINE)).toBe("برنامه کاهش وزن");
  });

  it("falls back to a track-based title when goal is missing", () => {
    expect(getPlanTitle(undefined, Track.TRACK_1_SLEEP_STRESS)).toBe("برنامه‌ی خواب و استرس");
  });
});
