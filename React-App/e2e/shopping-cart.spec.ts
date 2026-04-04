// TOPIC: E2E Testing with Playwright
// LEVEL: Senior — Testing (Advanced) #3
//
// ─── WHAT IS E2E TESTING? ────────────────────────────────────────────────────
//
//   End-to-End tests run in a REAL browser (Chromium, Firefox, WebKit).
//   They test the full stack: React component → real fetch → real server.
//
//   Unlike Jest tests (jsdom, mocked network), Playwright:
//   - Opens an actual browser window
//   - Navigates to real URLs
//   - Clicks, types, scrolls like a real user
//   - Can test things jsdom can't: CSS visibility, animations, iframes, file downloads
//
// ─── WHEN TO WRITE E2E TESTS ─────────────────────────────────────────────────
//
//   Write E2E for:
//   ✓ Critical user journeys (signup, checkout, login)
//   ✓ Cross-browser compatibility
//   ✓ Visual layout / CSS (things jsdom doesn't render)
//   ✓ Browser-only APIs (clipboard, FileReader, ResizeObserver)
//
//   Skip E2E for:
//   ✗ Component logic — use integration tests (faster, more stable)
//   ✗ Edge cases — use unit/integration tests
//   ✗ Every permutation — only the happy path + one critical failure
//
// ─── PLAYWRIGHT KEY CONCEPTS ─────────────────────────────────────────────────
//
//   page.goto(url)                   — navigate to a URL
//   page.getByRole(role, { name })   — query by ARIA role (same as Testing Library)
//   page.getByText(text)             — find element by text content
//   page.getByTestId(id)             — find by data-testid
//   page.getByLabel(text)            — find by label text
//
//   await locator.click()            — click an element
//   await locator.fill(text)         — clear and type into input
//   await locator.isVisible()        — check visibility
//   await locator.isDisabled()       — check disabled state
//   await expect(locator).toBeVisible()
//   await expect(locator).toHaveText(text)
//   await expect(locator).toBeDisabled()
//
// ─── AUTO-WAITING ─────────────────────────────────────────────────────────────
//
//   Playwright auto-waits for elements to be:
//   - Attached to DOM
//   - Visible
//   - Stable (not animating)
//   - Enabled
//   - Focused (for fill/type)
//
//   You rarely need explicit waits — just assert what you expect.
//
// ─── NETWORK INTERCEPTION (page.route) ───────────────────────────────────────
//
//   page.route('/api/products', route => route.fulfill({
//     status: 200,
//     json: [{ id: 1, name: 'Test Product', price: 9.99, category: 'misc' }],
//   }));
//
//   Like MSW but for Playwright — intercepts requests in the real browser.
//   Great for E2E tests that don't need a real backend.
//
// ─── RUNNING THESE TESTS ─────────────────────────────────────────────────────
//
//   1. Start dev server: npm start
//   2. In another terminal: npm run test:e2e
//   3. Interactive mode:   npm run test:e2e:ui
//   4. See browser:        npm run test:e2e:headed
//
//   These tests require the ShoppingCart component to be visible at localhost:3000.
//   The app renders it in the "Senior — Advanced Patterns" section.

import { test, expect, Page } from "@playwright/test";

// ─── SHARED MOCK DATA ────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  { id: 1, name: "React T-Shirt", price: 29.99, category: "clothing" },
  { id: 2, name: "TypeScript Mug", price: 14.99, category: "accessories" },
  { id: 3, name: "Node.js Hoodie", price: 49.99, category: "clothing" },
];

const MOCK_CHECKOUT = { orderId: "E2E-001", total: 29.99 };

// ─── HELPER — set up API routes for each test ────────────────────────────────

async function setupRoutes(page: Page) {
  await page.route("**/api/products", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PRODUCTS) })
  );
  await page.route("**/api/checkout", route =>
    route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(MOCK_CHECKOUT) })
  );
}

// ─── HELPER — navigate to the shopping cart section ──────────────────────────

async function gotoCart(page: Page) {
  await setupRoutes(page);
  await page.goto("/");
  // Scroll to the ShoppingCart component (rendered in Senior section)
  await page.getByText("Senior — Advanced Patterns").scrollIntoViewIfNeeded();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PAGE LOAD
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("1 — Page load", () => {
  test("products load and display on the page", async ({ page }) => {
    await gotoCart(page);

    // Products appear after fetch
    await expect(page.getByText("React T-Shirt")).toBeVisible();
    await expect(page.getByText("TypeScript Mug")).toBeVisible();
    await expect(page.getByText("Node.js Hoodie")).toBeVisible();
  });

  test("loading indicator shows while fetch is in progress", async ({ page }) => {
    // Delay the product response
    await page.route("**/api/products", async route => {
      await page.waitForTimeout(500);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PRODUCTS),
      });
    });
    await page.route("**/api/checkout", route =>
      route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(MOCK_CHECKOUT) })
    );

    await page.goto("/");
    await page.getByText("Senior — Advanced Patterns").scrollIntoViewIfNeeded();

    // Loading text briefly visible
    await expect(page.getByText("Loading products…")).toBeVisible();
    // Then products appear
    await expect(page.getByText("React T-Shirt")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CATEGORY FILTER
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("2 — Category filter", () => {
  test("filters to clothing category", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByTestId("filter-clothing").click();

    await expect(page.getByText("React T-Shirt")).toBeVisible();
    await expect(page.getByText("Node.js Hoodie")).toBeVisible();
    await expect(page.getByText("TypeScript Mug")).not.toBeVisible();
  });

  test("restores all products when 'all' is selected", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByTestId("filter-clothing").click();
    await page.getByTestId("filter-all").click();

    await expect(page.getByText("TypeScript Mug")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ADD TO CART
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("3 — Add to cart", () => {
  test("adds item to cart and updates heading", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();

    await expect(page.getByRole("heading", { name: "Cart (1 items)" })).toBeVisible();

    const cart = page.getByRole("region", { name: "Shopping cart" });
    await expect(cart.getByText("React T-Shirt")).toBeVisible();
  });

  test("increments quantity when same item added twice", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();

    await expect(page.getByRole("heading", { name: "Cart (2 items)" })).toBeVisible();
    await expect(page.getByTestId("cart-item-1").getByText("×2")).toBeVisible();
  });

  test("subtotal updates correctly", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByRole("button", { name: "Add TypeScript Mug to cart" }).click();

    // $29.99 + $14.99 = $44.98
    await expect(page.getByTestId("subtotal")).toHaveText("$44.98");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DISCOUNT CODE
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("4 — Discount code", () => {
  test("applies valid discount and updates total", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByRole("button", { name: "Add TypeScript Mug to cart" }).click();

    await page.getByLabel("Discount code").fill("SAVE10");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page.getByTestId("discount-applied")).toHaveText("10% discount applied!");
    // $44.98 * 0.9 = $40.48
    await expect(page.getByTestId("total")).toHaveText("$40.48");
  });

  test("shows error for invalid discount code", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByLabel("Discount code").fill("INVALID");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page.getByRole("alert")).toHaveText("Invalid code");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. FULL CHECKOUT JOURNEY (critical path — most important E2E test)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("5 — Full checkout journey", () => {
  test("complete checkout shows confirmation with order ID", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    // 1. Add items
    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByRole("button", { name: "Add TypeScript Mug to cart" }).click();

    // 2. Apply discount
    await page.getByLabel("Discount code").fill("SAVE10");
    await page.getByRole("button", { name: "Apply" }).click();

    // 3. Checkout
    await page.getByRole("button", { name: "Checkout" }).click();

    // 4. Confirmation
    await expect(page.getByTestId("order-confirmation")).toBeVisible();
    await expect(page.getByTestId("order-id")).toHaveText("E2E-001");
    await expect(page.getByText("Order confirmed!")).toBeVisible();
  });

  test("checkout button is disabled while submitting", async ({ page }) => {
    // Slow checkout response
    await page.route("**/api/products", route =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PRODUCTS) })
    );
    await page.route("**/api/checkout", async route => {
      await page.waitForTimeout(400);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(MOCK_CHECKOUT),
      });
    });

    await page.goto("/");
    await page.getByText("Senior — Advanced Patterns").scrollIntoViewIfNeeded();
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByRole("button", { name: "Checkout" }).click();

    // Button disabled during submission
    await expect(page.getByRole("button", { name: "Processing…" })).toBeDisabled();

    // Resolves
    await expect(page.getByTestId("order-confirmation")).toBeVisible();
  });

  test("checkout error shows alert and preserves cart", async ({ page }) => {
    await page.route("**/api/products", route =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_PRODUCTS) })
    );
    await page.route("**/api/checkout", route =>
      route.fulfill({ status: 500, body: "Internal Server Error" })
    );

    await page.goto("/");
    await page.getByText("Senior — Advanced Patterns").scrollIntoViewIfNeeded();
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByRole("button", { name: "Checkout" }).click();

    await expect(page.getByRole("alert")).toHaveText("Checkout failed. Please try again.");
    await expect(page.getByTestId("cart-item-1")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ACCESSIBILITY CHECKS (Playwright + axe)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("6 — Accessibility", () => {
  test("all Add to cart buttons have accessible names", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    // Every product should have a named button
    for (const product of MOCK_PRODUCTS) {
      await expect(
        page.getByRole("button", { name: `Add ${product.name} to cart` })
      ).toBeVisible();
    }
  });

  test("cart region has accessible label", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await expect(page.getByRole("region", { name: "Shopping cart" })).toBeVisible();
  });

  test("filter buttons have aria-pressed reflecting active state", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByTestId("filter-clothing").click();

    expect(
      await page.getByTestId("filter-clothing").getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      await page.getByTestId("filter-all").getAttribute("aria-pressed")
    ).toBe("false");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. REMOVE + SHOP AGAIN
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("7 — Remove and shop again", () => {
  test("removes item from cart", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByRole("button", { name: "Add TypeScript Mug to cart" }).click();

    await page.getByTestId("cart-item-1")
      .getByRole("button", { name: "Remove React T-Shirt" })
      .click();

    await expect(page.getByTestId("cart-item-1")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Cart (1 items)" })).toBeVisible();
  });

  test("Shop again resets to product list", async ({ page }) => {
    await gotoCart(page);
    await page.getByText("React T-Shirt").waitFor();

    await page.getByRole("button", { name: "Add React T-Shirt to cart" }).click();
    await page.getByRole("button", { name: "Checkout" }).click();
    await page.getByTestId("order-confirmation").waitFor();

    await page.getByRole("button", { name: "Shop again" }).click();

    await expect(page.getByText("React T-Shirt")).toBeVisible();
    await expect(page.getByTestId("order-confirmation")).not.toBeVisible();
  });
});
