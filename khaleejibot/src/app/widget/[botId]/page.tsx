import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { ChatWidget } from "@/components/widget/chat-widget";
import { directionOf, isLocale, type Locale } from "@/i18n/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/validation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function WidgetPage({ params, searchParams }: PageProps<"/widget/[botId]">) {
  const { botId } = await params;
  const query = await searchParams;
  const locale: Locale = isLocale(query.lang) ? query.lang : "ar";
  const embedded = query.embedded === "1";

  const bot = isUuid(botId)
    ? (
        await createAdminClient()
          .from("bots")
          .select("id, name, welcome_message_ar, welcome_message_en")
          .eq("id", botId)
          .maybeSingle()
      ).data
    : null;

  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: "widget" });

  return (
    <div lang={locale} dir={directionOf(locale)} className="bg-background flex h-dvh flex-col">
      {bot ? (
        <NextIntlClientProvider locale={locale} messages={{ widget: messages.widget }}>
          <ChatWidget
            botId={bot.id}
            botName={bot.name}
            welcome={locale === "ar" ? bot.welcome_message_ar : bot.welcome_message_en}
            embedded={embedded}
          />
        </NextIntlClientProvider>
      ) : (
        <p className="text-muted-foreground m-auto p-6 text-center text-sm">{t("unavailable")}</p>
      )}
    </div>
  );
}
