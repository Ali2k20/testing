"use client";

import Link from "next/link";
import { ProductCard } from "./product-card";
import { buttonClass } from "./ui";
import { getProducts, products } from "@/lib/products";
import { useStore } from "@/lib/store";

export function WishlistContent() {
  const { wishlist, ready } = useStore();
  const saved = getProducts(wishlist);

  if (!ready) {
    return <p className="mx-auto max-w-[1400px] px-5 py-24 text-sm text-fg-muted lg:px-10">Loading…</p>;
  }

  if (saved.length === 0) {
    const popular = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10">
        <div className="border border-line-soft bg-panel px-8 py-20 text-center">
          <p className="font-display text-4xl">Nothing saved yet</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-fg-muted">
            Tap the heart on any piece to keep it here. We will tell you if a saved size is about to
            sell out.
          </p>
          <Link href="/shop" className={buttonClass("solid", "lg", "mt-8")}>
            Browse the collection
          </Link>
        </div>
        <section className="mt-20">
          <p className="eyebrow text-fg-muted">Start with these</p>
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 pb-24 lg:px-10">
      <p className="text-sm text-fg-muted">
        {saved.length} {saved.length === 1 ? "piece" : "pieces"} saved
      </p>
      <div className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {saved.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
