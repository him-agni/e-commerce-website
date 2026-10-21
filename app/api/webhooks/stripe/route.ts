import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordPaidSession } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set; cannot verify Stripe webhooks");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // The signature covers the exact raw body, so read it as text before anything parses it.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const result = await recordPaidSession(session.id);
        if (result.status === "created") {
          // Stock changed: make product pages and cart lookups see it right away.
          revalidateTag("products", { expire: 0 });
        }
        return NextResponse.json({ received: true, result: result.status });
      } catch (error) {
        // A non-2xx response makes Stripe retry later, which is safe: recording is idempotent.
        console.error(`Failed to record session ${session.id}`, error);
        return NextResponse.json({ error: "Could not record order" }, { status: 500 });
      }
    }
    default:
      return NextResponse.json({ received: true, ignored: event.type });
  }
}
