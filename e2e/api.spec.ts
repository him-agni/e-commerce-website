import { expect, test } from "@playwright/test";

// The API routes that move money, change stock or spend the AI quota must refuse unauthorised callers.
test.describe("API routes refuse unauthorised callers", () => {
  test("checkout needs a signed-in user", async ({ request }) => {
    const res = await request.post("/api/checkout", { data: { items: [{ sku: "ASPEN-111", quantity: 1 }] } });
    expect(res.status()).toBe(401);
  });

  test("the Stripe webhook rejects an unsigned request", async ({ request }) => {
    const res = await request.post("/api/webhooks/stripe", {
      data: { type: "checkout.session.completed", data: { object: { id: "cs_test_forged" } } },
    });
    expect([400, 500]).toContain(res.status());
    expect(res.ok()).toBe(false);
  });

  test("the Stripe webhook rejects a forged signature", async ({ request }) => {
    const res = await request.post("/api/webhooks/stripe", {
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
      data: { type: "checkout.session.completed", data: { object: { id: "cs_test_forged" } } },
    });
    expect(res.status()).toBe(400);
  });

  test("the cache refresh hook rejects an unsigned request", async ({ request }) => {
    const res = await request.post("/api/revalidate", { data: { _type: "product", slug: "aspen-slatted-bed" } });
    expect(res.ok()).toBe(false);
    expect([401, 500]).toContain(res.status());
  });

  test("the chat route rejects an empty request", async ({ request }) => {
    const res = await request.post("/api/chat", { data: {} });
    expect(res.status()).toBe(400);
  });
});
