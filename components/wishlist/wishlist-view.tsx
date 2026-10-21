"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { getWishlistProducts } from "@/lib/wishlist/actions";
import { useWishlist } from "@/lib/wishlist/store";

export function WishlistView() {
  const hydrated = useHydrated();
  const slugs = useWishlist((state) => state.slugs);
  const remove = useWishlist((state) => state.remove);
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [failed, setFailed] = useState(false);

  const key = slugs.join(",");
  useEffect(() => {
    if (!hydrated || !key) return;
    let cancelled = false;
    getWishlistProducts(key.split(","))
      .then((list) => {
        if (cancelled) return;
        setProducts(list);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, key]);

  if (!hydrated) return <ProductGridSkeleton count={4} />;

  if (slugs.length === 0) {
    return (
      <div className="py-16 text-center">
        <Heart className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <p className="mt-4 text-lg">Nothing saved yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the heart on any piece to keep it here for later. Your wishlist is saved on this
          device.
        </p>
        <Link
          href="/products"
          className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 px-6 text-base")}
        >
          Browse furniture
        </Link>
      </div>
    );
  }

  if (failed && !products) {
    return (
      <p role="alert" className="text-destructive">
        We could not load your wishlist. Please refresh the page to try again.
      </p>
    );
  }
  if (!products) return <ProductGridSkeleton count={Math.min(slugs.length, 8)} />;

  // Keep the order they were saved in, and skip anything that has since been removed from the store.
  const shown = slugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is ProductCardData => !!p);

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {shown.map((product) => (
        <li key={product._id} className="relative">
          <ProductCard product={product} headingLevel={2} />
          <button
            type="button"
            onClick={() => remove(product.slug)}
            aria-label={`Remove ${product.name} from wishlist`}
            title="Remove from wishlist"
            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-background/90 shadow transition-transform hover:scale-110"
          >
            <Heart className="size-4 fill-wood text-wood" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
