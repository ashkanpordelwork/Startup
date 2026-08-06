import { describe, expect, it } from "vitest";
import { normalizeIranPhone } from "./phone.js";

describe("normalizeIranPhone", () => {
  it("accepts local format starting with 0", () => {
    expect(normalizeIranPhone("09123456789")).toBe("+989123456789");
  });

  it("accepts format without leading 0", () => {
    expect(normalizeIranPhone("9123456789")).toBe("+989123456789");
  });

  it("accepts +98 prefix", () => {
    expect(normalizeIranPhone("+989123456789")).toBe("+989123456789");
  });

  it("accepts 0098 prefix", () => {
    expect(normalizeIranPhone("00989123456789")).toBe("+989123456789");
  });

  it("strips spaces and dashes", () => {
    expect(normalizeIranPhone("0912-345 6789")).toBe("+989123456789");
  });

  it("rejects numbers that are too short", () => {
    expect(normalizeIranPhone("0912345")).toBeNull();
  });

  it("rejects numbers not starting with 9 after the prefix", () => {
    expect(normalizeIranPhone("08123456789")).toBeNull();
  });

  it("rejects non-Iranian country codes", () => {
    expect(normalizeIranPhone("+19123456789")).toBeNull();
  });
});
