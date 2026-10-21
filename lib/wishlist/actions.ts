"use server";

import { PRODUCTS_BY_SLUGS_QUERY } from "@/lib/sanity/queries";
import { client } from "@/sanity/lib/client";

const MAX_SLUGS = 50;

/** Current card data for the products on a wishlist. Products that no longer exist are simply absent. */
export async function getWishlistProducts(slugs: string[]) {
  const unique = [
    ...new Set(slugs.filter((s) => typeof s === "string" && s.length > 0 && s.length <= 100)),
  ].slice(0, MAX_SLUGS);
  if (unique.length === 0) return [];
  return client.fetch(PRODUCTS_BY_SLUGS_QUERY, { slugs: unique });
}
