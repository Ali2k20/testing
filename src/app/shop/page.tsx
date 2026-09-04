import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopBrowser } from "@/components/shop-browser";
import { TrustBar } from "@/components/trust-bar";

export const metadata: Metadata = {
  title: "Shop all abayas & mukhawar",
  description:
    "Browse every FRS piece — abayas, mukhawar, kaftans and accessories. Filter by colour, size, price and collection. Free UAE delivery over AED 300 with cash on delivery.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <>
      <header className="mx-auto max-w-[1400px] px-5 pb-10 pt-14 lg:px-10 lg:pt-20">
        <p className="eyebrow text-gold">The full collection</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] font-light sm:text-6xl">
          Everything in the atelier, right now
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-muted">
          Stock is live. If a size shows as unavailable it is genuinely made out — message us and we
          will tell you when the next run lands, or make it to order.
        </p>
      </header>

      <Suspense fallback={<div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10">Loading…</div>}>
        <ShopBrowser />
      </Suspense>

      <TrustBar tone="ivory" />
    </>
  );
}
