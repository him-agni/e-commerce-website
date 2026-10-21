const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formats a price in USD cents, e.g. 129900 -> "$1,299". */
export function formatPrice(cents: number) {
  return usd.format(cents / 100);
}

/** "Natural Oak / Queen / Slatted headboard", skipping empty parts. */
export function variantLabel(variant: {
  color: string | null;
  size: string | null;
  design: string | null;
}) {
  return [variant.color, variant.size, variant.design].filter(Boolean).join(" / ");
}
