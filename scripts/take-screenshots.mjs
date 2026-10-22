// Takes the screenshots used in the README and saves them to docs/screenshots/.
// Run: E2E_BASE_URL=https://my-farmhouse-pi.vercel.app npm run screenshots
// (without E2E_BASE_URL it uses http://localhost:3000, so start `npm run dev` or `npm start` first).
//
// It only browses signed out: nothing is bought, no account is used, and no personal data is on screen.
// The assistant shot sends one real message, so it needs the Gemini key to be working and not busy.

import { chromium, devices } from "@playwright/test";
import { mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
mkdirSync(OUT, { recursive: true });

const PRODUCT = "/products/harvest-trestle-table";
const JPEG = { type: "jpeg", quality: 85 };
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const PHONE = { ...devices["Pixel 7"], deviceScaleFactor: 2 };

// The pages fade and drift in over a couple of seconds; wait so the shot shows the finished page.
const settle = async (page, ms = 4500) => {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(ms);
};

const only = process.argv.slice(2); // e.g. `npm run screenshots -- 02 06` retakes just those
const browser = await chromium.launch();
const done = [];

async function shot(name, context, run) {
  if (only.length > 0 && !only.some((prefix) => name.startsWith(prefix))) return;
  const ctx = await browser.newContext(context);
  const page = await ctx.newPage();
  try {
    await run(page);
    const kb = Math.round(statSync(`${OUT}${name}`).size / 1024);
    done.push(`${name} (${kb} KB)`);
  } catch (error) {
    console.error(`FAILED ${name}: ${String(error).split("\n")[0]}`);
    process.exitCode = 1;
  } finally {
    await ctx.close();
  }
}

await shot("01-home.jpg", DESKTOP, async (page) => {
  await page.goto(`${BASE}/`);
  await settle(page);
  await page.screenshot({ path: `${OUT}01-home.jpg`, ...JPEG });
});

await shot("02-shop-menu.jpg", DESKTOP, async (page) => {
  await page.goto(`${BASE}/`);
  await settle(page, 2500);
  await page.getByRole("button", { name: "Shop", exact: true }).click();
  await page.getByRole("dialog", { name: "Shop by category" }).waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}02-shop-menu.jpg`, ...JPEG });
});

await shot("03-category.jpg", DESKTOP, async (page) => {
  await page.goto(`${BASE}/categories/sofas`);
  await settle(page);
  await page.screenshot({ path: `${OUT}03-category.jpg`, ...JPEG });
});

await shot("04-product.jpg", DESKTOP, async (page) => {
  await page.goto(`${BASE}${PRODUCT}`);
  await settle(page, 3500);
  await page.screenshot({ path: `${OUT}04-product.jpg`, ...JPEG });
});

await shot("05-cart.jpg", DESKTOP, async (page) => {
  await page.goto(`${BASE}${PRODUCT}`);
  await settle(page, 1500);
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: /^Add (\d+ )?to cart$/ }).click();
  await page.goto(`${BASE}/cart`);
  await page.getByText("Order summary").waitFor();
  await settle(page, 2500);
  await page.screenshot({ path: `${OUT}05-cart.jpg`, ...JPEG });
});

await shot("06-assistant.jpg", { ...DESKTOP, deviceScaleFactor: 2 }, async (page) => {
  await page.goto(`${BASE}/`);
  await settle(page, 1500);
  await page.getByRole("button", { name: "Ask us: open shopping assistant" }).click();
  const panel = page.getByRole("dialog", { name: "Shopping assistant" });
  await panel.getByRole("textbox", { name: "Your message" }).fill("I need a dining table for six, under $1,500");
  await panel.getByRole("button", { name: "Send message" }).click();
  // Wait for the product cards, for "Searching the catalog…" to go away, and for the text to finish streaming.
  await panel.getByRole("log").locator('a[href^="/products/"]').first().waitFor({ timeout: 60_000 });
  await panel.getByText("Searching the catalog").waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {});
  await panel.getByRole("log").locator("div.bg-muted").first().waitFor({ timeout: 60_000 }); // the written reply
  await page.waitForTimeout(6000); // let it finish streaming
  await panel.screenshot({ path: `${OUT}06-assistant.jpg`, ...JPEG });
});

await shot("07-mobile-home.jpg", PHONE, async (page) => {
  await page.goto(`${BASE}/`);
  await settle(page);
  await page.screenshot({ path: `${OUT}07-mobile-home.jpg`, ...JPEG });
});

await shot("08-mobile-product.jpg", PHONE, async (page) => {
  await page.goto(`${BASE}${PRODUCT}`);
  await settle(page, 3500);
  await page.screenshot({ path: `${OUT}08-mobile-product.jpg`, ...JPEG });
});

await browser.close();
console.log(`Saved to docs/screenshots/:\n  ${done.join("\n  ")}`);
