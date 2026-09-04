import { ProductCard } from "./product-card";
import type { Product } from "@/lib/types";

/** Horizontally scrollable product row — the standard mobile merchandising unit. */
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="rail -mx-5 mt-10 flex gap-5 overflow-x-auto px-5 pb-4 lg:-mx-10 lg:px-10">
      {products.map((product, index) => (
        <div key={product.slug} className="w-[68vw] shrink-0 sm:w-[42vw] lg:w-[23vw] xl:w-[300px]">
          <ProductCard product={product} priority={index < 2} />
        </div>
      ))}
    </div>
  );
}
