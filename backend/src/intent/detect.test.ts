import { describe, expect, it } from "vitest";
import { detectIntent } from "./detect.js";

describe("detectIntent", () => {
  it("detects weight_loss from a natural sentence", () => {
    expect(detectIntent("سلام میخوام وزن کم کنم").goal).toBe("weight_loss");
  });

  it("detects sleep", () => {
    expect(detectIntent("خوابم اصلا خوب نیست").goal).toBe("sleep");
  });

  it("detects stress", () => {
    expect(detectIntent("این روزا خیلی استرس دارم").goal).toBe("stress");
  });

  it("detects energy", () => {
    expect(detectIntent("همش خسته ام و بی‌حالم").goal).toBe("energy");
  });

  it("detects habit_building", () => {
    expect(detectIntent("میخوام یه عادت جدید بسازم").goal).toBe("habit_building");
  });

  it("returns null goal for unrecognized text", () => {
    const result = detectIntent("سلام چطوری");
    expect(result.goal).toBeNull();
    expect(result.matchedKeyword).toBeNull();
  });

  it("returns null goal for empty/whitespace text", () => {
    expect(detectIntent("   ").goal).toBeNull();
    expect(detectIntent("").goal).toBeNull();
  });

  it("resolves ties by category priority (weight_loss before stress)", () => {
    const result = detectIntent("هم استرس دارم هم میخوام وزن کم کنم");
    expect(result.goal).toBe("weight_loss");
  });
});
