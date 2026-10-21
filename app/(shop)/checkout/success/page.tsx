import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClearCart } from "@/components/cart/clear-cart";
import { Container } from "@/components/site/container";
import { buttonVariants } from "@/components/ui/button";
import { stripe } from "@/lib/stripe";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed" };

type Props = { searchParams: Promise<{ session_id?: string }> };

export default function CheckoutSuccessPage({ searchParams }: Props) {
  return (
    <Container className="max-w-xl py-20 text-center">
      <Suspense fallback={<p className="text-muted-foreground">Confirming your payment…</p>}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Confirmation({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  const { userId } = await auth();

  const session =
    sessionId && userId && /^cs_test_[A-Za-z0-9_]+$/.test(sessionId)
      ? await stripe.checkout.sessions.retrieve(sessionId).catch(() => null)
      : null;

  // Only show details of a session that belongs to the signed-in user.
  if (!session || session.client_reference_id !== userId) {
    return (
      <>
        <h1 className="text-4xl">We could not find that order</h1>
        <p className="mt-3 text-muted-foreground">
          If you just paid, your confirmation email from Stripe is on its way.
        </p>
        <ContinueShopping />
      </>
    );
  }

  if (session.payment_status !== "paid") {
    return (
      <>
        <h1 className="text-4xl">Payment not completed</h1>
        <p className="mt-3 text-muted-foreground">
          Your cart is still saved, so you can try again whenever you like.
        </p>
        <Link
          href="/cart"
          className={cn(buttonVariants({ size: "lg" }), "mt-8 h-11 px-6 text-base")}
        >
          Back to cart
        </Link>
      </>
    );
  }

  const email = session.customer_details?.email;
  return (
    <>
      <ClearCart />
      <p className="text-sm uppercase tracking-widest text-wood">Order confirmed</p>
      <h1 className="mt-3 text-4xl">Thank you for your order</h1>
      <p className="mt-3 text-muted-foreground">
        {email ? `A receipt is on its way to ${email}.` : "A receipt is on its way."}{" "}
        This is a demo store, so nothing will ship.
      </p>
      <ContinueShopping />
    </>
  );
}

function ContinueShopping() {
  return (
    <Link
      href="/products"
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "mt-8 h-11 px-6 text-base",
      )}
    >
      Continue shopping
    </Link>
  );
}
