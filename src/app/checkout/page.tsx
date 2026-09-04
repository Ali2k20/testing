import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your FRS order. Cash on delivery available across the UAE.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <header className="mx-auto max-w-[1400px] px-5 pb-4 pt-12 lg:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-5xl leading-none font-light">Checkout</h1>
          <Link href="/cart" className="eyebrow link-underline text-ink-muted">
            ← Back to bag
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          Secure checkout · Free returns within {site.returnWindowDays} days · Cash on delivery in
          all seven emirates
        </p>
      </header>
      <CheckoutForm />
    </>
  );
}
