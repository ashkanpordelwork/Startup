import { FormEvent, useEffect, useState } from "react";
import { Iphone, LockKeyhole, Sparkles, User } from "reicon-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { completeProfile, requestOtp, verifyOtp } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { toLatinDigits, toPersianDigits } from "../lib/numerals";

type Step = "phone" | "otp" | "name";

const RESEND_COOLDOWN_SECONDS = 60;

export default function Login({ initialStep = "phone" }: { initialStep?: Step }) {
  const { login, setUser, user } = useAuth();
  const [step, setStep] = useState<Step>(initialStep);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = toLatinDigits(phone);
    setLoading(true);
    try {
      await requestOtp(normalized);
      setPhone(normalized);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(phone, toLatinDigits(code));
      login(result.token, {
        userId: result.userId,
        phone: result.phone,
        name: result.name,
      });
      if (result.needsName) {
        setStep("name");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "کد وارد شده اشتباه است");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitName(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const updated = await completeProfile(trimmed);
      setUser(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen justify-center bg-muted">
      <div className="flex h-full w-full max-w-[420px] min-w-0 flex-col items-center justify-center gap-8 bg-background px-7">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary">
          <Sparkles size={36} />
        </span>

        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="flex w-full flex-col gap-5">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">ورود به چت‌بات</h1>
              <p className="mt-2 text-base text-helper-foreground">شماره موبایلت رو وارد کن تا کد تایید برات ارسال بشه.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className="text-base">شماره موبایل</Label>
              <div className="relative">
                <Iphone
                  size={19}
                  className="pointer-events-none absolute inset-y-0 end-3.5 my-auto text-muted-foreground"
                />
                <Input
                  id="phone"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="09xxxxxxxxx"
                  className="h-12 pe-10 text-center text-base"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" disabled={loading || phone.trim().length === 0}>
              {loading ? "در حال ارسال..." : "ارسال کد تایید"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="flex w-full flex-col gap-5">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">کد تایید رو وارد کن</h1>
              <p className="mt-2 text-base text-helper-foreground">
                کد ۶ رقمی به شماره‌ی {toPersianDigits(phone)} ارسال شد.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp" className="text-base">کد تایید</Label>
              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute inset-y-0 end-3.5 my-auto text-muted-foreground"
                />
                <Input
                  id="otp"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="------"
                  className="h-12 pe-10 text-center text-lg tracking-[0.5em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" disabled={loading || code.trim().length < 6}>
              {loading ? "در حال بررسی..." : "تایید"}
            </Button>
            <div className="flex items-center justify-between text-base">
              <button type="button" className="text-helper-foreground" onClick={() => setStep("phone")}>
                تغییر شماره
              </button>
              <button
                type="button"
                className={cooldown > 0 ? "text-muted-foreground" : "text-primary"}
                disabled={cooldown > 0}
                onClick={handleResend}
              >
                {cooldown > 0 ? `ارسال دوباره (${toPersianDigits(cooldown)})` : "ارسال دوباره‌ی کد"}
              </button>
            </div>
          </form>
        )}

        {step === "name" && (
          <form onSubmit={handleSubmitName} className="flex w-full flex-col gap-5">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">خوش اومدی{user?.name ? "" : "!"}</h1>
              <p className="mt-2 text-base text-helper-foreground">اسمت رو بگو تا بتونیم صدات کنیم.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-base">اسم</Label>
              <div className="relative">
                <User size={19} className="pointer-events-none absolute inset-y-0 end-3.5 my-auto text-muted-foreground" />
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="مثلاً: سارا"
                  className="h-12 pe-10 text-center text-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" disabled={loading || name.trim().length === 0}>
              {loading ? "در حال ذخیره..." : "شروع کن"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
