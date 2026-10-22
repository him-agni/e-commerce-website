import { expect, test, type Page } from "@playwright/test";

const PRODUCT = "Aspen Slatted Bed";
const PATH = "/products/aspen-slatted-bed";

const price = (page: Page) => page.locator("p.text-2xl");
const quantityGroup = (page: Page) => page.getByRole("group", { name: "Quantity" });

/** How many units the page says are left, or Infinity when it just says "In stock". */
async function unitsLeft(page: Page) {
  const text = (await page.getByText(/^(In stock|Only \d+ left|Out of stock)$/).first().textContent()) ?? "";
  const match = text.match(/Only (\d+) left/);
  return match ? Number(match[1]) : text === "Out of stock" ? 0 : Infinity;
}

test.describe("product page", () => {
  test("shows the product with its hashtags and options", async ({ page }) => {
    await page.goto(PATH);

    await expect(page.getByRole("heading", { level: 1, name: PRODUCT })).toBeVisible();
    await expect(price(page)).toHaveText(/^\$[\d,]+$/);
    await expect(page.getByRole("button", { name: "Queen", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "King", exact: true })).toBeVisible();
  });

  test("a hashtag on a product links to that hashtag's page", async ({ page }) => {
    await page.goto("/products/barn-linen-accent-chair");

    await page.getByRole("list", { name: "Hashtags" }).getByRole("link", { name: "#accent-chair" }).click();

    await expect(page).toHaveURL(/\/categories\/chairs\/accent-chair$/);
  });

  test("choosing a size changes the price", async ({ page }) => {
    await page.goto(PATH);
    await page.getByRole("button", { name: "Queen", exact: true }).click();
    const queen = await price(page).textContent();

    await page.getByRole("button", { name: "King", exact: true }).click();
    await expect(page.getByRole("button", { name: "King", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(price(page)).not.toHaveText(queen ?? "");
  });

  test("the quantity stepper stops at the stock that is left", async ({ page }) => {
    await page.goto(PATH);
    const left = await unitsLeft(page);
    test.skip(left === 0, "The default option is sold out, so there is no stepper to test.");

    const allowed = Math.min(left, 20);
    const increase = page.getByRole("button", { name: "Increase quantity" });
    for (let i = 0; i < allowed + 3 && (await increase.isEnabled()); i++) await increase.click();

    await expect(quantityGroup(page)).toContainText(String(allowed));
    await expect(increase).toBeDisabled();

    const decrease = page.getByRole("button", { name: "Decrease quantity" });
    for (let i = 0; i < allowed + 3 && (await decrease.isEnabled()); i++) await decrease.click();
    await expect(quantityGroup(page)).toContainText("1");
    await expect(decrease).toBeDisabled();
  });

  test("sharing copies the product link", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(PATH);
    await page.evaluate(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));

    await page.getByRole("button", { name: `Share ${PRODUCT}` }).click();

    await expect(page.getByText("Link copied")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/products\/aspen-slatted-bed$/);
  });
});

test.describe("cart", () => {
  test("an empty cart says so", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse furniture" })).toBeVisible();
  });

  test("add a product, see it in the cart, change the quantity, then remove it", async ({ page }) => {
    await page.goto(PATH);
    test.skip((await unitsLeft(page)) === 0, "The default option is sold out.");

    await page.getByRole("button", { name: /^Add (\d+ )?to cart$|^Add to cart$/ }).click();
    await expect(page.getByText(/1 in cart\./)).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart, 1 items" })).toBeVisible();

    await page.getByRole("link", { name: "View cart" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("link", { name: PRODUCT }).last()).toBeVisible();
    await expect(page.getByText("Order summary")).toBeVisible();
    await expect(page.getByText("Total", { exact: true })).toBeVisible();

    // Checking out needs an account, so a visitor is asked to sign in rather than charged.
    await expect(page.getByRole("button", { name: "Sign in to check out" })).toBeVisible();

    // The cart's own stepper is disabled once the stock is all in the cart.
    const increase = page.getByRole("button", { name: `Increase quantity of ${PRODUCT}` });
    if (await increase.isEnabled()) {
      await increase.click();
      await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();
    }

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
  });

  test("the cart survives a page reload", async ({ page }) => {
    await page.goto(PATH);
    test.skip((await unitsLeft(page)) === 0, "The default option is sold out.");
    await page.getByRole("button", { name: /^Add (\d+ )?to cart$/ }).click();
    await expect(page.getByText(/in cart\./)).toBeVisible();

    await page.reload();
    await expect(page.getByRole("link", { name: /^Cart, \d+ items$/ })).toBeVisible();
  });
});

test.describe("wishlist", () => {
  test("save a product, find it on the wishlist page, keep it after a reload, then remove it", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(page.getByText("Nothing saved yet.")).toBeVisible();

    await page.goto(PATH);
    const save = page.getByRole("button", { name: `Save ${PRODUCT} to wishlist` });
    await save.click();
    await expect(page.getByRole("button", { name: `Remove ${PRODUCT} from wishlist` })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: "Wishlist, 1 saved" })).toBeVisible();

    await page.getByRole("link", { name: "Wishlist, 1 saved" }).click();
    await expect(page).toHaveURL(/\/wishlist$/);
    await expect(page.getByRole("link", { name: PRODUCT }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole("link", { name: PRODUCT }).first()).toBeVisible();

    await page.getByRole("button", { name: `Remove ${PRODUCT} from wishlist` }).click();
    await expect(page.getByText("Nothing saved yet.")).toBeVisible();
  });

  test("the wishlist is private to the browser", async ({ page, browser }) => {
    await page.goto(PATH);
    await page.getByRole("button", { name: `Save ${PRODUCT} to wishlist` }).click();
    await expect(page.getByRole("link", { name: "Wishlist, 1 saved" })).toBeVisible();

    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto("/wishlist");
    await expect(otherPage.getByText("Nothing saved yet.")).toBeVisible();
    await other.close();
  });
});
