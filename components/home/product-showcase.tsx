"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  SHOWCASE_FILTERS,
  type ShowcaseFilterId,
  type ShowcaseGroups,
} from "./showcase-filters";

/** Filterable product grid. Cards fade in from blurry to sharp, one after another, each time the filter changes. */
export function ProductShowcase({ groups }: { groups: ShowcaseGroups }) {
  const [activeId, setActiveId] = useState<ShowcaseFilterId>("all");
  // The first set of cards fades in on scroll with everything else on the page. After the shopper
  // changes the filter, new cards animate in right away instead.
  const [changed, setChanged] = useState(false);
  const active = SHOWCASE_FILTERS.find((f) => f.id === activeId) ?? SHOWCASE_FILTERS[0];
  const shown = groups[activeId];

  return (
    <div>
      <div
        role="group"
        aria-label="Filter products by type"
        className="mb-10 flex flex-wrap justify-center gap-2"
      >
        {SHOWCASE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={filter.id === activeId}
            onClick={() => {
              setActiveId(filter.id);
              setChanged(true);
            }}
            className={cn(
              "h-9 rounded-full border px-4 text-sm transition-colors",
              filter.id === activeId
                ? "border-foreground bg-foreground text-background"
                : "hover:border-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Keyed by filter so every change replays the entrance animation. */}
      <ul
        key={activeId}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-live="polite"
      >
        {shown.map((product, index) => (
          <li
            key={product.id}
            {...(changed ? { className: "blur-in" } : { "data-reveal": "" })}
            style={{ "--delay": `${index * 140}ms` } as React.CSSProperties}
          >
            <Link
              href={`/products/${product.slug}`}
              className="group block rounded-2xl bg-secondary p-3 transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[5/4] overflow-hidden rounded-xl bg-muted">
                {product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                {!product.inStock && (
                  <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
                    Sold out
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between gap-3 px-1 pb-1 pt-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {product.categoryTitle}
                  </p>
                  <h3 className="truncate font-heading text-lg leading-snug">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.minPrice !== product.maxPrice ? "From " : ""}
                    {formatPrice(product.minPrice)}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background transition-colors group-hover:bg-foreground group-hover:text-background"
                >
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {shown.length === 0 && (
        <p className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          Nothing here yet. Check back soon.
        </p>
      )}

      <div className="mt-10 text-center">
        <Link
          href={active.slugs ? `/categories/${active.slugs[0]}` : "/products"}
          className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:text-wood"
        >
          {active.slugs ? `See all ${active.label.toLowerCase()}` : "View all furniture"}
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
