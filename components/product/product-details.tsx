"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/store";
import { formatPrice, variantLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PRODUCT_BY_SLUG_QUERY_RESULT } from "@/sanity/types";

type Product = NonNullable<PRODUCT_BY_SLUG_QUERY_RESULT>;
type Variant = Product["variants"][number];
type Dimension = "color" | "size" | "design";
type Selection = Record<Dimension, string | null>;
type GalleryImage = Product["images"][number] | NonNullable<Variant["image"]>;

const DIMENSIONS: { key: Dimension; label: string }[] = [
  { key: "color", label: "Color" },
  { key: "size", label: "Size" },
  { key: "design", label: "Design" },
];

function selectionFrom(variant: Variant): Selection {
  return {
    color: variant.color,
    size: variant.size,
    design: variant.design,
  };
}

function matches(variant: Variant, selection: Partial<Selection>) {
  return (Object.keys(selection) as Dimension[]).every(
    (dim) => (variant[dim] ?? null) === selection[dim],
  );
}

function buildGallery(product: Product) {
  const seen = new Set<string>();
  const gallery: { key: string; image: GalleryImage }[] = [];
  const add = (image: GalleryImage | null | undefined) => {
    const key = image?.asset?._ref;
    if (!image || !key || seen.has(key)) return;
    seen.add(key);
    gallery.push({ key, image });
  };
  product.images.forEach(add);
  product.designs?.forEach((design) => add(design.image));
  product.variants.forEach((variant) => add(variant.image));
  return gallery;
}

function stockMessage(stock: number) {
  if (stock === 0) return { text: "Out of stock", className: "text-destructive" };
  if (stock <= 5) return { text: `Only ${stock} left`, className: "text-wood" };
  return { text: "In stock", className: "text-muted-foreground" };
}

export function ProductDetails({ product }: { product: Product }) {
  const { variants } = product;
  const gallery = buildGallery(product);

  const [selection, setSelection] = useState<Selection>(() =>
    selectionFrom(variants.find((v) => v.stock > 0) ?? variants[0]),
  );
  const [activeKey, setActiveKey] = useState<string | undefined>(
    gallery[0]?.key,
  );

  const variant = variants.find((v) => matches(v, selection)) ?? variants[0];
  const activeImage = gallery.find((g) => g.key === activeKey) ?? gallery[0];
  const stock = stockMessage(variant.stock);

  const addItem = useCart((state) => state.addItem);
  const inCart = useCart(
    (state) => state.items.find((i) => i.sku === variant.sku)?.quantity ?? 0,
  );
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const atMax = inCart >= variant.stock;

  function addToCart() {
    const cover = gallery[0];
    const added = addItem({
      sku: variant.sku,
      productSlug: product.slug,
      name: product.name,
      variantLabel: variantLabel(variant),
      imageUrl: cover ? urlFor(cover.image).width(300).url() : null,
      unitPrice: variant.price,
      stock: variant.stock,
    });
    if (added > 0) setJustAdded(variant.sku);
  }

  function imageKeyFor(next: Variant) {
    const design = product.designs?.find((d) => d.name === next.design);
    return next.image?.asset?._ref ?? design?.image?.asset?._ref;
  }

  function choose(dim: Dimension, value: string) {
    const wanted = { ...selection, [dim]: value };
    // If the exact combination does not exist, fall back to the first variant with this value.
    const next =
      variants.find((v) => matches(v, wanted)) ??
      variants.find((v) => (v[dim] ?? null) === value);
    if (!next) return;
    setSelection(selectionFrom(next));
    const key = imageKeyFor(next);
    if (key) setActiveKey(key);
  }

  function isSoldOut(dim: Dimension, value: string) {
    const others = { ...selection };
    delete (others as Partial<Selection>)[dim];
    const candidates = variants.filter(
      (v) => (v[dim] ?? null) === value && matches(v, others),
    );
    return candidates.length > 0 && candidates.every((v) => v.stock === 0);
  }

  return (
    <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {activeImage && (
            <Image
              src={urlFor(activeImage.image).width(1200).url()}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        {gallery.length > 1 && (
          <ul className="grid grid-cols-5 gap-2">
            {gallery.map(({ key, image }, index) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setActiveKey(key)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={key === activeImage?.key}
                  className={cn(
                    "relative block aspect-square w-full overflow-hidden rounded-md bg-muted outline-offset-2 ring-offset-background",
                    key === activeImage?.key
                      ? "ring-2 ring-foreground ring-offset-2"
                      : "opacity-70 hover:opacity-100",
                  )}
                >
                  <Image
                    src={urlFor(image).width(200).url()}
                    alt=""
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-2xl">{formatPrice(variant.price)}</p>
          <p
            className={cn("mt-1 text-sm", stock.className)}
            aria-live="polite"
          >
            {stock.text}
          </p>
        </div>

        {DIMENSIONS.map(({ key: dim, label }) => {
          const options = [
            ...new Set(
              variants.map((v) => v[dim]).filter((v): v is string => !!v),
            ),
          ];
          if (options.length === 0) return null;
          return (
            <fieldset key={dim}>
              <legend className="mb-2 text-sm">
                <span className="text-muted-foreground">{label}: </span>
                <span className="font-medium">{selection[dim]}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const selected = selection[dim] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => choose(dim, option)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-sm transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "hover:border-foreground",
                        !selected &&
                          isSoldOut(dim, option) &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div>
          <Button
            size="lg"
            className="h-11 w-full text-base"
            disabled={variant.stock === 0 || atMax}
            onClick={addToCart}
          >
            {variant.stock === 0
              ? "Out of stock"
              : atMax
                ? "All available units are in your cart"
                : "Add to cart"}
          </Button>
          <p className="mt-2 min-h-5 text-sm" aria-live="polite">
            {inCart > 0 && (
              <>
                <span className="text-muted-foreground">
                  {justAdded === variant.sku ? "Added to your cart. " : ""}
                  {inCart} in cart.{" "}
                </span>
                <Link href="/cart" className="underline underline-offset-4">
                  View cart
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="space-y-4 border-t pt-6 text-sm leading-relaxed">
          {product.description && <p>{product.description}</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted-foreground">
            {product.material && (
              <>
                <dt>Material</dt>
                <dd className="text-foreground">{product.material}</dd>
              </>
            )}
            <dt>SKU</dt>
            <dd className="text-foreground">{variant.sku}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
