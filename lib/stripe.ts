import "server-only";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("Missing environment variable: STRIPE_SECRET_KEY");
}
if (!secretKey.startsWith("sk_test_")) {
  // This project only ever runs in Stripe test mode.
  throw new Error("STRIPE_SECRET_KEY must be a test-mode key (sk_test_...)");
}

export const stripe = new Stripe(secretKey);
