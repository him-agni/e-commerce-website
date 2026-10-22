import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordPaidSession } from "@/lib/orders";
import { createPseudonyms } from "@/lib/privacy-core.mjs";
import { variant, variantMap } from "../helpers/variants";

const { retrieve, listLineItems, lookupVariants, fetchCount, transaction } = vi.hoisted(() => ({
  retrieve: vi.fn(),
  listLineItems: vi.fn(),
  lookupVariants: vi.fn(),
  fetchCount: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { retrieve, listLineItems } } },
}));
vi.mock("@/lib/cart/lookup", () => ({ lookupVariants }));
vi.mock("@/sanity/lib/client", () => ({ writeClient: { fetch: fetchCount, transaction } }));

/** A stand-in for a Sanity transaction that records what was written. */
function fakeTransaction(commit: () => Promise<unknown> = async () => ({})) {
  const ops: { op: string; args: unknown[] }[] = [];
  const tx = {
    ops,
    create: vi.fn((doc: unknown) => (ops.push({ op: "create", args: [doc] }), tx)),
    createIfNotExists: vi.fn((doc: unknown) => (ops.push({ op: "createIfNotExists", args: [doc] }), tx)),
    patch: vi.fn((id: string, build: (p: unknown) => unknown) => {
      const calls: Record<string, unknown>[] = [];
      const patch = {
        set: (v: Record<string, unknown>) => (calls.push({ set: v }), patch),
        dec: (v: Record<string, unknown>) => (calls.push({ dec: v }), patch),
      };
      build(patch);
      ops.push({ op: "patch", args: [id, ...calls] });
      return tx;
    }),
    commit: vi.fn(commit),
  };
  return tx;
}

const paidSession = (overrides: Record<string, unknown> = {}) => ({
  id: "cs_test_abcdef12345678",
  payment_status: "paid",
  amount_total: 219800,
  created: 1_760_000_000,
  client_reference_id: "user_123",
  customer: "cus_ABC",
  metadata: { clerkUserId: "user_123" },
  // Personal details Stripe holds; none of this may reach Sanity.
  customer_details: { name: "Pat Buyer", email: "pat@example.com", address: { line1: "1 Main St" } },
  shipping_details: { address: { line1: "1 Main St", city: "Austin" } },
  ...overrides,
});

const lineItem = (sku: string | undefined, quantity: number, unit = 109900) => ({
  id: `li_${sku}`,
  quantity,
  description: "Aspen Slatted Bed",
  price: {
    unit_amount: unit,
    product: { name: "Aspen Slatted Bed", description: "Natural Oak / Queen", metadata: sku ? { sku } : {} },
  },
});

// The same derivation the app uses, so tests can state what should be stored.
const ids = createPseudonyms(process.env.ORDER_ID_SECRET);
const SESSION = "cs_test_abcdef12345678";
const ORDER_ID = ids.orderId(SESSION);
const CUSTOMER_ID = `customer-${ids.userKey("user_123")}`;

const opsOf = (tx: ReturnType<typeof fakeTransaction>, op: string) => tx.ops.filter((o) => o.op === op);

describe("recordPaidSession", () => {
  let tx: ReturnType<typeof fakeTransaction>;

  beforeEach(() => {
    [retrieve, listLineItems, lookupVariants, fetchCount, transaction].forEach((m) => m.mockReset());
    tx = fakeTransaction();
    transaction.mockReturnValue(tx);
    fetchCount.mockResolvedValue(0);
    retrieve.mockResolvedValue(paidSession());
    listLineItems.mockResolvedValue({ data: [lineItem("ASPEN-111", 2)] });
    lookupVariants.mockResolvedValue(variantMap(variant({ stock: 5 })));
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("ignores a session that has not been paid", async () => {
    retrieve.mockResolvedValue(paidSession({ payment_status: "unpaid" }));
    expect(await recordPaidSession("cs_test_abcdef12345678")).toEqual({ status: "unpaid" });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("does nothing when the order already exists", async () => {
    fetchCount.mockResolvedValue(1);
    expect(await recordPaidSession(SESSION)).toEqual({ status: "duplicate", orderId: ORDER_ID });
    expect(transaction).not.toHaveBeenCalled();
    expect(listLineItems).not.toHaveBeenCalled();
  });

  it("creates the order with an id derived from the Stripe session", async () => {
    const result = await recordPaidSession(SESSION);

    expect(result).toEqual({ status: "created", orderId: ORDER_ID, oversold: [] });
    expect(fetchCount).toHaveBeenCalledWith("count(*[_id == $id])", { id: ORDER_ID });

    const [{ args }] = opsOf(tx, "create");
    expect(args[0]).toMatchObject({
      _id: ORDER_ID,
      _type: "order",
      orderNumber: ids.orderNumber(SESSION),
      status: "paid",
      total: 219800,
      createdAt: "2025-10-09T08:53:20.000Z",
      customer: { _type: "reference", _ref: CUSTOMER_ID },
      items: [
        {
          productName: "Aspen Slatted Bed",
          variantLabel: "Natural Oak / Queen",
          sku: "ASPEN-111",
          unitPrice: 109900,
          quantity: 2,
          product: { _ref: "product-aspen", _weak: true },
        },
      ],
    });
    expect(tx.commit).toHaveBeenCalledTimes(1);
  });

  it("creates the customer only if new, holding just a random-looking key", async () => {
    await recordPaidSession(SESSION);

    expect(opsOf(tx, "createIfNotExists")[0].args[0]).toEqual({
      _id: CUSTOMER_ID,
      _type: "customer",
      userKey: ids.userKey("user_123"),
    });
    expect(opsOf(tx, "createIfNotExists")[0].args[0]).not.toHaveProperty("stripeCustomerId");
    expect(opsOf(tx, "patch").some((o) => o.args[0] === CUSTOMER_ID)).toBe(false);
  });

  it("never writes the buyer's name, email or address to the public dataset", async () => {
    await recordPaidSession(SESSION);
    const written = JSON.stringify(tx.ops);
    for (const secret of ["Pat Buyer", "pat@example.com", "1 Main St", "Austin"]) {
      expect(written).not.toContain(secret);
    }
  });

  it("never writes the Clerk user id, Stripe session id or Stripe customer id either", async () => {
    await recordPaidSession(SESSION);
    const written = JSON.stringify(tx.ops);
    for (const identifier of ["user_123", SESSION, "cs_test_", "cus_ABC", "abcdef12345678"]) {
      expect(written, identifier).not.toContain(identifier);
    }
  });

  it("keeps the session id recoverable by the server, for the shipping lookup", async () => {
    await recordPaidSession(SESSION);
    const [{ args }] = opsOf(tx, "create");
    const sealed = (args[0] as { sessionRef: string }).sessionRef;
    expect(sealed).not.toContain(SESSION);
    expect(ids.openSessionId(sealed)).toBe(SESSION);
  });

  it("takes stock off the variant that was sold", async () => {
    await recordPaidSession("cs_test_abcdef12345678");
    const stock = opsOf(tx, "patch").find((o) => o.args[0] === "product-aspen");
    expect(stock?.args[1]).toEqual({ dec: { 'variants[_key=="aspen-111"].stock': 2 } });
  });

  it("takes stock off every line of a multi-item order", async () => {
    listLineItems.mockResolvedValue({ data: [lineItem("ASPEN-111", 1), lineItem("RUG-111", 3, 18900)] });
    lookupVariants.mockResolvedValue(
      variantMap(
        variant({ sku: "ASPEN-111", variantKey: "aspen-111", stock: 5 }),
        variant({ sku: "RUG-111", productId: "product-rug", variantKey: "rug-111", stock: 9 }),
      ),
    );
    await recordPaidSession("cs_test_abcdef12345678");

    const decs = opsOf(tx, "patch").filter((o) => (o.args[1] as { dec?: unknown })?.dec);
    expect(decs.map((o) => o.args[0])).toEqual(["product-aspen", "product-rug"]);
  });

  it("never lets stock go below zero, and flags the oversold units", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant({ stock: 1 })));
    const result = await recordPaidSession("cs_test_abcdef12345678");

    expect(result).toMatchObject({ status: "created", oversold: ["ASPEN-111 (wanted 2, had 1)"] });
    const stock = opsOf(tx, "patch").find((o) => o.args[0] === "product-aspen");
    expect(stock?.args[1]).toEqual({ dec: { 'variants[_key=="aspen-111"].stock': 1 } });
  });

  it("records the order but does not touch stock that is already zero", async () => {
    lookupVariants.mockResolvedValue(variantMap(variant({ stock: 0 })));
    const result = await recordPaidSession("cs_test_abcdef12345678");

    expect(result).toMatchObject({ status: "created", oversold: ["ASPEN-111 (wanted 2, had 0)"] });
    expect(opsOf(tx, "patch").some((o) => o.args[0] === "product-aspen")).toBe(false);
    expect(opsOf(tx, "create")).toHaveLength(1);
  });

  it("still records an order for a variant that was deleted since checkout", async () => {
    lookupVariants.mockResolvedValue(new Map());
    const result = await recordPaidSession("cs_test_abcdef12345678");

    expect(result).toMatchObject({ status: "created", oversold: ["ASPEN-111 (variant no longer exists)"] });
    const [{ args }] = opsOf(tx, "create");
    expect((args[0] as { items: { product?: unknown }[] }).items[0].product).toBeUndefined();
  });

  it("skips a line item that has no sku", async () => {
    listLineItems.mockResolvedValue({ data: [lineItem(undefined, 1), lineItem("ASPEN-111", 1)] });
    await recordPaidSession("cs_test_abcdef12345678");

    const [{ args }] = opsOf(tx, "create");
    expect((args[0] as { items: unknown[] }).items).toHaveLength(1);
  });

  it("records an order with no customer when the session has no Clerk user", async () => {
    retrieve.mockResolvedValue(paidSession({ client_reference_id: null, metadata: {} }));
    await recordPaidSession("cs_test_abcdef12345678");

    expect(opsOf(tx, "createIfNotExists")).toHaveLength(0);
    const [{ args }] = opsOf(tx, "create");
    expect(args[0]).not.toHaveProperty("customer");
  });

  it("falls back to the user id in the session metadata", async () => {
    retrieve.mockResolvedValue(
      paidSession({ client_reference_id: null, customer: { id: "cus_OBJ" }, metadata: { clerkUserId: "user_meta" } }),
    );
    await recordPaidSession("cs_test_abcdef12345678");

    expect(opsOf(tx, "createIfNotExists")[0].args[0]).toMatchObject({
      _id: `customer-${ids.userKey("user_meta")}`,
    });
  });

  it("treats a concurrent duplicate delivery (409) as a duplicate, not an error", async () => {
    tx = fakeTransaction(async () => {
      throw Object.assign(new Error("document already exists"), { statusCode: 409 });
    });
    transaction.mockReturnValue(tx);

    expect(await recordPaidSession(SESSION)).toEqual({ status: "duplicate", orderId: ORDER_ID });
  });

  it("lets other write failures through so Stripe retries the webhook", async () => {
    tx = fakeTransaction(async () => {
      throw Object.assign(new Error("boom"), { statusCode: 500 });
    });
    transaction.mockReturnValue(tx);

    await expect(recordPaidSession("cs_test_abcdef12345678")).rejects.toThrow("boom");
  });
});
