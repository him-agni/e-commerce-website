import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/site/container";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getShipTo } from "@/lib/order-shipping";
import { pseudonyms } from "@/lib/privacy";
import { ORDERS_BY_USER_QUERY } from "@/lib/sanity/queries";
import { cn } from "@/lib/utils";
import { freshClient } from "@/sanity/lib/client";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const statusStyles: Record<string, string> = {
  paid: "bg-secondary text-secondary-foreground",
  shipped: "bg-accent text-accent-foreground",
  delivered: "bg-wood text-wood-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function OrdersPage() {
  return (
    <Container className="py-12">
      <h1 className="mb-8 text-4xl">Your orders</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading your orders…</p>}>
        <OrderList />
      </Suspense>
    </Container>
  );
}

async function OrderList() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/orders");

  // Orders must be exact and private to this user, so this read is never cached.
  const ids = pseudonyms();
  const orders = await freshClient.fetch(ORDERS_BY_USER_QUERY, { userKey: ids.userKey(userId) });

  // Addresses are not stored in Sanity (it is publicly readable); fetch them from Stripe for the
  // most recent orders, checking each belongs to this user.
  const shipTo = await Promise.all(
    orders.map((order, index) =>
      index < 10 ? getShipTo(ids.openSessionId(order.sessionRef), userId) : Promise.resolve(null),
    ),
  );

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg">No orders yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Just paid? It can take a few seconds to show up here.
        </p>
        <Link
          href="/products"
          className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 px-6 text-base")}
        >
          Browse furniture
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-6">
      {orders.map((order, index) => (
        <li key={order._id} className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <p className="font-heading text-lg">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">
                {order.createdAt ? dateFormat.format(new Date(order.createdAt)) : ""}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                  statusStyles[order.status] ?? statusStyles.paid,
                )}
              >
                {order.status}
              </span>
              <p className="text-lg">{formatPrice(order.total ?? 0)}</p>
            </div>
          </div>
          <ul className="divide-y px-5">
            {order.items?.map((item) => (
              <li key={item._key} className="flex justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  {item.productSlug ? (
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="hover:underline"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <span>{item.productName}</span>
                  )}
                  <p className="text-muted-foreground">{item.variantLabel}</p>
                </div>
                <p className="shrink-0 text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice ?? 0)}
                </p>
              </li>
            ))}
          </ul>
          {shipTo[index] && (
            <p className="border-t px-5 py-3 text-sm text-muted-foreground">
              Ships to {shipTo[index].name ? `${shipTo[index].name}, ` : ""}
              {shipTo[index].line1}, {shipTo[index].city}, {shipTo[index].state}{" "}
              {shipTo[index].postalCode}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
