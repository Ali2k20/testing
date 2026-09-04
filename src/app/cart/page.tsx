import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart-page-content";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review your FRS order before checkout.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <header className="mx-auto max-w-[1400px] px-5 pb-6 pt-14 lg:px-10">
        <h1 className="font-display text-5xl leading-none font-light">Your bag</h1>
      </header>
      <CartPageContent />
    </>
  );
}
