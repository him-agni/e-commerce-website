import "server-only";
import type Stripe from "stripe";
import { lookupVariants } from "@/lib/cart/lookup";
import { pseudonyms } from "@/lib/privacy";
import { stripe } from "@/lib/stripe";
import { writeClient } from "@/sanity/lib/client";

export type RecordResult =
  | { status: "created"; orderId: string; oversold: string[] }
  | { status: "duplicate"; orderId: string }
  | { status: "unpaid" };

type SanityError = { statusCode?: number };

const isConflict = (error: unknown) => (error as SanityError)?.statusCode === 409;

/**
 * Records a paid Checkout Session in Sanity: creates the customer (if new) and the order,
 * and decrements stock for each variant, all in one transaction.
 *
 * The dataset is publicly readable, so nothing that points at a person goes in it: no name,
 * email or address, and not even the Clerk user id or Stripe session id. Those are replaced by
 * values only the server can make or read (see lib/privacy-core.mjs).
 *
 * Safe to call repeatedly for the same session. The order id is derived from the session id
 * and created with `create` (which fails if it exists), so a retry or a concurrent duplicate
 * delivery aborts the whole transaction and stock is never decremented twice.
 */
export async function recordPaidSession(sessionId: string): Promise<RecordResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { status: "unpaid" };

  const ids = pseudonyms();
  const orderId = ids.orderId(session.id);
  const existing = await writeClient.fetch<number>(
    "count(*[_id == $id])",
    { id: orderId },
  );
  if (existing > 0) return { status: "duplicate", orderId };

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
  });

  const rows = lineItems.data.flatMap((line) => {
    const product = line.price?.product as Stripe.Product | undefined;
    const sku = product?.metadata?.sku;
    if (!sku) {
      console.warn(`Order ${orderId}: line item without a sku, skipped`, line.id);
      return [];
    }
    return [
      {
        sku,
        productName: product?.name ?? line.description ?? sku,
        variantLabel: product?.description ?? "",
        unitPrice: line.price?.unit_amount ?? 0,
        quantity: line.quantity ?? 1,
      },
    ];
  });

  const variants = await lookupVariants(rows.map((row) => row.sku));

  // The buyer's name, email and shipping address stay in Stripe and are looked up there when needed.
  const userId = session.client_reference_id ?? session.metadata?.clerkUserId ?? null;

  const tx = writeClient.transaction();

  const userKey = userId ? ids.userKey(userId) : null;
  const customerId = userKey ? `customer-${userKey}` : null;
  if (userKey && customerId) {
    tx.createIfNotExists({ _id: customerId, _type: "customer", userKey });
  } else {
    console.warn(`Order ${orderId}: session has no Clerk user id, order has no customer`);
  }

  tx.create({
    _id: orderId,
    _type: "order",
    orderNumber: ids.orderNumber(session.id),
    ...(customerId && { customer: { _type: "reference", _ref: customerId } }),
    items: rows.map((row, index) => {
      const variant = variants.get(row.sku);
      return {
        _key: `item-${index}`,
        _type: "orderItem",
        productName: row.productName,
        variantLabel: row.variantLabel,
        sku: row.sku,
        unitPrice: row.unitPrice,
        quantity: row.quantity,
        ...(variant && {
          product: { _type: "reference", _ref: variant.productId, _weak: true },
        }),
      };
    }),
    total: session.amount_total ?? rows.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0),
    status: "paid",
    // Encrypted: only the server can read it back, to ask Stripe for the shipping address.
    sessionRef: ids.sealSessionId(session.id),
    createdAt: new Date(session.created * 1000).toISOString(),
  });

  // Decrement stock, never below zero. If stock ran out between checkout and payment the
  // customer has still paid, so flag it for the owner (refund or backorder) instead of failing.
  const oversold: string[] = [];
  for (const row of rows) {
    const variant = variants.get(row.sku);
    if (!variant) {
      oversold.push(`${row.sku} (variant no longer exists)`);
      continue;
    }
    const decrement = Math.min(row.quantity, Math.max(variant.stock, 0));
    if (decrement < row.quantity) {
      oversold.push(`${row.sku} (wanted ${row.quantity}, had ${Math.max(variant.stock, 0)})`);
    }
    if (decrement > 0) {
      tx.patch(variant.productId, (p) =>
        p.dec({ [`variants[_key=="${variant.variantKey}"].stock`]: decrement }),
      );
    }
  }

  try {
    await tx.commit();
  } catch (error) {
    // A concurrent delivery of the same event won the race; nothing was written by this one.
    if (isConflict(error)) return { status: "duplicate", orderId };
    throw error;
  }

  if (oversold.length > 0) {
    console.warn(`Order ${orderId} oversold: ${oversold.join(", ")}`);
  }
  return { status: "created", orderId, oversold };
}
