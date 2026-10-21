import "server-only";
import { variantLabel } from "@/lib/format";
import { VARIANTS_BY_SKU_QUERY } from "@/lib/sanity/queries";
import { freshClient } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

/** Current, authoritative data for one purchasable variant. */
export type VariantInfo = {
  sku: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPrice: number; // USD cents
  stock: number;
  imageUrl: string | null;
};

/**
 * Reads current price and stock straight from Sanity (no cache, no CDN).
 * SKUs that no longer exist are simply absent from the result.
 */
export async function lookupVariants(skus: string[]) {
  const found = new Map<string, VariantInfo>();
  if (skus.length === 0) return found;

  const products = await freshClient.fetch(VARIANTS_BY_SKU_QUERY, { skus });
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      const image = variant.image ?? product.image;
      found.set(variant.sku, {
        sku: variant.sku,
        productSlug: product.slug,
        productName: product.name,
        variantLabel: variantLabel(variant),
        unitPrice: variant.price,
        stock: variant.stock,
        imageUrl: image ? urlFor(image).width(600).url() : null,
      });
    }
  }
  return found;
}
