import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { Toaster } from "@/components/ui/sonner";
import { directionOf, isLocale, defaultLocale } from "@/i18n/config";

import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: { default: t("appName"), template: `%s · ${t("appName")}` },
    description: t("tagline"),
  };
}

export const viewport: Viewport = {
  themeColor: "#0f5e5c",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requested = await getLocale();
  const locale = isLocale(requested) ? requested : defaultLocale;

  return (
    <html lang={locale} dir={directionOf(locale)} className={plexArabic.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <NextIntlClientProvider>
          {children}
          <Toaster position={locale === "ar" ? "bottom-left" : "bottom-right"} richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
