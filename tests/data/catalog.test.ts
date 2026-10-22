import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { LEGACY_CATEGORY_REDIRECTS } from "@/lib/legacy-categories";
import { categories } from "@/scripts/seed-data.mjs";

type Product = {
  name: string;
  description: string;
  material: string;
  base: number;
  colors: string[];
  sizes: [string, number][];
  designs: string[];
};
type Group = { tag: string | null; query: string; products: Product[] };
type Category = { slug: string; title: string; description: string; groups: Group[] };

const catalog = categories as Category[];
const products = catalog.flatMap((c) => c.groups.flatMap((g) => g.products));
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

describe("seed catalog", () => {
  it("has 9 categories and 60 products", () => {
    expect(catalog).toHaveLength(9);
    expect(products).toHaveLength(60);
  });

  it("gives every category a unique slug, title and description", () => {
    const slugs = catalog.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of catalog) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
    }
  });

  it("uses only kebab-case hashtags, each unique across the store", () => {
    const tags = catalog.flatMap((c) => c.groups.map((g) => g.tag)).filter((t): t is string => t !== null);
    for (const tag of tags) expect(tag).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it("either tags every group or none, per category", () => {
    for (const c of catalog) {
      const tagged = c.groups.filter((g) => g.tag !== null).length;
      expect([0, c.groups.length]).toContain(tagged);
    }
  });

  it("gives every product a unique slug (they become document ids)", () => {
    const slugs = products.map((p) => slugify(p.name));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every product something to buy, at a sensible price", () => {
    for (const p of products) {
      expect(p.colors.length, p.name).toBeGreaterThan(0);
      expect(p.sizes.length, p.name).toBeGreaterThan(0);
      expect(p.base, p.name).toBeGreaterThan(0);
      for (const [label, delta] of p.sizes) {
        expect(label.length, p.name).toBeGreaterThan(0);
        expect(p.base + delta, p.name).toBeGreaterThan(0);
      }
    }
  });

  it("has a search query for every group's photos", () => {
    for (const c of catalog) for (const g of c.groups) expect(g.query.length, c.slug).toBeGreaterThan(0);
  });
});

describe("legacy category redirects", () => {
  const tagsByCategory = new Map(
    catalog.map((c) => [c.slug, new Set(c.groups.map((g) => g.tag).filter(Boolean))]),
  );

  it("covers the 17 categories that became hashtags", () => {
    expect(LEGACY_CATEGORY_REDIRECTS).toHaveLength(17);
  });

  it("sends every old address to a category and hashtag that exist", () => {
    for (const { from, to } of LEGACY_CATEGORY_REDIRECTS) {
      const [, , category, tag] = to.split("/");
      expect(tagsByCategory.has(category), `${from} -> ${to}`).toBe(true);
      expect(tagsByCategory.get(category)?.has(tag), `${from} -> ${to}`).toBe(true);
    }
  });

  it("never redirects from a category that still exists", () => {
    const current = new Set(catalog.map((c) => c.slug));
    for (const { from } of LEGACY_CATEGORY_REDIRECTS) expect(current.has(from), from).toBe(false);
  });

  it("is wired into next.config as permanent redirects", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toHaveLength(LEGACY_CATEGORY_REDIRECTS.length);
    expect(redirects).toContainEqual({
      source: "/categories/couches",
      destination: "/categories/sofas/couch",
      permanent: true,
    });
    expect(redirects?.every((r) => r.permanent)).toBe(true);
  });
});
