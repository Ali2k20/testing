import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret } from "@/lib/crypto";

const key = randomBytes(32).toString("base64");

describe("secret encryption", () => {
  it("round-trips and never stores plaintext", () => {
    const stored = encryptSecret("EAAG-secret-token", key);
    expect(stored).toMatch(/^enc:v1:/);
    expect(stored).not.toContain("EAAG");
    expect(decryptSecret(stored, key)).toBe("EAAG-secret-token");
  });

  it("uses a fresh IV per encryption", () => {
    expect(encryptSecret("same", key)).not.toBe(encryptSecret("same", key));
  });

  it("detects tampering and wrong keys", () => {
    const stored = encryptSecret("token", key);
    const tampered = stored.slice(0, -4) + (stored.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(() => decryptSecret(tampered, key)).toThrow();
    expect(() => decryptSecret(stored, randomBytes(32).toString("base64"))).toThrow();
    expect(() => decryptSecret("plaintext", key)).toThrow(/encrypted format/);
  });
});
