"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchDialog } from "./search-dialog";
import { useStore } from "@/lib/store";
import { site } from "@/lib/site";

const navigation = [
  { href: "/shop?category=abaya", label: "Abayas" },
  { href: "/shop?category=mukhawar", label: "Mukhawar" },
  { href: "/shop?category=kaftan", label: "Kaftans" },
  { href: "/collections/eid-capsule", label: "Eid Capsule" },
  { href: "/shop", label: "Shop All" },
  { href: "/about", label: "Our Story" },
];

export function SiteHeader() {
  const { count, openCart, wishlist } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-line bg-ivory/95 backdrop-blur" : "border-transparent bg-ivory"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:h-20 lg:px-10">
        <nav className="hidden flex-1 items-center gap-7 lg:flex" aria-label="Primary">
          {navigation.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="eyebrow link-underline text-ink-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center lg:hidden"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <Link href="/" className="shrink-0 text-center" aria-label={`${site.name} home`}>
          <span className="font-display text-3xl leading-none tracking-[0.4em] text-ink sm:text-4xl">
            FRS
          </span>
          <span className="mt-0.5 block text-[8px] tracking-[0.34em] text-ink-muted uppercase">
            Dubai
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-3">
          <Link
            href="/about"
            className="eyebrow link-underline hidden text-ink-soft hover:text-ink lg:block"
          >
            Our Story
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
            aria-label="Open search"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <Link
            href="/wishlist"
            className="relative flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
            aria-label={`Wishlist, ${wishlist.length} items`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
            </svg>
            {wishlist.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[9px] font-medium text-ivory">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="relative flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
            aria-label={`Open cart, ${count} items`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" />
            </svg>
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center bg-ink px-1 text-[9px] font-medium text-ivory">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 h-full w-[86%] max-w-sm bg-ivory p-7 transition-transform duration-400 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setMenuOpen(false)} className="font-display text-2xl tracking-[0.4em]">
              FRS
            </Link>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav className="mt-10 flex flex-col" aria-label="Mobile">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-line-soft py-4 font-display text-2xl font-light text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 space-y-3 text-xs text-ink-muted">
            <p>Free UAE delivery over AED {site.freeShippingThreshold}</p>
            <p>Cash on delivery in all seven emirates</p>
            <a className="link-underline block text-ink" href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`}>
              {site.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
