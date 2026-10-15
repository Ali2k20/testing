import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { parseWhatsAppWebhook, verifyMetaSignature } from "@/lib/whatsapp/webhook";

const SECRET = "test-app-secret";
const sign = (body: string) => `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;

const payload = (messages: unknown[], extra: Record<string, unknown> = {}) => ({
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "97140000000", phone_number_id: "1234567890" },
            contacts: [{ wa_id: "971501234567", profile: { name: "Hamdan" } }],
            messages,
            ...extra,
          },
        },
      ],
    },
  ],
});

describe("verifyMetaSignature", () => {
  const body = JSON.stringify(payload([]));

  it("accepts a correct signature", () => {
    expect(verifyMetaSignature(body, sign(body), SECRET)).toBe(true);
  });

  it.each([null, "", "sha256=deadbeef", "md5=abc", sign(`${body} `)])("rejects %j", (header) => {
    expect(verifyMetaSignature(body, header, SECRET)).toBe(false);
  });
});

describe("parseWhatsAppWebhook", () => {
  it("parses text, voice notes, interactive replies and unsupported types", () => {
    const parsed = parseWhatsAppWebhook(
      payload([
        { from: "971501234567", id: "wamid.1", type: "text", text: { body: "هلا" } },
        { from: "971501234567", id: "wamid.2", type: "audio", audio: { id: "MEDIA1", mime_type: "audio/ogg; codecs=opus", voice: true } },
        { from: "971501234567", id: "wamid.3", type: "interactive", interactive: { type: "button_reply", button_reply: { id: "b1", title: "Menu" } } },
        { from: "971501234567", id: "wamid.4", type: "image", image: { id: "IMG" } },
      ]),
    );

    expect(parsed).toEqual([
      expect.objectContaining({ messageId: "wamid.1", kind: "text", text: "هلا", customerName: "Hamdan", phoneNumberId: "1234567890" }),
      expect.objectContaining({ messageId: "wamid.2", kind: "audio", audioMediaId: "MEDIA1", audioMimeType: "audio/ogg; codecs=opus" }),
      expect.objectContaining({ messageId: "wamid.3", kind: "text", text: "Menu" }),
      expect.objectContaining({ messageId: "wamid.4", kind: "unsupported", originalType: "image" }),
    ]);
  });

  it("ignores status callbacks and foreign payloads", () => {
    expect(parseWhatsAppWebhook(payload([], { statuses: [{ id: "wamid.1", status: "read" }] }))).toEqual([]);
    expect(parseWhatsAppWebhook({ object: "page", entry: [] })).toEqual([]);
    expect(parseWhatsAppWebhook("garbage")).toEqual([]);
  });
});

describe("withRetry", () => {
  it("retries transient failures, then succeeds", async () => {
    const { withRetry, WhatsAppApiError } = await import("@/lib/whatsapp/client");
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      if (calls < 3) throw calls === 1 ? new TypeError("fetch failed") : new WhatsAppApiError("busy", 503);
      return "sent";
    }, [1, 1]);
    expect(result).toBe("sent");
    expect(calls).toBe(3);
  });

  it("does not retry client errors such as an expired token", async () => {
    const { withRetry, WhatsAppApiError } = await import("@/lib/whatsapp/client");
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls += 1;
        throw new WhatsAppApiError("expired", 401);
      }, [1, 1]),
    ).rejects.toThrow("expired");
    expect(calls).toBe(1);
  });
});
