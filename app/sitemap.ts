import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getCategoryTags, getProductSlugs } from "@/lib/sanity/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, productSlugs] = await Promise.all([getCategoryTags(), getProductSlugs()]);

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...categories.flatMap((category) => [
      {
        url: `${siteUrl}/categories/${category.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      ...category.tags.map((tag) => ({
        url: `${siteUrl}/categories/${category.slug}/${tag}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ]),
    ...productSlugs.map((slug) => ({
      url: `${siteUrl}/products/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
