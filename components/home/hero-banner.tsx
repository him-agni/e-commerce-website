import type { SanityImageSource } from "@sanity/image-url";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

/** Full-width rounded photo banner. Its text fades in on load with plain CSS, so it never waits for JavaScript. */
export function HeroBanner({ image }: { image: SanityImageSource | null }) {
  return (
    <section className="px-3 pt-3 sm:px-6">
      <div className="relative mx-auto h-[min(44rem,82svh)] min-h-[30rem] max-w-[90rem] overflow-hidden rounded-3xl bg-muted">
        {image && (
          <Image
            src={urlFor(image).width(2000).url()}
            alt=""
            fill
            // The largest thing on the page: load it right away and ahead of everything else.
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1440px) 1440px, 100vw"
            className="drift object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/45" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center text-white">
          <p
            className="blur-in text-xs uppercase tracking-[0.28em] text-white/90 sm:text-sm"
            style={delay(150)}
          >
            Modern farmhouse furniture
          </p>
          <h1
            className="blur-in max-w-3xl text-5xl leading-[1.05] sm:text-6xl lg:text-7xl"
            style={delay(450)}
          >
            Furniture with farmhouse soul
          </h1>
          <p className="blur-in max-w-lg text-base text-white/90 sm:text-lg" style={delay(750)}>
            Warm woods, soft linens and black iron accents. Pieces made to be lived in, for
            every room of the house.
          </p>
          <div className="blur-in flex flex-wrap justify-center gap-3" style={delay(1050)}>
            <Link
              href="/products"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 text-base font-medium text-white backdrop-blur-md transition-colors hover:bg-white/35"
            >
              Shop all
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="#categories"
              className="inline-flex h-12 items-center rounded-full px-6 text-base font-medium text-white underline-offset-4 transition-colors hover:underline"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
