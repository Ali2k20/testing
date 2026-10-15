import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { BotSettingsForm } from "@/components/bots/bot-settings-form";
import { DeployPanel } from "@/components/bots/deploy-panel";
import { KnowledgeManager } from "@/components/bots/knowledge-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAdmin, requireOrgContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

export default async function BotPage({ params }: PageProps<"/dashboard/bots/[botId]">) {
  const { botId } = await params;
  if (!isUuid(botId)) notFound();

  const ctx = await requireOrgContext();
  const supabase = await createClient();
  const [{ data: bot }, { data: sources }] = await Promise.all([
    supabase.from("bots").select("*").eq("id", botId).maybeSingle(),
    supabase
      .from("knowledge_sources")
      .select("*")
      .eq("bot_id", botId)
      .order("updated_at", { ascending: false }),
  ]);
  if (!bot) notFound();

  const t = await getTranslations("bots");
  const playground = await getTranslations("playground");
  const locale = await getLocale();
  const canEdit = isAdmin(ctx.role);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <>
      <PageHeader title={bot.name} description={t(`persona.${bot.dialect_persona}`)} />
      <Tabs defaultValue="settings" className="p-4 sm:p-8" dir={locale === "ar" ? "rtl" : "ltr"}>
        <TabsList>
          <TabsTrigger value="settings">{t("tabs.settings")}</TabsTrigger>
          <TabsTrigger value="knowledge">{t("tabs.knowledge")}</TabsTrigger>
          <TabsTrigger value="deploy">{t("tabs.deploy")}</TabsTrigger>
          <TabsTrigger value="test">{t("tabs.test")}</TabsTrigger>
        </TabsList>
        <TabsContent value="settings">
          <BotSettingsForm bot={bot} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="knowledge">
          <KnowledgeManager botId={bot.id} sources={sources ?? []} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="deploy">
          <DeployPanel
            botId={bot.id}
            appUrl={appUrl}
            isWhatsAppDefault={bot.is_whatsapp_default}
            whatsappConnected={Boolean(ctx.org.whatsapp_phone_number_id)}
            canEdit={canEdit}
          />
        </TabsContent>
        <TabsContent value="test" className="grid gap-3">
          <p className="text-muted-foreground text-sm">{playground("help")}</p>
          <iframe
            src={`/widget/${bot.id}?lang=${locale}&embedded=0`}
            title={bot.name}
            className="bg-card h-[600px] w-full max-w-md rounded-xl border shadow-sm"
            allow="microphone"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
