import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: "Safqa صفقة — B2B quoting & negotiation agent" },
  description:
    "Turns Gulf Arabic voice notes and chats into verified, margin-safe quotations and negotiates within hard guardrails.",
  robots: { index: false, follow: false },
};

export default function SafqaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${plexArabic.variable} min-h-dvh bg-[#f4f6f5] text-[#10201b]`}
      style={{ fontFamily: "var(--font-plex-arabic), var(--font-sans)" }}
    >
      {children}
    </div>
  );
}
