import { BotIcon, MessageCircleIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAdmin, requireOrgContext } from "@/lib/auth";
import { PLAN_LIMITS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export default async function BotsPage() {
  const ctx = await requireOrgContext();
  const t = await getTranslations("bots");
  const supabase = await createClient();

  const [{ data: bots }, { data: sources }] = await Promise.all([
    supabase.from("bots").select("id, name, dialect_persona, is_whatsapp_default").order("created_at"),
    supabase.from("knowledge_sources").select("bot_id, chunk_count"),
  ]);

  const chunkCounts = new Map<string, number>();
  for (const source of sources ?? []) {
    chunkCounts.set(source.bot_id, (chunkCounts.get(source.bot_id) ?? 0) + source.chunk_count);
  }
  const limit = PLAN_LIMITS[ctx.org.plan_tier].bots;
  const atLimit = (bots?.length ?? 0) >= limit;
  const plans = await getTranslations("settings.org.plans");

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          isAdmin(ctx.role) && !atLimit ? (
            <Button asChild>
              <Link href="/dashboard/bots/new">
                <PlusIcon aria-hidden />
                {t("new")}
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="grid gap-4 p-4 sm:p-8">
        {atLimit && isAdmin(ctx.role) ? (
          <Alert variant="warning">
            <AlertDescription>{t("limitReached", { plan: plans(ctx.org.plan_tier), limit })}</AlertDescription>
          </Alert>
        ) : null}

        {!bots?.length ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
            <BotIcon className="text-muted-foreground size-10" aria-hidden />
            <p className="text-muted-foreground">{t("empty")}</p>
            {isAdmin(ctx.role) ? (
              <Button asChild>
                <Link href="/dashboard/bots/new">{t("new")}</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bots.map((bot) => (
              <li key={bot.id}>
                <Link
                  href={`/dashboard/bots/${bot.id}`}
                  className="bg-card hover:border-primary/50 focus-visible:ring-ring/50 block rounded-xl border p-5 shadow-xs transition-colors outline-none focus-visible:ring-[3px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{bot.name}</h2>
                    {bot.is_whatsapp_default ? (
                      <Badge variant="success">
                        <MessageCircleIcon aria-hidden />
                        {t("whatsappBadge")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{t(`persona.${bot.dialect_persona}`)}</p>
                  <p className="text-muted-foreground mt-4 text-xs">{t("chunks", { count: chunkCounts.get(bot.id) ?? 0 })}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
