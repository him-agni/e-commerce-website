import { cn } from "@/lib/utils";

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul
      aria-hidden
      className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="space-y-3">
          <Block className="aspect-[4/5] rounded-lg" />
          <Block className="h-3 w-1/3" />
          <Block className="h-5 w-2/3" />
          <Block className="h-4 w-1/4" />
        </li>
      ))}
    </ul>
  );
}

export function ProductPageSkeleton() {
  return (
    <div aria-hidden className="grid gap-10 md:grid-cols-2 lg:gap-16">
      <div className="space-y-3">
        <Block className="aspect-square rounded-lg" />
        <div className="grid grid-cols-5 gap-2">
          <Block className="aspect-square" />
          <Block className="aspect-square" />
        </div>
      </div>
      <div className="space-y-6">
        <Block className="h-10 w-3/4" />
        <Block className="h-7 w-24" />
        <Block className="h-9 w-2/3" />
        <Block className="h-9 w-1/2" />
        <Block className="h-11 w-full" />
      </div>
    </div>
  );
}
