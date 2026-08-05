import { IntakeAnswers, Track, TrackResult } from "./types.js";
import { getTemplate } from "./templates.js";

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

export function computeTrack(answers: IntakeAnswers): TrackResult {
  const reasonCodes: string[] = [];

  if (hasRedFlag(answers)) {
    reasonCodes.push("red_flag_present");
    return { track: Track.TRACK_0_RED_FLAG, message: getTemplate(Track.TRACK_0_RED_FLAG), reasonCodes };
  }

  const poorSleep = hasPoorSleep(answers);
  const highStress = hasHighStress(answers);
  if (poorSleep && highStress) {
    reasonCodes.push("poor_sleep", "high_stress");
    return { track: Track.TRACK_1_SLEEP_STRESS, message: getTemplate(Track.TRACK_1_SLEEP_STRESS), reasonCodes };
  }

  if (hasYoyoOrRestrictiveHistory(answers)) {
    reasonCodes.push("yoyo_diet_history");
    return { track: Track.TRACK_2_DIET_HISTORY, message: getTemplate(Track.TRACK_2_DIET_HISTORY), reasonCodes };
  }

  if (hasMobilityLimitation(answers)) {
    reasonCodes.push("mobility_limitation");
    return { track: Track.TRACK_3_MOBILITY, message: getTemplate(Track.TRACK_3_MOBILITY), reasonCodes };
  }

  reasonCodes.push("baseline");
  return { track: Track.TRACK_4_BASELINE, message: getTemplate(Track.TRACK_4_BASELINE), reasonCodes };
}
