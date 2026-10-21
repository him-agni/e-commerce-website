import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryListing } from "@/components/category/category-listing";
import { ProductGridSkeleton } from "@/components/product/skeletons";
import { Container } from "@/components/site/container";
import { getCategory, getCategorySlugs } from "@/lib/sanity/data";

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
  return <CategoryListing slug={slug} />;
}
