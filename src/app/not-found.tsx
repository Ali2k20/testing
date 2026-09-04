import { ButtonLink } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";

export default function NotFound() {
  const popular = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 4);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-24 lg:px-10">
      <div className="text-center">
        <p className="eyebrow text-gold">404</p>
        <h1 className="mt-4 font-display text-5xl leading-tight font-light sm:text-6xl">
          This page has sold out
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
          The link may be old, or the piece may have finished its run. Here is what is moving right
          now instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop" tone="solid" size="lg">
            Shop everything
          </ButtonLink>
          <ButtonLink href="/" tone="outline" size="lg">
            Back to home
          </ButtonLink>
        </div>
      </div>

      <div className="mt-20 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {popular.map((product) => (
          <ProductCard key={product.slug} product={product} compact />
        ))}
      </div>
    </div>
  );
}
