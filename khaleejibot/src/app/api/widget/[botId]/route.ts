import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/validation";

/** Public, non-sensitive bot settings the widget needs to render. */
export async function GET(_request: Request, ctx: RouteContext<"/api/widget/[botId]">) {
  const { botId } = await ctx.params;
  if (!isUuid(botId)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: bot, error } = await createAdminClient()
    .from("bots")
    .select("id, name, dialect_persona, welcome_message_ar, welcome_message_en")
    .eq("id", botId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!bot) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(bot, { headers: { "Cache-Control": "public, max-age=60" } });
}
