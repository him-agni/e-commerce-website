"use server";

import { lookupVariants, type VariantInfo } from "./lookup";

const MAX_SKUS = 50;

/** Fresh price, stock and image for the SKUs in a cart. Missing SKUs are no longer sold. */
export async function getCartVariants(skus: string[]): Promise<VariantInfo[]> {
  const unique = [...new Set(skus.filter((s) => typeof s === "string"))].slice(
    0,
    MAX_SKUS,
  );
  return [...(await lookupVariants(unique)).values()];
}
