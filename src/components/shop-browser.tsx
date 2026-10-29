"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ProductCard } from "./product-card";
import { buttonClass } from "./ui";
import { categoryLabels, categoryOrder, products, ratingFor, totalStock } from "@/lib/products";
import { collections } from "@/lib/collections";
import { colorOrder, palette } from "@/lib/palette";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Best rated" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

const priceBands = [
  { value: "under-500", label: "Under AED 500", test: (p: Product) => p.price < 500 },
  { value: "500-900", label: "AED 500 – 900", test: (p: Product) => p.price >= 500 && p.price <= 900 },
  { value: "900-1500", label: "AED 900 – 1,500", test: (p: Product) => p.price > 900 && p.price <= 1500 },
  { value: "over-1500", label: "Over AED 1,500", test: (p: Product) => p.price > 1500 },
];

const allSizes = Array.from(
  new Set(products.flatMap((product) => product.sizes.map((size) => size.label))),
).sort((a, b) => (Number(a) && Number(b) ? Number(a) - Number(b) : a.localeCompare(b)));

export function ShopBrowser() {
  const router = useRouter();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get("category") ?? "";
  const collection = params.get("collection") ?? "";
  const color = params.get("color") ?? "";
  const size = params.get("size") ?? "";
  const price = params.get("price") ?? "";
  const sort = (params.get("sort") ?? "featured") as SortValue;

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && next.get(key) !== value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      const query = next.toString();
      router.replace(query ? `/shop?${query}` : "/shop", { scroll: false });
    },
    [params, router],
  );

  const activeCount = [category, collection, color, size, price].filter(Boolean).length;

  const results = useMemo(() => {
    const band = priceBands.find((item) => item.value === price);
    const filtered = products.filter((product) => {
      if (category && product.category !== category) return false;
      if (collection && !product.collections.includes(collection)) return false;
      if (color && !product.colors.some((option) => option.name === color)) return false;
      if (size && !product.sizes.some((option) => option.label === size && option.stock > 0)) {
        return false;
      }
      if (band && !band.test(product)) return false;
      return true;
    });

    const sorted = [...filtered];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => +new Date(b.releasedAt) - +new Date(a.releasedAt));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => ratingFor(b).average - ratingFor(a).average);
        break;
      default:
        sorted.sort((a, b) => b.popularity - a.popularity);
    }
    return sorted;
  }, [category, collection, color, size, price, sort]);

  const availableColors = colorOrder.filter((key) =>
    products.some((product) => product.colors.some((option) => option.name === key)),
  );

  const filterPanel = (
    <div className="space-y-9">
      <FilterGroup title="Category">
        {categoryOrder.map((value) => (
          <FilterChip
            key={value}
            active={category === value}
            onClick={() => setParam("category", value)}
          >
            {categoryLabels[value]}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Collection">
        {collections.map((item) => (
          <FilterChip
            key={item.slug}
            active={collection === item.slug}
            onClick={() => setParam("collection", item.slug)}
          >
            {item.name}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {availableColors.map((key) => {
            const option = palette[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setParam("color", key)}
                title={option.label}
                aria-label={option.label}
                aria-pressed={color === key}
                className={`h-8 w-8 rounded-full border transition-all ${
                  color === key
                    ? "border-fg ring-1 ring-fg ring-offset-2 ring-offset-ground"
                    : "border-line hover:border-fg-muted"
                }`}
                style={{ backgroundColor: option.hex }}
              />
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Size in stock">
        {allSizes.map((value) => (
          <FilterChip key={value} active={size === value} onClick={() => setParam("size", value)}>
            {value}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        {priceBands.map((band) => (
          <FilterChip
            key={band.value}
            active={price === band.value}
            onClick={() => setParam("price", band.value)}
          >
            {band.label}
          </FilterChip>
        ))}
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => router.replace("/shop", { scroll: false })}
          className="eyebrow text-fg-muted underline hover:text-fg"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 lg:px-10">
      <div className="flex flex-col gap-4 border-b border-line py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">
          <span className="text-fg">{results.length}</span>{" "}
          {results.length === 1 ? "piece" : "pieces"}
          {activeCount > 0 && " matching your filters"}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={buttonClass("outline", "sm", "lg:hidden")}
          >
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <label className="flex items-center gap-2 text-[13px] text-fg-muted">
            <span className="eyebrow">Sort</span>
            <select
              value={sort}
              onChange={(event) => setParam("sort", event.target.value)}
              className="border border-line bg-ground px-3 py-2 text-[13px] text-fg outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-10 pt-10 lg:grid-cols-[220px_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-28">{filterPanel}</div>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="border border-line-soft bg-panel px-8 py-20 text-center">
              <p className="font-display text-3xl">Nothing matches that combination</p>
              <p className="mx-auto mt-3 max-w-md text-sm text-fg-muted">
                Try clearing a filter, or message us on WhatsApp — we often have unlisted stock and
                can make most pieces to order.
              </p>
              <button
                type="button"
                onClick={() => router.replace("/shop", { scroll: false })}
                className={buttonClass("solid", "md", "mt-7")}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((product, index) => (
                <ProductCard key={product.slug} product={product} priority={index < 3} />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <p className="mt-14 border-t border-line-soft pt-8 text-center text-[13px] text-fg-muted">
              Showing {results.length} of {products.length} pieces. Total stock across the studio:{" "}
              {products.reduce((sum, product) => sum + totalStock(product), 0)} garments. Prices in
              AED, VAT included, from {formatPrice(Math.min(...products.map((p) => p.price)))}.
            </p>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div className={`fixed inset-0 z-[65] lg:hidden ${filtersOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/65 transition-opacity duration-300 ${
            filtersOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setFiltersOpen(false)}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto bg-ground p-6 transition-transform duration-400 ease-out ${
            filtersOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mb-7 flex items-center justify-between">
            <p className="font-display text-2xl">Filters</p>
            <button type="button" onClick={() => setFiltersOpen(false)} className="eyebrow text-fg-muted">
              Done
            </button>
          </div>
          {filterPanel}
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className={buttonClass("solid", "lg", "mt-8 w-full")}
          >
            Show {results.length} {results.length === 1 ? "piece" : "pieces"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3.5 text-fg">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3 py-1.5 text-[13px] transition-colors ${
        active
          ? "border-fg bg-fg text-ground"
          : "border-line text-fg-soft hover:border-fg-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
