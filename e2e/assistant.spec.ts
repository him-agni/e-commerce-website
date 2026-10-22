import { expect, test } from "@playwright/test";

// These tests open and close the chat but never send a message, so they do not use up the
// shared free Gemini quota.
test.describe("shopping assistant", () => {
  test("opens from the launcher, takes focus, and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ask us: open shopping assistant" }).click();

    const panel = page.getByRole("dialog", { name: "Shopping assistant" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("textbox", { name: "Your message" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.getByRole("button", { name: "Ask us: open shopping assistant" })).toBeFocused();
  });

  test("offers a send button that is off until there is something to send", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ask us: open shopping assistant" }).click();

    const panel = page.getByRole("dialog", { name: "Shopping assistant" });
    await expect(panel.getByRole("button", { name: "Send message" })).toBeDisabled();
    await panel.getByRole("textbox", { name: "Your message" }).fill("a linen sofa");
    await expect(panel.getByRole("button", { name: "Send message" })).toBeEnabled();
  });
});
