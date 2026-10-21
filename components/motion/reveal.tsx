import { cn } from "@/lib/utils";

/**
 * Marks a block to fade in from blurry to sharp when it scrolls into view. It is a plain
 * server-rendered element (no JavaScript of its own); one <RevealController /> on the page does
 * the watching. Styles live in globals.css. `delay` staggers siblings, in milliseconds.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      data-reveal=""
      className={cn(className)}
      style={{ "--delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
