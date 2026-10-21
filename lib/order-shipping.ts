import "server-only";
import { stripe } from "@/lib/stripe";

export type ShipTo = {
  name?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

/**
 * Looks up where an order ships from Stripe, where the address actually lives.
 * The Sanity dataset is publicly readable, so addresses are never stored there.
 *
 * Only returns the address if the Stripe session belongs to `userId`, and returns null on any
 * failure so a Stripe hiccup never breaks the page that calls it.
 */
export async function getShipTo(
  sessionId: string | null | undefined,
  userId: string,
): Promise<ShipTo | null> {
  if (!sessionId) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== userId) return null;
    const shipping = session.collected_information?.shipping_details;
    const address = shipping?.address;
    if (!address?.line1) return null;
    return {
      name: shipping?.name ?? undefined,
      line1: address.line1,
      city: address.city ?? undefined,
      state: address.state ?? undefined,
      postalCode: address.postal_code ?? undefined,
    };
  } catch (error) {
    console.error("Could not load shipping details from Stripe", error);
    return null;
  }
}
