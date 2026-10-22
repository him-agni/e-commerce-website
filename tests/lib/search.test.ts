import { describe, expect, it } from "vitest";
import { findCategory, rankProducts, type CatalogProduct } from "@/lib/ai/search";

const sofas = { title: "Sofas", slug: "sofas" };
const chairs = { title: "Chairs", slug: "chairs" };
const tables = { title: "Accent Tables", slug: "accent-tables" };
const rugs = { title: "Soft Furnishings", slug: "soft-furnishings" };

function product(overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "name">): CatalogProduct {
  return {
    slug: overrides.name.toLowerCase().replace(/\s+/g, "-"),
    description: null,
    material: null,
    category: sofas,
    tags: null,
    minPrice: 100000,
    maxPrice: 100000,
    inStock: true,
    colors: [],
    sizes: [],
    designs: [],
    ...overrides,
  };
}

const catalog = [
  product({
    name: "Willow Linen Couch",
    category: sofas,
    tags: ["couch"],
    material: "Linen",
    minPrice: 129900,
    maxPrice: 149900,
  }),
  product({ name: "Harbor Sofa Set", category: sofas, tags: ["sofa-set"], minPrice: 249900, maxPrice: 249900 }),
  product({
    name: "Barn Linen Accent Chair",
    category: chairs,
    tags: ["accent-chair"],
    material: "Linen",
    minPrice: 44900,
    maxPrice: 44900,
  }),
  product({
    name: "Juniper Rocking Chair",
    category: chairs,
    tags: ["rocking-chair"],
    material: "Oak",
    minPrice: 38900,
    maxPrice: 38900,
  }),
  product({
    name: "Cedar Night Stand",
    category: tables,
    tags: ["night-stand"],
    material: "Pine",
    minPrice: 19900,
    maxPrice: 24900,
  }),
  product({
    name: "Sold Out Coffee Table",
    category: tables,
    tags: ["coffee-table"],
    inStock: false,
    minPrice: 29900,
    maxPrice: 29900,
  }),
  product({
    name: "Meadow Wool Rug",
    category: rugs,
    tags: ["rug"],
    material: "Wool",
    minPrice: 18900,
    maxPrice: 39900,
    colors: ["Cream", "Sage"],
  }),
];

const names = (list: CatalogProduct[]) => list.map((p) => p.name);

describe("rankProducts", () => {
  it("finds a product by its name", () => {
    expect(names(rankProducts(catalog, { query: "rocking chair" }))[0]).toBe("Juniper Rocking Chair");
  });

  it("treats couch and sofa as the same thing", () => {
    const result = names(rankProducts(catalog, { query: "sofa" }));
    expect(result).toContain("Willow Linen Couch");
    expect(result).toContain("Harbor Sofa Set");
  });

  it("matches hashtags", () => {
    expect(names(rankProducts(catalog, { query: "night stand" }))[0]).toBe("Cedar Night Stand");
  });

  it("tolerates plurals and ignores filler words", () => {
    const result = names(rankProducts(catalog, { query: "I am looking for some cozy rugs please" }));
    expect(result).toEqual(["Meadow Wool Rug"]);
  });

  it("ranks the thing being bought above one that shares an adjective", () => {
    const result = names(rankProducts(catalog, { query: "linen sofa" }));
    expect(result.indexOf("Willow Linen Couch")).toBeLessThan(result.indexOf("Barn Linen Accent Chair"));
  });

  it("finds products by material and color options", () => {
    expect(names(rankProducts(catalog, { query: "wool" }))).toEqual(["Meadow Wool Rug"]);
    expect(names(rankProducts(catalog, { query: "sage" }))).toEqual(["Meadow Wool Rug"]);
  });

  it("limits to a named category", () => {
    const result = rankProducts(catalog, { category: "Chairs" });
    expect(names(result).sort()).toEqual(["Barn Linen Accent Chair", "Juniper Rocking Chair"]);
  });

  it("limits by price in dollars, using each product's cheapest option", () => {
    const cheap = names(rankProducts(catalog, { maxPrice: 400 }));
    expect(cheap).toContain("Cedar Night Stand");
    expect(cheap).toContain("Meadow Wool Rug");
    expect(cheap).not.toContain("Harbor Sofa Set");

    const pricey = names(rankProducts(catalog, { minPrice: 1400 }));
    expect(pricey).toEqual(expect.arrayContaining(["Harbor Sofa Set", "Willow Linen Couch"]));
    expect(pricey).not.toContain("Cedar Night Stand");
  });

  it("hides sold-out products unless asked", () => {
    expect(names(rankProducts(catalog, { query: "coffee" }))).toEqual([]);
    expect(names(rankProducts(catalog, { query: "coffee", includeSoldOut: true }))).toEqual([
      "Sold Out Coffee Table",
    ]);
  });

  it("returns nothing when no word matches", () => {
    expect(rankProducts(catalog, { query: "helicopter" })).toEqual([]);
  });

  it("browses everything in stock when there is no query, cheapest first on ties", () => {
    const result = rankProducts(catalog, {}, 20);
    expect(result).toHaveLength(6);
    expect(result[0].name).toBe("Meadow Wool Rug");
  });

  it("returns at most the limit", () => {
    expect(rankProducts(catalog, {}, 2)).toHaveLength(2);
  });

  it("treats an unknown category as extra search words", () => {
    expect(names(rankProducts(catalog, { category: "rugs" }))).toEqual(["Meadow Wool Rug"]);
  });
});

describe("findCategory", () => {
  const categories = [sofas, chairs, tables, rugs];

  it("matches by title or slug, tolerating plurals", () => {
    expect(findCategory(categories, "Accent Tables")).toBe(tables);
    expect(findCategory(categories, "chair")).toBe(chairs);
    expect(findCategory(categories, "accent-tables")).toBe(tables);
  });

  it("returns nothing for text it does not recognise", () => {
    expect(findCategory(categories, "spaceships")).toBeUndefined();
    expect(findCategory(categories, "the")).toBeUndefined();
  });
});
