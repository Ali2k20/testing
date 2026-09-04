import Link from "next/link";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";
import { ProductRail } from "@/components/product-rail";
import { Reveal } from "@/components/reveal";
import { Testimonials } from "@/components/testimonials";
import { TrustBar } from "@/components/trust-bar";
import { NewsletterForm } from "@/components/newsletter-form";
import { ButtonLink, Eyebrow, SectionHeading } from "@/components/ui";
import { collections } from "@/lib/collections";
import { getProduct, products, productsInCollection } from "@/lib/products";
import { formatPrice, instalmentOf } from "@/lib/format";
import { site } from "@/lib/site";

const heroProduct = getProduct("noor-open-abaya")!;
const heroSecondary = getProduct("bahar-mukhawar")!;
const heroTertiary = getProduct("layali-crepe-abaya")!;

const bestSellers = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 8);
const newIn = [...products]
  .sort((a, b) => +new Date(b.releasedAt) - +new Date(a.releasedAt))
  .slice(0, 4);
const eidCapsule = productsInCollection("eid-capsule").slice(0, 3);

const categoryTiles = [
  {
    href: "/shop?category=abaya",
    label: "Abayas",
    arabic: "عبايات",
    copy: "Ten cuts, from a 429-dirham everyday zip to hand-set pearls.",
    product: getProduct("sahra-pleated-abaya")!,
  },
  {
    href: "/shop?category=mukhawar",
    label: "Mukhawar",
    arabic: "مخور",
    copy: "Traditional yokes and talli, cut for how women actually sit and host.",
    product: getProduct("talli-heritage-mukhawar")!,
  },
  {
    href: "/shop?category=kaftan",
    label: "Kaftans & Jalabiya",
    arabic: "قفاطين",
    copy: "Loose, cool and forgiving. Our most re-ordered Ramadan pieces.",
    product: getProduct("hessa-ramadan-jalabiya")!,
  },
];

const craftNumbers = [
  { value: "60 hrs", label: "of hand embroidery on our most worked mukhawar" },
  { value: "40", label: "pieces per colourway in the Eid Capsule — then it is gone" },
  { value: "1 in 5", label: "customers return within 90 days for a second colour" },
  { value: "7", label: "emirates we deliver to, with cash on delivery everywhere" },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />

      {/* Categories */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <SectionHeading
          eyebrow="Start here"
          title="Three ways to dress"
          intro="Every piece is cut, sewn and finished in our Al Quoz studio. Nothing here is a rebadged import."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {categoryTiles.map((tile, index) => (
            <Reveal key={tile.href} delay={index * 110}>
              <Link href={tile.href} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                  <ProductArt
                    product={tile.product}
                    color={tile.product.colors[0]}
                    className="h-full w-full transition-transform duration-[1100ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-6 pt-16">
                    <p className="font-display text-3xl text-ivory">{tile.label}</p>
                    <p className="font-display text-lg text-ivory/70" dir="rtl">
                      {tile.arabic}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">{tile.copy}</p>
                <span className="eyebrow link-underline mt-3 inline-block text-ink">Shop {tile.label}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="border-y border-line bg-sand py-20 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
          <SectionHeading
            align="left"
            eyebrow="Ranked by re-order rate"
            title="What Dubai keeps buying"
            intro="Not our highest-margin pieces — the ones customers come back for in a second colour."
            action={
              <ButtonLink href="/collections/best-sellers" tone="outline" size="md">
                See all best sellers
              </ButtonLink>
            }
          />
          <ProductRail products={bestSellers} />
        </div>
      </section>

      {/* Editorial: the atelier */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] overflow-hidden bg-sand">
                <ProductArt
                  product={getProduct("zahra-embroidered-abaya")!}
                  color={getProduct("zahra-embroidered-abaya")!.colors[1]}
                  view="detail"
                  className="h-full w-full"
                />
              </div>
              <div className="mt-10 aspect-[3/4] overflow-hidden bg-sand">
                <ProductArt
                  product={getProduct("talli-heritage-mukhawar")!}
                  color={getProduct("talli-heritage-mukhawar")!.colors[0]}
                  view="fabric"
                  className="h-full w-full"
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Eyebrow>The atelier</Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.08] font-light sm:text-5xl">
              We would rather make forty pieces properly than four thousand quickly.
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-ink-muted">
              FRS started with one open abaya and a complaint we kept hearing: the fabric looked
              expensive online and felt like nothing in the hand. So we buy the crepe ourselves,
              cut it ourselves, and put our name inside the neckline.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Our talli trim is hand-braided by an Emirati artisan cooperative in the Northern
              Emirates. Our zari is real metallic thread. When a piece takes sixty hours, we say so
              on the page and we price it honestly.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8">
              {craftNumbers.map((item) => (
                <div key={item.value}>
                  <dt className="font-display text-3xl text-gold">{item.value}</dt>
                  <dd className="mt-1.5 text-xs leading-relaxed text-ink-muted">{item.label}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href="/about" tone="outline" size="md" className="mt-10">
              Read our story
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      {/* Eid capsule feature */}
      <section className="bg-ink py-20 text-ivory lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="eyebrow text-gold-soft">Limited — 40 pieces per colourway</p>
            <h2 className="font-display text-4xl leading-[1.08] font-light sm:text-6xl">
              The Eid Capsule
            </h2>
            <p className="font-display text-2xl text-ivory/60" dir="rtl">
              مجموعة العيد
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ivory/70">
              Hand-set pearls, real zari and liquid satin. Our most photographed pieces, and the ones
              that sell out first every year.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {eidCapsule.map((product, index) => (
              <Reveal key={product.slug} delay={index * 120}>
                <Link href={`/product/${product.slug}`} className="group block">
                  <div className="aspect-[3/4] overflow-hidden bg-ink-soft">
                    <ProductArt
                      product={product}
                      color={product.colors[0]}
                      className="h-full w-full transition-transform duration-[1100ms] group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-2xl font-light">{product.name}</h3>
                    <span className="shrink-0 text-sm text-ivory/80">{formatPrice(product.price)}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-ivory/55">{product.tagline}</p>
                </Link>
              </Reveal>
            ))}
          </div>

          <div className="mt-14 text-center">
            <ButtonLink href="/collections/eid-capsule" tone="gold" size="lg">
              Shop the Eid Capsule
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* New in */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <SectionHeading
          align="left"
          eyebrow="Just left the studio"
          title="New arrivals"
          intro="Small runs. Most styles sell through within three weeks of landing."
          action={
            <ButtonLink href="/collections/new-arrivals" tone="outline">
              See everything new
            </ButtonLink>
          }
        />
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {newIn.map((product, index) => (
            <Reveal key={product.slug} delay={index * 90}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <Testimonials />

      {/* Fit help — removes the biggest reason carts get abandoned */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <Reveal>
            <Eyebrow>Sizing, solved</Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.08] font-light sm:text-5xl">
              Not sure between a 54 and a 56?
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-ink-muted">
              Send us your height and usual size on WhatsApp and a person — not a bot — will tell you
              which to take, usually within the hour. If it still arrives wrong, we collect it and
              send the right size free of charge within {site.returnWindowDays} days.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-soft">
              {[
                "Every product page lists the exact shoulder-to-hem length in centimetres",
                "Free size exchange, collected from your door",
                "Made-to-order in your own measurements on selected pieces, at no extra cost",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/size-guide" tone="solid">
                Open the size guide
              </ButtonLink>
              <ButtonLink href="/contact" tone="outline">
                Ask a stylist
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-4">
              {[heroTertiary, heroSecondary].map((product, index) => (
                <div
                  key={product.slug}
                  className={`aspect-[3/4] overflow-hidden bg-sand ${index === 1 ? "mt-12" : ""}`}
                >
                  <ProductArt product={product} color={product.colors[index]} className="h-full w-full" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Collections index */}
      <section className="border-t border-line bg-sand py-20 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
          <SectionHeading eyebrow="Browse by moment" title="Our collections" />
          <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="group bg-sand p-8 transition-colors hover:bg-ivory"
              >
                <p className="eyebrow" style={{ color: collection.accent }}>
                  {productsInCollection(collection.slug).length} pieces
                </p>
                <h3 className="mt-3 font-display text-3xl font-light">{collection.name}</h3>
                <p className="font-display text-lg text-ink-muted" dir="rtl">
                  {collection.arabicName}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{collection.headline}</p>
                <span className="eyebrow link-underline mt-5 inline-block text-ink">Explore</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-ink py-20 text-ivory lg:py-24">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 lg:grid-cols-2 lg:gap-20 lg:px-10">
          <div>
            <h2 className="font-display text-4xl leading-[1.08] font-light sm:text-5xl">
              {formatPrice(site.newsletterDiscount)} off your first piece
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ivory/70">
              Join the list for restock alerts and first access to capsule drops. We email roughly
              twice a month, and never sell your details.
            </p>
          </div>
          <div className="max-w-md lg:justify-self-end">
            <NewsletterForm variant="panel" />
          </div>
        </div>
      </section>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-ivory">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10 lg:py-20">
        <div className="animate-rise">
          <p className="eyebrow text-gold">Autumn / Winter 2026 · Made in Dubai</p>
          <h1 className="mt-6 font-display text-[3.25rem] leading-[0.98] font-light sm:text-7xl xl:text-[5.5rem]">
            Abayas worth
            <br />
            keeping.
          </h1>
          <p className="mt-3 font-display text-3xl font-light text-ink-muted" dir="rtl">
            عبايات ومخاور
          </p>
          <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-ink-muted">
            Heavyweight Japanese crepe, hand-braided Emirati talli and real zari — cut and finished
            in our Al Quoz studio. Free delivery across the UAE, cash on delivery, and a size
            exchange that costs you nothing.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/shop" tone="solid" size="lg">
              Shop the collection
            </ButtonLink>
            <ButtonLink href={`/product/${heroProduct.slug}`} tone="outline" size="lg">
              Shop the Noor abaya
            </ButtonLink>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] text-ink-muted">
            <span>
              From {formatPrice(429)} · or {site.instalments} × {formatPrice(instalmentOf(429))}{" "}
              interest-free
            </span>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span>Next-day delivery in Dubai</span>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3 aspect-[3/4] overflow-hidden bg-sand">
              <ProductArt
                product={heroProduct}
                color={heroProduct.colors[0]}
                priority
                className="h-full w-full"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-4 pt-10">
              <div className="aspect-[3/4] overflow-hidden bg-sand">
                <ProductArt product={heroSecondary} color={heroSecondary.colors[0]} className="h-full w-full" />
              </div>
              <div className="aspect-square overflow-hidden bg-sand">
                <ProductArt
                  product={heroTertiary}
                  color={heroTertiary.colors[1]}
                  view="fabric"
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>

          <Link
            href={`/product/${heroProduct.slug}`}
            className="absolute bottom-4 left-4 max-w-[240px] bg-ivory/95 p-4 backdrop-blur transition-colors hover:bg-ivory sm:bottom-6 sm:left-6"
          >
            <p className="eyebrow text-gold">Best seller</p>
            <p className="mt-1.5 font-display text-xl leading-tight">{heroProduct.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {formatPrice(heroProduct.price)} · {heroProduct.colors.length} colourways
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
