"use client";

import { ProductCard } from "./product-card";
import { getProducts } from "@/lib/products";
import { useStore } from "@/lib/store";

export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const { recentlyViewed } = useStore();
  const slugs = recentlyViewed.filter((slug) => slug !== exclude).slice(0, 4);
  const items = getProducts(slugs);

  if (items.length < 2) return null;

  return (
    <section className="mx-auto max-w-[1400px] border-t border-line px-5 py-16 lg:px-10">
      <p className="eyebrow text-ink-muted">Recently viewed</p>
      <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.slug} product={product} compact />
        ))}
      </div>
    </section>
  );
}
