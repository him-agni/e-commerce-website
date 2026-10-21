import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  /** Product slugs, newest first. */
  slugs: string[];
  /** Adds the product if it is not saved, removes it if it is. Returns true when it is now saved. */
  toggle: (slug: string) => boolean;
  remove: (slug: string) => void;
};

const MAX_SAVED = 50;

/**
 * The wishlist lives in this browser only (localStorage). It is deliberately not stored in
 * Sanity: that dataset is publicly readable, and what a person saves is theirs.
 */
export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) => {
        const saved = get().slugs.includes(slug);
        set((state) => ({
          slugs: saved
            ? state.slugs.filter((s) => s !== slug)
            : [slug, ...state.slugs].slice(0, MAX_SAVED),
        }));
        return !saved;
      },
      remove: (slug) => set((state) => ({ slugs: state.slugs.filter((s) => s !== slug) })),
    }),
    { name: "my-farmhouse-wishlist", version: 1 },
  ),
);

export const selectWishlistCount = (state: WishlistState) => state.slugs.length;
