"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "panel" }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className={variant === "panel" ? "text-ground" : "text-fg"}>
        <p className="font-display text-2xl">You are on the list.</p>
        <p className="mt-2 text-sm opacity-80">
          Use code <strong className="">{site.newsletterCode}</strong> for{" "}
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
        className={`eyebrow block ${variant === "panel" ? "text-talli-soft" : "text-fg"}`}
      >
        {formatPrice(site.newsletterDiscount)} off your first order
      </label>
      <div className="mt-3 flex">
        <input
          id={`newsletter-${variant}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          className={`w-full border-b bg-transparent py-2 text-base outline-none ${
            variant === "panel"
              ? "border-ground/40 text-ground placeholder:text-ground/60"
              : "border-fg-muted text-fg placeholder:text-fg-muted"
          }`}
        />
        <button
          type="submit"
          className={`min-h-11 shrink-0 px-3 font-medium ${variant === "panel" ? "text-ground" : "text-fg"}`}
        >
          Join
        </button>
      </div>
      <p
        className={`mt-2 text-[13px] ${
          variant === "panel" ? "text-ground/60" : "text-fg-muted"
        }`}
      >
        New drops and restocks only. Unsubscribe any time.
      </p>
    </form>
  );
}
