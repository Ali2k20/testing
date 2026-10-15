import { NextResponse, type NextRequest } from "next/server";

import { EngineError, processIncomingMessage } from "@/lib/ai/engine";
import { baseMediaType, createEngineDeps } from "@/lib/ai/engine-deps";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ConversationStatus } from "@/lib/supabase/database.types";
import { isUuid } from "@/lib/validation";
import { toWidgetMessage, type WidgetMessagesResponse } from "@/lib/widget";

export const maxDuration = 60;

const MAX_TEXT_CHARS = 2000;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const ALLOWED_AUDIO = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac", "audio/wav"]);

/**
 * Widget sends a customer message: JSON { visitorId, text, name? } or
 * multipart/form-data { visitorId, audio: File, name? }.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/widget/[botId]/messages">) {
  const { botId } = await ctx.params;
  if (!isUuid(botId)) return error("not_found", 404);

  const ip = clientIp(request.headers);
  const limited = rateLimit(`widget:${botId}:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let visitorId: string | null = null;
  let text: string | null = null;
  let name: string | null = null;
  let audio: { data: Uint8Array; mediaType: string } | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.startsWith("multipart/form-data")) {
      const form = await request.formData();
      visitorId = stringField(form.get("visitorId"));
      text = stringField(form.get("text"));
      name = stringField(form.get("name"));
      const file = form.get("audio");
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_AUDIO_BYTES) return error("audio_too_large", 413);
        const mediaType = baseMediaType(file.type || "audio/webm");
        if (!ALLOWED_AUDIO.has(mediaType)) return error("unsupported_audio", 415);
        audio = { data: new Uint8Array(await file.arrayBuffer()), mediaType };
      }
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      visitorId = stringField(body.visitorId);
      text = stringField(body.text);
      name = stringField(body.name);
    }
  } catch {
    return error("bad_request", 400);
  }

  if (!visitorId || !isUuid(visitorId)) return error("invalid_visitor", 400);
  if (text && text.length > MAX_TEXT_CHARS) return error("text_too_long", 413);
  if (!text?.trim() && !audio) return error("empty_message", 400);

  try {
    const result = await processIncomingMessage(
      {
        botId,
        channel: "web_widget",
        customerIdentifier: visitorId,
        customerName: name?.slice(0, 120) ?? null,
        text,
        audio,
      },
      createEngineDeps(),
    );

    const messages = [result.customerMessage, result.reply].filter((m) => m !== null).map(toWidgetMessage);
    return NextResponse.json({
      status: result.conversation?.status ?? "AI_ACTIVE",
      messages,
    } satisfies WidgetMessagesResponse);
  } catch (err) {
    if (err instanceof EngineError && err.code === "bot_not_found") return error("not_found", 404);
    if (err instanceof EngineError) return error(err.code, 400);
    console.error("[widget] message processing failed", err);
    return error("unavailable", 503);
  }
}

/** Widget polls for new messages (e.g. human agent replies after handoff). */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/widget/[botId]/messages">) {
  const { botId } = await ctx.params;
  const visitorId = request.nextUrl.searchParams.get("visitorId");
  const after = request.nextUrl.searchParams.get("after");
  if (!isUuid(botId) || !visitorId || !isUuid(visitorId)) return error("bad_request", 400);
  if (after && Number.isNaN(Date.parse(after))) return error("bad_request", 400);

  const limited = rateLimit(`widget-poll:${botId}:${clientIp(request.headers)}`, 120, 60_000);
  if (!limited.ok) return error("rate_limited", 429);

  const db = createAdminClient();
  const { data: conversation, error: convError } = await db
    .from("conversations")
    .select("id, status")
    .eq("bot_id", botId)
    .eq("channel", "web_widget")
    .eq("customer_identifier", visitorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (convError) return error("unavailable", 503);
  if (!conversation) {
    return NextResponse.json({ status: "AI_ACTIVE", messages: [] } satisfies WidgetMessagesResponse);
  }

  let query = db
    .from("messages")
    .select("id, sender_type, input_type, content_text, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(100);
  if (after) query = query.gt("created_at", new Date(after).toISOString());

  const { data: messages, error: msgError } = await query;
  if (msgError) return error("unavailable", 503);

  return NextResponse.json({
    status: conversation.status as ConversationStatus,
    messages: (messages ?? []).map(toWidgetMessage),
  } satisfies WidgetMessagesResponse);
}

function stringField(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function error(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}
