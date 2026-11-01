import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { PricingResult } from "./pricing";

/**
 * Quotes are stateless: the full quote travels in the URL, signed with an HMAC,
 * so the quote page works on any deployment without a database and a tampered
 * link is detected rather than shown as genuine.
 */
export type Quote = {
  id: string;
  issuedAt: string;
  validUntil: string;
  language: "ar" | "en";
  client: { name?: string; company?: string; phone?: string };
  pricing: Omit<PricingResult, "internal">;
  notes?: string;
};

const secret = () => process.env.SAFQA_QUOTE_SECRET || process.env.ANTHROPIC_API_KEY || "safqa-demo-secret";

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 32);

export function newQuoteId(now = new Date()) {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `SQ-${ymd}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function encodeQuote(quote: Quote) {
  const payload = Buffer.from(JSON.stringify(quote)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeQuote(token: string): { quote: Quote; verified: boolean } | null {
  const [payload, sig] = token.split(".");
  if (!payload) return null;
  try {
    const quote = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Quote;
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(sig ?? "");
    const verified = expected.length === given.length && timingSafeEqual(expected, given);
    return { quote, verified };
  } catch {
    return null;
  }
}
