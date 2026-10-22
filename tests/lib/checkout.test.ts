import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_LINES, MAX_QUANTITY_PER_LINE } from "@/lib/cart/limits";
import { createCheckoutSession, parseLines } from "@/lib/checkout";
import { variant, variantMap } from "../helpers/variants";

const { lookupVariants, createSession } = vi.hoisted(() => ({
  lookupVariants: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock("@/lib/cart/lookup", () => ({ lookupVariants }));
vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { create: createSession } } } }));

describe("parseLines", () => {
  it("accepts well-formed lines", () => {
    expect(
      parseLines([
        { sku: "A-1", quantity: 2 },
        { sku: "B-1", quantity: 1 },
      ]),
    ).toEqual([
      { sku: "A-1", quantity: 2 },
      { sku: "B-1", quantity: 1 },
    ]);
  });

  it("keeps only sku and quantity, dropping anything else the browser sent", () => {
    const lines = parseLines([{ sku: "A-1", quantity: 1, unitPrice: 1, name: "free sofa" }]);
    expect(lines).toEqual([{ sku: "A-1", quantity: 1 }]);
  });

  it.each([
    ["not an array", { sku: "A", quantity: 1 }],
    ["null", null],
    ["an empty cart", []],
    ["a line that is not an object", ["A-1"]],
    ["a null line", [null]],
    ["a missing sku", [{ quantity: 1 }]],
    ["an empty sku", [{ sku: "", quantity: 1 }]],
    ["a numeric sku", [{ sku: 5, quantity: 1 }]],
    ["a string quantity", [{ sku: "A", quantity: "2" }]],
    ["a fractional quantity", [{ sku: "A", quantity: 1.5 }]],
    ["a zero quantity", [{ sku: "A", quantity: 0 }]],
    ["a negative quantity", [{ sku: "A", quantity: -1 }]],
    ["NaN", [{ sku: "A", quantity: NaN }]],
    ["Infinity", [{ sku: "A", quantity: Infinity }]],
    ["a duplicated sku", [{ sku: "A", quantity: 1 }, { sku: "A", quantity: 1 }]],
  ])("rejects %s", (_name, input) => {
    expect(parseLines(input)).toBeNull();
  });

  it("enforces the per-line quantity and line-count limits", () => {
    expect(parseLines([{ sku: "A", quantity: MAX_QUANTITY_PER_LINE }])).not.toBeNull();
    expect(parseLines([{ sku: "A", quantity: MAX_QUANTITY_PER_LINE + 1 }])).toBeNull();

    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ sku: `S-${i}`, quantity: 1 }));
    expect(parseLines(many(MAX_LINES))).toHaveLength(MAX_LINES);
    expect(parseLines(many(MAX_LINES + 1))).toBeNull();
  });
});

describe("createCheckoutSession", () => {
  const args = { userId: "user_123", email: "buyer@example.com", origin: "https://shop.test" };

  beforeEach(() => {
    lookupVariants.mockReset();
    createSession.mockReset();
    createSession.mockResolvedValue({ url: "https://checkout.stripe.test/session" });
  });

  it("charges the price Sanity has, never one from the browser", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant({ unitPrice: 109900 })));

    const result = await createCheckoutSession({ ...args, lines: [{ sku: "ASPEN-111", quantity: 2 }] });

    expect(result).toEqual({ ok: true, url: "https://checkout.stripe.test/session" });
    const [params] = createSession.mock.calls[0];
    expect(params.line_items).toHaveLength(1);
    expect(params.line_items[0]).toMatchObject({
      quantity: 2,
      price_data: {
        currency: "usd",
        unit_amount: 109900,
        product_data: {
          name: "Aspen Slatted Bed",
          description: "Natural Oak / Queen",
          metadata: { sku: "ASPEN-111", productSlug: "aspen" },
        },
      },
    });
  });

  it("looks up exactly the skus in the cart", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant()));
    await createCheckoutSession({ ...args, lines: [{ sku: "ASPEN-111", quantity: 1 }] });
    expect(lookupVariants).toHaveBeenCalledWith(["ASPEN-111"]);
  });

  it("ties the session to the signed-in user and sends them back to the right pages", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant()));
    await createCheckoutSession({ ...args, lines: [{ sku: "ASPEN-111", quantity: 1 }] });

    const [params] = createSession.mock.calls[0];
    expect(params).toMatchObject({
      mode: "payment",
      customer_creation: "always",
      client_reference_id: "user_123",
      customer_email: "buyer@example.com",
      metadata: { clerkUserId: "user_123" },
      shipping_address_collection: { allowed_countries: ["US"] },
      success_url: "https://shop.test/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://shop.test/cart",
    });
  });

  it("omits the image and description when there are none", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant({ imageUrl: null, variantLabel: "" })));
    await createCheckoutSession({ ...args, lines: [{ sku: "ASPEN-111", quantity: 1 }] });

    const productData = createSession.mock.calls[0][0].line_items[0].price_data.product_data;
    expect(productData.images).toBeUndefined();
    expect(productData.description).toBeUndefined();
  });

  it("refuses a sku that no longer exists, without calling Stripe", async () => {
    lookupVariants.mockResolvedValue(new Map());
    const result = await createCheckoutSession({ ...args, lines: [{ sku: "GONE-1", quantity: 1 }] });

    expect(result).toEqual({
      ok: false,
      issues: [{ sku: "GONE-1", message: "This item is no longer available." }],
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("refuses more than is in stock and says how many are left", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant({ stock: 2 })));
    const result = await createCheckoutSession({ ...args, lines: [{ sku: "ASPEN-111", quantity: 3 }] });

    expect(result).toEqual({
      ok: false,
      issues: [{ sku: "ASPEN-111", message: "Only 2 of Aspen Slatted Bed left.", available: 2 }],
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("says when something is out of stock", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant({ stock: 0 })));
    const result = await createCheckoutSession({ ...args, lines: [{ sku: "ASPEN-111", quantity: 1 }] });

    expect(result).toMatchObject({
      ok: false,
      issues: [{ message: "Aspen Slatted Bed is out of stock.", available: 0 }],
    });
  });

  it("reports every problem at once, and charges nothing if any line fails", async () => {
    lookupVariants.mockResolvedValue(
      variantMap(variant({ sku: "OK-1", stock: 9 }), variant({ sku: "LOW-1", stock: 1 })),
    );
    const result = await createCheckoutSession({
      ...args,
      lines: [
        { sku: "OK-1", quantity: 1 },
        { sku: "LOW-1", quantity: 4 },
        { sku: "GONE-1", quantity: 1 },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((i) => i.sku)).toEqual(["LOW-1", "GONE-1"]);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("fails loudly if Stripe returns no checkout url", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant()));
    createSession.mockResolvedValue({ url: null });
    await expect(
      createCheckoutSession({ ...args, lines: [{ sku: "ASPEN-111", quantity: 1 }] }),
    ).rejects.toThrow("Stripe did not return a checkout URL");
  });
});
