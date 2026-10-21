import Link from "next/link";
import { Container } from "@/components/site/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-wood">404</p>
      <h1 className="mt-3 text-4xl">We could not find that page</h1>
      <p className="mt-3 text-muted-foreground">
        It may have moved, or the piece may no longer be in our collection.
      </p>
      <Link
        href="/products"
        className={cn(buttonVariants({ size: "lg" }), "mt-8 h-11 px-6 text-base")}
      >
        Browse all furniture
      </Link>
    </Container>
  );
}
