"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductArt } from "./product-art";
import { categoryLabels, products } from "@/lib/products";
import { formatPrice } from "@/lib/format";

const quickLinks = [
  { href: "/shop?category=abaya", label: "Abayas" },
  { href: "/shop?category=mukhawar", label: "Mukhawar" },
  { href: "/collections/ramadan-nights", label: "Ramadan Nights" },
  { href: "/collections/best-sellers", label: "Best Sellers" },
  { href: "/shop?sort=price-asc", label: "Under AED 500" },
];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    return products
      .filter((product) =>
        [
          product.name,
          product.arabicName,
          product.tagline,
          product.fabric,
          categoryLabels[product.category],
          ...product.colors.map((color) => color.label),
        ]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 6);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/65 animate-fade" onClick={close} />
      <div className="relative mx-auto mt-0 w-full max-w-3xl bg-ground p-6 shadow-2xl sm:mt-24 sm:p-10">
        <div className="flex items-center gap-4 border-b border-fg pb-4">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search abayas, mukhawar, colours…"
            className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-fg-muted/60"
            aria-label="Search products"
          />
          <button type="button" onClick={close} className="eyebrow text-fg-muted hover:text-fg">
            Close
          </button>
        </div>

        {results.length > 0 ? (
          <ul className="mt-6 divide-y divide-line-soft">
            {results.map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/product/${product.slug}`}
                  onClick={close}
                  className="flex items-center gap-4 py-3 hover:bg-panel/60"
                >
                  <div className="h-20 w-16 shrink-0 overflow-hidden bg-panel">
                    <ProductArt product={product} color={product.colors[0]} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg text-fg">{product.name}</p>
                    <p className="truncate text-[13px] text-fg-muted">{product.tagline}</p>
                  </div>
                  <span className="eyebrow shrink-0 text-fg">{formatPrice(product.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : query.trim().length >= 2 ? (
          <p className="mt-8 text-sm text-fg-muted">
            Nothing matched “{query}”. Try “crepe”, “pearl”, “olive” or “Ramadan”.
          </p>
        ) : (
          <div className="mt-8">
            <p className="eyebrow text-fg-muted">Popular right now</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="eyebrow border border-line px-4 py-2 text-fg-soft hover:border-fg hover:text-fg"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
