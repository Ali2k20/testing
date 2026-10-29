"use client";

import Link from "next/link";
import { ProductArt } from "./product-art";
import { ProductCard } from "./product-card";
import { buttonClass } from "./ui";
import { colorByName } from "@/lib/palette";
import { formatPrice } from "@/lib/format";
import { products } from "@/lib/products";
import { orderTotals, useStore } from "@/lib/store";
import { site } from "@/lib/site";

export function CartPageContent() {
  const { lines, subtotal, setQuantity, removeLine, ready } = useStore();
  const totals = orderTotals(subtotal);
  const progress = Math.min(100, (subtotal / site.freeShippingThreshold) * 100);

  const suggestions = products
    .filter((product) => !lines.some((line) => line.slug === product.slug))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4);

  if (!ready) {
    return <div className="mx-auto max-w-[1400px] px-5 py-24 text-sm text-fg-muted lg:px-10">Loading your bag…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10">
        <div className="border border-line-soft bg-panel px-8 py-20 text-center">
          <p className="font-display text-4xl">Your bag is empty</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-fg-muted">
            Most first orders start with the Noor Open Abaya or a mulberry silk sheila. Both ship
            free once you pass {formatPrice(site.freeShippingThreshold)}.
          </p>
          <Link href="/shop" className={buttonClass("solid", "lg", "mt-8")}>
            Shop the collection
          </Link>
        </div>

        <section className="mt-20">
          <p className="eyebrow text-fg-muted">Most loved right now</p>
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pb-24 pt-8 lg:grid-cols-[1.6fr_1fr] lg:gap-16 lg:px-10">
      <div>
        <div className="border border-line-soft bg-panel p-5">
          {totals.amountToFreeShipping > 0 ? (
            <p className="text-sm text-fg-soft">
              Add <strong>{formatPrice(totals.amountToFreeShipping)}</strong> more for free UAE
              delivery.
            </p>
          ) : (
            <p className="text-sm text-fg-soft">
              <strong>Free UAE delivery unlocked.</strong> Dubai orders arrive next day.
            </p>
          )}
          <div className="mt-3 h-[3px] w-full bg-line">
            <div className="h-full bg-talli transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ul className="mt-8 divide-y divide-line">
          {lines.map((line) => {
            const color = colorByName(line.color) ?? line.product.colors[0];
            return (
              <li key={line.id} className="flex gap-5 py-7 first:pt-0">
                <Link
                  href={`/product/${line.product.slug}`}
                  className="h-40 w-32 shrink-0 overflow-hidden bg-panel"
                >
                  <ProductArt product={line.product} color={color} className="h-full w-full" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${line.product.slug}`}
                        className="link-underline font-display text-2xl leading-tight"
                      >
                        {line.product.name}
                      </Link>
                      <p className="mt-1 text-[13px] text-fg-muted">
                        {color.label} · Size {line.size}
                      </p>
                      <p className="mt-1 text-[13px] text-fg-muted">{line.product.fabric}</p>
                    </div>
                    <span className="shrink-0 text-sm">{formatPrice(line.lineTotal)}</span>
                  </div>

                  <div className="mt-auto flex items-center gap-5 pt-4">
                    <div className="flex items-center border border-line">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                        className="px-3 py-1.5 text-fg-muted hover:text-fg"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="min-w-7 text-center text-[13px]">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                        className="px-3 py-1.5 text-fg-muted hover:text-fg"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="text-[13px] text-fg-muted underline hover:text-fg"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <section className="mt-14 border-t border-line pt-10">
          <p className="eyebrow text-fg-muted">Customers also added</p>
          <div className="rail -mx-5 mt-6 flex gap-5 overflow-x-auto px-5 pb-4">
            {suggestions.map((product) => (
              <div key={product.slug} className="w-[62vw] shrink-0 sm:w-[38vw] lg:w-[220px]">
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line p-7">
          <h2 className="font-display text-2xl">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-fg-muted">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-muted">Delivery</dt>
              <dd>{totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt>Total</dt>
              <dd className="font-display text-2xl">{formatPrice(totals.total)}</dd>
            </div>
            <div className="flex justify-between text-[13px] text-fg-muted">
              <dt>Includes VAT (5%)</dt>
              <dd>{formatPrice(totals.vat)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className={buttonClass("solid", "lg", "mt-7 w-full")}>
            Proceed to checkout
          </Link>
          <Link href="/shop" className={buttonClass("ghost", "sm", "mt-2 w-full")}>
            Continue shopping
          </Link>

          <ul className="mt-7 space-y-2.5 border-t border-line-soft pt-6 text-[13px] text-fg-muted">
            <li>Cash on delivery available in all seven emirates</li>
            <li>Free size exchange within {site.returnWindowDays} days</li>
            <li>
              Pay in {site.instalments} interest-free instalments with Tabby or Tamara at checkout
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
