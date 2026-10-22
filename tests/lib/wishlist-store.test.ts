// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { selectWishlistCount, useWishlist } from "@/lib/wishlist/store";

beforeEach(() => {
  localStorage.clear();
  useWishlist.setState({ slugs: [] });
});

describe("wishlist store", () => {
  it("saves a product, newest first, and reports it is now saved", () => {
    expect(useWishlist.getState().toggle("aspen-bed")).toBe(true);
    expect(useWishlist.getState().toggle("oak-table")).toBe(true);
    expect(useWishlist.getState().slugs).toEqual(["oak-table", "aspen-bed"]);
  });

  it("toggling a saved product removes it", () => {
    useWishlist.getState().toggle("aspen-bed");
    expect(useWishlist.getState().toggle("aspen-bed")).toBe(false);
    expect(useWishlist.getState().slugs).toEqual([]);
  });

  it("removes a product", () => {
    useWishlist.getState().toggle("a");
    useWishlist.getState().toggle("b");
    useWishlist.getState().remove("a");
    expect(useWishlist.getState().slugs).toEqual(["b"]);
  });

  it("keeps at most 50 items, dropping the oldest", () => {
    for (let i = 0; i < 55; i++) useWishlist.getState().toggle(`product-${i}`);
    const { slugs } = useWishlist.getState();
    expect(slugs).toHaveLength(50);
    expect(slugs[0]).toBe("product-54");
    expect(slugs).not.toContain("product-0");
  });

  it("counts saved products", () => {
    useWishlist.getState().toggle("a");
    useWishlist.getState().toggle("b");
    expect(selectWishlistCount(useWishlist.getState())).toBe(2);
  });

  it("is saved in this browser's localStorage only", () => {
    useWishlist.getState().toggle("a");
    expect(localStorage.getItem("my-farmhouse-wishlist")).toContain('"a"');
  });
});
