import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductReviews } from "@/components/product-reviews";
import { RecentlyViewed } from "@/components/recently-viewed";
import { TrustBar } from "@/components/trust-bar";
import { SectionHeading } from "@/components/ui";
import { getCollection } from "@/lib/collections";
import { getProduct, getProducts, products, ratingFor, totalStock } from "@/lib/products";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Piece not found" };

  return {
    title: `${product.name} — ${product.tagline}`,
    description: `${product.description.slice(0, 155)}…`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} | ${site.name}`,
      description: product.tagline,
      url: `${site.url}/product/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const rating = ratingFor(product);
  const stock = totalStock(product);
  const pairsWith = getProducts(product.pairsWith);
  const primaryCollection = getCollection(product.collections[0]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: site.name },
    material: product.fabric,
    countryOfOrigin: "AE",
    color: product.colors.map((color) => color.label).join(", "),
    offers: {
      "@type": "Offer",
      priceCurrency: "AED",
      price: product.price,
      availability:
        stock > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      url: `${site.url}/product/${product.slug}`,
      seller: { "@type": "Organization", name: site.legalName },
    },
    ...(rating.count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.average,
        reviewCount: rating.count,
      },
      review: product.reviews.map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.author },
        datePublished: review.date,
        name: review.title,
        reviewBody: review.body,
        reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
      })),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1400px] px-5 pt-6 lg:px-10">
        <ol className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
          <li>
            <Link href="/" className="link-underline">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="link-underline">
              Shop
            </Link>
          </li>
          {primaryCollection && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/collections/${primaryCollection.slug}`} className="link-underline">
                  {primaryCollection.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li className="text-ink">{product.name}</li>
        </ol>
      </nav>

      <ProductPurchase product={product} />

      <TrustBar />

      {pairsWith.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10 lg:py-20">
          <SectionHeading
            align="left"
            eyebrow="Styled together"
            title="Complete the look"
            intro="What our customers most often add to the bag alongside this piece."
          />
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {pairsWith.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}

      <ProductReviews product={product} />

      <RecentlyViewed exclude={product.slug} />
    </>
  );
}
