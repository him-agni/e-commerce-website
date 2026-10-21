"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useHydrated } from "@/lib/use-hydrated";
import { selectWishlistCount, useWishlist } from "@/lib/wishlist/store";

export function WishlistLink() {
  const hydrated = useHydrated();
  const count = useWishlist(selectWishlistCount);
  const shown = hydrated ? count : 0;

  return (
    <Link
      href="/wishlist"
      aria-label={shown > 0 ? `Wishlist, ${shown} saved` : "Wishlist"}
      className="relative text-muted-foreground transition-colors hover:text-foreground"
    >
      <Heart className="size-5" />
      {shown > 0 && (
        <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-wood text-[10px] font-medium text-wood-foreground">
          {shown > 9 ? "9+" : shown}
        </span>
      )}
    </Link>
  );
}
