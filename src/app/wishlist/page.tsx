import type { Metadata } from "next";
import { WishlistContent } from "@/components/wishlist-content";

export const metadata: Metadata = {
  title: "Your wishlist",
  description: "Pieces you have saved at FRS.",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <>
      <header className="mx-auto max-w-[1400px] px-5 pb-6 pt-14 lg:px-10">
        <p className="eyebrow text-gold">Saved for later</p>
        <h1 className="mt-4 font-display text-5xl leading-none font-light">Your wishlist</h1>
      </header>
      <WishlistContent />
    </>
  );
}
