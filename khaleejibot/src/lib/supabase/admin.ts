import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env";
import type { Database } from "./database.types";

export type AdminClient = SupabaseClient<Database>;

let admin: AdminClient | undefined;

/**
 * Service-role client. Bypasses RLS — only use it for inbound channel traffic
 * (widget, WhatsApp) and for writes that must not be possible from a browser.
 * Every caller is responsible for scoping its queries to the right tenant.
 */
export function createAdminClient(): AdminClient {
  if (admin) return admin;
  const env = serverEnv();
  admin = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
