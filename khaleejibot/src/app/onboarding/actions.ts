"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: boolean } | undefined;

export async function createOrganization(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const name = z.string().trim().min(1).max(120).safeParse(formData.get("name"));
  if (!name.success) return { error: true };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("organization_members").select("org_id").limit(1).maybeSingle();
  if (!existing) {
    const { error } = await supabase.rpc("create_organization", { p_name: name.data });
    if (error) return { error: true };
  }
  redirect("/dashboard");
}
