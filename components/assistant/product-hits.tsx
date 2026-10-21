import Image from "next/image";
import Link from "next/link";
import type { ProductHit } from "@/lib/ai/tools";

export function ProductHits({ products }: { products: ProductHit[] }) {
  return (
    <ul className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
      {products.map((product) => (
        <li key={product.url} className="w-36 shrink-0 snap-start">
          <Link
            href={product.url}
            className="block overflow-hidden rounded-lg border bg-background transition-colors hover:border-foreground"
          >
            <div className="relative aspect-square bg-muted">
              {product.imageUrl && (
                <Image
                  src={product.imageUrl}
                  alt=""
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              )}
              {!product.inStock && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium">
                  Sold out
                </span>
              )}
            </div>
            <div className="space-y-0.5 p-2">
              <p className="line-clamp-2 text-xs font-medium leading-snug">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.price}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
