// Ranks catalog products against a shopper's words. Pure functions, no I/O, so it is easy to test.
// The catalog is small (dozens of products), so ranking in code beats raw text matching:
// it tolerates plurals, synonyms (couch/sofa) and extra descriptive words ("sturdy", "cozy").

export type CatalogProduct = {
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  category: { title: string; slug: string };
  minPrice: number; // USD cents
  maxPrice: number;
  inStock: boolean;
  colors: (string | null)[];
  sizes: (string | null)[];
  designs: (string | null)[];
};

export type SearchFilters = {
  query?: string;
  category?: string;
  /** US dollars */
  maxPrice?: number;
  /** US dollars */
  minPrice?: number;
  includeSoldOut?: boolean;
};

const STOPWORDS = new Set([
  "a", "an", "the", "for", "and", "or", "of", "to", "in", "on", "with", "without", "my", "me",
  "i", "we", "you", "your", "need", "want", "looking", "look", "find", "show", "get", "buy",
  "some", "any", "good", "great", "nice", "best", "that", "this", "is", "are", "do", "does",
  "have", "has", "under", "over", "below", "above", "less", "than", "more", "about", "around",
  "please", "something", "item", "items", "piece", "pieces", "furniture", "home", "house",
  "room", "sturdy", "cozy", "comfortable", "comfy", "pretty", "beautiful", "cheap", "affordable",
]);

// Shopper words that mean something different from the words we use in the catalog.
const SYNONYMS: Record<string, string[]> = {
  couch: ["sofa", "sectional"],
  sofa: ["couch", "sectional"],
  loveseat: ["sofa", "couch"],
  sectional: ["sofa", "couch"],
  pillow: ["cushion"],
  throw: ["cushion"],
  carpet: ["rug"],
  runner: ["rug"],
  drape: ["curtain"],
  blind: ["curtain"],
  dresser: ["chest", "drawer"],
  drawers: ["chest", "drawer"],
  bedside: ["night", "stand"],
  nightstand: ["night", "stand"],
  tv: ["media", "console"],
  television: ["tv", "media", "console"],
  light: ["lamp", "chandelier"],
  lighting: ["lamp", "chandelier"],
  bulb: ["lamp"],
  armchair: ["chair", "accent"],
  rocker: ["chair", "rocking"],
  stool: ["chair"],
  seat: ["chair"],
  wooden: ["wood", "oak", "pine"],
};

/** Lowercase, strip punctuation, drop a trailing plural "s". */
function stem(word: string) {
  return word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

function tokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(stem);
}

function queryTerms(query: string) {
  const base = tokens(query).filter((t) => !STOPWORDS.has(t) && t.length > 1);
  const expanded = new Set(base);
  for (const term of base) for (const synonym of SYNONYMS[term] ?? []) expanded.add(stem(synonym));
  return { base, expanded: [...expanded] };
}

/** True when some word in the text starts with the term ("wood" matches "wooden"). */
function hasTerm(words: string[], term: string) {
  return words.some((w) => w === term || (term.length >= 3 && w.startsWith(term)));
}

export function findCategory(categories: { title: string; slug: string }[], input: string) {
  const wanted = tokens(input).filter((t) => !STOPWORDS.has(t));
  if (wanted.length === 0) return undefined;
  return categories.find((category) => {
    const words = tokens(`${category.title} ${category.slug}`);
    return wanted.every((term) => hasTerm(words, term));
  });
}

export function rankProducts<T extends CatalogProduct>(
  catalog: T[],
  filters: SearchFilters,
  limit = 6,
): T[] {
  const categories = [
    ...new Map(catalog.map((p) => [p.category.slug, p.category])).values(),
  ];
  const matchedCategory = filters.category
    ? findCategory(categories, filters.category)
    : undefined;

  // A category the shopper named that we do not recognise is treated as extra search words.
  const query = [filters.query, matchedCategory ? "" : filters.category]
    .filter(Boolean)
    .join(" ");
  const { base, expanded } = queryTerms(query);

  const scored = catalog
    .filter((p) => {
      if (matchedCategory && p.category.slug !== matchedCategory.slug) return false;
      if (!filters.includeSoldOut && !p.inStock) return false;
      if (filters.maxPrice !== undefined && p.minPrice > filters.maxPrice * 100) return false;
      if (filters.minPrice !== undefined && p.maxPrice < filters.minPrice * 100) return false;
      return true;
    })
    .map((p) => {
      const name = tokens(p.name);
      const category = tokens(`${p.category.title} ${p.category.slug}`);
      const material = tokens(p.material ?? "");
      const options = tokens([...p.colors, ...p.sizes, ...p.designs].filter(Boolean).join(" "));
      const description = tokens(p.description ?? "");

      const termScore = (term: string) =>
        (hasTerm(name, term) ? 4 : 0) +
        (hasTerm(category, term) ? 4 : 0) +
        (hasTerm(material, term) ? 2 : 0) +
        (hasTerm(options, term) ? 2 : 0) +
        (hasTerm(description, term) ? 1 : 0);

      // What the shopper literally said counts fully; synonym matches count for less.
      let score = 0;
      let matchedBase = 0;
      for (const term of expanded) {
        const s = termScore(term);
        if (s === 0) continue;
        const literal = base.includes(term);
        score += literal ? s : s * 0.6;
        if (literal) matchedBase++;
      }
      if (base.length > 1 && matchedBase === base.length) score += 3; // matched every word

      // In "linen sofa" the last word is the thing being bought and the rest describe it,
      // so a product of that type should outrank one that merely shares an adjective.
      const head = base[base.length - 1];
      if (base.length > 1 && head) {
        const headTerms = [head, ...(SYNONYMS[head] ?? []).map(stem)];
        if (headTerms.some((t) => hasTerm(name, t) || hasTerm(category, t))) score += 5;
      }
      return { product: p, score };
    });

  const hasQuery = expanded.length > 0;
  return scored
    .filter((s) => !hasQuery || s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.product.inStock) - Number(a.product.inStock) ||
        a.product.minPrice - b.product.minPrice,
    )
    .slice(0, limit)
    .map((s) => s.product);
}
