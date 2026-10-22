import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Local runs pick up the Clerk keys and the test user's login from .env.local. CI sets them as secrets.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// The suite drives a running copy of the site. Point it at any deployment with E2E_BASE_URL
// (for example the live site); without it, it starts `npm run dev` on localhost:3000.
// Nothing in it pays or writes to Sanity, so it is safe to run against production. The signed-in tests
// log in as a Clerk test user and stop at Stripe's payment page.
const baseURL = process.env.E2E_BASE_URL?.replace(/\/$/, "");

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global.setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: baseURL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // A phone-sized viewport with touch, to catch layouts and controls that only break on small screens.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: baseURL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
