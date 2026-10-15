import { AudioLinesIcon, BookOpenCheckIcon, HeadsetIcon, InboxIcon, LanguagesIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { key: "dialects", icon: LanguagesIcon },
  { key: "voice", icon: AudioLinesIcon },
  { key: "whatsapp", icon: MessageCircleIcon },
  { key: "knowledge", icon: BookOpenCheckIcon },
  { key: "handoff", icon: HeadsetIcon },
  { key: "inbox", icon: InboxIcon },
] as const;

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const common = await getTranslations("common");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <LocaleSwitcher />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{common("signIn")}</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-x-0 -top-40 -z-10 mx-auto h-[28rem] max-w-4xl rounded-full bg-gradient-to-br from-primary/25 via-accent to-transparent blur-3xl"
          />
          <div className="mx-auto max-w-4xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24">
            <p className="text-primary mb-4 text-sm font-semibold">{t("eyebrow")}</p>
            <h1 className="text-4xl leading-tight font-bold text-balance sm:text-5xl">{t("title")}</h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
              {t("subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">{t("ctaStart")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">{t("ctaSignIn")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <article key={key} className="bg-card rounded-xl border p-6 shadow-xs">
              <div className="bg-secondary text-secondary-foreground mb-4 inline-flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden />
              </div>
              <h2 className="font-semibold">{t(`features.${key}.title`)}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t(`features.${key}.body`)}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="text-muted-foreground border-t py-8 text-center text-sm">{t("footer")}</footer>
    </div>
  );
}
