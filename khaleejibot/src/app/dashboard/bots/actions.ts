"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { failed, forbidden, type ActionResult } from "@/lib/action-result";
import { isAdmin, requireOrgContext } from "@/lib/auth";
import { ingestKnowledgeSource } from "@/lib/knowledge/ingest";
import { PLAN_LIMITS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

const botSchema = z.object({
  name: z.string().trim().min(1).max(80),
  dialect_persona: z.enum(["emirati_khaleeji", "levantine", "msa_formal", "bilingual_auto"]),
  system_instructions: z.string().max(8000).default(""),
  confidence_threshold: z.coerce.number().min(0).max(1),
  welcome_message_ar: z.string().trim().min(1).max(500),
  welcome_message_en: z.string().trim().min(1).max(500),
  handoff_message_ar: z.string().trim().min(1).max(500),
  handoff_message_en: z.string().trim().min(1).max(500),
});

const createSchema = botSchema.pick({ name: true, dialect_persona: true });

export async function createBot(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed();

  const supabase = await createClient();
  const { count } = await supabase.from("bots").select("id", { count: "exact", head: true }).eq("org_id", ctx.org.id);
  const limit = PLAN_LIMITS[ctx.org.plan_tier].bots;
  if ((count ?? 0) >= limit) return failed("bots.limitReached", { plan: ctx.org.plan_tier, limit });

  const { data, error } = await supabase
    .from("bots")
    .insert({ org_id: ctx.org.id, ...parsed.data })
    .select("id")
    .single();
  if (error) return failed();

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/bots/${data.id}`);
}

export async function updateBot(botId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();

  const parsed = botSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed();

  const supabase = await createClient();
  const { error } = await supabase.from("bots").update(parsed.data).eq("id", botId).eq("org_id", ctx.org.id);
  if (error) return failed();

  revalidatePath(`/dashboard/bots/${botId}`);
  revalidatePath("/dashboard/bots");
  return { ok: true, message: "bots.updated" };
}

export async function deleteBot(botId: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();

  const supabase = await createClient();
  const { error } = await supabase.from("bots").delete().eq("id", botId).eq("org_id", ctx.org.id);
  if (error) return failed();

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/bots");
}

export async function setWhatsAppBot(botId: string, enabled: boolean): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();

  const supabase = await createClient();
  // Clear first: a partial unique index allows one WhatsApp bot per org.
  const { error: clearError } = await supabase
    .from("bots")
    .update({ is_whatsapp_default: false })
    .eq("org_id", ctx.org.id)
    .eq("is_whatsapp_default", true);
  if (clearError) return failed();

  if (enabled) {
    const { error } = await supabase
      .from("bots")
      .update({ is_whatsapp_default: true })
      .eq("id", botId)
      .eq("org_id", ctx.org.id);
    if (error) return failed();
  }

  revalidatePath(`/dashboard/bots/${botId}`);
  revalidatePath("/dashboard/bots");
  return { ok: true, message: "bots.updated" };
}

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const TEXT_EXTENSIONS = /\.(txt|md|markdown|csv|json)$/i;

export async function addKnowledge(botId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();

  const file = formData.get("file");
  let sourceName = String(formData.get("sourceName") ?? "").trim();
  let text = String(formData.get("content") ?? "");

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) return failed("knowledge.errors.fileSize");
    if (!TEXT_EXTENSIONS.test(file.name)) return failed("knowledge.errors.fileType");
    text = [text, await file.text()].filter((part) => part.trim()).join("\n\n");
    sourceName ||= file.name;
  }
  if (!sourceName || !text.trim()) return failed("knowledge.errors.missing");

  const supabase = await createClient();
  try {
    const { chunks } = await ingestKnowledgeSource(supabase, { botId, sourceName, text });
    revalidatePath(`/dashboard/bots/${botId}`);
    return { ok: true, message: "knowledge.added", values: { count: chunks, source: sourceName } };
  } catch (error) {
    console.error("[knowledge] ingest failed", error);
    return failed();
  }
}

export async function deleteKnowledgeSource(botId: string, sourceName: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();

  const supabase = await createClient();
  const { error } = await supabase.from("knowledge_chunks").delete().eq("bot_id", botId).eq("source_name", sourceName);
  if (error) return failed();

  revalidatePath(`/dashboard/bots/${botId}`);
  return { ok: true, message: "knowledge.deleted" };
}
