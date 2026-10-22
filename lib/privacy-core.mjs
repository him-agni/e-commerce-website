// Turns identifiers into values that are safe to store in the public Sanity dataset.
//
// Anyone can read that dataset, so it must not hold anything that points at a person: not their
// Clerk user id, not their Stripe session id. Instead the server derives stand-ins with a secret
// (ORDER_ID_SECRET) that only the server knows:
//   - userKey, orderId, orderNumber: one-way HMACs. Without the secret they cannot be reversed or
//     matched to a Clerk account or Stripe session, but the same input always gives the same output,
//     so a signed-in customer's orders can still be found.
//   - sealSessionId: the Stripe session id, encrypted (AES-256-GCM). Only the server can read it back,
//     which is how My orders asks Stripe for the shipping address.
//
// Plain JavaScript with no imports from the app, so the app and the one-time migration script share
// exactly the same code. Never change the secret or these labels once orders exist: every stored id
// would stop matching.

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const MIN_SECRET_LENGTH = 32;
const SEAL_VERSION = "v1";

/** @param {string | undefined} secret */
export function createPseudonyms(secret) {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`ORDER_ID_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters`);
  }

  // One independent key per purpose, so a value made for one use can never stand in for another.
  const subkey = (/** @type {string} */ purpose) =>
    createHmac("sha256", secret).update(`my-farmhouse:${purpose}`).digest();
  const hmac = (/** @type {string} */ purpose, /** @type {string} */ value) =>
    createHmac("sha256", subkey(purpose)).update(value).digest("hex");
  const sealKey = subkey("session-seal");

  return {
    /** Stable stand-in for a Clerk user id. */
    userKey: (/** @type {string} */ userId) => hmac("user", userId).slice(0, 32),

    /** Document id for an order, derived from its Stripe session id. Also what makes webhooks idempotent. */
    orderId: (/** @type {string} */ sessionId) => `order-${hmac("order", sessionId).slice(0, 32)}`,

    /** The order number shown to the customer. */
    orderNumber: (/** @type {string} */ sessionId) =>
      `MF-${hmac("number", sessionId).slice(0, 8).toUpperCase()}`,

    /** Encrypts a Stripe session id for storage. Each call gives a different string. */
    sealSessionId(/** @type {string} */ sessionId) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", sealKey, iv);
      const data = Buffer.concat([cipher.update(sessionId, "utf8"), cipher.final()]);
      const parts = [SEAL_VERSION, iv, cipher.getAuthTag(), data].map((p) =>
        typeof p === "string" ? p : p.toString("base64url"),
      );
      return parts.join(".");
    },

    /** Decrypts a stored value, or returns null if it is missing, damaged or was not made with this secret. */
    openSessionId(/** @type {string | null | undefined} */ sealed) {
      if (!sealed) return null;
      try {
        const [version, iv, tag, data] = sealed.split(".");
        if (version !== SEAL_VERSION || !iv || !tag || !data) return null;
        const decipher = createDecipheriv("aes-256-gcm", sealKey, Buffer.from(iv, "base64url"));
        decipher.setAuthTag(Buffer.from(tag, "base64url"));
        return Buffer.concat([
          decipher.update(Buffer.from(data, "base64url")),
          decipher.final(),
        ]).toString("utf8");
      } catch {
        return null;
      }
    },
  };
}
