"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { ProductArt } from "./product-art";
import { buttonClass } from "./ui";
import { colorByName } from "@/lib/palette";
import { formatPrice, orderReference, vatPortion } from "@/lib/format";
import { orderTotals, useStore } from "@/lib/store";
import { deliveryDays, emirates, site, whatsappLink, type Emirate } from "@/lib/site";

type PaymentMethod = "card" | "cod" | "instalments" | "applepay";

const paymentMethods: { value: PaymentMethod; label: string; note: string }[] = [
  { value: "card", label: "Card", note: "Visa, Mastercard. Secured by 3-D Secure." },
  {
    value: "cod",
    label: "Cash on delivery",
    note: `Pay the courier at your door. ${formatPrice(site.codFee)} handling fee.`,
  },
  {
    value: "instalments",
    label: "Tabby or Tamara",
    note: `Split into ${site.instalments} interest-free payments.`,
  },
  { value: "applepay", label: "Apple Pay", note: "One tap, no card details to type." },
];

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, clearCart, ready } = useStore();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [emirate, setEmirate] = useState<Emirate>("Dubai");
  const [notes, setNotes] = useState("");
  const [express, setExpress] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const discount = appliedPromo ? site.newsletterDiscount : 0;
  const totals = useMemo(
    () => orderTotals(Math.max(0, subtotal - discount), { express, cod: payment === "cod" }),
    [subtotal, discount, express, payment],
  );

  function applyPromo() {
    if (promo.trim().toUpperCase() === site.newsletterCode) {
      setAppliedPromo(site.newsletterCode);
      setPromoError(null);
    } else {
      setAppliedPromo(null);
      setPromoError("That code is not recognised. Try FRS50 for your first order.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lines.length === 0) return;
    setSubmitting(true);

    const reference = orderReference();
    const order = {
      reference,
      placedAt: new Date().toISOString(),
      customer: { firstName, lastName, email, phone },
      delivery: { address, area, emirate, express, notes, eta: deliveryDays[emirate] },
      payment,
      promo: appliedPromo,
      lines: lines.map((line) => ({
        name: line.product.name,
        slug: line.product.slug,
        color: colorByName(line.color)?.label ?? line.color,
        size: line.size,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      totals: { ...totals, discount, vat: vatPortion(totals.total) },
    };

    try {
      // No payment gateway is wired in this build; the order is handed to the
      // confirmation page so the full flow is verifiable end to end.
      window.sessionStorage.setItem(`frs.order.${reference}`, JSON.stringify(order));
    } catch {
      // Session storage unavailable — the confirmation page falls back to a
      // reference-only receipt.
    }

    clearCart();
    router.push(`/order-confirmed?ref=${reference}`);
  }

  if (!ready) {
    return <p className="mx-auto max-w-[1400px] px-5 py-24 text-sm text-ink-muted lg:px-10">Loading…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10">
        <div className="border border-line-soft bg-sand px-8 py-20 text-center">
          <p className="font-display text-4xl font-light">There is nothing to check out</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-ink-muted">
            Add a piece to your bag and come back — it will still be here.
          </p>
          <Link href="/shop" className={buttonClass("solid", "lg", "mt-8")}>
            Shop the collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto grid max-w-[1400px] gap-12 px-5 pb-24 pt-8 lg:grid-cols-[1.5fr_1fr] lg:gap-16 lg:px-10"
    >
      <div className="space-y-12">
        <Fieldset legend="Contact" step={1}>
          <Field label="Email" hint="We send the order confirmation and tracking here.">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className={inputClass}
              autoComplete="email"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name">
              <input
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClass}
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name">
              <input
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClass}
                autoComplete="family-name"
              />
            </Field>
          </div>
          <Field label="Mobile number" hint="The courier will call before arriving.">
            <input
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+971 50 000 0000"
              className={inputClass}
              autoComplete="tel"
            />
          </Field>
        </Fieldset>

        <Fieldset legend="Delivery address" step={2}>
          <Field label="Building, street" >
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Villa 12, Street 4a"
              className={inputClass}
              autoComplete="street-address"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Area">
              <input
                required
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="Jumeirah 1"
                className={inputClass}
                autoComplete="address-level2"
              />
            </Field>
            <Field label="Emirate">
              <select
                value={emirate}
                onChange={(event) => setEmirate(event.target.value as Emirate)}
                className={inputClass}
              >
                {emirates.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Delivery notes" hint="Optional — gate code, landmark, best time to call.">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>
        </Fieldset>

        <Fieldset legend="Delivery speed" step={3}>
          <div className="space-y-3">
            <Choice
              checked={!express}
              onChange={() => setExpress(false)}
              title={`Standard — ${deliveryDays[emirate]}`}
              note={
                totals.subtotal >= site.freeShippingThreshold
                  ? "Free on this order"
                  : `${formatPrice(site.standardShipping)}, or free over ${formatPrice(site.freeShippingThreshold)}`
              }
            />
            <Choice
              checked={express}
              onChange={() => setExpress(true)}
              title="Express — same day in Dubai, next day elsewhere"
              note={`${formatPrice(site.expressShipping)} · order before 14:00`}
            />
          </div>
        </Fieldset>

        <Fieldset legend="Payment" step={4}>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Choice
                key={method.value}
                checked={payment === method.value}
                onChange={() => setPayment(method.value)}
                title={method.label}
                note={method.note}
              />
            ))}
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">
            This storefront runs without a live payment gateway. Placing the order records it and
            takes you to a confirmation — connect Stripe, Checkout.com or Network International to
            take real payments.
          </p>
        </Fieldset>

        <button type="submit" disabled={submitting} className={buttonClass("solid", "lg", "w-full")}>
          {submitting ? "Placing your order…" : `Place order · ${formatPrice(totals.total)}`}
        </button>

        <p className="text-center text-xs text-ink-muted">
          By placing this order you agree to our{" "}
          <Link href="/shipping-and-returns" className="underline">
            delivery and returns terms
          </Link>
          . Need help?{" "}
          <a
            href={whatsappLink("Hi FRS, I need help with my checkout.")}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Message us on WhatsApp
          </a>
          .
        </p>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line p-7">
          <h2 className="font-display text-2xl font-light">
            Your order <span className="text-ink-muted">({lines.length})</span>
          </h2>

          <ul className="mt-6 divide-y divide-line-soft">
            {lines.map((line) => {
              const color = colorByName(line.color) ?? line.product.colors[0];
              return (
                <li key={line.id} className="flex gap-4 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
                    <ProductArt product={line.product} color={color} className="h-full w-full" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-ivory">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{line.product.name}</p>
                    <p className="text-[11px] text-ink-muted">
                      {color.label} · {line.size}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm">{formatPrice(line.lineTotal)}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 border-t border-line-soft pt-5">
            <label className="eyebrow text-ink" htmlFor="promo">
              Discount code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="promo"
                value={promo}
                onChange={(event) => setPromo(event.target.value)}
                placeholder={site.newsletterCode}
                className={`${inputClass} flex-1`}
              />
              <button type="button" onClick={applyPromo} className={buttonClass("outline", "sm")}>
                Apply
              </button>
            </div>
            {appliedPromo && (
              <p className="mt-2 text-xs text-olive">
                {appliedPromo} applied — {formatPrice(site.newsletterDiscount)} off.
              </p>
            )}
            {promoError && <p className="mt-2 text-xs text-[#8E2C33]">{promoError}</p>}
          </div>

          <dl className="mt-6 space-y-2.5 border-t border-line-soft pt-5 text-sm">
            <Row term="Subtotal" value={formatPrice(subtotal)} />
            {discount > 0 && <Row term="Discount" value={`− ${formatPrice(discount)}`} />}
            <Row
              term={express ? "Express delivery" : "Delivery"}
              value={totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}
            />
            {totals.codFee > 0 && (
              <Row term="Cash-on-delivery fee" value={formatPrice(totals.codFee)} />
            )}
            <div className="flex justify-between border-t border-line pt-3">
              <dt>Total</dt>
              <dd className="font-display text-2xl">{formatPrice(totals.total)}</dd>
            </div>
            <Row term="Includes VAT (5%)" value={formatPrice(totals.vat)} muted />
          </dl>

          <p className="mt-5 text-xs leading-relaxed text-ink-muted">
            Arriving <strong className="text-ink">{express ? "same or next day" : deliveryDays[emirate]}</strong>{" "}
            to {emirate}. Free size exchange within {site.returnWindowDays} days.
          </p>
        </div>
      </aside>
    </form>
  );
}

const inputClass =
  "w-full border border-line bg-ivory px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-ink placeholder:text-ink-muted/60";

function Fieldset({
  legend,
  step,
  children,
}: {
  legend: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-5 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink text-xs">
          {step}
        </span>
        <span className="font-display text-2xl font-light">{legend}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-ink-muted">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-[11px] text-ink-muted">{hint}</span>}
    </label>
  );
}

function Choice({
  checked,
  onChange,
  title,
  note,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  note: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3.5 border p-4 transition-colors ${
        checked ? "border-ink bg-sand" : "border-line hover:border-ink-muted"
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-[#14110e]"
      />
      <span>
        <span className="block text-sm text-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-muted">{note}</span>
      </span>
    </label>
  );
}

function Row({ term, value, muted }: { term: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-xs text-ink-muted" : ""}`}>
      <dt className={muted ? "" : "text-ink-muted"}>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}
