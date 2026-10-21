import { ProductCard, type ProductCardData } from "./product-card";

export function ProductGrid({
  products,
  emptyMessage = "No products here yet.",
}: {
  products: ProductCardData[];
  emptyMessage?: string;
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
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
