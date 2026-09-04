import type { Metadata } from "next";
import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { collections } from "@/lib/collections";
import { productsInCollection } from "@/lib/products";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Browse FRS by moment — Ramadan Nights, the Eid Capsule, Everyday Luxe, Occasion & Bridal, New Arrivals and Best Sellers.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsPage() {
  return (
    <>
      <header className="mx-auto max-w-[1400px] px-5 pb-10 pt-14 lg:px-10 lg:pt-20">
        <p className="eyebrow text-gold">Browse by moment</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.02] font-light sm:text-6xl">
          Our collections
        </h1>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 pb-24 lg:grid-cols-2 lg:px-10">
        {collections.map((collection) => {
          const items = productsInCollection(collection.slug);
          const hero = items[0];
          return (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="group grid grid-cols-[140px_1fr] gap-6 border border-line p-5 transition-colors hover:bg-sand sm:grid-cols-[200px_1fr] sm:gap-8 sm:p-7"
            >
              <div className="aspect-[3/4] overflow-hidden bg-sand">
                {hero && (
                  <ProductArt
                    product={hero}
                    color={hero.colors[0]}
                    className="h-full w-full transition-transform duration-[1100ms] group-hover:scale-105"
                  />
                )}
              </div>
              <div className="self-center">
                <p className="eyebrow" style={{ color: collection.accent }}>
                  {items.length} pieces
                </p>
                <h2 className="mt-2 font-display text-3xl font-light">{collection.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{collection.headline}</p>
                <span className="eyebrow link-underline mt-4 inline-block text-ink">Explore</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
