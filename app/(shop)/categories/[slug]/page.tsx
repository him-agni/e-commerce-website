import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { Container } from "@/components/site/container";
import {
  getCategory,
  getCategorySlugs,
  getProductsByCategory,
} from "@/lib/sanity/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: category.title,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategory(slug),
    getProductsByCategory(slug),
  ]);
  if (!category) notFound();

  return (
    <Container className="py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.title}</span>
      </nav>
      <h1 className="mb-2 text-4xl">{category.title}</h1>
      {category.description && (
        <p className="mb-10 max-w-xl text-muted-foreground">{category.description}</p>
      )}
      <ProductGrid
        products={products}
        emptyMessage="Nothing in this category yet. Check back soon."
      />
    </Container>
  );
}
