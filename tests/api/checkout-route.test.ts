import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/checkout/route";

const { auth, currentUser, createCheckoutSession } = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  createCheckoutSession: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth, currentUser }));
vi.mock("@/lib/checkout", async (importOriginal) => ({
  // parseLines stays real so the route's validation is exercised end to end.
  ...(await importOriginal<typeof import("@/lib/checkout")>()),
  createCheckoutSession,
}));

const post = (body: unknown, raw = false) =>
  POST(
    new Request("https://shop.test/api/checkout", {
      method: "POST",
      body: raw ? (body as string) : JSON.stringify(body),
    }),
  );

describe("POST /api/checkout", () => {
  beforeEach(() => {
    [auth, currentUser, createCheckoutSession].forEach((m) => m.mockReset());
    auth.mockResolvedValue({ userId: "user_123" });
    currentUser.mockResolvedValue({ primaryEmailAddress: { emailAddress: "buyer@example.com" } });
    createCheckoutSession.mockResolvedValue({ ok: true, url: "https://checkout.stripe.test/s" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("requires a signed-in user", async () => {
    auth.mockResolvedValue({ userId: null });
    const res = await post({ items: [{ sku: "A", quantity: 1 }] });
    expect(res.status).toBe(401);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([
    ["no items", {}],
    ["an empty cart", { items: [] }],
    ["a bad quantity", { items: [{ sku: "A", quantity: -2 }] }],
  ])("rejects %s with 400", async (_name, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const res = await post("not json", true);
    expect(res.status).toBe(400);
  });

  it("returns the Stripe url for a valid cart", async () => {
    const res = await post({ items: [{ sku: "ASPEN-111", quantity: 2 }] });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.test/s" });
    expect(createCheckoutSession).toHaveBeenCalledWith({
      lines: [{ sku: "ASPEN-111", quantity: 2 }],
      userId: "user_123",
      email: "buyer@example.com",
      origin: "https://shop.test",
    });
  });

  it("takes the user id from the session, never from the request body", async () => {
    await post({ items: [{ sku: "A", quantity: 1 }], userId: "user_attacker" });
    expect(createCheckoutSession.mock.calls[0][0].userId).toBe("user_123");
  });

  it("prefers the configured site url as the return address", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://farmhouse.example";
    await post({ items: [{ sku: "A", quantity: 1 }] });
    expect(createCheckoutSession.mock.calls[0][0].origin).toBe("https://farmhouse.example");
  });

  it("returns 409 with the problems when items changed", async () => {
    const issues = [{ sku: "A", message: "Only 1 of Bed left.", available: 1 }];
    createCheckoutSession.mockResolvedValue({ ok: false, issues });
    const res = await post({ items: [{ sku: "A", quantity: 3 }] });

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Some items in your cart changed.", issues });
  });

  it("hides internal errors behind a generic message", async () => {
    createCheckoutSession.mockRejectedValue(new Error("stripe key sk_test_secret exploded"));
    const res = await post({ items: [{ sku: "A", quantity: 1 }] });

    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("sk_test_secret");
  });
});
