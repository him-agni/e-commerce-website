import "server-only";
import { lookupVariants } from "@/lib/cart/lookup";
import { stripe } from "@/lib/stripe";

import { MAX_LINES, MAX_QUANTITY_PER_LINE } from "@/lib/cart/limits";

export type CheckoutLine = { sku: string; quantity: number };

export type CheckoutIssue = {
  sku: string;
  message: string;
  /** Units currently available, when the SKU exists. */
  available?: number;
};

/** Narrows untrusted JSON into checkout lines, or returns null if it is malformed. */
export function parseLines(input: unknown): CheckoutLine[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_LINES) {
    return null;
  }
  const lines: CheckoutLine[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "object" || raw === null) return null;
    const { sku, quantity } = raw as Record<string, unknown>;
    if (
      typeof sku !== "string" ||
      sku.length === 0 ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY_PER_LINE ||
      seen.has(sku)
    ) {
      return null;
    }
    seen.add(sku);
    lines.push({ sku, quantity });
  }
  return lines;
}

type CreateSessionArgs = {
  lines: CheckoutLine[];
  userId: string;
  email?: string;
  origin: string;
};

/**
 * Builds a Stripe Checkout session. Prices and names come from Sanity, never from the client,
 * and stock is re-checked here. Returns either the session URL or the problems to show the user.
 */
export async function createCheckoutSession({
  lines,
  userId,
  email,
  origin,
}: CreateSessionArgs): Promise<
  { ok: true; url: string } | { ok: false; issues: CheckoutIssue[] }
> {
  const variants = await lookupVariants(lines.map((l) => l.sku));

  const issues: CheckoutIssue[] = [];
  for (const line of lines) {
    const variant = variants.get(line.sku);
    if (!variant) {
      issues.push({ sku: line.sku, message: "This item is no longer available." });
    } else if (variant.stock < line.quantity) {
      issues.push({
        sku: line.sku,
        message:
          variant.stock === 0
            ? `${variant.productName} is out of stock.`
            : `Only ${variant.stock} of ${variant.productName} left.`,
        available: variant.stock,
      });
    }
  }
  if (issues.length > 0) return { ok: false, issues };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Creates a Stripe customer for the buyer, so the owner can find their payments in the Stripe dashboard.
    customer_creation: "always",
    line_items: lines.map((line) => {
      const variant = variants.get(line.sku)!;
      return {
        quantity: line.quantity,
        price_data: {
          currency: "usd",
          unit_amount: variant.unitPrice,
          product_data: {
            name: variant.productName,
            description: variant.variantLabel || undefined,
            images: variant.imageUrl ? [variant.imageUrl] : undefined,
            // The webhook reads these back to match line items to Sanity variants.
            metadata: { sku: variant.sku, productSlug: variant.productSlug },
          },
        },
      };
    }),
    client_reference_id: userId,
    customer_email: email,
    metadata: { clerkUserId: userId },
    shipping_address_collection: { allowed_countries: ["US"] },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { ok: true, url: session.url };
}
