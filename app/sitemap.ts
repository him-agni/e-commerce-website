import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getCategorySlugs, getProductSlugs } from "@/lib/sanity/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorySlugs, productSlugs] = await Promise.all([
    getCategorySlugs(),
    getProductSlugs(),
  ]);

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    ...categorySlugs.map((slug) => ({
      url: `${siteUrl}/categories/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...productSlugs.map((slug) => ({
      url: `${siteUrl}/products/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
