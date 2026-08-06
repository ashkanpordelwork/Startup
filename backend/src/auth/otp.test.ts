import { describe, expect, it } from "vitest";
import { generateOtpCode, OTP_LENGTH } from "./otp.js";

describe("generateOtpCode", () => {
  it("always returns a zero-padded numeric string of the configured length", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d+$/);
      expect(code).toHaveLength(OTP_LENGTH);
    }
  });
});
