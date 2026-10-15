import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InboxClient, type InboxConversation } from "@/components/inbox/inbox-client";
import { requireOrgContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("inbox"))("title") };
}

export default async function InboxPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const [{ data: bots }, { data: conversations }] = await Promise.all([
    supabase.from("bots").select("id, name"),
    supabase.from("conversations").select("*").order("updated_at", { ascending: false }).limit(200),
  ]);

  const botNames = Object.fromEntries((bots ?? []).map((bot) => [bot.id, bot.name]));
  const initial: InboxConversation[] = (conversations ?? []).map((c) => ({ ...c, bot_name: botNames[c.bot_id] ?? "" }));

  return (
    <div className="[--inbox-offset:0px] max-md:[--inbox-offset:9rem]">
      <InboxClient orgId={ctx.org.id} botNames={botNames} initialConversations={initial} />
    </div>
  );
}
