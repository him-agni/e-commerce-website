"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCartVariants } from "@/lib/cart/actions";
import type { VariantInfo } from "@/lib/cart/lookup";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";

type Live = { key: string; bySku: Record<string, VariantInfo> };
type CheckoutResponse = {
  url?: string;
  error?: string;
  issues?: { message: string }[];
};

export function CartView() {
  const hydrated = useHydrated();
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const { isLoaded, isSignedIn } = useUser();

  const [live, setLive] = useState<Live | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const skuKey = items
    .map((item) => item.sku)
    .sort()
    .join(",");

  // The server is the source of truth for price and stock; the cart only remembers SKUs.
  useEffect(() => {
    if (!hydrated || !skuKey) return;
    let cancelled = false;
    getCartVariants(skuKey.split(","))
      .then((variants) => {
        if (cancelled) return;
        setLive({
          key: skuKey,
          bySku: Object.fromEntries(variants.map((v) => [v.sku, v])),
        });
        setLoadFailed(false);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, skuKey, refresh]);

  if (!hydrated) {
    return <p className="py-16 text-center text-muted-foreground">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg">Your cart is empty.</p>
        <Link
          href="/products"
          className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 px-6 text-base")}
        >
          Browse furniture
        </Link>
      </div>
    );
  }

  const loaded = live?.key === skuKey;

  const lines = items.map((item) => {
    const info = loaded ? live.bySku[item.sku] : undefined;
    const blocked = loaded && (!info || info.stock === 0);
    const max = info ? info.stock : item.stock;
    const quantity = info ? Math.min(item.quantity, info.stock) : item.quantity;
    const unitPrice = info?.unitPrice ?? item.unitPrice;

    let notice: string | null = null;
    if (loaded && !info) notice = "No longer available. Remove it to continue.";
    else if (info && info.stock === 0) notice = "Out of stock. Remove it to continue.";
    else if (info && item.quantity > info.stock) notice = `Only ${info.stock} left.`;
    else if (info && info.unitPrice !== item.unitPrice) {
      notice = `Price updated from ${formatPrice(item.unitPrice)}.`;
    }

    return {
      item,
      name: info?.productName ?? item.name,
      variantLabel: info?.variantLabel ?? item.variantLabel,
      imageUrl: info?.imageUrl ?? item.imageUrl,
      blocked,
      max,
      quantity,
      unitPrice,
      notice,
    };
  });

  const blocked = lines.some((line) => line.blocked);
  const subtotal = lines.reduce(
    (sum, line) => (line.blocked ? sum : sum + line.unitPrice * line.quantity),
    0,
  );

  async function checkout() {
    setCheckingOut(true);
    setMessage(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({
            sku: line.item.sku,
            quantity: line.quantity,
          })),
        }),
      });
      const data: CheckoutResponse = await response.json().catch(() => ({}));
      if (response.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setMessage(
        data.issues?.map((issue) => issue.message).join(" ") ??
          data.error ??
          "Something went wrong. Please try again.",
      );
      if (response.status === 409) setRefresh((n) => n + 1);
    } catch {
      setMessage("We could not reach the server. Check your connection and try again.");
    }
    setCheckingOut(false);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <ul className="divide-y border-y">
        {lines.map((line) => (
          <li key={line.item.sku} className="flex gap-4 py-5">
            <Link
              href={`/products/${line.item.productSlug}`}
              className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted sm:size-28"
            >
              {line.imageUrl && (
                <Image
                  src={line.imageUrl}
                  alt={line.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/products/${line.item.productSlug}`}
                    className="font-heading text-lg leading-snug hover:underline"
                  >
                    {line.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{line.variantLabel}</p>
                </div>
                <p className="shrink-0">
                  {formatPrice(line.unitPrice * line.quantity)}
                </p>
              </div>
              {line.notice && (
                <p className="mt-1 text-sm text-wood" role="status">
                  {line.notice}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-md border">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${line.name}`}
                    className="p-2 hover:bg-muted disabled:opacity-40"
                    disabled={line.blocked || line.quantity <= 1}
                    onClick={() => setQuantity(line.item.sku, line.quantity - 1)}
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm" aria-live="polite">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${line.name}`}
                    className="p-2 hover:bg-muted disabled:opacity-40"
                    disabled={line.blocked || line.quantity >= line.max}
                    onClick={() => setQuantity(line.item.sku, line.quantity + 1)}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(line.item.sku)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-4 rounded-lg border bg-card p-6 lg:sticky lg:top-32">
        <h2 className="text-xl">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping (US)</dt>
            <dd>Free</dd>
          </div>
        </dl>
        <div className="flex justify-between border-t pt-4 text-lg">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {isLoaded && !isSignedIn ? (
          <SignInButton mode="modal" forceRedirectUrl="/cart">
            <Button size="lg" className="h-11 w-full text-base">
              Sign in to check out
            </Button>
          </SignInButton>
        ) : (
          <Button
            size="lg"
            className="h-11 w-full text-base"
            disabled={!isLoaded || !loaded || blocked || checkingOut}
            onClick={checkout}
          >
            {checkingOut ? "Starting checkout…" : "Check out"}
          </Button>
        )}

        {loadFailed && !loaded && (
          <p className="text-sm text-destructive" role="alert">
            We could not confirm current prices and stock.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => setRefresh((n) => n + 1)}
            >
              Try again
            </button>
          </p>
        )}
        {message && (
          <p className="text-sm text-destructive" role="alert">
            {message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Payments run in Stripe test mode. No real charges are made.
        </p>
      </aside>
    </div>
  );
}
