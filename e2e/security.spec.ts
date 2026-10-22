import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

// The production site sends hardening headers, and its Content-Security-Policy must not block anything
// the pages really use. The policy is only sent by a production build (Next's dev server needs eval),
// so the policy checks skip against `npm run dev`.

async function policyOf(page: Page) {
  const res = await page.request.get("/");
  return res.headers()["content-security-policy"];
}

/** Records every message the browser prints about a blocked resource. */
function watchForBlocks(page: Page) {
  const blocked: string[] = [];
  const onConsole = (message: ConsoleMessage) => {
    const text = message.text();
    if (/content security policy|refused to (load|connect|frame|execute|apply|display|send)/i.test(text)) {
      blocked.push(text.slice(0, 200));
    }
  };
  page.on("console", onConsole);
  return blocked;
}

test.describe("security headers", () => {
  test("every page says it must not be sniffed, framed or leak its address", async ({ request }) => {
    for (const path of ["/", "/products/aspen-slatted-bed", "/cart", "/api/chat"]) {
      const headers = (await request.get(path)).headers();
      expect(headers["x-content-type-options"], path).toBe("nosniff");
      expect(headers["x-frame-options"], path).toBe("DENY");
      expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
      expect(headers["permissions-policy"], path).toContain("camera=()");
    }
  });

  test("the Content-Security-Policy is strict where it matters", async ({ page }) => {
    const csp = await policyOf(page);
    test.skip(!csp, "No policy is sent by the development server; run against a production build.");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toMatch(/(^|[ ;])\*([ ;]|$)/); // no bare wildcard source
    expect(csp).not.toMatch(/script-src[^;]*https:(?!\/)/); // no "any https script"
  });

  test("the Studio is exempt from the policy but still cannot be framed", async ({ request }) => {
    const headers = (await request.get("/studio")).headers();
    expect(headers["content-security-policy"]).toBeUndefined();
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("another site cannot put the shop in a frame", async ({ page, baseURL }) => {
    const csp = await policyOf(page);
    test.skip(!csp, "No policy is sent by the development server; run against a production build.");
    const blocked = watchForBlocks(page);

    await page.setContent(`<iframe src="${baseURL}/" title="shop"></iframe>`);

    await expect.poll(() => blocked.length).toBeGreaterThan(0);
    expect(blocked.join(" ")).toMatch(/frame|display/i);
  });
});

test.describe("the policy blocks nothing the site needs", () => {
  test("browsing, sign-in window and assistant run without a single blocked resource", async ({ page }) => {
    const csp = await policyOf(page);
    test.skip(!csp, "No policy is sent by the development server; run against a production build.");
    const blocked = watchForBlocks(page);

    for (const path of ["/", "/categories/chairs", "/products/barn-linen-accent-chair", "/cart", "/wishlist", "/sign-in", "/sign-up"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }

    // Clerk's sign-in window loads its code from Clerk's domain and a bot check from Cloudflare.
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator(".cl-rootBox").first()).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Escape");

    // The assistant's code is loaded on demand.
    await page.getByRole("button", { name: "Ask us: open shopping assistant" }).click();
    await expect(page.getByRole("dialog", { name: "Shopping assistant" })).toBeVisible();

    // Fonts and images on a product page, and the cart's price lookup.
    await page.goto("/products/aspen-slatted-bed");
    await page.getByRole("button", { name: /^Add (\d+ )?to cart$/ }).click();
    await page.goto("/cart");
    await expect(page.getByText("Order summary")).toBeVisible();

    expect(blocked).toEqual([]);
  });
});
