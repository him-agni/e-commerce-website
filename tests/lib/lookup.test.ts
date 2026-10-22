import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCartVariants } from "@/lib/cart/actions";
import { lookupVariants } from "@/lib/cart/lookup";

const { fetch } = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock("@/sanity/lib/client", () => ({ freshClient: { fetch } }));
vi.mock("@/sanity/lib/image", () => ({
  urlFor: (source: { id: string }) => ({ width: (w: number) => ({ url: () => `https://img.test/${source.id}?w=${w}` }) }),
}));

const product = {
  _id: "product-aspen",
  name: "Aspen Slatted Bed",
  slug: "aspen-slatted-bed",
  image: { id: "product-photo" },
  variants: [
    { _key: "aspen-111", sku: "ASPEN-111", color: "Natural Oak", size: "Queen", design: "Slatted", price: 109900, stock: 4, image: null },
    { _key: "aspen-211", sku: "ASPEN-211", color: "Weathered Gray", size: "Queen", design: null, price: 112900, stock: 0, image: { id: "gray-photo" } },
  ],
};

beforeEach(() => fetch.mockReset());

describe("lookupVariants", () => {
  it("does not query Sanity for an empty list", async () => {
    expect((await lookupVariants([])).size).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps each variant to its authoritative price, stock and label", async () => {
    fetch.mockResolvedValue([product]);
    const found = await lookupVariants(["ASPEN-111", "ASPEN-211"]);

    expect(fetch).toHaveBeenCalledWith(expect.anything(), { skus: ["ASPEN-111", "ASPEN-211"] });
    expect(found.get("ASPEN-111")).toEqual({
      sku: "ASPEN-111",
      productId: "product-aspen",
      variantKey: "aspen-111",
      productSlug: "aspen-slatted-bed",
      productName: "Aspen Slatted Bed",
      variantLabel: "Natural Oak / Queen / Slatted",
      unitPrice: 109900,
      stock: 4,
      imageUrl: "https://img.test/product-photo?w=600",
    });
  });

  it("uses a variant's own photo when it has one", async () => {
    fetch.mockResolvedValue([product]);
    const found = await lookupVariants(["ASPEN-211"]);
    expect(found.get("ASPEN-211")?.imageUrl).toBe("https://img.test/gray-photo?w=600");
  });

  it("leaves out skus that no longer exist", async () => {
    fetch.mockResolvedValue([]);
    expect((await lookupVariants(["GONE-1"])).size).toBe(0);
  });
});

describe("getCartVariants", () => {
  it("returns fresh data for the skus in a cart", async () => {
    // Sanity only returns the variants whose sku was asked for.
    fetch.mockResolvedValue([{ ...product, variants: [product.variants[0]] }]);
    const result = await getCartVariants(["ASPEN-111"]);
    expect(result.map((v) => v.sku)).toEqual(["ASPEN-111"]);
  });

  it("removes duplicates and non-strings before asking Sanity", async () => {
    fetch.mockResolvedValue([]);
    await getCartVariants(["A", "A", 5 as unknown as string, "B"]);
    expect(fetch).toHaveBeenCalledWith(expect.anything(), { skus: ["A", "B"] });
  });

  it("looks up at most 50 skus", async () => {
    fetch.mockResolvedValue([]);
    await getCartVariants(Array.from({ length: 80 }, (_, i) => `SKU-${i}`));
    expect(fetch.mock.calls[0][1].skus).toHaveLength(50);
  });
});
