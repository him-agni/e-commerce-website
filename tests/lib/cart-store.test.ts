// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart/limits";
import { selectCount, useCart, type CartItem } from "@/lib/cart/store";

const sofa: Omit<CartItem, "quantity"> = {
  sku: "SOFA-111",
  productSlug: "sofa",
  name: "Sofa",
  variantLabel: "Grey",
  imageUrl: null,
  unitPrice: 99900,
  stock: 5,
};

beforeEach(() => {
  localStorage.clear();
  useCart.setState({ items: [] });
});

describe("cart store", () => {
  it("adds an item and merges repeats into one line", () => {
    expect(useCart.getState().addItem(sofa)).toBe(1);
    expect(useCart.getState().addItem(sofa, 2)).toBe(2);
    const { items } = useCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("never holds more than the stock", () => {
    expect(useCart.getState().addItem(sofa, 9)).toBe(5);
    expect(useCart.getState().addItem(sofa)).toBe(0);
    expect(useCart.getState().items[0].quantity).toBe(5);
  });

  it("never exceeds the per-line limit checkout accepts", () => {
    const plenty = { ...sofa, stock: 500 };
    expect(useCart.getState().addItem(plenty, 100)).toBe(MAX_QUANTITY_PER_LINE);
    expect(useCart.getState().items[0].quantity).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("adds nothing for a sold-out variant", () => {
    expect(useCart.getState().addItem({ ...sofa, stock: 0 })).toBe(0);
    expect(useCart.getState().items).toEqual([]);
  });

  it("refreshes the display snapshot when the same sku is added again", () => {
    useCart.getState().addItem(sofa);
    useCart.getState().addItem({ ...sofa, unitPrice: 89900 });
    expect(useCart.getState().items[0].unitPrice).toBe(89900);
  });

  it("changes a quantity, and removes the line when it reaches zero", () => {
    useCart.getState().addItem(sofa, 2);
    useCart.getState().setQuantity("SOFA-111", 4);
    expect(useCart.getState().items[0].quantity).toBe(4);
    useCart.getState().setQuantity("SOFA-111", 0);
    expect(useCart.getState().items).toEqual([]);
  });

  it("removes a line and clears the cart", () => {
    useCart.getState().addItem(sofa);
    useCart.getState().addItem({ ...sofa, sku: "RUG-1" });
    useCart.getState().removeItem("SOFA-111");
    expect(useCart.getState().items.map((i) => i.sku)).toEqual(["RUG-1"]);
    useCart.getState().clear();
    expect(useCart.getState().items).toEqual([]);
  });

  it("counts units across lines", () => {
    useCart.getState().addItem(sofa, 2);
    useCart.getState().addItem({ ...sofa, sku: "RUG-1" }, 3);
    expect(selectCount(useCart.getState())).toBe(5);
  });

  it("is saved in this browser's localStorage", () => {
    useCart.getState().addItem(sofa);
    const saved = JSON.parse(localStorage.getItem("my-farmhouse-cart") ?? "{}");
    expect(saved.state.items[0].sku).toBe("SOFA-111");
  });
});
