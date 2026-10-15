"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { failed, forbidden, type ActionResult } from "@/lib/action-result";
import { isAdmin, requireOrgContext } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateOrganization(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();
  const name = z.string().trim().min(1).max(120).safeParse(formData.get("name"));
  if (!name.success) return failed();

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ name: name.data }).eq("id", ctx.org.id);
  if (error) return failed();
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "bots.updated" };
}

const whatsappSchema = z.object({
  phoneNumberId: z.string().trim().regex(/^\d{5,30}$/),
  accessToken: z.string().trim().max(1000),
});

export async function saveWhatsAppSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();
  const parsed = whatsappSchema.safeParse({
    phoneNumberId: formData.get("phoneNumberId"),
    accessToken: formData.get("accessToken") ?? "",
  });
  if (!parsed.success) return failed();

  // The token column is not writable (or readable) by dashboard users; the
  // server encrypts it and writes it with the service role after the admin
  // check above.
  const patch: { whatsapp_phone_number_id: string; whatsapp_access_token?: string } = {
    whatsapp_phone_number_id: parsed.data.phoneNumberId,
  };
  if (parsed.data.accessToken) {
    patch.whatsapp_access_token = encryptSecret(parsed.data.accessToken, serverEnv().ENCRYPTION_KEY);
  }

  const { error } = await createAdminClient().from("organizations").update(patch).eq("id", ctx.org.id);
  if (error?.code === "23505") return failed("settings.whatsapp.taken");
  if (error) return failed();

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "settings.whatsapp.saved" };
}

const inviteSchema = z.object({
  email: z.email().max(254),
  role: z.enum(["admin", "agent"]),
});

export async function inviteMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!isAdmin(ctx.role)) return forbidden();
  const parsed = inviteSchema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return failed();

  const admin = createAdminClient();
  const appUrl = serverEnv().NEXT_PUBLIC_APP_URL;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/dashboard`,
  });
  if (error || !data.user) return failed();

  // Membership is written through the inviter's RLS-bound client: the policy
  // only lets admins add non-owner members to their own organization.
  const supabase = await createClient();
  const { error: memberError } = await supabase
    .from("organization_members")
    .upsert({ org_id: ctx.org.id, user_id: data.user.id, role: parsed.data.role }, { onConflict: "org_id,user_id", ignoreDuplicates: true });
  if (memberError) return failed();

  revalidatePath("/dashboard/settings");
  return { ok: true, message: "settings.team.invited" };
}
