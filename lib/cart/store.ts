import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * A cart line. Everything except sku and quantity is a snapshot for display;
 * the server re-reads price and stock from Sanity at cart view and at checkout.
 */
export type CartItem = {
  sku: string;
  productSlug: string;
  name: string;
  variantLabel: string;
  imageUrl: string | null;
  unitPrice: number; // USD cents
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  /** Adds one or more of a variant, capped at its stock. Returns how many were added. */
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => number;
  setQuantity: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const existing = get().items.find((i) => i.sku === item.sku);
        const current = existing?.quantity ?? 0;
        const next = Math.min(current + quantity, item.stock);
        const added = next - current;
        if (added <= 0) return 0;
        set((state) => ({
          items: existing
            ? state.items.map((i) =>
                i.sku === item.sku ? { ...i, ...item, quantity: next } : i,
              )
            : [...state.items, { ...item, quantity: next }],
        }));
        return added;
      },
      setQuantity: (sku, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.sku !== sku)
              : state.items.map((i) => (i.sku === sku ? { ...i, quantity } : i)),
        })),
      removeItem: (sku) =>
        set((state) => ({ items: state.items.filter((i) => i.sku !== sku) })),
      clear: () => set({ items: [] }),
    }),
    { name: "my-farmhouse-cart", version: 1 },
  ),
);

export const selectCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);
