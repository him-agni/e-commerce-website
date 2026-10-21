import { cacheLife, cacheTag } from "next/cache";
import { client } from "@/sanity/lib/client";
import {
  ALL_PRODUCTS_QUERY,
  ASSISTANT_CATALOG_QUERY,
  CATEGORIES_QUERY,
  CATEGORY_BY_SLUG_QUERY,
  CATEGORY_SLUGS_QUERY,
  CATEGORY_TAGS_QUERY,
  FEATURED_PRODUCTS_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_SLUGS_QUERY,
  PRODUCTS_BY_CATEGORY_QUERY,
} from "./queries";

// Product data carries stock, so it is cached for minutes and tagged so the Stripe webhook
// can refresh it with revalidateTag("products") after an order. Categories change rarely.

export async function getCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  return client.fetch(CATEGORIES_QUERY);
}

export async function getCategory(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  return client.fetch(CATEGORY_BY_SLUG_QUERY, { slug });
}

export async function getCategorySlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  return client.fetch(CATEGORY_SLUGS_QUERY);
}

export async function getFeaturedProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return client.fetch(FEATURED_PRODUCTS_QUERY);
}

export async function getAllProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return client.fetch(ALL_PRODUCTS_QUERY);
}

export async function getProductsByCategory(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return client.fetch(PRODUCTS_BY_CATEGORY_QUERY, { slug });
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product:${slug}`);
  return client.fetch(PRODUCT_BY_SLUG_QUERY, { slug });
}

export async function getProductSlugs() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return client.fetch(PRODUCT_SLUGS_QUERY);
}

export async function getAssistantCatalog() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return client.fetch(ASSISTANT_CATALOG_QUERY);
}

/** Each category with the hashtags its products use, e.g. chairs -> accent-chair, dining-chair. */
export async function getCategoryTags() {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories", "products");
  const categories = await client.fetch(CATEGORY_TAGS_QUERY);
  return categories.map((c) => ({
    _id: c._id,
    title: c.title,
    slug: c.slug,
    tags: (c.tags ?? []).filter((t): t is string => !!t).sort(),
  }));
}
