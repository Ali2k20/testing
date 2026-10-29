import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { TrustBar } from "@/components/trust-bar";
import { ButtonLink } from "@/components/ui";
import { collections, getCollection } from "@/lib/collections";
import { productsInCollection } from "@/lib/products";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Collection not found" };
  return {
    title: `${collection.name} — ${collection.headline}`,
    description: collection.description,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const items = productsInCollection(collection.slug).sort((a, b) => b.popularity - a.popularity);
  const others = collections.filter((item) => item.slug !== collection.slug);

  return (
    <>
      <header className="border-b border-line bg-panel">
        <div className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10 lg:py-24">
          <p className="eyebrow" style={{ color: collection.accent }}>
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] sm:text-7xl">
            {collection.name}
          </h1>
          <p className="mt-2 font-arabic-text text-3xl text-fg-muted" dir="rtl" lang="ar">
            {collection.arabicName}
          </p>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-fg-soft">
            {collection.headline}. {collection.description}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10 lg:py-20">
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product, index) => (
            <ProductCard key={product.slug} product={product} priority={index < 4} />
          ))}
        </div>
      </section>

      <TrustBar />

      <section className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10 lg:py-20">
        <p className="eyebrow text-fg-muted">Keep browsing</p>
        <div className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
          {others.map((item) => (
            <ButtonLink
              key={item.slug}
              href={`/collections/${item.slug}`}
              tone="ghost"
              className="bg-ground px-6 py-8 text-center"
            >
              {item.name}
            </ButtonLink>
          ))}
        </div>
        <p className="mt-10 text-center text-[13px] text-fg-muted">
          Every piece ships free across the UAE over {site.currency} {site.freeShippingThreshold},
          with cash on delivery in all seven emirates.
        </p>
      </section>
    </>
  );
}
