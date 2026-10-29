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
  const [lead, ...rest] = featured;

  return (
    <section aria-labelledby="reviews-title" className="mt-24 bg-panel py-24 lg:mt-44 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-10">
        <div className="flex flex-col items-start gap-4">
          <Stars rating={overall.average} />
          <h2
            id="reviews-title"
            className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.02] tracking-[-0.02em] text-balance"
          >
            {overall.average} out of 5, from {overall.count} verified buyers
          </h2>
          <p className="max-w-lg text-base text-fg-soft">
            Every review comes from a customer who paid for the piece. We do not gift, seed or edit
            them.
          </p>
        </div>

        <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-8">
          {lead && (
            <figure className="lg:col-span-7">
              <blockquote>
                <p className="font-display text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.15]">
                  “{lead.title}.”
                </p>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg">{lead.body}</p>
              </blockquote>
              <Caption review={lead} />
            </figure>
          )}
          <div className="flex flex-col gap-12 lg:col-span-4 lg:col-start-9">
            {rest.slice(0, 2).map((review) => (
              <figure key={`${review.product.slug}-${review.author}`}>
                <blockquote className="text-lg leading-relaxed text-fg">
                  <span className="font-display text-xl">“{review.title}.”</span> {review.body}
                </blockquote>
                <Caption review={review} />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Caption({ review }: { review: (typeof featured)[number] }) {
  return (
    <figcaption className="mt-5 text-[0.9375rem] text-fg-muted">
      <span className="text-fg">{review.author}</span>, {review.emirate}, {formatDate(review.date)}.
      Bought the {review.product.name}.
    </figcaption>
  );
}
