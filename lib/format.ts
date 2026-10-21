const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formats a price in USD cents, e.g. 129900 -> "$1,299". */
export function formatPrice(cents: number) {
  return usd.format(cents / 100);
}
