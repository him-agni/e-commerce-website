import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryListing } from "@/components/category/category-listing";
import { ProductGridSkeleton } from "@/components/product/skeletons";
import { Container } from "@/components/site/container";
import { getCategory, getCategoryTags } from "@/lib/sanity/data";
import { tagTitle } from "@/lib/tags";

type Props = { params: Promise<{ slug: string; tag: string }> };

export async function generateStaticParams() {
  const categories = await getCategoryTags();
  return categories.flatMap((c) => c.tags.map((tag) => ({ slug: c.slug, tag })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, tag } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: `${tagTitle(tag)} in ${category.title}`,
    description: category.description ?? undefined,
    alternates: { canonical: `/categories/${category.slug}/${tag}` },
  };
}

export default function CategoryTagPage({ params }: Props) {
  return (
    <Container className="py-12">
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryTagContent params={params} />
      </Suspense>
    </Container>
  );
}

async function CategoryTagContent({ params }: Props) {
  const { slug, tag } = await params;
  return <CategoryListing slug={slug} tag={tag} />;
}
