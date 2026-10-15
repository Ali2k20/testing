import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type { MemberRole, PlanTier } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type OrgContext = {
  userId: string;
  email: string | null;
  org: { id: string; name: string; plan_tier: PlanTier; whatsapp_phone_number_id: string | null };
  role: MemberRole;
};

/** The signed-in user and their organization, or a redirect to login/onboarding. */
export const requireOrgContext = cache(async (): Promise<OrgContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("role, org_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!membership) redirect("/onboarding");

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, plan_tier, whatsapp_phone_number_id")
    .eq("id", membership.org_id)
    .single();
  if (orgError) throw orgError;

  return { userId: user.id, email: user.email ?? null, org, role: membership.role };
});

export function isAdmin(role: MemberRole): boolean {
  return role === "owner" || role === "admin";
}
