"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist/store";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

/** Heart toggle that saves a product to this browser's wishlist. */
export function WishlistButton({ slug, name }: { slug: string; name: string }) {
  const hydrated = useHydrated();
  const saved = useWishlist((state) => state.slugs.includes(slug));
  const toggle = useWishlist((state) => state.toggle);
  // Saved state comes from localStorage, so only show it once the page is interactive.
  const active = hydrated && saved;

  return (
    <>
      <button
        type="button"
        aria-pressed={active}
        aria-label={active ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
        title={active ? "Saved to wishlist" : "Save to wishlist"}
        onClick={() => toggle(slug)}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-md border transition-colors hover:border-foreground",
          active && "border-wood",
        )}
      >
        <Heart
          aria-hidden
          className={cn(
            "size-5 transition-transform duration-300",
            active && "scale-110 fill-wood text-wood",
          )}
        />
      </button>
      <span role="status" className="sr-only">
        {active ? "Saved to wishlist" : ""}
      </span>
    </>
  );
}
