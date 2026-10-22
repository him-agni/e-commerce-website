import "server-only";
import { createPseudonyms } from "./privacy-core.mjs";

let cached: ReturnType<typeof createPseudonyms> | undefined;

/**
 * Pseudonyms for what is stored in the public Sanity dataset (see privacy-core.mjs). Read lazily so a
 * missing ORDER_ID_SECRET fails the one request that needs it (and Stripe retries the webhook)
 * instead of breaking the whole build.
 */
export function pseudonyms() {
  return (cached ??= createPseudonyms(process.env.ORDER_ID_SECRET));
}
