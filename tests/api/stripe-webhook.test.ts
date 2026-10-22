import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";

const { recordPaidSession, revalidateTag } = vi.hoisted(() => ({
  recordPaidSession: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/orders", () => ({ recordPaidSession }));
vi.mock("next/cache", () => ({ revalidateTag }));
// The real Stripe library does the signature check, so only the (unused) API calls are absent.
vi.mock("@/lib/stripe", () => ({ stripe: new Stripe("sk_test_unit_tests_only") }));

const SECRET = "whsec_unit_tests_only";

function event(type: string, id = "cs_test_123") {
  return JSON.stringify({ id: "evt_1", object: "event", type, data: { object: { id, object: "checkout.session" } } });
}

function signed(body: string, secret = SECRET) {
  return new Stripe("sk_test_unit_tests_only").webhooks.generateTestHeaderString({ payload: body, secret });
}

function request(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/webhooks/stripe", { method: "POST", body, headers });
}

const post = (body: string, signature = signed(body)) => POST(request(body, { "stripe-signature": signature }));

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    recordPaidSession.mockReset();
    revalidateTag.mockReset();
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rejects a request with no signature", async () => {
    const res = await POST(request(event("checkout.session.completed")));
    expect(res.status).toBe(400);
    expect(recordPaidSession).not.toHaveBeenCalled();
  });

  it("rejects a signature made with the wrong secret", async () => {
    const body = event("checkout.session.completed");
    const res = await post(body, signed(body, "whsec_someone_else"));
    expect(res.status).toBe(400);
    expect(recordPaidSession).not.toHaveBeenCalled();
  });

  it("rejects a body that was changed after it was signed", async () => {
    const original = event("checkout.session.completed", "cs_test_123");
    const res = await post(event("checkout.session.completed", "cs_test_999"), signed(original));
    expect(res.status).toBe(400);
    expect(recordPaidSession).not.toHaveBeenCalled();
  });

  it("fails closed when the webhook secret is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await post(event("checkout.session.completed"));
    expect(res.status).toBe(500);
    expect(recordPaidSession).not.toHaveBeenCalled();
  });

  it("records a completed checkout and refreshes cached product data", async () => {
    recordPaidSession.mockResolvedValue({ status: "created", orderId: "order-cs_test_123", oversold: [] });
    const res = await post(event("checkout.session.completed"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, result: "created" });
    expect(recordPaidSession).toHaveBeenCalledWith("cs_test_123");
    expect(revalidateTag).toHaveBeenCalledWith("products", { expire: 0 });
  });

  it("also records a delayed payment that succeeds later", async () => {
    recordPaidSession.mockResolvedValue({ status: "created", orderId: "order-x", oversold: [] });
    const res = await post(event("checkout.session.async_payment_succeeded"));
    expect(res.status).toBe(200);
    expect(recordPaidSession).toHaveBeenCalledOnce();
  });

  it("answers 200 to a repeated delivery without refreshing the cache again", async () => {
    recordPaidSession.mockResolvedValue({ status: "duplicate", orderId: "order-cs_test_123" });
    const res = await post(event("checkout.session.completed"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, result: "duplicate" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("answers 200 for an unpaid session, so Stripe does not keep retrying", async () => {
    recordPaidSession.mockResolvedValue({ status: "unpaid" });
    const res = await post(event("checkout.session.completed"));
    expect(res.status).toBe(200);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("answers 500 when recording fails, so Stripe retries later", async () => {
    recordPaidSession.mockRejectedValue(new Error("sanity down"));
    const res = await post(event("checkout.session.completed"));
    expect(res.status).toBe(500);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("acknowledges and ignores other event types", async () => {
    const res = await post(event("payment_intent.created"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, ignored: "payment_intent.created" });
    expect(recordPaidSession).not.toHaveBeenCalled();
  });
});
