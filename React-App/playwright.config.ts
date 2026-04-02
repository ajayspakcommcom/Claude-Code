// TOPIC: Playwright Configuration — E2E Testing
//
// Playwright tests run in a REAL browser (Chromium, Firefox, WebKit).
// Unlike Jest + jsdom, Playwright tests the actual rendered app.
//
// E2E tests are the top of the testing pyramid:
//   Unit tests     — fast, many, isolated
//   Integration    — medium speed, verify component interaction
//   E2E (Playwright) — slow, few, verify full user journeys in real browser
//
// Run: npm run test:e2e          (requires the dev server to be running)
//      npm run test:e2e:ui       (opens Playwright's interactive UI)
//      npm run test:e2e:headed   (shows the browser window)
//
// Files: e2e/**/*.spec.ts

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Where E2E test files live
  testDir: "./e2e",

  // Pattern for test files
  testMatch: "**/*.spec.ts",

  // Run tests in parallel — faster in CI
  fullyParallel: true,

  // Fail the build on any test.only() left in — CI safety net
  forbidOnly: !!process.env.CI,

  // Retry failed tests once in CI (flaky network, timing)
  retries: process.env.CI ? 1 : 0,

  // Workers (parallel test runners)
  workers: process.env.CI ? 1 : undefined,

  // Reporter — terminal output + HTML report
  reporter: [
    ["list"],                                  // live output
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    // Base URL — your dev server. Tests use relative paths: goto("/login")
    baseURL: "http://localhost:3000",

    // Capture screenshots on failure
    screenshot: "only-on-failure",

    // Capture video on failure (useful for debugging CI failures)
    video: "retain-on-failure",

    // Capture trace on first retry — opens in Playwright Trace Viewer
    trace: "on-first-retry",
  },

  // Browser targets — run tests in all three by default
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment to test cross-browser:
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
    // Mobile viewports:
    // {
    //   name: "Mobile Chrome",
    //   use: { ...devices["Pixel 5"] },
    // },
  ],

  // Start the dev server before tests and shut it down after
  // webServer: {
  //   command: "npm start",
  //   url: "http://localhost:3000",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30_000,
  // },
});
