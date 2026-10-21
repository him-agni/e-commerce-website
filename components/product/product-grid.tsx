import { RevealController } from "@/components/motion/reveal-controller";
import { ProductCard, type ProductCardData } from "./product-card";

export function ProductGrid({
  products,
  emptyMessage = "No products here yet.",
  headingLevel = 3,
  priorityCount = 0,
}: {
  products: ProductCardData[];
  emptyMessage?: string;
  headingLevel?: 2 | 3;
  /** How many leading cards are above the fold and worth preloading. Leave 0 for grids further down a page. */
  priorityCount?: number;
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <RevealController />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => {
          const aboveTheFold = index < priorityCount;
          return (
            <li
              key={product._id}
              // Cards at the top rise in on load (plain CSS, visible from the start); the rest fade in as
              // they scroll into view. Either way each card in a row arrives a beat after the last.
              {...(aboveTheFold ? { className: "blur-rise" } : { "data-reveal": "" })}
              style={{ "--delay": `${(index % 4) * 130}ms` } as React.CSSProperties}
            >
              <ProductCard
                product={product}
                priority={aboveTheFold}
                headingLevel={headingLevel}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
