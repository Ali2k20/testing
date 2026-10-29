import Link from "next/link";
import { FrsLogo } from "./frs-logo";
import { NewsletterForm } from "./newsletter-form";
import { collections } from "@/lib/collections";
import { categoryLabels, categoryOrder } from "@/lib/products";
import { site } from "@/lib/site";

const help = [
  { href: "/size-guide", label: "Size guide" },
  { href: "/shipping-and-returns", label: "Shipping & returns" },
  { href: "/fabric-care", label: "Fabric care" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
  { href: "/about", label: "Our story" },
];

const payments = ["Visa", "Mastercard", "Apple Pay", "Tabby", "Tamara", "Cash on delivery"];

export function SiteFooter() {
  return (
    <footer className="mt-32 bg-panel">
      <div className="mx-auto max-w-[1400px] px-5 pt-20 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-md">
            <p className="text-base leading-relaxed text-fg">
              Abayas and mukhawar cut, sewn and finished in small runs at our studio in Al Quoz,
              Dubai.
            </p>
            <div className="mt-8">
              <NewsletterForm />
            </div>
          </div>

          <FooterColumn title="Shop">
            {categoryOrder.map((category) => (
              <Link key={category} href={`/shop?category=${category}`} className="link-underline">
                {categoryLabels[category]}
              </Link>
            ))}
            <Link href="/shop" className="link-underline">
              Everything
            </Link>
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="link-underline"
              >
                {collection.name}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Help">
            {help.map((item) => (
              <Link key={item.href} href={item.href} className="link-underline">
                {item.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Studio">
            {site.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span>Sunday to Thursday, 10:00 to 19:00</span>
            <a href={`mailto:${site.email}`} className="link-underline mt-3 text-fg">
              {site.email}
            </a>
            <a href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`} className="link-underline text-fg">
              {site.phoneDisplay}
            </a>
            <span className="mt-3 flex gap-4">
              <a href={site.instagram} className="link-underline" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href={site.tiktok} className="link-underline" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </span>
          </FooterColumn>
        </div>

        <p className="mt-14 max-w-3xl text-sm leading-relaxed text-fg-muted">
          We accept {payments.join(", ")}. All prices are in AED and include 5% VAT.
        </p>

        {/* The name closes the page at full width. */}
        <FrsLogo className="mt-16 block h-auto w-full text-fg" title={site.name} />

        <div className="flex flex-col gap-2 py-6 text-[13px] text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. Trade licence 000-000000, Dubai.
          </p>
          <p>Made in the United Arab Emirates</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-base font-medium text-fg">{title}</h2>
      <div className="flex flex-col items-start gap-2.5 text-[0.9375rem] text-fg-muted">{children}</div>
    </div>
  );
}
