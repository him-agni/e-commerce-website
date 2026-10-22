import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAssistantTools } from "@/lib/ai/tools";
import type { CatalogProduct } from "@/lib/ai/search";

const { getAssistantCatalog, getCategories, getCategoryTags, getProduct, fetchOrders } = vi.hoisted(() => ({
  getAssistantCatalog: vi.fn(),
  getCategories: vi.fn(),
  getCategoryTags: vi.fn(),
  getProduct: vi.fn(),
  fetchOrders: vi.fn(),
}));

vi.mock("@/lib/sanity/data", () => ({ getAssistantCatalog, getCategories, getCategoryTags, getProduct }));
vi.mock("@/sanity/lib/client", () => ({ freshClient: { fetch: fetchOrders } }));
vi.mock("@/sanity/lib/image", () => ({
  urlFor: () => ({ width: () => ({ height: () => ({ fit: () => ({ url: () => "https://img.test/p.jpg" }) }) }) }),
}));

// The AI library calls execute(input, options); the tools here ignore the options.
const run = <T,>(tool: { execute?: unknown }, input: unknown) =>
  (tool.execute as (i: unknown, o: unknown) => Promise<T>)(input, { toolCallId: "t", messages: [] });

const bed: CatalogProduct & { image: unknown } = {
  name: "Aspen Slatted Bed",
  slug: "aspen-slatted-bed",
  description: "A solid oak frame. ".repeat(20),
  material: "Solid oak",
  category: { title: "Beds", slug: "beds" },
  tags: null,
  minPrice: 109900,
  maxPrice: 129900,
  inStock: true,
  colors: ["Natural Oak", null],
  sizes: ["Queen", "King"],
  designs: [],
  image: { asset: { _ref: "image-x" } },
};

beforeEach(() => {
  [getAssistantCatalog, getCategories, getCategoryTags, getProduct, fetchOrders].forEach((m) => m.mockReset());
});

describe("searchProducts", () => {
  const { searchProducts } = createAssistantTools({ userId: null });

  it("returns product cards with real links and formatted prices", async () => {
    getAssistantCatalog.mockResolvedValue([bed]);
    const result = await run<{ count: number; products: Record<string, unknown>[] }>(searchProducts, { query: "bed" });

    expect(result.count).toBe(1);
    expect(result.products[0]).toMatchObject({
      name: "Aspen Slatted Bed",
      url: "/products/aspen-slatted-bed",
      category: "Beds",
      price: "$1,099 to $1,299",
      inStock: true,
      colors: ["Natural Oak"],
      imageUrl: "https://img.test/p.jpg",
    });
    expect(String(result.products[0].summary).length).toBeLessThanOrEqual(141);
  });

  it("shows hashtags with a # in front", async () => {
    getAssistantCatalog.mockResolvedValue([{ ...bed, name: "Cedar Night Stand", tags: ["night-stand", null] }]);
    const result = await run<{ products: { hashtags: string[] }[] }>(searchProducts, { query: "night stand" });
    expect(result.products[0].hashtags).toEqual(["#night-stand"]);
  });

  it("shows a single price when every option costs the same", async () => {
    getAssistantCatalog.mockResolvedValue([{ ...bed, maxPrice: bed.minPrice }]);
    const result = await run<{ products: { price: string }[] }>(searchProducts, { query: "bed" });
    expect(result.products[0].price).toBe("$1,099");
  });

  it("hints at what to do when nothing matches", async () => {
    getAssistantCatalog.mockResolvedValue([bed]);
    const result = await run<{ count: number; hint?: string }>(searchProducts, { query: "helicopter" });
    expect(result.count).toBe(0);
    expect(result.hint).toMatch(/listCategories/);
  });
});

describe("getProductDetails", () => {
  const { getProductDetails } = createAssistantTools({ userId: null });

  it("says when the product does not exist", async () => {
    getProduct.mockResolvedValue(null);
    expect(await run(getProductDetails, { slug: "nope" })).toEqual({ found: false });
  });

  it("lists each option with its price and an availability label", async () => {
    getProduct.mockResolvedValue({
      name: "Aspen Slatted Bed",
      slug: "aspen-slatted-bed",
      category: { title: "Beds" },
      tags: ["bed-frame"],
      material: "Solid oak",
      description: "A solid oak frame.",
      variants: [
        { color: "Natural Oak", size: "Queen", design: null, price: 109900, stock: 12 },
        { color: "Natural Oak", size: "King", design: null, price: 129900, stock: 3 },
        { color: "Weathered Gray", size: "Queen", design: null, price: 109900, stock: 0 },
      ],
    });
    const result = await run<{ found: boolean; variants: { option: string; price: string; availability: string }[] }>(
      getProductDetails,
      { slug: "aspen-slatted-bed" },
    );

    expect(result.found).toBe(true);
    expect(result.variants).toEqual([
      { option: "Natural Oak / Queen", price: "$1,099", availability: "in stock" },
      { option: "Natural Oak / King", price: "$1,299", availability: "only 3 left" },
      { option: "Weathered Gray / Queen", price: "$1,099", availability: "sold out" },
    ]);
  });
});

describe("listCategories", () => {
  it("lists each category with its hashtags", async () => {
    getCategories.mockResolvedValue([
      { title: "Chairs", slug: "chairs", description: "Seating" },
      { title: "Beds", slug: "beds", description: "Sleep" },
    ]);
    getCategoryTags.mockResolvedValue([{ slug: "chairs", tags: ["accent-chair", "rocking-chair"] }]);

    const { listCategories } = createAssistantTools({ userId: null });
    expect(await run(listCategories, {})).toEqual([
      { name: "Chairs", url: "/categories/chairs", description: "Seating", hashtags: ["#accent-chair", "#rocking-chair"] },
      { name: "Beds", url: "/categories/beds", description: "Sleep", hashtags: [] },
    ]);
  });
});

describe("getMyOrders", () => {
  it("tells a signed-out visitor to sign in, without reading any orders", async () => {
    const { getMyOrders } = createAssistantTools({ userId: null });
    const result = await run<{ signedIn: boolean }>(getMyOrders, {});

    expect(result.signedIn).toBe(false);
    expect(fetchOrders).not.toHaveBeenCalled();
  });

  it("reads orders for the signed-in user only", async () => {
    fetchOrders.mockResolvedValue([
      {
        orderNumber: "MF-1234ABCD",
        createdAt: "2026-10-01T12:00:00.000Z",
        status: "paid",
        total: 219800,
        items: [{ productName: "Aspen Slatted Bed", variantLabel: "Natural Oak / Queen", quantity: 2 }],
      },
    ]);
    const { getMyOrders } = createAssistantTools({ userId: "user_123" });
    const result = await run(getMyOrders, {});

    expect(fetchOrders).toHaveBeenCalledWith(expect.anything(), { userId: "user_123" });
    expect(result).toEqual({
      signedIn: true,
      orders: [
        {
          orderNumber: "MF-1234ABCD",
          placedOn: "2026-10-01",
          status: "paid",
          total: "$2,198",
          items: [{ name: "Aspen Slatted Bed", option: "Natural Oak / Queen", quantity: 2 }],
        },
      ],
    });
  });

  it("returns at most five orders", async () => {
    fetchOrders.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => ({ orderNumber: `MF-${i}`, createdAt: null, status: "paid", total: 100, items: [] })),
    );
    const { getMyOrders } = createAssistantTools({ userId: "user_123" });
    const result = await run<{ orders: unknown[] }>(getMyOrders, {});
    expect(result.orders).toHaveLength(5);
  });

  it("takes no input, so the model cannot ask for someone else's orders", () => {
    const { getMyOrders } = createAssistantTools({ userId: "user_123" });
    const schema = getMyOrders.inputSchema as { safeParse: (v: unknown) => { success: boolean; data?: unknown } };
    expect(schema.safeParse({ userId: "user_other" }).data).toEqual({});
  });
});
