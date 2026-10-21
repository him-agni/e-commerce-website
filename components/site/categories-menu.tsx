"use client";

import { Popover } from "@base-ui/react/popover";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { tagText } from "@/lib/tags";

type Category = { _id: string; title: string; slug: string; tags: string[] };

/** "Shop" menu listing every category. Keyboard and screen-reader behavior comes from Base UI's popover. */
export function CategoriesMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="flex items-center gap-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline data-[popup-open]:text-foreground">
        Shop
        <ChevronDown
          aria-hidden
          className="size-4 transition-transform in-data-[popup-open]:rotate-180"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={12} align="end" collisionPadding={12} className="z-50">
          <Popover.Popup
            aria-label="Shop by category"
            className="w-[min(calc(100vw-1.5rem),40rem)] rounded-xl border bg-popover p-5 text-popover-foreground shadow-xl outline-none"
          >
            <Link
              href="/products"
              onClick={close}
              className="mb-4 block border-b pb-4 font-heading text-lg hover:underline"
            >
              All furniture
            </Link>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              {categories.map((category) => (
                <li key={category._id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    onClick={close}
                    className="block rounded-md px-2 py-1 font-heading text-base transition-colors hover:bg-muted"
                  >
                    {category.title}
                  </Link>
                  {category.tags.length > 1 && (
                    <ul className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 px-2">
                      {category.tags.map((tag) => (
                        <li key={tag}>
                          <Link
                            href={`/categories/${category.slug}/${tag}`}
                            onClick={close}
                            className="text-xs text-muted-foreground transition-colors hover:text-wood"
                          >
                            {tagText(tag)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
