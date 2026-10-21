"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/site/container";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ShopError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-wood">Something went wrong</p>
      <h1 className="mt-3 text-4xl">We hit a snag loading this page</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        This is usually temporary. Try again, or head back to browse the collection.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" className="h-11 px-6 text-base" onClick={() => retry()}>
          Try again
        </Button>
        <Link
          href="/products"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 px-6 text-base",
          )}
        >
          Browse furniture
        </Link>
      </div>
    </Container>
  );
}
