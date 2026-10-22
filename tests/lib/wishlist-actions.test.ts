import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWishlistProducts } from "@/lib/wishlist/actions";

const { fetch } = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/sanity/lib/client", () => ({ client: { fetch } }));

beforeEach(() => {
  fetch.mockReset();
  fetch.mockResolvedValue([{ slug: "aspen-slatted-bed" }]);
});

describe("getWishlistProducts", () => {
  it("returns card data for the saved products", async () => {
    expect(await getWishlistProducts(["aspen-slatted-bed"])).toEqual([{ slug: "aspen-slatted-bed" }]);
    expect(fetch).toHaveBeenCalledWith(expect.anything(), { slugs: ["aspen-slatted-bed"] });
  });

  it("skips Sanity entirely for an empty wishlist", async () => {
    expect(await getWishlistProducts([])).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("drops duplicates, empty, non-string and over-long slugs", async () => {
    await getWishlistProducts(["a", "a", "", 7 as unknown as string, "x".repeat(101), "b"]);
    expect(fetch).toHaveBeenCalledWith(expect.anything(), { slugs: ["a", "b"] });
  });

  it("asks for at most 50 products", async () => {
    await getWishlistProducts(Array.from({ length: 80 }, (_, i) => `p-${i}`));
    expect(fetch.mock.calls[0][1].slugs).toHaveLength(50);
  });
});
