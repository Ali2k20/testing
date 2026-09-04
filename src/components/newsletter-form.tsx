"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "panel" }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className={variant === "panel" ? "text-ivory" : "text-ink"}>
        <p className="font-display text-2xl font-light">You are on the list.</p>
        <p className="mt-2 text-sm opacity-80">
          Use code <strong className="tracking-widest">{site.newsletterCode}</strong> for{" "}
          {formatPrice(site.newsletterDiscount)} off your first order.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // No backend in this build — the flow is wired end to end so the
        // integration point is a single fetch away.
        if (email.includes("@")) setDone(true);
      }}
      className="w-full"
    >
      <label
        htmlFor={`newsletter-${variant}`}
        className={`eyebrow block ${variant === "panel" ? "text-gold-soft" : "text-ink"}`}
      >
        {formatPrice(site.newsletterDiscount)} off your first order
      </label>
      <div
        className={`mt-3 flex border-b ${
          variant === "panel" ? "border-ivory/40" : "border-ink"
        }`}
      >
        <input
          id={`newsletter-${variant}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          className={`w-full bg-transparent py-2 text-sm outline-none ${
            variant === "panel"
              ? "text-ivory placeholder:text-ivory/50"
              : "text-ink placeholder:text-ink-muted/70"
          }`}
        />
        <button
          type="submit"
          className={`eyebrow shrink-0 px-3 ${variant === "panel" ? "text-ivory" : "text-ink"}`}
        >
          Join
        </button>
      </div>
      <p
        className={`mt-2 text-[11px] ${
          variant === "panel" ? "text-ivory/60" : "text-ink-muted"
        }`}
      >
        New drops and restocks only. Unsubscribe any time.
      </p>
    </form>
  );
}
