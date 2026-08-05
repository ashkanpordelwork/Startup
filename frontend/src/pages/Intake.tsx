import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitIntake } from "../api/client";
import { IntakeAnswers } from "../api/types";
import { getStoredUserId, setStoredUserId } from "../userId";

type OptionDef<T> = { value: T; label: string };

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: OptionDef<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="question">
      <span className="field-label">{label}</span>
      <div className="options">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`option-btn ${value === opt.value ? "selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BoolGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <OptionGroup<"yes" | "no">
      label={label}
      value={value ? "yes" : "no"}
      onChange={(v) => onChange(v === "yes")}
      options={[
        { value: "yes", label: "بله" },
        { value: "no", label: "خیر" },
      ]}
    />
  );
}

const defaultAnswers: IntakeAnswers = {
  redFlags: {
    isPregnant: false,
    hasDiabetesKidneyHeartOrBP: false,
    hasEatingDisorderHistory: false,
    onMetabolicMedication: false,
    underDoctorSupervision: false,
    ageUnder18OrOver65: false,
  },
  sleep: {
    avgSleepHours: 7,
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

const STEPS = ["پرچم‌های ایمنی", "خواب", "استرس", "سابقه‌ی رژیم", "فعالیت بدنی", "هدف"];

export default function Intake() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<IntakeAnswers>(defaultAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isLastStep = step === STEPS.length - 1;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitIntake(getStoredUserId(), answers);
      setStoredUserId(result.userId);
      navigate("/result", { state: result });
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="step-title">
        مرحله {step + 1} از {STEPS.length}: {STEPS[step]}
      </div>

      {step === 0 && (
        <>
          <BoolGroup
            label="آیا باردار هستید؟"
            value={answers.redFlags.isPregnant}
            onChange={(v) => setAnswers({ ...answers, redFlags: { ...answers.redFlags, isPregnant: v } })}
          />
          <BoolGroup
            label="آیا دیابت، بیماری کلیوی، قلبی یا فشار خون دارید؟"
            value={answers.redFlags.hasDiabetesKidneyHeartOrBP}
            onChange={(v) =>
              setAnswers({ ...answers, redFlags: { ...answers.redFlags, hasDiabetesKidneyHeartOrBP: v } })
            }
          />
          <BoolGroup
            label="آیا سابقه‌ی اختلال خوردن دارید؟"
            value={answers.redFlags.hasEatingDisorderHistory}
            onChange={(v) =>
              setAnswers({ ...answers, redFlags: { ...answers.redFlags, hasEatingDisorderHistory: v } })
            }
          />
          <BoolGroup
            label="آیا داروی متابولیک مصرف می‌کنید؟"
            value={answers.redFlags.onMetabolicMedication}
            onChange={(v) =>
              setAnswers({ ...answers, redFlags: { ...answers.redFlags, onMetabolicMedication: v } })
            }
          />
          <BoolGroup
            label="آیا در حال حاضر تحت نظر پزشک هستید؟"
            value={answers.redFlags.underDoctorSupervision}
            onChange={(v) =>
              setAnswers({ ...answers, redFlags: { ...answers.redFlags, underDoctorSupervision: v } })
            }
          />
          <BoolGroup
            label="آیا سن شما زیر ۱۸ یا بالای ۶۵ سال است؟"
            value={answers.redFlags.ageUnder18OrOver65}
            onChange={(v) =>
              setAnswers({ ...answers, redFlags: { ...answers.redFlags, ageUnder18OrOver65: v } })
            }
          />
        </>
      )}

      {step === 1 && (
        <>
          <OptionGroup<string>
            label="به‌طور میانگین چند ساعت می‌خوابید؟"
            value={String(answers.sleep.avgSleepHours)}
            onChange={(v) =>
              setAnswers({ ...answers, sleep: { ...answers.sleep, avgSleepHours: Number(v) } })
            }
            options={[
              { value: "4", label: "کمتر از ۵" },
              { value: "6", label: "۵ تا ۶" },
              { value: "7", label: "۶ تا ۸" },
              { value: "9", label: "بیشتر از ۸" },
            ]}
          />
          <OptionGroup
            label="ثبات خواب شما چطور است؟"
            value={answers.sleep.sleepConsistency}
            onChange={(v) => setAnswers({ ...answers, sleep: { ...answers.sleep, sleepConsistency: v } })}
            options={[
              { value: "consistent", label: "منظم" },
              { value: "somewhat", label: "تا حدی منظم" },
              { value: "inconsistent", label: "نامنظم" },
            ]}
          />
          <OptionGroup
            label="معمولاً بعد از بیدار شدن چه حسی دارید؟"
            value={answers.sleep.wakeUpFeeling}
            onChange={(v) => setAnswers({ ...answers, sleep: { ...answers.sleep, wakeUpFeeling: v } })}
            options={[
              { value: "rested", label: "سرحال" },
              { value: "neutral", label: "معمولی" },
              { value: "exhausted", label: "خسته" },
            ]}
          />
          <BoolGroup
            label="آیا بی‌خوابی دارید؟"
            value={answers.sleep.hasInsomnia}
            onChange={(v) => setAnswers({ ...answers, sleep: { ...answers.sleep, hasInsomnia: v } })}
          />
        </>
      )}

      {step === 2 && (
        <>
          <OptionGroup
            label="سطح استرس فعلی شما چقدر است؟"
            value={answers.stress.stressLevel}
            onChange={(v) => setAnswers({ ...answers, stress: { ...answers.stress, stressLevel: v } })}
            options={[
              { value: "low", label: "کم" },
              { value: "moderate", label: "متوسط" },
              { value: "high", label: "زیاد" },
            ]}
          />
          <BoolGroup
            label="آیا اخیراً تغییر بزرگی در زندگی داشته‌اید؟"
            value={answers.stress.majorLifeChangeRecently}
            onChange={(v) =>
              setAnswers({ ...answers, stress: { ...answers.stress, majorLifeChangeRecently: v } })
            }
          />
          <BoolGroup
            label="آیا هنگام استرس یا احساسات منفی پرخوری می‌کنید؟"
            value={answers.stress.emotionalEating}
            onChange={(v) => setAnswers({ ...answers, stress: { ...answers.stress, emotionalEating: v } })}
          />
        </>
      )}

      {step === 3 && (
        <>
          <OptionGroup<string>
            label="تا به حال چند بار رژیم گرفته‌اید؟"
            value={String(answers.dietHistory.previousDietsCount)}
            onChange={(v) =>
              setAnswers({ ...answers, dietHistory: { ...answers.dietHistory, previousDietsCount: Number(v) } })
            }
            options={[
              { value: "0", label: "هیچ‌وقت" },
              { value: "1", label: "۱-۲ بار" },
              { value: "3", label: "۳ بار یا بیشتر" },
            ]}
          />
          <BoolGroup
            label="آیا بعد از رژیم‌های قبلی وزنتون برگشته (یویو)؟"
            value={answers.dietHistory.hasYoyoWeightHistory}
            onChange={(v) =>
              setAnswers({ ...answers, dietHistory: { ...answers.dietHistory, hasYoyoWeightHistory: v } })
            }
          />
          <BoolGroup
            label="آیا در حال حاضر یک گروه غذایی رو حذف کرده‌اید؟"
            value={answers.dietHistory.currentlyEliminatingFoodGroup}
            onChange={(v) =>
              setAnswers({
                ...answers,
                dietHistory: { ...answers.dietHistory, currentlyEliminatingFoodGroup: v },
              })
            }
          />
        </>
      )}

      {step === 4 && (
        <>
          <OptionGroup
            label="سطح فعالیت بدنی فعلی شما چطور است؟"
            value={answers.activity.currentActivityLevel}
            onChange={(v) =>
              setAnswers({ ...answers, activity: { ...answers.activity, currentActivityLevel: v } })
            }
            options={[
              { value: "sedentary", label: "کم‌تحرک" },
              { value: "light", label: "سبک" },
              { value: "moderate", label: "متوسط" },
              { value: "active", label: "فعال" },
            ]}
          />
          <BoolGroup
            label="آیا آسیب یا محدودیت حرکتی دارید؟"
            value={answers.activity.hasInjuryOrMobilityLimitation}
            onChange={(v) =>
              setAnswers({
                ...answers,
                activity: { ...answers.activity, hasInjuryOrMobilityLimitation: v },
              })
            }
          />
        </>
      )}

      {step === 5 && (
        <>
          <OptionGroup
            label="هدف اصلی شما چیست؟"
            value={answers.goal.primaryGoal}
            onChange={(v) => setAnswers({ ...answers, goal: { ...answers.goal, primaryGoal: v } })}
            options={[
              { value: "weight_loss", label: "کاهش وزن" },
              { value: "energy", label: "افزایش انرژی" },
              { value: "sleep", label: "بهبود خواب" },
              { value: "stress", label: "کاهش استرس" },
              { value: "habit_building", label: "عادت‌سازی" },
            ]}
          />
          <OptionGroup
            label="این هدف بیشتر از درون شماست یا فشار بیرونی؟"
            value={answers.goal.motivation}
            onChange={(v) => setAnswers({ ...answers, goal: { ...answers.goal, motivation: v } })}
            options={[
              { value: "intrinsic", label: "از درون خودم" },
              { value: "extrinsic", label: "فشار/توقع دیگران" },
            ]}
          />
        </>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="nav-buttons">
        <button className="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          قبلی
        </button>
        {isLastStep ? (
          <button className="primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "در حال ارسال..." : "دریافت توصیه"}
          </button>
        ) : (
          <button className="primary" onClick={() => setStep((s) => s + 1)}>
            بعدی
          </button>
        )}
      </div>
    </div>
  );
}
