import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";

// Signs in as a dedicated Clerk test user and goes as far as Stripe's payment page. It never pays,
// so no order is created and no stock changes; the only trace is an unpaid Stripe test session.
// Needs E2E_USER_EMAIL (a Clerk test user) and the Clerk keys (see the README); skips without them.
// Sign-in uses a one-time token minted with the secret key, so no password or email code is involved.
const email = process.env.E2E_USER_EMAIL;
const configured = Boolean(email && process.env.CLERK_SECRET_KEY);

test.skip(!configured, "Set E2E_USER_EMAIL and the Clerk keys to run the signed-in tests.");
// One test user, one browser at a time keeps Clerk's sign-in limits happy.
test.describe.configure({ mode: "serial" });

const PRODUCT = "Aspen Slatted Bed";

async function signIn(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email! });
  // The header swaps "Sign in" for the account button once Clerk has a session.
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeHidden();
}

test.describe("signed in", () => {
  test("the cart offers Check out instead of asking to sign in", async ({ page }) => {
    await signIn(page);
    await page.goto("/products/aspen-slatted-bed");
    await page.getByRole("button", { name: /^Add (\d+ )?to cart$/ }).click();
    await page.getByRole("link", { name: "View cart" }).click();

    await expect(page.getByRole("button", { name: "Check out" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Sign in to check out" })).toHaveCount(0);
  });

  test("Check out sends the shopper to Stripe with the right product and price", async ({ page }) => {
    await signIn(page);
    await page.goto("/products/aspen-slatted-bed");
    const price = (await page.locator("p.text-2xl").textContent())!;
    await page.getByRole("button", { name: /^Add (\d+ )?to cart$/ }).click();
    await page.getByRole("link", { name: "View cart" }).click();

    await page.getByRole("button", { name: "Check out" }).click();

    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
    await expect(page.getByText(PRODUCT).first()).toBeVisible();
    // Stripe shows cents ("$1,099.00"); the product page shows whole dollars ("$1,099").
    await expect(page.getByText(`${price}.00`).first()).toBeVisible();
    // Stripe passes on the email Clerk holds for the user, and a "cs_test_" session means test mode: no real money.
    await expect(page.locator("body")).toContainText(email!);
    await expect(page.locator("body")).toHaveAttribute("data-session-id", /^cs_test_/);
  });

  test("My orders opens for the signed-in user", async ({ page }) => {
    await signIn(page);
    await page.goto("/orders");
    await expect(page.getByRole("heading", { level: 1, name: "Your orders" })).toBeVisible();
    await expect(page.getByText(/No orders yet\.|Order MF-/).first()).toBeVisible();
  });
});
