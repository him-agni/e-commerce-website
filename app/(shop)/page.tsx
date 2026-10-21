import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroBanner } from "@/components/home/hero-banner";
import { ProductShowcase } from "@/components/home/product-showcase";
import { WhyChoose } from "@/components/home/why-choose";
import { SHOWCASE_FILTERS, SHOWCASE_SIZE, type ShowcaseGroups } from "@/components/home/showcase-filters";
import { Reveal } from "@/components/motion/reveal";
import { RevealController } from "@/components/motion/reveal-controller";
import { Container } from "@/components/site/container";
import { getAllProducts, getCategories, getFeaturedProducts } from "@/lib/sanity/data";
import { urlFor } from "@/sanity/lib/image";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [categories, products, featured] = await Promise.all([
    getCategories(),
    getAllProducts(),
    getFeaturedProducts(),
  ]);

  // Pick the best-looking room photos for the two large frames, with safe fallbacks.
  const imageOf = (slug: string) => products.find((p) => p.slug === slug)?.image ?? null;
  const heroImage =
    imageOf("homestead-3-piece-set") ?? featured[0]?.image ?? products[0]?.image ?? null;
  const whyImage =
    categories.find((c) => c.slug === "coffee-tables")?.image ??
    imageOf("ember-round-coffee-table") ??
    products[1]?.image ??
    null;

  // Precompute what each filter shows, so the browser only receives the handful of cards it needs.
  const featuredSlugs = featured.map((p) => p.slug);
  const toCard = (p: (typeof products)[number]) => ({
    id: p._id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.image ? urlFor(p.image).width(900).url() : null,
    categoryTitle: p.category.title,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    inStock: p.inStock,
  });
  const groups = Object.fromEntries(
    SHOWCASE_FILTERS.map((filter) => {
      const matching = filter.slugs
        ? products.filter((p) => (filter.slugs as readonly string[]).includes(p.category.slug))
        : // "All" leads with the featured pieces.
          [
            ...products.filter((p) => featuredSlugs.includes(p.slug)),
            ...products.filter((p) => !featuredSlugs.includes(p.slug)),
          ];
      return [filter.id, matching.slice(0, SHOWCASE_SIZE).map(toCard)];
    }),
  ) as ShowcaseGroups;

  return (
    <>
      <RevealController />
      <HeroBanner image={heroImage} />

      <section className="pt-24">
        <Container>
          <Reveal className="mx-auto mb-10 max-w-xl text-center">
            <h2 className="text-4xl sm:text-5xl">Our products</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Pieces chosen for lasting quality and a warm, lived-in feel.
            </p>
          </Reveal>
          <ProductShowcase groups={groups} />
        </Container>
      </section>

      <WhyChoose image={whyImage} />

      <section id="categories" className="scroll-mt-24 pb-4">
        <Container>
          <Reveal className="mb-8">
            <h2 className="text-3xl sm:text-4xl">Shop by category</h2>
          </Reveal>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category, index) => (
              <li key={category._id}>
                <Reveal delay={(index % 4) * 130}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
                  >
                    {category.image && (
                      <Image
                        src={urlFor(category.image).width(700).url()}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-4 font-heading text-xl text-white">
                      {category.title}
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
