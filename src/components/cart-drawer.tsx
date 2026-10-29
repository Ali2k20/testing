"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ProductArt } from "./product-art";
import { buttonClass } from "./ui";
import { colorByName } from "@/lib/palette";
import { formatPrice } from "@/lib/format";
import { orderTotals, useStore, type ResolvedLine } from "@/lib/store";
import { site } from "@/lib/site";

export function CartDrawer() {
  const { cartOpen, closeCart, lines, subtotal, count } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const totals = orderTotals(subtotal);
  const progress = Math.min(100, (subtotal / site.freeShippingThreshold) * 100);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, closeCart]);

  return (
    <div
      className={`fixed inset-0 z-[70] ${cartOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!cartOpen}
    >
      <div
        className={`absolute inset-0 bg-black/65 transition-opacity duration-300 ${
          cartOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Shopping bag"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ground outline-none transition-transform duration-400 ease-out ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-6 py-5">
          <h2 className="font-display text-2xl">
            Your bag {count > 0 && <span className="text-fg-muted">({count})</span>}
          </h2>
          <button type="button" onClick={closeCart} aria-label="Close bag" className="p-1.5">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {lines.length > 0 && (
          <div className="bg-panel px-6 py-4">
            {totals.amountToFreeShipping > 0 ? (
              <p className="text-[13px] text-fg-soft">
                You are <strong>{formatPrice(totals.amountToFreeShipping)}</strong> away from free UAE
                delivery.
              </p>
            ) : (
              <p className="text-[13px] text-fg-soft">
                <strong>Free UAE delivery unlocked.</strong> Dubai orders arrive next day.
              </p>
            )}
            <div className="mt-2.5 h-[3px] w-full bg-line">
              <div
                className="h-full bg-talli transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <p className="font-display text-2xl text-fg">Your bag is empty</p>
              <p className="max-w-xs text-sm text-fg-muted">
                Start with the Noor Open Abaya — it is the first piece four out of five customers buy.
              </p>
              <Link href="/shop" onClick={closeCart} className={buttonClass("solid", "md")}>
                Shop the collection
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line-soft">
              {lines.map((line) => (
                <CartRow key={line.id} line={line} />
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <footer className="bg-panel px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow text-fg-muted">Subtotal</span>
              <span className="font-display text-2xl">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-[13px] text-fg-muted">
              Delivery and any cash-on-delivery fee are calculated at checkout. VAT included.
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className={buttonClass("solid", "lg", "mt-4 w-full")}
            >
              Checkout · {formatPrice(subtotal)}
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className={buttonClass("ghost", "sm", "mt-2 w-full")}
            >
              View full bag
            </Link>
          </footer>
        )}
      </div>
    </div>
  );
}

function CartRow({ line }: { line: ResolvedLine }) {
  const { setQuantity, removeLine } = useStore();
  const color = colorByName(line.color) ?? line.product.colors[0];

  return (
    <li className="flex gap-4 py-5">
      <Link href={`/product/${line.product.slug}`} className="h-28 w-22 shrink-0 overflow-hidden bg-panel">
        <ProductArt product={line.product} color={color} className="h-full w-full" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-tight">{line.product.name}</p>
            <p className="mt-0.5 text-[13px] text-fg-muted">
              {color.label} · Size {line.size}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeLine(line.id)}
            className="shrink-0 text-[13px] text-fg-muted underline hover:text-fg"
          >
            Remove
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQuantity(line.id, line.quantity - 1)}
              className="px-2.5 py-1 text-fg-muted hover:text-fg"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-7 text-center text-[13px]">{line.quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(line.id, line.quantity + 1)}
              className="px-2.5 py-1 text-fg-muted hover:text-fg"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="text-sm">{formatPrice(line.lineTotal)}</span>
        </div>
      </div>
    </li>
  );
}
