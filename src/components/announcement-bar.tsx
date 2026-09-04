import { site } from "@/lib/site";
import { formatPrice } from "@/lib/format";

const messages = [
  `Free UAE delivery on orders over ${formatPrice(site.freeShippingThreshold)}`,
  "Cash on delivery available across all seven emirates",
  `${site.returnWindowDays}-day free returns — exchange sizes at no cost`,
  `Pay in ${site.instalments} interest-free instalments with Tabby or Tamara`,
  "Cut, sewn and finished in Al Quoz, Dubai",
];

export function AnnouncementBar() {
  // Duplicated once so the marquee loops without a visible seam.
  const track = [...messages, ...messages];
  return (
    <div className="overflow-hidden bg-ink py-2.5 text-ivory">
      <div className="flex w-max animate-marquee">
        {track.map((message, index) => (
          <span key={index} className="eyebrow flex shrink-0 items-center gap-8 px-8 opacity-90">
            {message}
            <span className="text-gold-soft" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
