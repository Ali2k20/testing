import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui";
import { deliveryDays, emirates, site } from "@/lib/site";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description:
    "Free UAE delivery over AED 300, cash on delivery in all seven emirates, and a free 14-day size exchange collected from your door.",
  alternates: { canonical: "/shipping-and-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Delivery & returns"
        title="How your order reaches you, and how to send it back"
        intro="We pack Sunday to Thursday from the Al Quoz studio. Orders placed on Friday or Saturday go out on Sunday morning."
      />

      <div className="mx-auto max-w-4xl px-5 py-16 lg:px-10">
        <section>
          <h2 className="font-display text-3xl">Delivery across the UAE</h2>
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-fg text-left">
                  <th className="py-3 pr-4 text-[13px] text-fg-muted">
                    Emirate
                  </th>
                  <th className="py-3 pr-4 text-[13px] text-fg-muted">
                    Standard
                  </th>
                  <th className="py-3 text-[13px] text-fg-muted">
                    Express
                  </th>
                </tr>
              </thead>
              <tbody>
                {emirates.map((emirate) => (
                  <tr key={emirate} className="border-b border-line-soft">
                    <td className="py-4 pr-4">{emirate}</td>
                    <td className="py-4 pr-4 text-fg-muted">{deliveryDays[emirate]}</td>
                    <td className="py-4 text-fg-muted">
                      {emirate === "Dubai" ? "Same day before 14:00" : "Next day"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-7 space-y-2.5 text-sm text-fg-muted">
            <li>
              Standard delivery is {formatPrice(site.standardShipping)}, free on orders over{" "}
              {formatPrice(site.freeShippingThreshold)}.
            </li>
            <li>Express delivery is {formatPrice(site.expressShipping)} to any emirate.</li>
            <li>
              Cash on delivery is available everywhere, with a {formatPrice(site.codFee)} handling
              fee collected by the courier.
            </li>
            <li>The courier calls before arriving. If you miss them, they retry the next day.</li>
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">Returns and exchanges</h2>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">
            You have {site.returnWindowDays} days from delivery. Message us, and we book a courier to
            collect from your address at no cost to you. A size exchange is free. A refund goes back
            to the original payment method within five working days of the piece reaching the studio,
            or as a bank transfer if you paid cash on delivery.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="border border-line p-6">
              <p className="eyebrow text-fg">We accept back</p>
              <ul className="mt-3 space-y-2 text-sm text-fg-muted">
                <li>Unworn pieces with the tag attached</li>
                <li>Anything that arrived faulty or not as described</li>
                <li>Wrong sizes, exchanged free of charge</li>
              </ul>
            </div>
            <div className="border border-line p-6">
              <p className="eyebrow text-fg">We cannot accept back</p>
              <ul className="mt-3 space-y-2 text-sm text-fg-muted">
                <li>Made-to-order pieces cut to your measurements</li>
                <li>Personalised or monogrammed items</li>
                <li>Underscarves and other close-fitting accessories, for hygiene</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-16 border border-line bg-panel p-8">
          <h2 className="font-display text-3xl">Start a return</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            Have your order reference ready — it looks like FRS-XXXXXXXX and is on your confirmation
            email. Message the studio and we will arrange collection, usually for the next working
            day.
          </p>
          <ButtonLink href="/contact" tone="solid" className="mt-6">
            Contact the studio
          </ButtonLink>
        </section>
      </div>
    </>
  );
}
