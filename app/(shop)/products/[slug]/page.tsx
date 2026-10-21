import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetails } from "@/components/product/product-details";
import { ProductPageSkeleton } from "@/components/product/skeletons";
import { Container } from "@/components/site/container";
import { getProduct, getProductSlugs } from "@/lib/sanity/data";
import { SITE_NAME, siteUrl } from "@/lib/site";
import { urlFor } from "@/sanity/lib/image";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const cover = product.images[0];
  return {
    title: product.name,
    description: product.description ?? undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description ?? undefined,
      url: `/products/${product.slug}`,
      images: cover
        ? [{ url: urlFor(cover).width(1200).height(630).fit("crop").url(), width: 1200, height: 630, alt: product.name }]
        : undefined,
    },
  };
}

// The page stays synchronous so the shell (and the skeleton) is available instantly;
// reading params happens inside the Suspense boundary.
export default function ProductPage({ params }: Props) {
  return (
    <Container className="py-10">
      <Suspense fallback={<ProductPageSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </Container>
  );
}

async function ProductContent({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const prices = product.variants.map((v) => v.price);
  // Structured data so search engines can show price and availability (schema.org Product).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    material: product.material ?? undefined,
    category: product.category.title,
    image: product.images.slice(0, 4).map((image) => urlFor(image).width(1200).url()),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "AggregateOffer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "USD",
      lowPrice: (Math.min(...prices) / 100).toFixed(2),
      highPrice: (Math.max(...prices) / 100).toFixed(2),
      offerCount: product.variants.length,
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so product text can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="blur-in mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/categories/${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>
      <ProductDetails product={product} />
    </>
  );
}
