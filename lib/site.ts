export const SITE_NAME = "My Farmhouse";

/** Public origin of the site, used for canonical URLs, the sitemap and social previews. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
