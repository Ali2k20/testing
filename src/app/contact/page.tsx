import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PageHeader } from "@/components/page-header";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact the studio",
  description:
    "Sizing advice, order help, bridal appointments and studio visits — reach FRS by WhatsApp, phone or email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Talk to a person"
        title="Contact the studio"
        intro="No chatbots. Messages go to the same team that cuts and packs the garments, Sunday to Thursday, 10:00 to 19:00."
      />

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:px-10">
        <div className="space-y-10">
          <section>
            <p className="eyebrow text-fg">Fastest</p>
            <a
              href={whatsappLink("Hi FRS, I have a question.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block font-display text-3xl underline decoration-1 underline-offset-4"
            >
              WhatsApp us
            </a>
            <p className="mt-2 text-sm text-fg-muted">
              Typical reply within the hour on working days.
            </p>
          </section>

          <section>
            <p className="eyebrow text-fg">Email</p>
            <a
              href={`mailto:${site.email}`}
              className="mt-3 block font-display text-3xl underline decoration-1 underline-offset-4"
            >
              {site.email}
            </a>
            <p className="mt-2 text-sm text-fg-muted">We reply within one working day.</p>
          </section>

          <section>
            <p className="eyebrow text-fg">Phone</p>
            <a
              href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`}
              className="mt-3 block font-display text-3xl underline decoration-1 underline-offset-4"
            >
              {site.phoneDisplay}
            </a>
          </section>

          <section>
            <p className="eyebrow text-fg">Studio</p>
            <address className="mt-3 space-y-0.5 text-sm not-italic text-fg-muted">
              {site.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
            <p className="mt-3 text-sm text-fg-muted">
              Sunday to Thursday, 10:00 – 19:00. Closed Friday and Saturday. Parking behind the
              warehouse.
            </p>
          </section>
        </div>

        <div>
          <ContactForm />
        </div>
      </div>
    </>
  );
}
