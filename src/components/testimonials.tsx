import { Stars } from "./ui";
import { catalogueRating, products } from "@/lib/products";
import { formatDate } from "@/lib/format";

/** Five strongest reviews across the catalogue, used as homepage social proof. */
const featured = products
  .flatMap((product) => product.reviews.map((review) => ({ ...review, product })))
  .filter((review) => review.rating === 5 && review.body.length > 90)
  .sort((a, b) => b.body.length - a.body.length)
  .slice(0, 6);

export function Testimonials() {
  const overall = catalogueRating();

  return (
    <section className="border-y border-line bg-sand py-20">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Stars rating={overall.average} className="scale-125" />
          <p className="font-display text-3xl font-light sm:text-4xl">
            {overall.average} out of 5, from {overall.count} verified buyers
          </p>
          <p className="max-w-lg text-sm text-ink-muted">
            Every review below comes from a customer who paid for the piece. We do not gift, seed or
            edit them.
          </p>
        </div>

        <div className="rail -mx-5 mt-12 flex gap-5 overflow-x-auto px-5 pb-4 lg:-mx-10 lg:px-10">
          {featured.map((review) => (
            <figure
              key={`${review.product.slug}-${review.author}`}
              className="flex w-[80vw] shrink-0 flex-col justify-between border border-line bg-ivory p-7 sm:w-[46vw] lg:w-[30vw] xl:w-[380px]"
            >
              <div>
                <Stars rating={review.rating} />
                <p className="mt-4 font-display text-xl leading-snug font-light">“{review.title}”</p>
                <blockquote className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {review.body}
                </blockquote>
              </div>
              <figcaption className="mt-6 border-t border-line-soft pt-4 text-[11px] text-ink-muted">
                <span className="text-ink">{review.author}</span> · {review.emirate} ·{" "}
                {formatDate(review.date)}
                <span className="mt-1 block text-gold">Verified purchase — {review.product.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
