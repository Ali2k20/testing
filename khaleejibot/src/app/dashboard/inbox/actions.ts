"use server";

import { z } from "zod";

import { failed, type ActionResult } from "@/lib/action-result";
import { requireOrgContext } from "@/lib/auth";
import { deliverAgentReplyToWhatsApp } from "@/lib/channels/whatsapp";
import { VOICE_NOTES_BUCKET } from "@/lib/ai/engine-deps";
import type { ConversationStatus, MessageRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

/**
 * Agent workflow. Every write goes through the agent's own RLS-bound client,
 * so an agent can only touch conversations of their organization.
 */

async function setStatus(conversationId: string, patch: {
  status: ConversationStatus;
  assigned_agent_id?: string | null;
  handoff_reason?: string | null;
}): Promise<ActionResult> {
  if (!isUuid(conversationId)) return failed();
  await requireOrgContext();
  const supabase = await createClient();
  const { data, error } = await supabase.from("conversations").update(patch).eq("id", conversationId).select("id");
  if (error || !data?.length) return failed();
  return { ok: true };
}

export async function takeOverConversation(conversationId: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  return setStatus(conversationId, { status: "HUMAN_ACTIVE", assigned_agent_id: ctx.userId });
}

export async function handBackToAI(conversationId: string): Promise<ActionResult> {
  return setStatus(conversationId, { status: "AI_ACTIVE", assigned_agent_id: null, handoff_reason: null });
}

export async function resolveConversation(conversationId: string): Promise<ActionResult> {
  return setStatus(conversationId, { status: "RESOLVED" });
}

const replySchema = z.string().trim().min(1).max(4000);

export async function sendAgentReply(
  conversationId: string,
  text: string,
): Promise<{ ok: true; message: MessageRow; warning?: string } | { ok: false; error: string }> {
  const body = replySchema.safeParse(text);
  if (!isUuid(conversationId) || !body.success) return { ok: false, error: "inbox.errors.send" };

  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, status, channel, customer_identifier, bots(org_id)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation || conversation.status === "RESOLVED") return { ok: false, error: "inbox.errors.send" };

  // Replying claims the conversation, so the AI can never talk over the agent.
  if (conversation.status !== "HUMAN_ACTIVE") {
    const { error } = await supabase
      .from("conversations")
      .update({ status: "HUMAN_ACTIVE", assigned_agent_id: ctx.userId })
      .eq("id", conversationId);
    if (error) return { ok: false, error: "inbox.errors.send" };
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "human_agent",
      input_type: "text",
      content_text: body.data,
      sender_user_id: ctx.userId,
    })
    .select("*")
    .single();
  if (error || !message) return { ok: false, error: "inbox.errors.send" };

  // Web-widget customers pick the reply up by polling; WhatsApp needs a push.
  if (conversation.channel === "whatsapp") {
    try {
      await deliverAgentReplyToWhatsApp({
        orgId: conversation.bots?.org_id ?? ctx.org.id,
        to: conversation.customer_identifier,
        body: body.data,
      });
    } catch (deliveryError) {
      console.error("[inbox] WhatsApp delivery failed", deliveryError);
      return { ok: true, message, warning: "inbox.errors.whatsapp" };
    }
  }

  return { ok: true, message };
}

/** Short-lived URL for playing a customer's voice note (storage RLS applies). */
export async function getVoiceNoteUrl(messageId: string): Promise<string | null> {
  if (!isUuid(messageId)) return null;
  await requireOrgContext();
  const supabase = await createClient();
  const { data: message } = await supabase.from("messages").select("audio_url").eq("id", messageId).maybeSingle();
  if (!message?.audio_url) return null;

  const { data } = await supabase.storage.from(VOICE_NOTES_BUCKET).createSignedUrl(message.audio_url, 300);
  return data?.signedUrl ?? null;
}
