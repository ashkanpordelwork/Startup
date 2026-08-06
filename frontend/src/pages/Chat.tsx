import { ChatRoundDots, Mic, Send, Sparkles } from "reicon-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { confirmPlan, detectIntent, getAction, postChatMessage, refinePlan, submitIntake } from "../api/client";
import { ActionItem, IntakeAnswers, RefineFeedback } from "../api/types";
import { CATEGORY_META } from "../lib/actionMeta";
import { toPersianDigits } from "../lib/numerals";
import { answerTopicQuestion } from "../lib/topicFaq";

const GREETING = "سلام! چه کمکی از دستم برمیاد؟";

const SUGGESTIONS = ["می‌خوام وزن کم کنم", "خوابم زیاد خوب نیست", "این روزا خیلی استرس دارم", "می‌خوام یه عادت جدید بسازم"];

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

/** Renders `**bold**` segments as semibold spans — minimal rich-text support for bot messages. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\*\*([^*]+)\*\*$/);
        return match ? (
          <strong key={i} className="font-semibold">
            {match[1]}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-bubble bg-muted px-5 py-3 text-base leading-relaxed text-foreground">
        {text}
      </div>
    </div>
  );
}

function GreetingBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-center gap-2.5 rounded-bubble bg-secondary px-5 py-3 text-base leading-relaxed text-secondary-foreground">
        <Sparkles size={16} className="shrink-0 text-brand" />
        {text}
      </div>
    </div>
  );
}

function BotBubble({ text }: { text: string }) {
  return (
    <div className="max-w-[92%] text-base leading-relaxed text-foreground">
      <RichText text={text} />
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
    <div className="flex items-center gap-3">
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
        className="h-11 w-28 text-base"
      />
      <span className="text-base text-muted-foreground">{step.unit}</span>
      <Button onClick={confirm}>تایید</Button>
    </div>
  );
}

function echoLabel(step: StepConfig, value: boolean | string | number): string {
  if (step.kind === "bool") return value ? "بله" : "خیر";
  if (step.kind === "choice") return step.options.find((o) => o.value === value)?.label ?? String(value);
  return `${toPersianDigits(String(value))} ${step.unit}`;
}

function ReviewActionCard({
  planId,
  action,
  onRemoved,
  onUpdated,
}: {
  planId: string;
  action: ActionItem;
  onRemoved: (id: string, reply: string) => void;
  onUpdated: (updated: ActionItem, reply: string) => void;
}) {
  const category = CATEGORY_META[action.category];
  const Icon = category.icon;
  const [busy, setBusy] = useState<RefineFeedback | null>(null);

  async function handle(feedback: RefineFeedback) {
    setBusy(feedback);
    try {
      const result = await refinePlan(planId, action.id, feedback);
      if (result.removed) {
        onRemoved(action.id, result.reply);
      } else if (result.action) {
        onUpdated(result.action, result.reply);
      }
    } catch {
      // best-effort; leave card as-is on failure
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.chipClassName}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{action.title}</p>
          <p className="mt-0.5 truncate text-sm text-helper-foreground">{category.label}</p>
        </div>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-helper-foreground">{action.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-sm"
          disabled={busy !== null}
          onClick={() => handle("simplify")}
        >
          {busy === "simplify" ? "در حال بررسی..." : "سخته، ساده‌ترش کن"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-sm"
          disabled={busy !== null}
          onClick={() => handle("remove")}
        >
          {busy === "remove" ? "در حال حذف..." : "حذفش کن"}
        </Button>
      </div>
    </div>
  );
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topicActionId = searchParams.get("actionId");
  const topicTitle = searchParams.get("topic");

  const [entries, setEntries] = useState<Entry[]>(
    topicActionId
      ? [{ id: 0, role: "bot", text: `داری درباره‌ی «${topicTitle}» سوال می‌پرسی. بپرس تا کمکت کنم.` }]
      : [{ id: 0, role: "bot", text: GREETING }]
  );
  const [phase, setPhase] = useState<"intent" | "questions" | "submitting" | "review">(
    topicActionId ? "review" : "intent"
  );
  const [answers, setAnswers] = useState<IntakeAnswers>(defaultAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefilledGoal, setPrefilledGoal] = useState<string | null>(null);
  const [plan, setPlan] = useState<{ planId: string; actions: ActionItem[] } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [topicAction, setTopicAction] = useState<ActionItem | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const stopStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [entries, phase, stepIndex, streamingText, thinking, plan]);

  useEffect(() => {
    if (!topicActionId) return;
    getAction(topicActionId)
      .then(setTopicAction)
      .catch(() => setTopicAction(null));
  }, [topicActionId]);

  function pushEntry(role: "user" | "bot", text: string) {
    setEntries((e) => [...e, { id: nextId.current++, role, text }]);
    if (topicActionId) {
      postChatMessage(role, text, topicActionId).catch(() => {});
    }
  }

  function streamBotMessage(text: string): Promise<void> {
    return new Promise((resolve) => {
      let shown = 0;
      const finish = () => {
        clearInterval(timer);
        setStreamingText(null);
        pushEntry("bot", text);
        resolve();
      };
      const timer = setInterval(() => {
        shown = Math.min(text.length, shown + 3);
        setStreamingText(text.slice(0, shown));
        if (shown >= text.length) finish();
      }, 20);
      stopStreamRef.current = finish;
    });
  }

  async function handleSendIntent(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    pushEntry("user", text);
    setInput("");
    setThinking(true);
    setError(null);
    try {
      const result = await detectIntent(text);
      if (result.goal) {
        setAnswers((a) => ({ ...a, goal: { ...a.goal, primaryGoal: result.goal! } }));
        setPrefilledGoal(result.goal);
      }
      setThinking(false);
      await streamBotMessage(result.reflection);
      pushEntry("bot", STEPS[0].question);
      setPhase("questions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
      setThinking(false);
    }
  }

  async function handleTopicQuestion() {
    const text = input.trim();
    if (!text || !topicAction) return;
    pushEntry("user", text);
    setInput("");
    setThinking(true);
    const reply = answerTopicQuestion(topicAction.category, text);
    setThinking(false);
    await streamBotMessage(reply);
  }

  async function handleReviewNote() {
    const text = input.trim();
    if (!text) return;
    pushEntry("user", text);
    setInput("");
    setThinking(true);
    setThinking(false);
    await streamBotMessage(
      "این نکته رو در نظر گرفتم. اگه درباره‌ی یکی از اقدام‌های بالا نکته داری، از دکمه‌های کنار همون اقدام استفاده کن تا دقیق‌تر بررسیش کنم."
    );
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
    setThinking(true);
    setError(null);
    try {
      const result = await submitIntake(updated);
      setThinking(false);
      await streamBotMessage(
        `تحلیل من انجام شد ✅ این اقدام‌ها رو برای «${result.title}» برات آماده کردم. اگه نکته‌ای داری بگو، وگرنه با دکمه‌ی پایین تایید کن:`
      );
      setPlan({ planId: result.planId, actions: result.actions });
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
      setThinking(false);
    }
  }

  function handleActionRemoved(actionId: string, reply: string) {
    setPlan((p) => (p ? { ...p, actions: p.actions.filter((a) => a.id !== actionId) } : p));
    pushEntry("bot", reply);
  }

  function handleActionUpdated(updated: ActionItem, reply: string) {
    setPlan((p) => (p ? { ...p, actions: p.actions.map((a) => (a.id === updated.id ? updated : a)) } : p));
    pushEntry("bot", reply);
  }

  async function handleConfirmPlan() {
    if (!plan) return;
    setConfirming(true);
    setError(null);
    try {
      await confirmPlan(plan.planId);
      navigate("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setConfirming(false);
    }
  }

  const currentStep = phase === "questions" ? STEPS[stepIndex] : null;
  const progressPercent = (stepIndex / STEPS.length) * 100;
  const showSuggestions = !topicActionId && phase === "intent" && entries.length === 1;
  const showReviewCards = phase === "review" && plan && !topicActionId;
  const showTextInput = phase === "intent" || topicActionId || (phase === "review" && !topicActionId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {(phase === "questions" || phase === "submitting") && (
        <div className="px-5 pt-4">
          <Progress value={progressPercent} />
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {showSuggestions && (
          <div className="flex flex-col items-center gap-4 pb-3 pt-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-brand">
              <ChatRoundDots size={36} />
            </span>
          </div>
        )}

        {entries.map((e) =>
          e.role === "bot" ? (
            e.id === 0 ? (
              <GreetingBubble key={e.id} text={e.text} />
            ) : (
              <BotBubble key={e.id} text={e.text} />
            )
          ) : (
            <UserBubble key={e.id} text={e.text} />
          )
        )}

        {showSuggestions && (
          <div className="space-y-4 rounded-xl bg-card p-5 shadow-chat">
            <div className="flex items-center gap-2.5 text-base text-foreground">
              <Sparkles size={18} className="text-brand" />
              می‌تونی یکی از این‌ها رو انتخاب کنی یا خودت تایپ کنی:
            </div>
            <div className="flex flex-wrap gap-2.5">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="h-auto rounded-full px-4 py-2 text-sm"
                  onClick={() => handleSendIntent(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentStep && (
          <div className="flex justify-start">
            <div className="max-w-[85%] space-y-3">
              {currentStep.kind === "bool" && (
                <ToggleGroup type="single" value="" onValueChange={(v) => v && handleAnswer(v === "yes")}>
                  <ToggleGroupItem value="yes">بله</ToggleGroupItem>
                  <ToggleGroupItem value="no">خیر</ToggleGroupItem>
                </ToggleGroup>
              )}
              {currentStep.kind === "choice" && currentStep.isGoalField && prefilledGoal && (
                <p className="text-sm text-helper-foreground">
                  حدس من: <strong className="font-semibold text-foreground">«{currentStep.options.find((o) => o.value === prefilledGoal)?.label}»</strong> — اگه
                  درسته همین رو بزن، وگرنه یکی دیگه رو انتخاب کن.
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

        {thinking && (
          <div className="flex gap-1.5">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        )}

        {streamingText !== null && (
          <div className="space-y-2.5">
            <div className="max-w-[92%] text-base leading-relaxed text-foreground">
              <RichText text={streamingText} />
              <span className="ms-0.5 inline-block h-4 w-[2px] animate-pulse bg-foreground align-middle" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 rounded-full text-sm" onClick={() => stopStreamRef.current?.()}>
              <span className="h-2 w-2 rounded-[2px] bg-foreground" />
              در حال تولید پاسخ... (توقف)
            </Button>
          </div>
        )}

        {showReviewCards && (
          <div className="flex flex-col gap-3">
            {plan.actions.length === 0 && (
              <p className="text-sm text-helper-foreground">همه‌ی اقدام‌ها رو حذف کردی؛ حداقل یکی رو نگه دار تا بتونی تایید کنی.</p>
            )}
            {plan.actions.map((action) => (
              <ReviewActionCard
                key={action.id}
                planId={plan.planId}
                action={action}
                onRemoved={handleActionRemoved}
                onUpdated={handleActionUpdated}
              />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {showReviewCards && (
        <div className="bg-background px-5 pb-2">
          <Button
            className="w-full"
            disabled={confirming || plan.actions.length === 0}
            onClick={handleConfirmPlan}
          >
            {confirming ? "در حال ثبت..." : "با این برنامه راضی‌ام، بریم"}
          </Button>
        </div>
      )}

      {showTextInput && (
        <div className="flex items-center gap-2.5 bg-background px-5 py-4">
          <div className="flex flex-1 items-center gap-2.5 rounded-full border border-input bg-card px-4 py-3">
            <Input
              value={input}
              disabled={thinking || streamingText !== null}
              placeholder={
                topicActionId ? "سوالت رو بپرس..." : phase === "review" ? "اگه نکته‌ای داری بگو..." : "مثلاً: می‌خوام لاغر شم"
              }
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (topicActionId) handleTopicQuestion();
                else if (phase === "review") handleReviewNote();
                else handleSendIntent();
              }}
              className="h-auto border-0 bg-transparent p-0 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <Mic size={20} className="shrink-0 text-muted-foreground" />
          </div>
          <Button
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={thinking || streamingText !== null || !input.trim()}
            onClick={() => {
              if (topicActionId) handleTopicQuestion();
              else if (phase === "review") handleReviewNote();
              else handleSendIntent();
            }}
          >
            <Send size={20} className="-scale-x-100" />
          </Button>
        </div>
      )}
    </div>
  );
}
