import { IntakeAnswers, Track, TrackResult } from "./types.js";
import { getTemplate, getTemplateSteps } from "./templates.js";

function hasRedFlag(a: IntakeAnswers): boolean {
  const rf = a.redFlags;
  return (
    rf.isPregnant ||
    rf.hasDiabetesKidneyHeartOrBP ||
    rf.hasEatingDisorderHistory ||
    rf.onMetabolicMedication ||
    rf.underDoctorSupervision ||
    rf.ageUnder18OrOver65
  );
}

function hasPoorSleep(a: IntakeAnswers): boolean {
  const s = a.sleep;
  return (
    s.avgSleepHours < 6 ||
    s.sleepConsistency === "inconsistent" ||
    s.wakeUpFeeling === "exhausted" ||
    s.hasInsomnia
  );
}

function hasHighStress(a: IntakeAnswers): boolean {
  const st = a.stress;
  return st.stressLevel === "high" || st.majorLifeChangeRecently || st.emotionalEating;
}

function hasYoyoOrRestrictiveHistory(a: IntakeAnswers): boolean {
  const d = a.dietHistory;
  return d.hasYoyoWeightHistory || d.previousDietsCount >= 3 || d.currentlyEliminatingFoodGroup;
}

function hasMobilityLimitation(a: IntakeAnswers): boolean {
  return a.activity.hasInjuryOrMobilityLimitation;
}

function buildResult(track: Track, reasonCodes: string[]): TrackResult {
  const { reflection, risk, alternative } = getTemplateSteps(track);
  return { track, message: getTemplate(track), steps: [reflection, risk, alternative], reasonCodes };
}

export function computeTrack(answers: IntakeAnswers): TrackResult {
  if (hasRedFlag(answers)) {
    return buildResult(Track.TRACK_0_RED_FLAG, ["red_flag_present"]);
  }

  const poorSleep = hasPoorSleep(answers);
  const highStress = hasHighStress(answers);
  if (poorSleep && highStress) {
    return buildResult(Track.TRACK_1_SLEEP_STRESS, ["poor_sleep", "high_stress"]);
  }

  if (hasYoyoOrRestrictiveHistory(answers)) {
    return buildResult(Track.TRACK_2_DIET_HISTORY, ["yoyo_diet_history"]);
  }

  if (hasMobilityLimitation(answers)) {
    return buildResult(Track.TRACK_3_MOBILITY, ["mobility_limitation"]);
  }

  return buildResult(Track.TRACK_4_BASELINE, ["baseline"]);
}
