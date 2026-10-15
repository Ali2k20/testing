import { after, NextResponse, type NextRequest } from "next/server";

import { handleWhatsAppMessage } from "@/lib/channels/whatsapp";
import { serverEnv } from "@/lib/env";
import { parseWhatsAppWebhook, verifyMetaSignature } from "@/lib/whatsapp/webhook";

// Transcription + LLM can take a while; Meta only needs a fast 200.
export const maxDuration = 60;

/** Meta's one-time webhook verification handshake. */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const verifyToken = serverEnv().WHATSAPP_VERIFY_TOKEN;
  if (
    verifyToken &&
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === verifyToken
  ) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const appSecret = serverEnv().META_APP_SECRET;
  if (!appSecret) {
    console.error("[whatsapp] META_APP_SECRET is not configured; rejecting webhook");
    return new NextResponse("Not configured", { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const messages = parseWhatsAppWebhook(payload);
  if (messages.length > 0) {
    // Acknowledge immediately (Meta retries slow webhooks) and process after
    // the response. Messages are handled in order so replies stay in sequence;
    // retries are de-duplicated by WhatsApp message id inside the engine.
    after(async () => {
      for (const message of messages) {
        try {
          await handleWhatsAppMessage(message);
        } catch (error) {
          console.error("[whatsapp] failed to process message", message.messageId, error);
        }
      }
    });
  }

  return NextResponse.json({ received: true });
}
