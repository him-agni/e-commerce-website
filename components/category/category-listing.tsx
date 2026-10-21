import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { getCategory, getProductsByCategory } from "@/lib/sanity/data";
import { tagsOf, tagText } from "@/lib/tags";
import { cn } from "@/lib/utils";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors",
        active ? "border-foreground bg-foreground text-background" : "hover:border-foreground",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * A category's products, optionally narrowed to one hashtag (e.g. /categories/chairs/accent-chair).
 * Hashtags group products inside a category; each has its own page so it can be linked and shared.
 */
export async function CategoryListing({ slug, tag }: { slug: string; tag?: string }) {
  const [category, products] = await Promise.all([getCategory(slug), getProductsByCategory(slug)]);
  if (!category) notFound();

  const tags = tagsOf(products);
  if (tag && !tags.includes(tag)) notFound();
  const shown = tag ? products.filter((p) => p.tags?.includes(tag)) : products;

  return (
    <>
      <nav aria-label="Breadcrumb" className="blur-in mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        {tag ? (
          <>
            <Link href={`/categories/${slug}`} className="hover:text-foreground">
              {category.title}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{tagText(tag)}</span>
          </>
        ) : (
          <span className="text-foreground">{category.title}</span>
        )}
      </nav>
      <h1 className="blur-in mb-2 text-4xl" style={delay(150)}>
        {category.title}
      </h1>
      {category.description && (
        <p className="blur-in mb-8 max-w-xl text-muted-foreground" style={delay(300)}>
          {category.description}
        </p>
      )}

      {tags.length > 1 && (
        <nav
          aria-label={`Filter ${category.title} by hashtag`}
          className="blur-in mb-10 flex flex-wrap gap-2"
          style={delay(450)}
        >
          <Pill href={`/categories/${slug}`} active={!tag}>
            All
          </Pill>
          {tags.map((t) => (
            <Pill key={t} href={`/categories/${slug}/${t}`} active={t === tag}>
              {tagText(t)}
            </Pill>
          ))}
        </nav>
      )}

      <ProductGrid
        products={shown}
        emptyMessage="Nothing in this category yet. Check back soon."
        headingLevel={2}
        priorityCount={4}
      />
    </>
  );
}
