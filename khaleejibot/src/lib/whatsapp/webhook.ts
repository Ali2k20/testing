import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

/** Verifies Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const received = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

// Only the parts of the Cloud API webhook payload we use. Unknown fields are
// ignored, and status callbacks (sent/delivered/read) simply have no messages.
const whatsAppMessageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string().optional(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  audio: z.object({ id: z.string(), mime_type: z.string().optional(), voice: z.boolean().optional() }).optional(),
  button: z.object({ text: z.string() }).optional(),
  interactive: z
    .object({
      button_reply: z.object({ title: z.string() }).optional(),
      list_reply: z.object({ title: z.string() }).optional(),
    })
    .optional(),
});

const webhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            metadata: z.object({ phone_number_id: z.string() }).optional(),
            contacts: z
              .array(z.object({ wa_id: z.string(), profile: z.object({ name: z.string() }).optional() }))
              .optional(),
            messages: z.array(whatsAppMessageSchema).optional(),
          }),
        }),
      ),
    }),
  ),
});

export type InboundWhatsAppMessage = {
  phoneNumberId: string;
  messageId: string;
  from: string;
  customerName: string | null;
  kind: "text" | "audio" | "unsupported";
  text: string | null;
  audioMediaId: string | null;
  audioMimeType: string | null;
  originalType: string;
};

export function parseWhatsAppWebhook(payload: unknown): InboundWhatsAppMessage[] {
  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success || parsed.data.object !== "whatsapp_business_account") return [];

  const out: InboundWhatsAppMessage[] = [];
  for (const entry of parsed.data.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;
      const { metadata, contacts = [], messages = [] } = change.value;
      if (!metadata) continue;
      for (const message of messages) {
        const contact = contacts.find((c) => c.wa_id === message.from);
        const base = {
          phoneNumberId: metadata.phone_number_id,
          messageId: message.id,
          from: message.from,
          customerName: contact?.profile?.name ?? null,
          originalType: message.type,
          text: null,
          audioMediaId: null,
          audioMimeType: null,
        };
        const interactiveTitle =
          message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? message.button?.text;

        if (message.type === "text" && message.text) {
          out.push({ ...base, kind: "text", text: message.text.body });
        } else if (message.type === "audio" && message.audio) {
          out.push({
            ...base,
            kind: "audio",
            audioMediaId: message.audio.id,
            audioMimeType: message.audio.mime_type ?? "audio/ogg",
          });
        } else if (interactiveTitle) {
          out.push({ ...base, kind: "text", text: interactiveTitle });
        } else {
          out.push({ ...base, kind: "unsupported" });
        }
      }
    }
  }
  return out;
}
