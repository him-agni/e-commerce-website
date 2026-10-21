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
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product._id}>
          <ProductCard
            product={product}
            priority={index < priorityCount}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ul>
  );
}
