import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated WCAG 2.1 A/AA checks. They catch roughly a third of accessibility problems (contrast,
// names, roles, landmarks); keyboard and screen-reader behavior still needs a human.
const pages = [
  ["home", "/"],
  ["a category", "/categories/chairs"],
  ["a hashtag page", "/categories/chairs/accent-chair"],
  ["a product", "/products/barn-linen-accent-chair"],
  ["the cart", "/cart"],
  ["the wishlist", "/wishlist"],
  ["the privacy page", "/privacy"],
] as const;

for (const [name, path] of pages) {
  test(`${name} has no detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
    expect(summary).toEqual([]);
  });
}
