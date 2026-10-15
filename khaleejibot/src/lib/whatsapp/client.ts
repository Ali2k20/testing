import "server-only";

import { serverEnv } from "@/lib/env";

const GRAPH = "https://graph.facebook.com";
const MAX_MEDIA_BYTES = 16 * 1024 * 1024;

export class WhatsAppApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "WhatsAppApiError";
  }
}

function graphUrl(path: string): string {
  return `${GRAPH}/${serverEnv().WHATSAPP_GRAPH_API_VERSION}/${path}`;
}

async function graphFetch(url: string, accessToken: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new WhatsAppApiError(`WhatsApp API ${response.status}: ${body.slice(0, 500)}`, response.status);
  }
  return response;
}

/** Network errors, rate limits and 5xx are worth retrying; 4xx are not. */
export function isTransientWhatsAppError(error: unknown): boolean {
  if (error instanceof WhatsAppApiError) return error.status === 429 || error.status >= 500;
  return error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError");
}

export async function withRetry<T>(fn: () => Promise<T>, delaysMs: number[] = [500, 2000]): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= delaysMs.length || !isTransientWhatsAppError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, delaysMs[attempt]));
    }
  }
}

/**
 * Sends a plain-text message (WhatsApp caps bodies at 4096 characters).
 * Retries transient failures: the reply is already saved and a webhook retry
 * would be de-duplicated, so this is the only chance to deliver it.
 */
export async function sendWhatsAppText(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
}): Promise<string | null> {
  const response = await withRetry(() =>
    graphFetch(graphUrl(`${params.phoneNumberId}/messages`), params.accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.to,
        type: "text",
        text: { preview_url: false, body: params.body.slice(0, 4096) },
      }),
    }),
  );
  const json = (await response.json()) as { messages?: { id: string }[] };
  return json.messages?.[0]?.id ?? null;
}

/** Marks the inbound message as read (blue ticks). Best-effort. */
export async function markWhatsAppRead(params: { phoneNumberId: string; accessToken: string; messageId: string }) {
  await graphFetch(graphUrl(`${params.phoneNumberId}/messages`), params.accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: params.messageId }),
  });
}

/** Resolves a media id to its short-lived URL, then downloads the bytes. */
export async function downloadWhatsAppMedia(params: {
  mediaId: string;
  accessToken: string;
}): Promise<{ data: Uint8Array; mediaType: string }> {
  const metaResponse = await withRetry(() => graphFetch(graphUrl(params.mediaId), params.accessToken));
  const meta = (await metaResponse.json()) as { url?: string; mime_type?: string; file_size?: number };
  if (!meta.url) throw new WhatsAppApiError("Media URL missing from WhatsApp response", 502);
  if (meta.file_size && meta.file_size > MAX_MEDIA_BYTES) {
    throw new WhatsAppApiError(`Voice note too large (${meta.file_size} bytes)`, 413);
  }

  const mediaResponse = await withRetry(() => graphFetch(meta.url!, params.accessToken));
  const data = new Uint8Array(await mediaResponse.arrayBuffer());
  if (data.byteLength > MAX_MEDIA_BYTES) throw new WhatsAppApiError("Voice note too large", 413);
  return { data, mediaType: meta.mime_type ?? mediaResponse.headers.get("content-type") ?? "audio/ogg" };
}
