const IRAN_MOBILE_REGEX = /^(?:\+98|0098|0)?9\d{9}$/;

export function normalizeIranPhone(raw: string): string | null {
  const digits = raw.trim().replace(/[\s-]/g, "");
  if (!IRAN_MOBILE_REGEX.test(digits)) {
    return null;
  }
  const local = digits.replace(/^(?:\+98|0098|0)/, "");
  return `+98${local}`;
}
