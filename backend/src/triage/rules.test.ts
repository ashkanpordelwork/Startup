import { describe, expect, it } from "vitest";
import { computeTrack } from "./rules.js";
import { IntakeAnswers, Track } from "./types.js";

function baseAnswers(): IntakeAnswers {
  return {
    redFlags: {
      isPregnant: false,
      hasDiabetesKidneyHeartOrBP: false,
      hasEatingDisorderHistory: false,
      onMetabolicMedication: false,
      underDoctorSupervision: false,
      ageUnder18OrOver65: false,
    },
    sleep: {
      avgSleepHours: 7.5,
      sleepConsistency: "consistent",
      wakeUpFeeling: "rested",
      hasInsomnia: false,
    },
    stress: {
      stressLevel: "low",
      majorLifeChangeRecently: false,
      emotionalEating: false,
    },
    dietHistory: {
      previousDietsCount: 0,
      hasYoyoWeightHistory: false,
      currentlyEliminatingFoodGroup: false,
    },
    activity: {
      currentActivityLevel: "moderate",
      hasInjuryOrMobilityLimitation: false,
    },
    goal: {
      primaryGoal: "habit_building",
      motivation: "intrinsic",
    },
  };
}

describe("computeTrack", () => {
  it("returns TRACK_0 when a red flag is present, regardless of other answers", () => {
    const a = baseAnswers();
    a.redFlags.hasDiabetesKidneyHeartOrBP = true;
    a.sleep.hasInsomnia = true;
    a.stress.stressLevel = "high";
    const result = computeTrack(a);
    expect(result.track).toBe(Track.TRACK_0_RED_FLAG);
    expect(result.reasonCodes).toContain("red_flag_present");
  });

  it("returns TRACK_1 for poor sleep + high stress with no red flags", () => {
    const a = baseAnswers();
    a.sleep.avgSleepHours = 5;
    a.stress.stressLevel = "high";
    const result = computeTrack(a);
    expect(result.track).toBe(Track.TRACK_1_SLEEP_STRESS);
  });

  it("does not trigger TRACK_1 when only sleep is poor but stress is low", () => {
    const a = baseAnswers();
    a.sleep.avgSleepHours = 5;
    const result = computeTrack(a);
    expect(result.track).not.toBe(Track.TRACK_1_SLEEP_STRESS);
  });

  it("returns TRACK_2 for yoyo diet history when sleep/stress are fine", () => {
    const a = baseAnswers();
    a.dietHistory.hasYoyoWeightHistory = true;
    const result = computeTrack(a);
    expect(result.track).toBe(Track.TRACK_2_DIET_HISTORY);
  });

  it("returns TRACK_2 when previousDietsCount >= 3", () => {
    const a = baseAnswers();
    a.dietHistory.previousDietsCount = 4;
    const result = computeTrack(a);
    expect(result.track).toBe(Track.TRACK_2_DIET_HISTORY);
  });

  it("returns TRACK_3 for mobility limitation with clean other groups", () => {
    const a = baseAnswers();
    a.activity.hasInjuryOrMobilityLimitation = true;
    const result = computeTrack(a);
    expect(result.track).toBe(Track.TRACK_3_MOBILITY);
  });

  it("returns TRACK_4 baseline when nothing else applies", () => {
    const a = baseAnswers();
    const result = computeTrack(a);
    expect(result.track).toBe(Track.TRACK_4_BASELINE);
  });

  it("prioritizes TRACK_1 over TRACK_2/3 when both conditions are met", () => {
    const a = baseAnswers();
    a.sleep.avgSleepHours = 4;
    a.stress.stressLevel = "high";
    a.dietHistory.hasYoyoWeightHistory = true;
    a.activity.hasInjuryOrMobilityLimitation = true;
    const result = computeTrack(a);
    expect(result.track).toBe(Track.TRACK_1_SLEEP_STRESS);
  });

  it("prioritizes TRACK_2 over TRACK_3 when both conditions are met but not TRACK_1", () => {
    const a = baseAnswers();
    a.dietHistory.hasYoyoWeightHistory = true;
    a.activity.hasInjuryOrMobilityLimitation = true;
    const result = computeTrack(a);
    expect(result.track).toBe(Track.TRACK_2_DIET_HISTORY);
  });

  it("every track message contains non-empty text", () => {
    const tracks: Track[] = [
      Track.TRACK_0_RED_FLAG,
      Track.TRACK_1_SLEEP_STRESS,
      Track.TRACK_2_DIET_HISTORY,
      Track.TRACK_3_MOBILITY,
      Track.TRACK_4_BASELINE,
    ];
    for (const t of tracks) {
      const a = baseAnswers();
      if (t === Track.TRACK_0_RED_FLAG) a.redFlags.isPregnant = true;
      if (t === Track.TRACK_1_SLEEP_STRESS) {
        a.sleep.avgSleepHours = 4;
        a.stress.stressLevel = "high";
      }
      if (t === Track.TRACK_2_DIET_HISTORY) a.dietHistory.hasYoyoWeightHistory = true;
      if (t === Track.TRACK_3_MOBILITY) a.activity.hasInjuryOrMobilityLimitation = true;
      const result = computeTrack(a);
      expect(result.message.length).toBeGreaterThan(10);
    }
  });
});
