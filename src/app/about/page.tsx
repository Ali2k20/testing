import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProductArt } from "@/components/product-art";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { TrustBar } from "@/components/trust-bar";
import { getProduct } from "@/lib/products";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "FRS is a Dubai atelier making abayas and mukhawar in small runs — heavyweight Japanese crepe, hand-braided Emirati talli and real zari, cut and finished in Al Quoz.",
  alternates: { canonical: "/about" },
};

const chapters = [
  {
    title: "It started with one complaint",
    body: "A friend showed us an abaya she had bought online. It photographed beautifully and felt like a bin liner. We spent four months sourcing crepe until we found a Japanese Nida that held its weight in the hand and stayed opaque in direct sun. That fabric became the Noor abaya, and the Noor abaya became FRS.",
  },
  {
    title: "We make less, on purpose",
    body: `Most colourways run to forty pieces. When they are gone we either re-cut them or we do not, depending on whether the fit was right. That is slower and it costs more per piece, but it means we can check every garment before it is folded, and it means you are unlikely to see your abaya on three other women at the same majlis.`,
  },
  {
    title: "The talli is not decoration",
    body: "Talli is the braided trim Emirati women have made on a kajoojah cushion for generations. It is genuinely difficult, genuinely slow, and it is disappearing. We buy ours from an artisan cooperative in the Northern Emirates at a price they set, and a share of every Talli Heritage Mukhawar goes back to them. No two lengths are identical, which is the whole point.",
  },
  {
    title: "Prices you can reason about",
    body: `Our cheapest abaya is ${"AED 429"} and our most worked mukhawar is AED 2,250. The difference is hours and materials, and we say which on every page. If a piece takes sixty hours of embroidery, that is on the listing. If it is a simple crepe with a good zip, we do not pretend otherwise.`,
  },
];

export default function AboutPage() {
  const noor = getProduct("noor-open-abaya")!;
  const talli = getProduct("talli-heritage-mukhawar")!;

  return (
    <>
      <PageHeader
        eyebrow="Since 2026 · Al Quoz, Dubai"
        title="A small atelier that would rather be good than big"
        intro="FRS cuts, sews and finishes abayas and mukhawar in Dubai. Not sourced, not relabelled — made here, in runs small enough that we can check every one."
      />

      <section className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div className="grid grid-cols-2 gap-4 lg:sticky lg:top-28 lg:self-start">
            <div className="aspect-[3/4] overflow-hidden bg-sand">
              <ProductArt product={noor} color={noor.colors[0]} className="h-full w-full" />
            </div>
            <div className="mt-10 aspect-[3/4] overflow-hidden bg-sand">
              <ProductArt product={talli} color={talli.colors[0]} view="detail" className="h-full w-full" />
            </div>
          </div>

          <div className="space-y-14">
            {chapters.map((chapter, index) => (
              <article key={chapter.title}>
                <Eyebrow>{String(index + 1).padStart(2, "0")}</Eyebrow>
                <h2 className="mt-3 font-display text-3xl leading-tight font-light sm:text-4xl">
                  {chapter.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">{chapter.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <TrustBar />

      <section className="mx-auto max-w-[1400px] px-5 py-20 text-center lg:px-10">
        <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight font-light sm:text-5xl">
          Come and feel the fabric
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ink-muted">
          The studio is open Sunday to Thursday, 10:00 to 19:00. Bring a friend, try three sizes,
          leave with nothing if nothing is right. We would rather that than a return.
        </p>
        <p className="mt-6 text-sm text-ink-soft">{site.addressLines.join(" · ")}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/contact" tone="solid" size="lg">
            Book a studio visit
          </ButtonLink>
          <ButtonLink href="/shop" tone="outline" size="lg">
            Shop the collection
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
