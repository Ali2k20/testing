import { site } from "@/lib/site";
import { formatPrice } from "@/lib/format";

const points = [
  {
    title: "Free UAE delivery",
    body: `On every order over ${formatPrice(site.freeShippingThreshold)}. Next day in Dubai.`,
    icon: (
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    ),
  },
  {
    title: "Cash on delivery",
    body: "Pay the courier at your door, in all seven emirates.",
    icon: <path d="M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  },
  {
    title: `${site.returnWindowDays}-day free returns`,
    body: "Wrong size? We collect it and send the right one, free.",
    icon: <path d="M4 9h11a5 5 0 0 1 0 10H9M4 9l4-4M4 9l4 4" />,
  },
  {
    title: "Made in the UAE",
    body: "Cut, sewn and finished in our Al Quoz studio.",
    icon: <path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6" />,
  },
];

export function TrustBar({ tone = "sand" }: { tone?: "sand" | "ivory" }) {
  return (
    <section
      className={`border-y border-line ${tone === "sand" ? "bg-sand" : "bg-ivory"}`}
      aria-label="Why shop with FRS"
    >
      <div className="mx-auto grid max-w-[1400px] gap-px bg-line px-0 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((point) => (
          <div
            key={point.title}
            className={`flex gap-4 px-6 py-7 lg:px-8 ${tone === "sand" ? "bg-sand" : "bg-ivory"}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 text-gold"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {point.icon}
            </svg>
            <div>
              <p className="text-sm font-medium text-ink">{point.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{point.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
