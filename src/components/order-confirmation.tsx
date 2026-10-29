"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { buttonClass } from "./ui";
import { formatPrice } from "@/lib/format";
import { products } from "@/lib/products";
import { site, whatsappLink } from "@/lib/site";

interface StoredOrder {
  reference: string;
  placedAt: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  delivery: { address: string; area: string; emirate: string; express: boolean; eta: string };
  payment: string;
  lines: { name: string; slug: string; color: string; size: string; quantity: number; lineTotal: number }[];
  totals: { subtotal: number; shipping: number; codFee: number; discount: number; total: number; vat: number };
}

const paymentLabels: Record<string, string> = {
  card: "Card",
  cod: "Cash on delivery",
  instalments: "Tabby / Tamara instalments",
  applepay: "Apple Pay",
};

export function OrderConfirmation() {
  const params = useSearchParams();
  const reference = params.get("ref");
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Same as the cart store: the receipt lives in sessionStorage, which can only
  // be read once the component is on the client.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!reference) {
      setLoaded(true);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(`frs.order.${reference}`);
      if (raw) setOrder(JSON.parse(raw) as StoredOrder);
    } catch {
      // Receipt details are unavailable — the reference alone is still shown.
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [reference]);

  const suggestions = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 4);

  if (!loaded) return null;

  if (!reference) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-24 text-center lg:px-10">
        <p className="font-display text-4xl">No order to show</p>
        <p className="mx-auto mt-4 max-w-md text-sm text-fg-muted">
          This page shows a receipt straight after checkout. If you are looking for an existing
          order, message us with your reference and we will pull it up.
        </p>
        <Link href="/shop" className={buttonClass("solid", "lg", "mt-8")}>
          Back to the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-talli text-talli">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <p className="eyebrow mt-6 text-fg-muted">Order placed</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">
          Shukran{order ? `, ${order.customer.firstName}` : ""}.
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-fg-muted">
          Your reference is{" "}
          <strong className=" text-fg">{reference}</strong>. We have emailed a
          confirmation
          {order ? ` to ${order.customer.email}` : ""}. Our studio packs orders Sunday to Thursday.
        </p>
        {order && (
          <p className="mt-3 text-sm text-fg-soft">
            Arriving <strong>{order.delivery.express ? "same or next day" : order.delivery.eta}</strong>{" "}
            to {order.delivery.area}, {order.delivery.emirate}.
          </p>
        )}
      </div>

      {order && (
        <div className="mx-auto mt-14 max-w-2xl border border-line p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-soft pb-4">
            <h2 className="font-display text-2xl">Receipt</h2>
            <span className="text-[13px] text-fg-muted">
              {paymentLabels[order.payment] ?? order.payment}
            </span>
          </div>

          <ul className="divide-y divide-line-soft">
            {order.lines.map((line) => (
              <li key={`${line.slug}-${line.color}-${line.size}`} className="flex justify-between gap-4 py-4">
                <div>
                  <Link href={`/product/${line.slug}`} className="link-underline text-sm">
                    {line.name}
                  </Link>
                  <p className="text-[13px] text-fg-muted">
                    {line.color} · Size {line.size} · Qty {line.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm">{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2.5 border-t border-line-soft pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-fg-muted">Subtotal</dt>
              <dd>{formatPrice(order.totals.subtotal)}</dd>
            </div>
            {order.totals.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-fg-muted">Discount</dt>
                <dd>− {formatPrice(order.totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-fg-muted">Delivery</dt>
              <dd>{order.totals.shipping === 0 ? "Free" : formatPrice(order.totals.shipping)}</dd>
            </div>
            {order.totals.codFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-fg-muted">Cash-on-delivery fee</dt>
                <dd>{formatPrice(order.totals.codFee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3">
              <dt>Total paid</dt>
              <dd className="font-display text-2xl">{formatPrice(order.totals.total)}</dd>
            </div>
            <div className="flex justify-between text-[13px] text-fg-muted">
              <dt>Includes VAT (5%)</dt>
              <dd>{formatPrice(order.totals.vat)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-3">
        <a
          href={whatsappLink(`Hi ${site.name}, I have a question about order ${reference}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "md")}
        >
          Ask about this order
        </a>
        <Link href="/shop" className={buttonClass("solid", "md")}>
          Keep shopping
        </Link>
      </div>

      <section className="mt-20 border-t border-line pt-14">
        <p className="eyebrow text-center text-fg-muted">Customers usually add these next</p>
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {suggestions.map((product) => (
            <ProductCard key={product.slug} product={product} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
