"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductArt, type ArtView } from "./product-art";
import { WishlistButton } from "./wishlist-button";
import { Badge, Stars, buttonClass } from "./ui";
import { discountPercent, formatPrice, instalmentOf } from "@/lib/format";
import { ratingFor, totalStock } from "@/lib/products";
import { useStore } from "@/lib/store";
import { deliveryDays, emirates, site, whatsappLink, type Emirate } from "@/lib/site";
import type { Product } from "@/lib/types";

const views: { value: ArtView; label: string }[] = [
  { value: "full", label: "Front" },
  { value: "detail", label: "Detail" },
  { value: "back", label: "Back" },
  { value: "fabric", label: "Fabric" },
];

export function ProductPurchase({ product }: { product: Product }) {
  const { addLine, recordView } = useStore();
  const [colorName, setColorName] = useState(product.colors[0].name);
  const [sizeLabel, setSizeLabel] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0].label : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState<ArtView>("full");
  const [emirate, setEmirate] = useState<Emirate>("Dubai");
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    recordView(product.slug);
  }, [product.slug, recordView]);

  const color = useMemo(
    () => product.colors.find((option) => option.name === colorName) ?? product.colors[0],
    [colorName, product.colors],
  );
  const selectedSize = product.sizes.find((option) => option.label === sizeLabel);
  const rating = ratingFor(product);
  const stock = totalStock(product);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const soldOut = stock === 0;

  function handleAdd() {
    if (!sizeLabel) {
      setSizeError(true);
      return;
    }
    addLine({ slug: product.slug, color: color.name, size: sizeLabel, quantity });
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-10 lg:pt-12">
      {/* Gallery */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative aspect-[3/4] overflow-hidden bg-panel">
          <ProductArt product={product} color={color} view={view} className="h-full w-full" />
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {discount > 0 && <Badge tone="sale">Save {discount}%</Badge>}
            {stock > 0 && stock <= 12 && <Badge tone="gold">Only {stock} left in the studio</Badge>}
          </div>
          <WishlistButton
            slug={product.slug}
            withLabel
            className="absolute right-4 top-4 bg-ground/90 px-3 py-2 text-fg-soft hover:text-fg"
          />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-3">
          {views.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setView(item.value)}
              aria-pressed={view === item.value}
              className={`aspect-square overflow-hidden border transition-colors ${
                view === item.value ? "border-fg" : "border-line hover:border-fg-muted"
              }`}
              aria-label={`${item.label} view`}
            >
              <ProductArt product={product} color={color} view={item.value} className="h-full w-full" />
            </button>
          ))}
        </div>
      </div>

      {/* Buy panel */}
      <div>
        <p className="eyebrow text-fg-muted">{product.tagline}</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl">
          {product.name}
        </h1>
        <p className="mt-1.5 font-arabic-text text-2xl text-fg-muted" dir="rtl" lang="ar">
          {product.arabicName}
        </p>

        {rating.count > 0 && (
          <a href="#reviews" className="mt-4 inline-flex items-center gap-2.5">
            <Stars rating={rating.average} />
            <span className="text-[13px] text-fg-muted underline">
              {rating.average} · {rating.count} verified {rating.count === 1 ? "review" : "reviews"}
            </span>
          </a>
        )}

        <div className="mt-6 flex flex-wrap items-baseline gap-3">
          <span className="font-display text-3xl">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-fg-muted line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span className="text-[13px] text-fg-muted">VAT included</span>
        </div>
        <p className="mt-2 text-[13px] text-fg-muted">
          or {site.instalments} interest-free payments of{" "}
          <strong className="text-fg">{formatPrice(instalmentOf(product.price))}</strong> with Tabby
          or Tamara
        </p>

        <p className="mt-7 text-sm leading-relaxed text-fg-soft">{product.description}</p>

        {/* Colour */}
        <div className="mt-9">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow text-fg">Colour</p>
            <p className="text-[13px] text-fg-muted">{color.label}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.colors.map((option) => (
              <button
                key={option.name}
                type="button"
                onClick={() => setColorName(option.name)}
                aria-pressed={option.name === colorName}
                aria-label={option.label}
                title={option.label}
                className={`h-10 w-10 rounded-full border transition-all ${
                  option.name === colorName
                    ? "border-fg ring-1 ring-fg ring-offset-2 ring-offset-ground"
                    : "border-line hover:border-fg-muted"
                }`}
                style={{ backgroundColor: option.hex }}
              />
            ))}
          </div>
        </div>

        {/* Size */}
        {product.sizes.length > 1 && (
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow text-fg">Size</p>
              <Link href="/size-guide" className="text-[13px] text-fg-muted underline hover:text-fg">
                Size guide
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {product.sizes.map((option) => {
                const out = option.stock === 0;
                return (
                  <button
                    key={option.label}
                    type="button"
                    disabled={out}
                    onClick={() => {
                      setSizeLabel(option.label);
                      setSizeError(false);
                    }}
                    aria-pressed={option.label === sizeLabel}
                    className={`relative border py-3 text-[13px] transition-colors ${
                      option.label === sizeLabel
                        ? "border-fg bg-fg text-ground"
                        : out
                          ? "cursor-not-allowed border-line-soft text-fg-muted/50 line-through"
                          : "border-line text-fg hover:border-fg"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {selectedSize?.lengthCm && (
              <p className="mt-2.5 text-[13px] text-fg-muted">
                Size {selectedSize.label} measures {selectedSize.lengthCm} cm shoulder to hem.
                {selectedSize.stock <= 4 && selectedSize.stock > 0 && (
                  <strong className="text-talli"> Only {selectedSize.stock} left in this size.</strong>
                )}
              </p>
            )}
            {sizeError && (
              <p className="mt-2.5 text-[13px] text-[#8E2C33]">Choose a size to continue.</p>
            )}
          </div>
        )}

        {/* Quantity + add */}
        <div className="mt-8 flex flex-wrap items-stretch gap-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="px-4 py-3 text-fg-muted hover:text-fg"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(9, value + 1))}
              className="px-4 py-3 text-fg-muted hover:text-fg"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className={buttonClass("solid", "lg", "flex-1 min-w-[200px]")}
          >
            {soldOut ? "Join the waitlist" : `Add to bag · ${formatPrice(product.price * quantity)}`}
          </button>
        </div>

        <a
          href={whatsappLink(
            `Hi ${site.name}, I would like to order the ${product.name} in ${color.label}${
              sizeLabel ? `, size ${sizeLabel}` : ""
            }.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "lg", "mt-3 w-full")}
        >
          Order on WhatsApp instead
        </a>

        {/* Delivery estimate */}
        <div className="mt-8 border border-line-soft bg-panel p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow text-fg">Delivery to</span>
            <select
              value={emirate}
              onChange={(event) => setEmirate(event.target.value as Emirate)}
              className="border border-line bg-ground px-3 py-2 text-[13px] outline-none"
              aria-label="Choose your emirate"
            >
              {emirates.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-sm text-fg-soft">
            <strong>{deliveryDays[emirate]}</strong> — free on orders over{" "}
            {formatPrice(site.freeShippingThreshold)}, otherwise {formatPrice(site.standardShipping)}.
            Cash on delivery available.
          </p>
        </div>

        <ul className="mt-7 space-y-2.5 text-sm text-fg-soft">
          {product.details.map((detail) => (
            <li key={detail} className="flex gap-3">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-talli" />
              {detail}
            </li>
          ))}
        </ul>

        <dl className="mt-8 divide-y divide-line-soft border-y border-line-soft">
          {[
            { term: "Fabric", detail: product.fabric },
            { term: "Care", detail: product.care },
            { term: "Made", detail: product.origin },
            {
              term: "Returns",
              detail: `Free collection and exchange within ${site.returnWindowDays} days, anywhere in the UAE.`,
            },
          ].map((row) => (
            <div key={row.term} className="grid grid-cols-[100px_1fr] gap-4 py-4">
              <dt className="eyebrow text-fg-muted">{row.term}</dt>
              <dd className="text-sm leading-relaxed text-fg-soft">{row.detail}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Sticky mobile buy bar */}
      <div className="buy-bar fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 bg-panel px-4 py-3 lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-fg-muted">{product.name}</p>
          <p className="text-sm font-medium">{formatPrice(product.price)}</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className={buttonClass("solid", "md", "shrink-0")}
        >
          {soldOut ? "Waitlist" : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
