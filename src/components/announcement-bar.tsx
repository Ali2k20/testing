import { site } from "@/lib/site";
import { formatPrice } from "@/lib/format";

const messages = [
  `Free UAE delivery over ${formatPrice(site.freeShippingThreshold)}`,
  "Cash on delivery in all seven emirates",
  `${site.returnWindowDays}-day returns and free size exchanges`,
];

export function AnnouncementBar() {
  return (
    <div className="bg-panel px-5 py-2.5 text-center text-[13px] text-fg-soft">
      <p className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-center gap-x-6 gap-y-1">
        {messages.map((message, index) => (
          <span key={message} className={index > 0 ? "hidden md:inline" : undefined}>
            {message}
          </span>
        ))}
      </p>
    </div>
  );
}
