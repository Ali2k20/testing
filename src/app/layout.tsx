import type { Metadata, Viewport } from "next";
import { Badeen_Display, Bodoni_Moda, Hanken_Grotesk, Noto_Naskh_Arabic } from "next/font/google";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CartDrawer } from "@/components/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { StoreProvider } from "@/lib/store";
import { site } from "@/lib/site";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const badeen = Badeen_Display({
  variable: "--font-badeen",
  subsets: ["arabic"],
  weight: "400",
  display: "swap",
});

const naskh = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "abaya",
    "abaya Dubai",
    "mukhawar",
    "jalabiya",
    "kaftan UAE",
    "Emirati fashion",
    "modest wear UAE",
    "abaya online UAE",
  ],
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ebe3d6",
  width: "device-width",
  initialScale: 1,
};

const organisationSchema = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: site.name,
  legalName: site.legalName,
  description: site.description,
  url: site.url,
  email: site.email,
  telephone: site.phoneDisplay,
  currenciesAccepted: site.currency,
  paymentAccepted: "Cash on delivery, Credit card, Apple Pay",
  areaServed: "AE",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.addressLines[0],
    addressLocality: "Dubai",
    addressCountry: "AE",
  },
  sameAs: [site.instagram, site.tiktok],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${hanken.variable} ${badeen.variable} ${naskh.variable}`}>
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }}
        />
        <StoreProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-fg focus:px-4 focus:py-2 focus:text-ground"
          >
            Skip to content
          </a>
          <AnnouncementBar />
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <CartDrawer />
          <WhatsAppButton />
        </StoreProvider>
      </body>
    </html>
  );
}
