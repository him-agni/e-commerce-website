import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/product/skeletons";
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
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

// The page stays synchronous so the shell (and the skeleton) is available instantly;
// reading params happens inside the Suspense boundary.
export default function CategoryPage({ params }: Props) {
  return (
    <Container className="py-12">
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryContent params={params} />
      </Suspense>
    </Container>
  );
}

async function CategoryContent({ params }: Props) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategory(slug),
    getProductsByCategory(slug),
  ]);
  if (!category) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="blur-in mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.title}</span>
      </nav>
      <h1
        className="blur-in mb-2 text-4xl"
        style={{ "--delay": "150ms" } as React.CSSProperties}
      >
        {category.title}
      </h1>
      {category.description && (
        <p
          className="blur-in mb-10 max-w-xl text-muted-foreground"
          style={{ "--delay": "300ms" } as React.CSSProperties}
        >
          {category.description}
        </p>
      )}
      <ProductGrid
        products={products}
        emptyMessage="Nothing in this category yet. Check back soon."
        headingLevel={2}
        priorityCount={4}
      />
    </>
  );
}
