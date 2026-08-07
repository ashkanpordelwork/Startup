export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 120;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const code = Math.floor(Math.random() * max)
    .toString()
    .padStart(OTP_LENGTH, "0");
  return code;
}

export function sendOtpSms(phone: string, code: string): void {
  console.log(`[mock-sms] OTP for ${phone}: ${code} (valid ${OTP_TTL_SECONDS}s)`);
}
