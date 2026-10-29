import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Fabric care",
  description:
    "How to wash, store and press every FRS fabric — Japanese crepe, linen, silk, velvet, pleats and hand-worked zari.",
  alternates: { canonical: "/fabric-care" },
};

const principles = [
  {
    title: "Wash cold, always",
    body: "Heat is what kills a crepe. Cold water on a delicate cycle, inside a laundry bag, and the fabric will outlast anything you do to it. Never wash an abaya with jeans or towels — the abrasion pills the surface.",
  },
  {
    title: "Hang in shade, not sun",
    body: "UV fades black faster than anything else, and the UAE sun is unforgiving. Hang indoors or on a shaded balcony. A wet abaya hung on a wide hanger will drop most of its creases on its own.",
  },
  {
    title: "Iron on the reverse, or not at all",
    body: "Cool iron, reverse side, and never directly on embroidery, pearls or talli. For pleated pieces do not iron at all — hang them in a steamy bathroom and let the folds settle.",
  },
  {
    title: "Store on wide hangers",
    body: "Thin wire hangers dent the shoulder line permanently. Use a wide wooden or padded hanger, and give pleated and embroidered pieces their own space so nothing crushes the work.",
  },
];

export default function FabricCarePage() {
  return (
    <>
      <PageHeader
        eyebrow="Make it last"
        title="Fabric care"
        intro="An abaya that is looked after properly outlives four that are not. Here is what we tell every customer who comes to the studio."
      />

      <div className="mx-auto max-w-4xl px-5 py-16 lg:px-10">
        <section className="grid gap-8 sm:grid-cols-2">
          {principles.map((item) => (
            <article key={item.title} className="border border-line p-7">
              <h2 className="font-display text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">Care by piece</h2>
          <p className="mt-3 text-sm text-fg-muted">
            Every product page repeats this, but here it is in one place.
          </p>
          <div className="mt-7 divide-y divide-line-soft border-y border-line-soft">
            {products.map((product) => (
              <div key={product.slug} className="grid gap-2 py-5 sm:grid-cols-[240px_1fr] sm:gap-6">
                <Link href={`/product/${product.slug}`} className="link-underline text-sm text-fg">
                  {product.name}
                </Link>
                <div>
                  <p className="text-sm text-fg-muted">{product.care}</p>
                  <p className="mt-1 text-[13px] text-fg-muted/80">{product.fabric}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
