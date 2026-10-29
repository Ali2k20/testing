import { site } from "@/lib/site";
import { formatPrice } from "@/lib/format";

const points = [
  {
    title: "Free UAE delivery",
    body: `On every order over ${formatPrice(site.freeShippingThreshold)}. Next day in Dubai.`,
  },
  {
    title: "Cash on delivery",
    body: "Pay the courier at your door, in all seven emirates.",
  },
  {
    title: `${site.returnWindowDays}-day free returns`,
    body: "Wrong size? We collect it and send the right one, free.",
  },
  {
    title: "Made in the UAE",
    body: "Cut, sewn and finished in our Al Quoz studio.",
  },
];

export function TrustBar({ tone = "sand" }: { tone?: "sand" | "ivory" }) {
  return (
    <section className={tone === "sand" ? "bg-panel" : "bg-ground"} aria-label="Why shop with FRS">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        {points.map((point) => (
          <div key={point.title}>
            <p className="text-base font-medium text-fg">{point.title}</p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-fg-soft">{point.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
