import { Stars } from "./ui";
import { formatDate } from "@/lib/format";
import { ratingFor } from "@/lib/products";
import type { Product } from "@/lib/types";

export function ProductReviews({ product }: { product: Product }) {
  const rating = ratingFor(product);
  if (rating.count === 0) return null;

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: product.reviews.filter((review) => review.rating === stars).length,
  }));

  return (
    <section id="reviews" className="border-t border-line bg-panel py-16 lg:py-20">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 lg:grid-cols-[300px_1fr] lg:gap-16 lg:px-10">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-fg-muted">Verified buyers</p>
          <p className="mt-3 font-display text-5xl">{rating.average}</p>
          <Stars rating={rating.average} className="mt-2 scale-110 origin-left" />
          <p className="mt-3 text-sm text-fg-muted">
            {rating.count} {rating.count === 1 ? "review" : "reviews"} from customers who bought this
            piece
          </p>
          <div className="mt-6 space-y-2">
            {distribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-[13px] text-fg-muted">
                <span className="w-6">{row.stars}★</span>
                <div className="h-1 flex-1 bg-line">
                  <div
                    className="h-full bg-talli"
                    style={{ width: `${(row.count / rating.count) * 100}%` }}
                  />
                </div>
                <span className="w-5 text-right">{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-line">
          {product.reviews.map((review) => (
            <li key={`${review.author}-${review.date}`} className="py-7 first:pt-0">
              <div className="flex flex-wrap items-center gap-3">
                <Stars rating={review.rating} />
                <p className="font-display text-xl leading-none">{review.title}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-fg-soft">{review.body}</p>
              <p className="mt-3 text-[13px] text-fg-muted">
                {review.author} · {review.emirate} · {formatDate(review.date)}
                {review.verified && <span className="ml-2 text-talli">Verified purchase</span>}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
