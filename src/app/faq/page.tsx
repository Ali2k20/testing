import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Delivery times, cash on delivery, returns, made-to-order pieces, fabric care and studio visits — answered.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  {
    question: "How long does delivery take?",
    answer: `Next day in Dubai, one to two working days in Abu Dhabi, Sharjah and Ajman, and two to three days in Umm Al Quwain, Ras Al Khaimah and Fujairah. Delivery is free over ${formatPrice(site.freeShippingThreshold)} and ${formatPrice(site.standardShipping)} below that. Express is ${formatPrice(site.expressShipping)} and reaches most Dubai addresses the same day if you order before 14:00.`,
  },
  {
    question: "Can I pay cash on delivery?",
    answer: `Yes, in all seven emirates. There is a ${formatPrice(site.codFee)} handling fee, which the courier collects along with the order total. We also take Visa, Mastercard, Apple Pay, and Tabby or Tamara if you want to split it into ${site.instalments} interest-free payments.`,
  },
  {
    question: "What if the size is wrong?",
    answer: `We collect it and send the right size, free, within ${site.returnWindowDays} days of delivery. The piece needs to be unworn with the tag still attached. Made-to-order and personalised pieces are the exception — those are cut to your measurements, so we cannot resell them.`,
  },
  {
    question: "Do you make pieces to order?",
    answer: "Yes, on selected styles — the Zahra Embroidered Abaya, the Aseel Zari Mukhawar and the Lulwa Bridal Kaftan are all made to your measurements at no extra cost. Allow ten to fourteen days for embroidered abayas, three to four weeks for a full zari mukhawar, and five to six weeks for bridal. Rush service is available; message us.",
  },
  {
    question: "Are your abayas see-through in sunlight?",
    answer: "No. Every fabric we buy is tested against direct sun before we cut it, and anything sheer is either lined or rejected. It is the single most common complaint about abayas bought online, and it is the first thing we check.",
  },
  {
    question: "Is the talli really hand-made?",
    answer: "Yes. It is braided by hand by an artisan cooperative in the Northern Emirates, roughly eleven metres per garment. Each length varies slightly because a person made it. A share of every Talli Heritage Mukhawar sale goes back to the cooperative.",
  },
  {
    question: "Can I visit the studio?",
    answer: `Please do. We are in Alserkal Avenue, Al Quoz 1, open Sunday to Thursday from 10:00 to 19:00. You can try as many sizes as you like and leave with nothing — we would rather that than a return. Book ahead through the contact page and we will have your sizes ready.`,
  },
  {
    question: "How should I wash an abaya?",
    answer: "It depends on the fabric, and every product page says which. Broadly: crepe and cotton pieces are machine washable cold, satin and anything embroidered or pearled is dry clean only. Never tumble dry a pleated piece.",
  },
  {
    question: "Do you ship outside the UAE?",
    answer: "Not yet through the site. We do ship to Saudi Arabia, Kuwait, Qatar, Oman and Bahrain on request — message us on WhatsApp with your address and we will quote the courier cost.",
  },
];

export default function FaqPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PageHeader
        eyebrow="Everything else"
        title="Frequently asked"
        intro="If your question is not here, message us on WhatsApp — a person answers, usually within the hour."
      />

      <div className="mx-auto max-w-3xl px-5 py-16 lg:px-10">
        <dl className="divide-y divide-line">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-8 first:pt-0">
              <dt className="font-display text-2xl leading-snug font-light">{faq.question}</dt>
              <dd className="mt-3 text-sm leading-relaxed text-ink-muted">{faq.answer}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 border-t border-line pt-8 text-sm text-ink-muted">
          Still stuck?{" "}
          <Link href="/contact" className="underline hover:text-ink">
            Contact the studio
          </Link>{" "}
          or email{" "}
          <a href={`mailto:${site.email}`} className="underline hover:text-ink">
            {site.email}
          </a>
          .
        </p>
      </div>
    </>
  );
}
