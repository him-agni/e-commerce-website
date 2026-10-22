// One-time migration (2026-10-22): replaces the real Clerk user ids and Stripe session ids that early
// orders stored in the public Sanity dataset with the stand-ins from lib/privacy-core.mjs.
//
// Run: node --env-file=.env.local scripts/pseudonymize-orders.mjs            (dry run: changes nothing)
//      node --env-file=.env.local scripts/pseudonymize-orders.mjs --apply    (writes)
//
// Needs ORDER_ID_SECRET, the same value the deployed site uses. It prints counts only, never ids.
// Safe to run again: it only touches documents still in the old format, and finding none is a success.
// Deploy the code that reads the new format first; until this has run, My orders shows no old orders.

import { createClient } from "@sanity/client";
import { createPseudonyms } from "../lib/privacy-core.mjs";

const apply = process.argv.includes("--apply");

const { NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN, ORDER_ID_SECRET } =
  process.env;
if (!NEXT_PUBLIC_SANITY_PROJECT_ID || !NEXT_PUBLIC_SANITY_DATASET || !SANITY_API_WRITE_TOKEN) {
  console.error("Set the Sanity variables in .env.local");
  process.exit(1);
}
const ids = createPseudonyms(ORDER_ID_SECRET); // throws a clear message if missing or too short

const client = createClient({
  projectId: NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  useCdn: false,
  token: SANITY_API_WRITE_TOKEN,
});

const oldCustomers = await client.fetch(`*[_type == "customer" && defined(clerkUserId)]{ _id, clerkUserId }`);
const oldOrders = await client.fetch(
  `*[_type == "order" && defined(stripeSessionId)]{
    _id, "customerId": customer._ref, items, total, status, stripeSessionId, createdAt
  }`,
);

console.log(`Dataset "${NEXT_PUBLIC_SANITY_DATASET}": ${oldCustomers.length} old-format customer(s), ${oldOrders.length} old-format order(s).`);
if (oldCustomers.length === 0 && oldOrders.length === 0) {
  console.log("Nothing to migrate.");
  process.exit(0);
}

const userIdByDocId = new Map(oldCustomers.map((c) => [c._id, c.clerkUserId]));
const customerDocId = (userId) => `customer-${ids.userKey(userId)}`;

const tx = client.transaction();

for (const customer of oldCustomers) {
  tx.createIfNotExists({
    _id: customerDocId(customer.clerkUserId),
    _type: "customer",
    userKey: ids.userKey(customer.clerkUserId),
  });
}

let withoutCustomer = 0;
for (const order of oldOrders) {
  const userId = order.customerId ? userIdByDocId.get(order.customerId) : undefined;
  if (!userId) withoutCustomer++;
  tx.createIfNotExists({
    _id: ids.orderId(order.stripeSessionId),
    _type: "order",
    orderNumber: ids.orderNumber(order.stripeSessionId),
    ...(userId && { customer: { _type: "reference", _ref: customerDocId(userId) } }),
    items: order.items,
    total: order.total,
    status: order.status,
    sessionRef: ids.sealSessionId(order.stripeSessionId),
    createdAt: order.createdAt,
  });
}

// Remove the old documents in the same transaction, orders first.
for (const order of oldOrders) tx.delete(order._id);
for (const customer of oldCustomers) tx.delete(customer._id);

console.log(
  `Plan: create ${oldCustomers.length} customer(s) and ${oldOrders.length} order(s) in the new format` +
    (withoutCustomer ? ` (${withoutCustomer} without a customer)` : "") +
    `, then delete the old ones.`,
);

if (!apply) {
  console.log("Dry run: nothing was written. Re-run with --apply to migrate.");
  process.exit(0);
}

await tx.commit();

const left = await client.fetch(
  `count(*[(_type == "customer" && defined(clerkUserId)) || (_type == "order" && defined(stripeSessionId))])`,
);
console.log(`Migrated. Old-format documents remaining: ${left}.`);
if (left !== 0) process.exit(1);
