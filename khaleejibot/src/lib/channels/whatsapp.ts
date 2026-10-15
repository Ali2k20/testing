import "server-only";

import { createEngineDeps } from "@/lib/ai/engine-deps";
import { processIncomingMessage, type EngineDeps } from "@/lib/ai/engine";
import { decryptSecret } from "@/lib/crypto";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { downloadWhatsAppMedia, markWhatsAppRead, sendWhatsAppText } from "@/lib/whatsapp/client";
import type { InboundWhatsAppMessage } from "@/lib/whatsapp/webhook";

type WhatsAppTenant = {
  orgId: string;
  botId: string;
  phoneNumberId: string;
  accessToken: string;
};

async function resolveTenant(phoneNumberId: string): Promise<WhatsAppTenant | null> {
  const db = createAdminClient();
  const { data: org, error } = await db
    .from("organizations")
    .select("id, whatsapp_access_token")
    .eq("whatsapp_phone_number_id", phoneNumberId)
    .maybeSingle();
  if (error) throw error;
  if (!org?.whatsapp_access_token) return null;

  const { data: bot, error: botError } = await db
    .from("bots")
    .select("id")
    .eq("org_id", org.id)
    .eq("is_whatsapp_default", true)
    .maybeSingle();
  if (botError) throw botError;
  if (!bot) return null;

  return {
    orgId: org.id,
    botId: bot.id,
    phoneNumberId,
    accessToken: decryptSecret(org.whatsapp_access_token, serverEnv().ENCRYPTION_KEY),
  };
}

/** Handles one inbound WhatsApp message end to end. Safe to call for retries. */
export async function handleWhatsAppMessage(message: InboundWhatsAppMessage, deps: EngineDeps = createEngineDeps()) {
  const tenant = await resolveTenant(message.phoneNumberId);
  if (!tenant) {
    console.warn(`[whatsapp] no organization/bot configured for phone_number_id ${message.phoneNumberId}`);
    return;
  }

  markWhatsAppRead({ phoneNumberId: tenant.phoneNumberId, accessToken: tenant.accessToken, messageId: message.messageId }).catch(
    (error) => console.warn("[whatsapp] mark-as-read failed", String(error)),
  );

  const audio =
    message.kind === "audio" && message.audioMediaId
      ? await downloadWhatsAppMedia({ mediaId: message.audioMediaId, accessToken: tenant.accessToken })
      : null;

  const result = await processIncomingMessage(
    {
      botId: tenant.botId,
      channel: "whatsapp",
      customerIdentifier: message.from,
      customerName: message.customerName,
      externalId: message.messageId,
      // Images, stickers, locations… go through the engine as a placeholder so
      // agents see them and the AI (when active) can ask for text instead.
      text: message.kind === "unsupported"
          ? `[Customer sent an unsupported WhatsApp message (type: ${message.originalType}) that the assistant cannot view]`
          : message.text,
      audio,
    },
    deps,
  );

  if (result.reply) {
    await sendWhatsAppText({ ...tenantSender(tenant), to: message.from, body: result.reply.content_text });
  }
}

function tenantSender(tenant: WhatsAppTenant) {
  return { phoneNumberId: tenant.phoneNumberId, accessToken: tenant.accessToken };
}

/**
 * Delivers a human agent's reply to a WhatsApp customer. Called from the
 * dashboard after the agent's message has been saved through RLS.
 */
export async function deliverAgentReplyToWhatsApp(params: { orgId: string; to: string; body: string }) {
  const db = createAdminClient();
  const { data: org, error } = await db
    .from("organizations")
    .select("whatsapp_phone_number_id, whatsapp_access_token")
    .eq("id", params.orgId)
    .single();
  if (error) throw error;
  if (!org.whatsapp_phone_number_id || !org.whatsapp_access_token) {
    throw new Error("WhatsApp is not connected for this organization");
  }
  await sendWhatsAppText({
    phoneNumberId: org.whatsapp_phone_number_id,
    accessToken: decryptSecret(org.whatsapp_access_token, serverEnv().ENCRYPTION_KEY),
    to: params.to,
    body: params.body,
  });
}
