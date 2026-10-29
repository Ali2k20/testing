import Link from "next/link";
import { LitStrip } from "@/components/lit-strip";
import { ProductArt } from "@/components/product-art";
import { ProductRail } from "@/components/product-rail";
import { Reveal } from "@/components/reveal";
import { SizeFinder } from "@/components/size-finder";
import { Testimonials } from "@/components/testimonials";
import { ButtonLink, buttonClass } from "@/components/ui";
import { collections } from "@/lib/collections";
import { formatPrice, instalmentOf } from "@/lib/format";
import {
  categoryLabels,
  categoryOrder,
  getProduct,
  products,
  productsInCollection,
} from "@/lib/products";
import { site } from "@/lib/site";
import type { Product } from "@/lib/types";

/** The garments in the hero strip, in the order they hang. */
const stripSlugs = [
  "yasmine-butterfly-abaya",
  "bahar-mukhawar",
  "noor-open-abaya",
  "aseel-zari-mukhawar",
  "zahra-embroidered-abaya",
  "talli-heritage-mukhawar",
  "layali-crepe-abaya",
  "farah-velvet-mukhawar",
  "sadu-kimono-abaya",
  "lulwa-bridal-kaftan",
  "dana-pearl-trim-abaya",
  "majlis-mukhawar",
];
const strip = stripSlugs.map((slug) => getProduct(slug)!);

const showcase = getProduct("talli-heritage-mukhawar")!;
const studioPiece = getProduct("zahra-embroidered-abaya")!;

const bestSellers = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 8);
const eidCapsule = productsInCollection("eid-capsule").slice(0, 3);

const categoryArabic: Record<Product["category"], string> = {
  abaya: "عبايات",
  mukhawar: "مخاور",
  kaftan: "قفاطين وجلابيات",
  set: "أطقم",
  accessory: "إكسسوارات",
};

const lineup = categoryOrder.map((category) => {
  const pieces = products.filter((product) => product.category === category);
  return {
    href: `/shop?category=${category}`,
    name: categoryLabels[category],
    arabic: categoryArabic[category],
    count: pieces.length,
    from: Math.min(...pieces.map((product) => product.price)),
  };
});

const collectionLineup = collections
  .filter((collection) => collection.slug !== "best-sellers")
  .map((collection) => {
    const pieces = productsInCollection(collection.slug);
    return {
      href: `/collections/${collection.slug}`,
      name: collection.name,
      arabic: collection.arabicName,
      count: pieces.length,
      from: Math.min(...pieces.map((product) => product.price)),
    };
  });

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* The live thing: height in, Gulf size out. */}
      <section aria-labelledby="finder-title" className="mx-auto max-w-[1400px] px-5 pt-24 lg:px-10 lg:pt-44">
        <Reveal>
          <h2 id="finder-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] tracking-[-0.02em] text-balance">
            Find your abaya length
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-soft">
            Gulf sizes from 50 to 60 measure length, not width. Slide to your height and the right
            one lights up. A size exchange is free if it still arrives wrong.
          </p>
        </Reveal>
        <Reveal delay={90} className="mt-14">
          <SizeFinder />
        </Reveal>
      </section>

      <Lineup />

      <Showcase />

      {/* Best sellers, pulled sideways */}
      <section aria-labelledby="best-title" className="mx-auto max-w-[1400px] px-5 pt-24 lg:px-10 lg:pt-44">
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-6">
            <h2 id="best-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] tracking-[-0.02em]">
              Most ordered this season
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="max-w-xl text-lg leading-relaxed text-fg-soft">
              The pieces customers come back for in a second colour.
            </p>
            <ButtonLink href="/collections/best-sellers" tone="outline" size="md" className="mt-6">
              See all best sellers
            </ButtonLink>
          </div>
        </Reveal>
        <ProductRail products={bestSellers} />
      </section>

      <Atelier />

      <EidCapsule />

      <Testimonials />

      <Closing />
    </>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col justify-between gap-8 pt-6 pb-10 lg:gap-10 lg:pb-24"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-baseline justify-between gap-x-10 gap-y-2 px-5 lg:px-10">
        <h1
          id="hero-title"
          className="animate-rise font-display text-[clamp(2.75rem,5.4vw,5.25rem)] leading-[0.96] tracking-[-0.02em]"
        >
          Abayas &amp; mukhawar
        </h1>
        <p
          lang="ar"
          dir="rtl"
          className="animate-rise font-arabic text-[clamp(2.75rem,5.4vw,5.25rem)] leading-[1.1] text-fg [animation-delay:90ms]"
        >
          عبايات ومخاور
        </p>
      </div>

      <LitStrip
        label="Garments from the current collection"
        startIndex={5}
        captions={strip.map((product) => ({ name: product.name, detail: formatPrice(product.price) }))}
      >
        {strip.map((product, index) => (
          <Link
            key={product.slug}
            href={`/product/${product.slug}`}
            data-frame=""
            className="lit-frame group"
            draggable={false}
          >
            <span className="lit-art block aspect-[3/4] overflow-hidden bg-panel">
              <ProductArt
                product={product}
                color={product.colors[0]}
                priority={index > 2 && index < 8}
                className="h-full w-full"
              />
            </span>
          </Link>
        ))}
      </LitStrip>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-5 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <p className="animate-rise max-w-xl text-lg leading-relaxed text-fg-soft [animation-delay:180ms]">
          Cut, sewn and finished by hand in our Al Quoz studio, Dubai. From {formatPrice(429)}, with
          cash on delivery in all seven emirates.
        </p>
        <div className="animate-rise flex flex-wrap items-center gap-x-6 gap-y-4 [animation-delay:240ms]">
          <ButtonLink href="/shop" tone="solid" size="lg">
            Shop the collection
          </ButtonLink>
          <Link href="/size-guide" className="link-underline text-base text-fg-soft hover:text-fg">
            How Gulf sizing works
          </Link>
        </div>
      </div>
    </section>
  );
}

function Lineup() {
  return (
    <section aria-labelledby="lineup-title" className="mx-auto max-w-[1400px] px-5 pt-24 lg:px-10 lg:pt-44">
      <Reveal>
        <h2 id="lineup-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] tracking-[-0.02em]">
          Everything we make
        </h2>
      </Reveal>
      <LineupGroup title="By piece" rows={lineup} />
      <LineupGroup title="By moment" rows={collectionLineup} />
    </section>
  );
}

function LineupGroup({
  title,
  rows,
}: {
  title: string;
  rows: { href: string; name: string; arabic: string; count: number; from: number }[];
}) {
  return (
    <Reveal className="mt-14">
      <h3 className="text-lg text-fg-muted">{title}</h3>
      <ul className="lineup mt-4">
        {rows.map((row) => (
          <li key={row.href}>
            <Link
              href={row.href}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 py-2 font-display text-[clamp(1.375rem,2.3vw,2.125rem)] leading-snug md:grid-cols-[2.2fr_1.6fr_1fr_1fr]"
            >
              <span>{row.name}</span>
              <span lang="ar" dir="rtl" className="hidden text-left font-arabic-text md:block">
                {row.arabic}
              </span>
              <span className="hidden tabular-nums md:block">{row.count} pieces</span>
              <span className="text-right text-[0.65em] tabular-nums md:text-[1em]">
                from {formatPrice(row.from)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function Showcase() {
  return (
    <section aria-labelledby="showcase-title" className="relative mt-24 lg:mt-44">
      <div className="h-[100svh] min-h-[560px] overflow-hidden bg-panel">
        <ProductArt
          product={showcase}
          color={showcase.colors[0]}
          view="detail"
          className="showcase-art h-full w-full"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 lg:inset-y-0 lg:flex lg:items-center">
        <div className="mx-auto w-full max-w-[1400px] lg:px-10">
          <div className="bg-fg p-6 text-ground sm:p-8 lg:ml-[25%] lg:w-[min(24rem,30%)]">
            <div className="flex items-start justify-between gap-6 lg:block">
              <div>
                <h2 id="showcase-title" className="font-display text-3xl leading-tight sm:text-4xl">
                  {showcase.name}
                </h2>
                <p lang="ar" dir="rtl" className="mt-1 font-arabic-text text-xl text-ground/75 lg:text-left">
                  {showcase.arabicName}
                </p>
              </div>
              <span className="block w-24 shrink-0 overflow-hidden bg-panel lg:mt-6 lg:w-full">
                <span className="block aspect-[3/4]">
                  <ProductArt product={showcase} color={showcase.colors[0]} className="h-full w-full" />
                </span>
              </span>
            </div>
            <p className="mt-5 text-base leading-relaxed">{showcase.tagline}</p>
            <p className="mt-4 text-base">
              <span className="text-lg font-medium tabular-nums">{formatPrice(showcase.price)}</span>
              <span className="text-ground/75">
                {" "}
                or {site.instalments} × {formatPrice(instalmentOf(showcase.price))}
              </span>
            </p>
            <Link
              href={`/product/${showcase.slug}`}
              className="mt-6 flex min-h-12 w-full items-center justify-center bg-ground px-6 text-base font-medium text-fg transition-colors hover:bg-panel-deep"
            >
              See the mukhawar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Atelier() {
  return (
    <section aria-labelledby="atelier-title" className="mx-auto max-w-[1400px] px-5 pt-24 lg:px-10 lg:pt-44">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-3">
          <h2 id="atelier-title" className="font-display text-3xl leading-tight sm:text-4xl">
            The studio in Al Quoz
          </h2>
          <dl className="mt-8 grid grid-cols-3 gap-4 text-[0.9375rem] lg:grid-cols-1 lg:gap-6">
            <div>
              <dt className="text-fg-muted">Where</dt>
              <dd className="text-fg">{site.addressLines[0]}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Runs</dt>
              <dd className="text-fg">Small, by colourway</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Visit</dt>
              <dd className="text-fg">Sunday to Thursday, 10:00 to 19:00</dd>
            </div>
          </dl>
        </Reveal>
        <Reveal delay={90} className="lg:col-span-9">
          <p className="text-[clamp(1.375rem,2.3vw,2rem)] leading-[1.3] text-fg">
            <span className="float-left mt-1 mr-4 block h-[3.9em] w-[3.9em] overflow-hidden bg-panel">
              <ProductArt
                product={studioPiece}
                color={studioPiece.colors[0]}
                view="detail"
                className="h-full w-full"
              />
            </span>
            We buy the crepe, cut it ourselves and put our name inside the neckline.
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fg-soft">
            Nothing here is a relabelled import. The talli is hand-braided by an Emirati cooperative in the Northern Emirates, and the zari
            is real metallic thread. When a piece takes sixty hours of handwork, its product page
            says so.
          </p>
          <ButtonLink href="/about" tone="outline" size="md" className="mt-10">
            Read our story
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}

function EidCapsule() {
  const [first, second, third] = eidCapsule;
  return (
    <section aria-labelledby="eid-title" className="mt-24 bg-panel py-24 lg:mt-44 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 lg:grid-cols-12 lg:gap-8 lg:px-10">
        <Reveal className="lg:col-span-4">
          <h2 id="eid-title" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] tracking-[-0.02em]">
            The Eid Capsule
          </h2>
          <p lang="ar" dir="rtl" className="mt-3 font-arabic text-5xl text-fg-soft lg:text-left">
            مجموعة العيد
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-soft">
            Hand-set pearls, real zari and liquid satin, made in runs of forty per colourway.
          </p>
          <ButtonLink href="/collections/eid-capsule" tone="solid" size="lg" className="mt-8">
            Shop the Eid Capsule
          </ButtonLink>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 lg:col-span-8 lg:grid-cols-3 lg:gap-6">
          {[
            { product: first, frame: "col-span-2 lg:col-span-1", delay: 0 },
            { product: second, frame: "lg:mt-32", delay: 90 },
            { product: third, frame: "lg:mt-14", delay: 180 },
          ].map(({ product, frame, delay }) =>
            product ? (
              <Reveal key={product.slug} delay={delay} className={frame}>
                <Link href={`/product/${product.slug}`} className="group block">
                  <span className="block aspect-[3/4] overflow-hidden bg-ground">
                    <ProductArt
                      product={product}
                      color={product.colors[0]}
                      className="h-full w-full transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="mt-4 block font-display text-xl sm:text-2xl">{product.name}</span>
                  <span className="mt-1 block tabular-nums text-fg-soft">{formatPrice(product.price)}</span>
                </Link>
              </Reveal>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section aria-labelledby="closing-title" className="mx-auto flex max-w-[1400px] flex-col items-center px-5 pt-24 text-center lg:px-10 lg:pt-44">
      <h2 id="closing-title" className="font-display text-[clamp(3rem,11vw,10rem)] leading-[0.92] tracking-[-0.03em]">
        Abaya
        <span className="block">
          or mukhawar?
        </span>
      </h2>
      <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
        <Link href="/shop?category=abaya" className={buttonClass("solid", "lg", "w-56")}>
          Shop abayas
        </Link>
        <Link href="/shop?category=mukhawar" className={buttonClass("outline", "lg", "w-56")}>
          Shop mukhawar
        </Link>
      </div>
      <p className="mt-6 max-w-md text-base leading-relaxed text-fg-soft">
        Free UAE delivery over {formatPrice(site.freeShippingThreshold)}, and{" "}
        {site.returnWindowDays}-day returns if it is not right.
      </p>
    </section>
  );
}
