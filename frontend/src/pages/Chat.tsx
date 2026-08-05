import { Send } from "reicon-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { detectIntent, submitIntake } from "../api/client";
import { IntakeAnswers } from "../api/types";
import { toPersianDigits } from "../lib/numerals";
import { getStoredUserId, setStoredUserId } from "../userId";

const GREETING = "سلام! چه کمکی از دستم برمیاد؟";

const defaultAnswers: IntakeAnswers = {
  redFlags: {
    isPregnant: false,
    hasDiabetesKidneyHeartOrBP: false,
    hasEatingDisorderHistory: false,
    onMetabolicMedication: false,
    underDoctorSupervision: false,
    ageUnder18OrOver65: false,
  },
  sleep: { avgSleepHours: 7, sleepConsistency: "consistent", wakeUpFeeling: "rested", hasInsomnia: false },
  stress: { stressLevel: "low", majorLifeChangeRecently: false, emotionalEating: false },
  dietHistory: { previousDietsCount: 0, hasYoyoWeightHistory: false, currentlyEliminatingFoodGroup: false },
  activity: { currentActivityLevel: "moderate", hasInjuryOrMobilityLimitation: false },
  goal: { primaryGoal: "habit_building", motivation: "intrinsic" },
};

type Option = { value: string; label: string };

type StepConfig =
  | { kind: "bool"; question: string; get: (a: IntakeAnswers) => boolean; set: (a: IntakeAnswers, v: boolean) => IntakeAnswers }
  | { kind: "choice"; question: string; options: Option[]; get: (a: IntakeAnswers) => string; set: (a: IntakeAnswers, v: string) => IntakeAnswers; isGoalField?: boolean }
  | { kind: "number"; question: string; unit: string; min: number; max: number; get: (a: IntakeAnswers) => number; set: (a: IntakeAnswers, v: number) => IntakeAnswers };

const STEPS: StepConfig[] = [
  { kind: "bool", question: "آیا باردار هستید؟", get: (a) => a.redFlags.isPregnant, set: (a, v) => ({ ...a, redFlags: { ...a.redFlags, isPregnant: v } }) },
  { kind: "bool", question: "آیا دیابت، بیماری کلیوی، قلبی یا فشار خون دارید؟", get: (a) => a.redFlags.hasDiabetesKidneyHeartOrBP, set: (a, v) => ({ ...a, redFlags: { ...a.redFlags, hasDiabetesKidneyHeartOrBP: v } }) },
  { kind: "bool", question: "آیا سابقه‌ی اختلال خوردن دارید؟", get: (a) => a.redFlags.hasEatingDisorderHistory, set: (a, v) => ({ ...a, redFlags: { ...a.redFlags, hasEatingDisorderHistory: v } }) },
  { kind: "bool", question: "آیا داروی متابولیک مصرف می‌کنید؟", get: (a) => a.redFlags.onMetabolicMedication, set: (a, v) => ({ ...a, redFlags: { ...a.redFlags, onMetabolicMedication: v } }) },
  { kind: "bool", question: "آیا در حال حاضر تحت نظر پزشک هستید؟", get: (a) => a.redFlags.underDoctorSupervision, set: (a, v) => ({ ...a, redFlags: { ...a.redFlags, underDoctorSupervision: v } }) },
  { kind: "bool", question: "آیا سن شما زیر ۱۸ یا بالای ۶۵ سال است؟", get: (a) => a.redFlags.ageUnder18OrOver65, set: (a, v) => ({ ...a, redFlags: { ...a.redFlags, ageUnder18OrOver65: v } }) },

  { kind: "number", question: "به‌طور میانگین چند ساعت می‌خوابید؟", unit: "ساعت", min: 0, max: 16, get: (a) => a.sleep.avgSleepHours, set: (a, v) => ({ ...a, sleep: { ...a.sleep, avgSleepHours: v } }) },
  { kind: "choice", question: "ثبات خواب شما چطور است؟", options: [{ value: "consistent", label: "منظم" }, { value: "somewhat", label: "تا حدی منظم" }, { value: "inconsistent", label: "نامنظم" }], get: (a) => a.sleep.sleepConsistency, set: (a, v) => ({ ...a, sleep: { ...a.sleep, sleepConsistency: v as IntakeAnswers["sleep"]["sleepConsistency"] } }) },
  { kind: "choice", question: "معمولاً بعد از بیدار شدن چه حسی دارید؟", options: [{ value: "rested", label: "سرحال" }, { value: "neutral", label: "معمولی" }, { value: "exhausted", label: "خسته" }], get: (a) => a.sleep.wakeUpFeeling, set: (a, v) => ({ ...a, sleep: { ...a.sleep, wakeUpFeeling: v as IntakeAnswers["sleep"]["wakeUpFeeling"] } }) },
  { kind: "bool", question: "آیا بی‌خوابی دارید؟", get: (a) => a.sleep.hasInsomnia, set: (a, v) => ({ ...a, sleep: { ...a.sleep, hasInsomnia: v } }) },

  { kind: "choice", question: "سطح استرس فعلی شما چقدر است؟", options: [{ value: "low", label: "کم" }, { value: "moderate", label: "متوسط" }, { value: "high", label: "زیاد" }], get: (a) => a.stress.stressLevel, set: (a, v) => ({ ...a, stress: { ...a.stress, stressLevel: v as IntakeAnswers["stress"]["stressLevel"] } }) },
  { kind: "bool", question: "آیا اخیراً تغییر بزرگی در زندگی داشته‌اید؟", get: (a) => a.stress.majorLifeChangeRecently, set: (a, v) => ({ ...a, stress: { ...a.stress, majorLifeChangeRecently: v } }) },
  { kind: "bool", question: "آیا هنگام استرس یا احساسات منفی پرخوری می‌کنید؟", get: (a) => a.stress.emotionalEating, set: (a, v) => ({ ...a, stress: { ...a.stress, emotionalEating: v } }) },

  { kind: "number", question: "تا به حال چند بار رژیم گرفته‌اید؟", unit: "بار", min: 0, max: 50, get: (a) => a.dietHistory.previousDietsCount, set: (a, v) => ({ ...a, dietHistory: { ...a.dietHistory, previousDietsCount: v } }) },
  { kind: "bool", question: "آیا بعد از رژیم‌های قبلی وزنتون برگشته (یویو)؟", get: (a) => a.dietHistory.hasYoyoWeightHistory, set: (a, v) => ({ ...a, dietHistory: { ...a.dietHistory, hasYoyoWeightHistory: v } }) },
  { kind: "bool", question: "آیا در حال حاضر یک گروه غذایی رو حذف کرده‌اید؟", get: (a) => a.dietHistory.currentlyEliminatingFoodGroup, set: (a, v) => ({ ...a, dietHistory: { ...a.dietHistory, currentlyEliminatingFoodGroup: v } }) },

  { kind: "choice", question: "سطح فعالیت بدنی فعلی شما چطور است؟", options: [{ value: "sedentary", label: "کم‌تحرک" }, { value: "light", label: "سبک" }, { value: "moderate", label: "متوسط" }, { value: "active", label: "فعال" }], get: (a) => a.activity.currentActivityLevel, set: (a, v) => ({ ...a, activity: { ...a.activity, currentActivityLevel: v as IntakeAnswers["activity"]["currentActivityLevel"] } }) },
  { kind: "bool", question: "آیا آسیب یا محدودیت حرکتی دارید؟", get: (a) => a.activity.hasInjuryOrMobilityLimitation, set: (a, v) => ({ ...a, activity: { ...a.activity, hasInjuryOrMobilityLimitation: v } }) },

  { kind: "choice", isGoalField: true, question: "هدف اصلی شما چیست؟", options: [{ value: "weight_loss", label: "کاهش وزن" }, { value: "energy", label: "افزایش انرژی" }, { value: "sleep", label: "بهبود خواب" }, { value: "stress", label: "کاهش استرس" }, { value: "habit_building", label: "عادت‌سازی" }], get: (a) => a.goal.primaryGoal, set: (a, v) => ({ ...a, goal: { ...a.goal, primaryGoal: v as IntakeAnswers["goal"]["primaryGoal"] } }) },
  { kind: "choice", question: "این هدف بیشتر از درون شماست یا فشار بیرونی؟", options: [{ value: "intrinsic", label: "از درون خودم" }, { value: "extrinsic", label: "فشار/توقع دیگران" }], get: (a) => a.goal.motivation, set: (a, v) => ({ ...a, goal: { ...a.goal, motivation: v as IntakeAnswers["goal"]["motivation"] } }) },
];

type Entry = { id: number; role: "bot" | "user"; text: string };

function ChatBubble({ role, children }: { role: "bot" | "user"; children: React.ReactNode }) {
  const isBot = role === "bot";
  return (
    <div className={cn("flex", isBot ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-7",
          isBot ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {children}
      </div>
    </div>
  );
}

function NumberQuestion({ step, onAnswer }: { step: Extract<StepConfig, { kind: "number" }>; onAnswer: (v: number) => void }) {
  const [value, setValue] = useState("");

  function confirm() {
    const n = Number(value);
    if (value.trim() === "" || Number.isNaN(n) || n < step.min || n > step.max) return;
    onAnswer(n);
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        inputMode="numeric"
        min={step.min}
        max={step.max}
        value={value}
        placeholder={step.unit}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirm();
        }}
        className="w-24"
      />
      <span className="text-sm text-muted-foreground">{step.unit}</span>
      <Button size="sm" onClick={confirm}>
        تایید
      </Button>
    </div>
  );
}

function echoLabel(step: StepConfig, value: boolean | string | number): string {
  if (step.kind === "bool") return value ? "بله" : "خیر";
  if (step.kind === "choice") return step.options.find((o) => o.value === value)?.label ?? String(value);
  return `${toPersianDigits(String(value))} ${step.unit}`;
}

export default function Chat() {
  const [entries, setEntries] = useState<Entry[]>([{ id: 0, role: "bot", text: GREETING }]);
  const [phase, setPhase] = useState<"intent" | "questions" | "submitting" | "done">("intent");
  const [answers, setAnswers] = useState<IntakeAnswers>(defaultAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilledGoal, setPrefilledGoal] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [entries, phase, stepIndex]);

  function pushEntry(role: "user" | "bot", text: string) {
    setEntries((e) => [...e, { id: nextId.current++, role, text }]);
  }

  async function handleSendIntent() {
    const text = input.trim();
    if (!text) return;
    pushEntry("user", text);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const result = await detectIntent(text);
      if (result.goal) {
        setAnswers((a) => ({ ...a, goal: { ...a.goal, primaryGoal: result.goal! } }));
        setPrefilledGoal(result.goal);
      }
      pushEntry("bot", result.reflection);
      pushEntry("bot", STEPS[0].question);
      setPhase("questions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setBusy(false);
    }
  }

  async function handleAnswer(value: boolean | string | number) {
    const step = STEPS[stepIndex];
    const updated = step.set(answers, value as never);
    setAnswers(updated);
    pushEntry("user", echoLabel(step, value));

    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      pushEntry("bot", STEPS[nextIndex].question);
      setStepIndex(nextIndex);
      return;
    }

    setPhase("submitting");
    setBusy(true);
    setError(null);
    try {
      const result = await submitIntake(getStoredUserId(), updated);
      setStoredUserId(result.userId);
      pushEntry("bot", result.message);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setBusy(false);
    }
  }

  const currentStep = phase === "questions" ? STEPS[stepIndex] : null;
  const progressPercent = (stepIndex / STEPS.length) * 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {(phase === "questions" || phase === "submitting") && (
        <div className="pb-3">
          <Progress value={progressPercent} />
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto">
        {entries.map((e) => (
          <ChatBubble key={e.id} role={e.role}>
            {e.text}
          </ChatBubble>
        ))}

        {currentStep && (
          <div className="flex justify-start">
            <div className="max-w-[85%] space-y-2.5">
              {currentStep.kind === "bool" && (
                <ToggleGroup type="single" value="" onValueChange={(v) => v && handleAnswer(v === "yes")}>
                  <ToggleGroupItem value="yes">بله</ToggleGroupItem>
                  <ToggleGroupItem value="no">خیر</ToggleGroupItem>
                </ToggleGroup>
              )}
              {currentStep.kind === "choice" && currentStep.isGoalField && prefilledGoal && (
                <p className="text-xs text-muted-foreground">
                  حدس من: «{currentStep.options.find((o) => o.value === prefilledGoal)?.label}» — اگه درسته همین رو
                  بزن، وگرنه یکی دیگه رو انتخاب کن.
                </p>
              )}
              {currentStep.kind === "choice" && (
                <ToggleGroup
                  type="single"
                  value=""
                  onValueChange={(v) => v && handleAnswer(v)}
                  className="flex-wrap justify-start"
                >
                  {currentStep.options.map((opt) => (
                    <ToggleGroupItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
              {currentStep.kind === "number" && <NumberQuestion step={currentStep} onAnswer={handleAnswer} />}
            </div>
          </div>
        )}

        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">در حال بررسی...</div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {phase === "intent" && (
        <div className="flex items-center gap-2 border-t pt-3">
          <Input
            value={input}
            disabled={busy}
            placeholder="مثلاً: می‌خوام لاغر شم"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendIntent();
            }}
          />
          <Button size="icon" disabled={busy || !input.trim()} onClick={handleSendIntent}>
            <Send size={18} className="-scale-x-100" />
          </Button>
        </div>
      )}
    </div>
  );
}
