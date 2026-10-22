import { expect, test, type Page } from "@playwright/test";

// Runs in both the desktop and phone projects; the phone run is where these can actually fail.
const pages = [
  ["home", "/"],
  ["all products", "/products"],
  ["a category", "/categories/chairs"],
  ["a product", "/products/aspen-slatted-bed"],
  ["the cart", "/cart"],
  ["the wishlist", "/wishlist"],
] as const;

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const [name, path] of pages) {
  test(`${name} does not scroll sideways`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await overflow(page)).toBeLessThanOrEqual(0);
  });
}

test("the Shop menu stays inside the screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Shop", exact: true }).click();

  const menu = page.getByRole("dialog", { name: "Shop by category" });
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  await expect(menu.getByRole("link", { name: "Decor", exact: true })).toBeVisible();
});

test("the buying controls are big enough to tap", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Tap targets only matter on the phone-sized run.");
  await page.goto("/products/aspen-slatted-bed");

  for (const name of [/^Add (\d+ )?to cart$|^Out of stock$|^All available/, /^Save .* to wishlist$/, /^Share /]) {
    const box = await page.getByRole("button", { name }).first().boundingBox();
    expect(box!.height, String(name)).toBeGreaterThanOrEqual(40);
    expect(box!.width, String(name)).toBeGreaterThanOrEqual(40);
  }
});

test("the assistant panel fits on the screen and can be closed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ask us: open shopping assistant" }).click();

  const panel = page.getByRole("dialog", { name: "Shopping assistant" });
  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);

  await panel.getByRole("button", { name: "Close assistant" }).click();
  await expect(panel).toBeHidden();
});

test("the phone project really is phone-sized", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Only checks the phone project's setup.");
  expect(page.viewportSize()!.width).toBeLessThan(500);
});
