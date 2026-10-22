import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("shows the hero, the shop menu and products", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "Furniture with farmhouse soul" })).toBeVisible();
    await expect(page).toHaveTitle(/My Farmhouse/);
    await expect(page.locator('a[href^="/products/"]').first()).toBeVisible();
    expect(await page.locator('a[href^="/products/"]').count()).toBeGreaterThanOrEqual(4);
  });

  test("the Shop menu lists all nine categories with their hashtags", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Shop", exact: true }).click();

    const menu = page.getByRole("dialog", { name: "Shop by category" });
    await expect(menu).toBeVisible();
    for (const title of [
      "Beds",
      "Dining Tables",
      "Sofas",
      "Chairs",
      "Consoles & Storage",
      "Accent Tables",
      "Lighting",
      "Soft Furnishings",
      "Decor",
    ]) {
      await expect(menu.getByRole("link", { name: title, exact: true })).toBeVisible();
    }
    await expect(menu.getByRole("link", { name: "#accent-chair" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });
});

test.describe("categories and hashtags", () => {
  test("a category page lists its products and hashtag filters", async ({ page }) => {
    await page.goto("/categories/chairs");

    await expect(page.getByRole("heading", { level: 1, name: "Chairs" })).toBeVisible();
    const filters = page.getByRole("navigation", { name: "Filter Chairs by hashtag" });
    for (const tag of ["#dining-chair", "#accent-chair", "#rocking-chair", "#counter-stool"]) {
      await expect(filters.getByRole("link", { name: tag })).toBeVisible();
    }
  });

  test("choosing a hashtag narrows the products and has its own address", async ({ page }) => {
    // Next keeps the previous page hidden in the DOM after a client-side navigation, so count only what is visible.
    const cards = page.locator('main a[href^="/products/"]:visible');
    await page.goto("/categories/chairs");
    await expect(cards.first()).toBeVisible();
    const all = await cards.count();
    expect(all).toBeGreaterThan(3);

    await page.getByRole("navigation", { name: "Filter Chairs by hashtag" }).getByRole("link", { name: "#accent-chair" }).click();

    await expect(page).toHaveURL(/\/categories\/chairs\/accent-chair$/);
    await expect(page.getByRole("heading", { level: 1, name: "Chairs" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("#accent-chair");
    await expect(
      page.getByRole("navigation", { name: "Filter Chairs by hashtag" }).getByRole("link", { name: "#accent-chair" }),
    ).toHaveAttribute("aria-current", "page");
    await expect.poll(() => cards.count()).toBeLessThan(all);
    await expect(cards.first()).toBeVisible();
  });

  test("old category addresses redirect permanently to the matching hashtag", async ({ request }) => {
    const res = await request.get("/categories/couches", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(new URL(res.headers()["location"], "http://x").pathname).toBe("/categories/sofas/couch");
  });

  test("the old address lands on a working page", async ({ page }) => {
    await page.goto("/categories/accent-chairs");
    await expect(page).toHaveURL(/\/categories\/chairs\/accent-chair$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("an unknown category, hashtag or product shows the not-found page", async ({ page }) => {
    for (const path of ["/categories/not-a-category", "/categories/chairs/not-a-tag", "/products/not-a-product"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "We could not find that page" }), path).toBeVisible();
    }
  });
});

test.describe("privacy page", () => {
  test("is linked from the footer and explains where data lives", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
    for (const heading of ["What the site keeps, and where", "The shopping assistant", "Your choices"]) {
      await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
    }
    await expect(page.getByText("free tier")).toBeVisible();
  });

  test("is listed in the sitemap", async ({ request }) => {
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/privacy</loc>");
  });
});

test.describe("private pages", () => {
  test("a signed-out visitor is sent to sign in before seeing orders", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByText("No orders yet.")).toHaveCount(0);
  });
});

test.describe("search engines", () => {
  test("robots.txt keeps private pages out and points at the sitemap", async ({ request }) => {
    const text = await (await request.get("/robots.txt")).text();
    expect(text).toMatch(/Sitemap: .+\/sitemap\.xml/);
    for (const path of ["/api/", "/cart", "/orders", "/wishlist"]) expect(text).toContain(`Disallow: ${path}`);
  });

  test("the sitemap lists categories, hashtag pages and products", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBe(true);
    const xml = await res.text();
    expect(xml).toContain("/categories/sofas</loc>");
    expect(xml).toContain("/categories/sofas/couch</loc>");
    expect(xml).toContain("/products/aspen-slatted-bed</loc>");
    expect(xml).not.toContain("/categories/couches<");
  });

  test("a product page describes itself to search engines", async ({ page }) => {
    await page.goto("/products/aspen-slatted-bed");
    const json = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(json ?? "{}");
    expect(data["@type"]).toBe("Product");
    expect(data.name).toBe("Aspen Slatted Bed");
    expect(data.offers).toBeTruthy();
  });
});
