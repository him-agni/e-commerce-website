import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-grid";
import { Container } from "@/components/site/container";
import { getAllProducts } from "@/lib/sanity/data";

export const metadata: Metadata = {
  title: "All furniture",
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <Container className="py-12">
      <h1 className="mb-2 text-4xl">All furniture</h1>
      <p className="mb-10 text-muted-foreground">
        {products.length} {products.length === 1 ? "piece" : "pieces"}
      </p>
      <ProductGrid products={products} />
    </Container>
  );
}
