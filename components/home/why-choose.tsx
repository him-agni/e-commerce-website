import type { SanityImageSource } from "@sanity/image-url";
import { MessageCircle, ShieldCheck, SlidersHorizontal, Truck } from "lucide-react";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { urlFor } from "@/sanity/lib/image";

// Only things that are true of this store.
const FEATURES = [
  {
    icon: Truck,
    title: "Free US shipping",
    text: "Free shipping on every order within the United States.",
  },
  {
    icon: SlidersHorizontal,
    title: "Made your way",
    text: "Pick the color, size and design that suit your room, with live pricing and stock.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    text: "Pay safely with Stripe. This is a demo store, so no real charges are made.",
  },
  {
    icon: MessageCircle,
    title: "Help when you need it",
    text: "Ask our shopping assistant to find a piece, compare options or check an order.",
  },
] as const;

export function WhyChoose({ image }: { image: SanityImageSource | null }) {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:gap-16">
      <div>
        <Reveal>
          <h2 className="text-4xl leading-tight sm:text-5xl">Why shoppers choose My Farmhouse</h2>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Honest materials, simple choices and a store that is easy to use.
          </p>
        </Reveal>
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }, index) => (
            <li key={title}>
              <Reveal delay={index * 170}>
                <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-wood">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-heading text-xl">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      <Reveal delay={250}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted lg:aspect-[5/6]">
          {image && (
            <Image
              src={urlFor(image).width(1200).url()}
              alt=""
              fill
              sizes="(min-width: 1024px) 560px, 92vw"
              className="drift object-cover"
            />
          )}
        </div>
      </Reveal>
    </section>
  );
}
