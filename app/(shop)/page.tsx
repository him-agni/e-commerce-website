import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import { Container } from "@/components/site/container";
import { buttonVariants } from "@/components/ui/button";
import { getCategories, getFeaturedProducts } from "@/lib/sanity/data";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";

export default async function Home() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);
  const heroImage = featured[0]?.image;

  return (
    <>
      <section className="border-b bg-secondary/40">
        <Container className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-widest text-wood">
              Modern farmhouse furniture
            </p>
            <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Furniture with farmhouse soul
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Warm woods, soft linens and black iron accents. Pieces made to be
              lived in, for every room of the house.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
              >
                Shop all
              </Link>
              <Link
                href="#categories"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-6 text-base",
                )}
              >
                Browse categories
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            {heroImage && (
              <Image
                src={urlFor(heroImage).width(1400).url()}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            )}
          </div>
        </Container>
      </section>

      <section className="pt-16">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl">Featured pieces</h2>
            <Link
              href="/products"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <ProductGrid
            products={featured}
            emptyMessage="Featured products will appear here."
          />
        </Container>
      </section>

      <section id="categories" className="scroll-mt-24 pt-20">
        <Container>
          <h2 className="mb-8 text-3xl">Shop by category</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category._id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                >
                  {category.image && (
                    <Image
                      src={urlFor(category.image).width(700).url()}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 font-heading text-xl text-white">
                    {category.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
