/** Hashtags group products inside a category. They are stored as lowercase slugs, e.g. "accent-chair". */

export const tagText = (slug: string) => `#${slug}`;

/** "accent-chair" -> "Accent chair", for page titles. */
export function tagTitle(slug: string) {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The distinct tags used by a set of products, sorted. */
export function tagsOf(products: { tags: (string | null)[] | null }[]) {
  return [...new Set(products.flatMap((p) => p.tags ?? []).filter((t): t is string => !!t))].sort();
}
