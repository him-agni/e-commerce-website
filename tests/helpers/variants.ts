import type { VariantInfo } from "@/lib/cart/lookup";

/** A purchasable variant as `lookupVariants` would return it. Override only what a test cares about. */
export function variant(overrides: Partial<VariantInfo> = {}): VariantInfo {
  return {
    sku: "ASPEN-111",
    productId: "product-aspen",
    variantKey: "aspen-111",
    productSlug: "aspen",
    productName: "Aspen Slatted Bed",
    variantLabel: "Natural Oak / Queen",
    unitPrice: 109900,
    stock: 5,
    imageUrl: "https://cdn.sanity.io/images/p/d/aspen.jpg",
    ...overrides,
  };
}

export const variantMap = (...variants: VariantInfo[]) => new Map(variants.map((v) => [v.sku, v]));
