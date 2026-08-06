import { describe, expect, it } from "vitest";
import { signAuthToken, verifyAuthToken } from "./jwt.js";

describe("auth token", () => {
  it("round-trips a valid payload", () => {
    const token = signAuthToken({ userId: "u1", phone: "+989123456789" });
    const payload = verifyAuthToken(token);
    expect(payload?.userId).toBe("u1");
    expect(payload?.phone).toBe("+989123456789");
  });

  it("rejects a garbage token", () => {
    expect(verifyAuthToken("not-a-real-token")).toBeNull();
  });
});
