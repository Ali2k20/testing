"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "./products";
import { shippingFor, vatPortion } from "./format";
import { site } from "./site";
import type { CartLine, Product } from "./types";

const CART_KEY = "frs.cart.v1";
const WISHLIST_KEY = "frs.wishlist.v1";
const VIEWED_KEY = "frs.viewed.v1";

export function lineId(slug: string, color: string, size: string) {
  return `${slug}:${color}:${size}`;
}

export interface ResolvedLine extends CartLine {
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

interface StoreValue {
  ready: boolean;
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  addLine: (input: Omit<CartLine, "id">) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
  inWishlist: (slug: string) => boolean;
  recentlyViewed: string[];
  recordView: (slug: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The cart
    // still works for the current page view, it just will not persist.
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Hydrating persisted state has to happen after mount: reading localStorage
  // during render would desync the server and client markup. The lint rule below
  // targets cascading-render bugs, which a one-shot mount hydration is not.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setCart(readJson<CartLine[]>(CART_KEY, []));
    setWishlist(readJson<string[]>(WISHLIST_KEY, []));
    setRecentlyViewed(readJson<string[]>(VIEWED_KEY, []));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (ready) writeJson(CART_KEY, cart);
  }, [cart, ready]);

  useEffect(() => {
    if (ready) writeJson(WISHLIST_KEY, wishlist);
  }, [wishlist, ready]);

  useEffect(() => {
    if (ready) writeJson(VIEWED_KEY, recentlyViewed);
  }, [recentlyViewed, ready]);

  // Lock body scroll while the cart drawer is open.
  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cartOpen]);

  const addLine = useCallback((input: Omit<CartLine, "id">) => {
    const id = lineId(input.slug, input.color, input.size);
    setCart((current) => {
      const existing = current.find((line) => line.id === id);
      if (existing) {
        return current.map((line) =>
          line.id === id ? { ...line, quantity: line.quantity + input.quantity } : line,
        );
      }
      return [...current, { ...input, id }];
    });
    setCartOpen(true);
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, quantity } : line)),
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    setCart((current) => current.filter((line) => line.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [slug, ...current],
    );
  }, []);

  const recordView = useCallback((slug: string) => {
    setRecentlyViewed((current) => [slug, ...current.filter((s) => s !== slug)].slice(0, 8));
  }, []);

  const lines = useMemo<ResolvedLine[]>(() => {
    return cart.flatMap((line) => {
      const product = getProduct(line.slug);
      if (!product) return [];
      return [
        {
          ...line,
          product,
          unitPrice: product.price,
          lineTotal: product.price * line.quantity,
        },
      ];
    });
  }, [cart]);

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.lineTotal, 0),
    [lines],
  );

  const count = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      lines,
      count,
      subtotal,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      wishlist,
      toggleWishlist,
      inWishlist: (slug: string) => wishlist.includes(slug),
      recentlyViewed,
      recordView,
    }),
    [
      ready,
      lines,
      count,
      subtotal,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      cartOpen,
      wishlist,
      toggleWishlist,
      recentlyViewed,
      recordView,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside <StoreProvider>");
  return context;
}

/** Order maths shared by the cart drawer, cart page and checkout. */
export function orderTotals(subtotal: number, options: { express?: boolean; cod?: boolean } = {}) {
  const shipping = subtotal === 0 ? 0 : shippingFor(subtotal, Boolean(options.express));
  const codFee = options.cod && subtotal > 0 ? site.codFee : 0;
  const total = subtotal + shipping + codFee;
  return {
    subtotal,
    shipping,
    codFee,
    total,
    vat: vatPortion(total),
    amountToFreeShipping: Math.max(0, site.freeShippingThreshold - subtotal),
  };
}
