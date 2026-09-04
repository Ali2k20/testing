import Link from "next/link";
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
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-sand">
      <div className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-4xl tracking-[0.4em]">FRS</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              A Dubai atelier making abayas and mukhawar in small runs. Cut, sewn and finished in Al
              Quoz — not imported and relabelled.
            </p>
            <div className="mt-6">
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
          </FooterColumn>

          <FooterColumn title="Collections">
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
            <Link href="/about" className="link-underline">
              Our story
            </Link>
          </FooterColumn>
        </div>

        <div className="mt-14 grid gap-8 border-t border-line pt-10 md:grid-cols-3">
          <div className="text-xs leading-relaxed text-ink-muted">
            <p className="eyebrow mb-2 text-ink">Studio</p>
            {site.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="mt-2">Sunday to Thursday, 10:00 – 19:00</p>
          </div>
          <div className="text-xs leading-relaxed text-ink-muted">
            <p className="eyebrow mb-2 text-ink">Talk to us</p>
            <a href={`mailto:${site.email}`} className="link-underline block text-ink">
              {site.email}
            </a>
            <a
              href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`}
              className="link-underline block text-ink"
            >
              {site.phoneDisplay}
            </a>
            <div className="mt-3 flex gap-4">
              <a href={site.instagram} className="link-underline" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href={site.tiktok} className="link-underline" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </div>
          </div>
          <div className="text-xs leading-relaxed text-ink-muted">
            <p className="eyebrow mb-2 text-ink">Payment</p>
            <div className="flex flex-wrap gap-2">
              {["Visa", "Mastercard", "Apple Pay", "Tabby", "Tamara", "Cash on delivery"].map(
                (method) => (
                  <span key={method} className="border border-line px-2.5 py-1 text-[10px] text-ink-soft">
                    {method}
                  </span>
                ),
              )}
            </div>
            <p className="mt-3">All prices in AED and inclusive of 5% VAT.</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-[11px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. Trade licence 000-000000, Dubai.
          </p>
          <p>Made in the United Arab Emirates 🇦🇪</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-4 text-ink">{title}</p>
      <div className="flex flex-col items-start gap-2.5 text-sm text-ink-muted">{children}</div>
    </div>
  );
}
