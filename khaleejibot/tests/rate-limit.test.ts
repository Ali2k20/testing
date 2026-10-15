import { describe, expect, it } from "vitest";

import { clientIp, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit per window, then resets", () => {
    const key = `test:${Math.random()}`;
    const now = 1_000_000;
    expect(rateLimit(key, 2, 60_000, now).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000, now).ok).toBe(true);
    const blocked = rateLimit(key, 2, 60_000, now + 1000);
    expect(blocked).toEqual({ ok: false, retryAfterSeconds: 59 });
    expect(rateLimit(key, 2, 60_000, now + 60_000).ok).toBe(true);
  });

  it("reads the first forwarded IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
