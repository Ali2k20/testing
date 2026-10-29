"use client";

import { useState } from "react";
import { buttonClass } from "./ui";

const topics = [
  "Sizing advice",
  "An existing order",
  "A return or exchange",
  "Made to order / bridal",
  "Book a studio visit",
  "Something else",
];

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState(topics[0]);

  if (sent) {
    return (
      <div className="border border-line bg-panel p-10 text-center">
        <p className="font-display text-3xl">Message received</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-fg-muted">
          A person from the studio will reply, usually within one working day. If it is urgent,
          WhatsApp is faster.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // No mail backend in this build — wire this to your provider of choice.
        setSent(true);
      }}
      className="space-y-5"
    >
      <label className="block">
        <span className="eyebrow text-fg-muted">What is it about?</span>
        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="mt-2 w-full border border-line bg-ground px-4 py-3 text-sm outline-none focus:border-fg"
        >
          {topics.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow text-fg-muted">Name</span>
          <input
            required
            className="mt-2 w-full border border-line bg-ground px-4 py-3 text-sm outline-none focus:border-fg"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="eyebrow text-fg-muted">Email</span>
          <input
            type="email"
            required
            className="mt-2 w-full border border-line bg-ground px-4 py-3 text-sm outline-none focus:border-fg"
            autoComplete="email"
          />
        </label>
      </div>

      <label className="block">
        <span className="eyebrow text-fg-muted">Message</span>
        <textarea
          required
          rows={5}
          placeholder={
            topic === "Sizing advice"
              ? "My height is ___ cm and I usually wear a size ___"
              : "Tell us what you need"
          }
          className="mt-2 w-full border border-line bg-ground px-4 py-3 text-sm outline-none focus:border-fg placeholder:text-fg-muted/60"
        />
      </label>

      <button type="submit" className={buttonClass("solid", "lg", "w-full")}>
        Send message
      </button>
    </form>
  );
}
