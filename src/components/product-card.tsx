import Link from "next/link";
import { ProductArt } from "./product-art";
import { WishlistButton } from "./wishlist-button";
import { Badge, Stars } from "./ui";
import { categoryLabels, ratingFor, totalStock } from "@/lib/products";
import { discountPercent, formatPrice, instalmentOf } from "@/lib/format";
import { site } from "@/lib/site";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
  compact = false,
}: {
  product: Product;
  priority?: boolean;
  compact?: boolean;
}) {
  const rating = ratingFor(product);
  const stock = totalStock(product);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const isNew = new Date(product.releasedAt) > new Date("2026-04-01");

  return (
    <article className="group relative flex flex-col">
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden bg-panel">
        <div className="aspect-[3/4]">
          <ProductArt
            product={product}
            color={product.colors[0]}
            priority={priority}
            className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]"
          />
        </div>
        {/* Second colourway revealed on hover — the standard fashion-retail cue. */}
        {product.colors.length > 1 && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <ProductArt product={product} color={product.colors[1]} className="h-full w-full" />
          </div>
        )}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {discount > 0 && <Badge tone="sale">Save {discount}%</Badge>}
          {discount === 0 && isNew && <Badge tone="quiet">New</Badge>}
          {stock > 0 && stock <= 12 && <Badge tone="gold">Only {stock} left</Badge>}
          {stock === 0 && <Badge tone="quiet">Waitlist</Badge>}
        </div>
        <WishlistButton
          slug={product.slug}
          className="absolute right-3 top-3 h-11 w-11 justify-center bg-ground/80 text-fg-soft hover:text-fg"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        {!compact && (
          <p className="text-[13px] text-fg-muted">{categoryLabels[product.category]}</p>
        )}
        <h3 className="font-display text-xl leading-snug font-normal">
          <Link href={`/product/${product.slug}`} className="link-underline">
            {product.name}
          </Link>
        </h3>
        {!compact && <p className="text-sm leading-relaxed text-fg-soft">{product.tagline}</p>}

        {rating.count > 0 && (
          <div className="flex items-center gap-2 pt-0.5">
            <Stars rating={rating.average} />
            <span className="text-[13px] text-fg-muted">
              {rating.average} ({rating.count})
            </span>
          </div>
        )}

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-medium text-fg">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-fg-muted line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <p className="text-[13px] text-fg-muted">
          or {site.instalments} × {formatPrice(instalmentOf(product.price))} interest-free
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          {product.colors.slice(0, 5).map((color) => (
            <span
              key={color.name}
              title={color.label}
              className="h-3.5 w-3.5 rounded-full border border-line"
              style={{ backgroundColor: color.hex }}
            />
          ))}
          {product.colors.length > 5 && (
            <span className="text-[13px] text-fg-muted">+{product.colors.length - 5}</span>
          )}
        </div>
      </div>
    </article>
  );
}
