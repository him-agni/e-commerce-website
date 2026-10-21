import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { urlFor } from "@/sanity/lib/image";
import type { FEATURED_PRODUCTS_QUERY_RESULT } from "@/sanity/types";

export type ProductCardData = FEATURED_PRODUCTS_QUERY_RESULT[number];

export function ProductCard({
  product,
  priority = false,
  headingLevel = 3,
}: {
  product: ProductCardData;
  priority?: boolean;
  /** Heading level for the product name, so headings follow the page's outline (h2 under an h1, h3 under an h2). */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const hasRange = product.minPrice !== product.maxPrice;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block transition-transform duration-500 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
        {product.image && (
          <Image
            src={urlFor(product.image).width(800).url()}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            {...(priority ? { loading: "eager", fetchPriority: "high" } : {})}
          />
        )}
        {!product.inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {product.category.title}
        </p>
        <Heading className="font-heading text-lg leading-snug">{product.name}</Heading>
        <p className="text-sm text-muted-foreground">
          {hasRange ? "From " : ""}
          {formatPrice(product.minPrice)}
        </p>
      </div>
    </Link>
  );
}
