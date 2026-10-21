"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { selectCount, useCart } from "@/lib/cart/store";
import { useHydrated } from "@/lib/use-hydrated";

export function CartLink() {
  const hydrated = useHydrated();
  const count = useCart(selectCount);
  const shown = hydrated ? count : 0;

  return (
    <Link
      href="/cart"
      aria-label={shown > 0 ? `Cart, ${shown} items` : "Cart"}
      className="relative text-muted-foreground transition-colors hover:text-foreground"
    >
      <ShoppingBag className="size-5" />
      {shown > 0 && (
        <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {shown > 9 ? "9+" : shown}
        </span>
      )}
    </Link>
  );
}
