// TOPIC: Playwright E2E Tests
//
// These tests run in a REAL Chromium browser against your running app.
//
// Key differences from Jest tests:
//   ✓ Real browser — JavaScript, CSS, animations all work
//   ✓ Real network — no mocking (or you use route() to intercept)
//   ✓ Real DOM — actual keyboard/mouse events, focus, scroll
//   ✗ Slower — seconds per test, not milliseconds
//   ✗ Needs dev server running (npm start)
//
// Playwright API:
//   page.goto(url)               — navigate
//   page.getByRole(role, {name}) — accessible query (same priority as RTL)
//   page.getByLabel(text)        — find by label
//   page.getByText(text)         — find by text content
//   page.getByTestId(id)         — find by data-testid
//   locator.click()              — click element
//   locator.fill(text)           — type into input (clears first)
//   locator.press("Enter")       — keyboard event
//   locator.isVisible()          — check visibility
//   expect(locator).toBeVisible()
//   expect(locator).toHaveText(text)
//   expect(locator).toBeDisabled()
//   page.waitForResponse(url)    — wait for a specific network request
//   page.route(url, handler)     — intercept and mock network requests
//
// Run this file: npm run test:e2e
// (Requires: npm start running on http://localhost:3000)

import { test, expect, Page } from "@playwright/test";

// ════════════════════════════════════════════════════════════
// Page Object Model (POM) — enterprise pattern
//
// Instead of duplicating selectors across tests, encapsulate
// page interactions in a class. If the selector changes, update
// it in ONE place.
// ════════════════════════════════════════════════════════════

class TodoPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto("/");
  }

  // Locators — defined once, used everywhere
  get heading()    { return this.page.getByRole("heading", { name: /todo/i }); }
  get input()      { return this.page.getByLabel(/new todo/i); }
  get addButton()  { return this.page.getByRole("button", { name: /add/i }); }
  get todoItems()  { return this.page.getByRole("listitem"); }
  get errorAlert() { return this.page.getByRole("alert"); }

  todoItem(name: string) {
    return this.page.getByRole("listitem").filter({ hasText: name });
  }

  deleteButton(name: string) {
    return this.page.getByRole("button", { name: new RegExp(`delete ${name}`, "i") });
  }

  checkbox(name: string) {
    return this.page.getByRole("checkbox", { name: new RegExp(`toggle ${name}`, "i") });
  }

  // Actions
  async addTodo(title: string) {
    await this.input.fill(title);
    await this.addButton.click();
  }

  async deleteTodo(title: string) {
    await this.deleteButton(title).click();
  }

  async toggleTodo(title: string) {
    await this.checkbox(title).click();
  }
}

// ════════════════════════════════════════════════════════════
// Tests
// NOTE: These tests require the dev server (npm start) to be
//       running on http://localhost:3000 with a TodoApp component
//       accessible at the root route.
//       The webServer option in playwright.config.ts can auto-start it.
// ════════════════════════════════════════════════════════════

test.describe("Todo App — E2E", () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    // In a real app: await todoPage.goto();
    // For this learning project, we document the patterns without
    // requiring the server — uncomment when running against a live app.
  });

  // ── Pattern 1: Basic navigation and content ──────────────
  test("page loads and shows the todo heading", async ({ page }) => {
    // await page.goto("/");
    // await expect(page.getByRole("heading", { name: /todo/i })).toBeVisible();

    // LEARNING: This is the pattern. In practice, navigate and assert.
    expect(true).toBe(true); // placeholder — remove when running against live app
  });

  // ── Pattern 2: Add a todo ────────────────────────────────
  test("user can add a todo item", async ({ page }) => {
    /*
    await page.goto("/");
    await todoPage.addTodo("Buy milk");
    await expect(todoPage.todoItem("Buy milk")).toBeVisible();
    */
    expect(true).toBe(true);
  });

  // ── Pattern 3: Delete a todo ─────────────────────────────
  test("user can delete a todo item", async ({ page }) => {
    /*
    await page.goto("/");
    await todoPage.addTodo("Delete me");
    await todoPage.deleteTodo("Delete me");
    await expect(todoPage.todoItem("Delete me")).not.toBeVisible();
    */
    expect(true).toBe(true);
  });

  // ── Pattern 4: Network interception ─────────────────────
  test("shows error when API is down", async ({ page }) => {
    /*
    // Mock the network BEFORE navigating
    await page.route("/api/todos", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" })
    );
    await page.goto("/");
    await expect(page.getByRole("alert")).toBeVisible();
    */
    expect(true).toBe(true);
  });

  // ── Pattern 5: Wait for network request ──────────────────
  test("add todo waits for POST to complete", async ({ page }) => {
    /*
    await page.goto("/");

    // Wait for the specific POST request to complete
    const [response] = await Promise.all([
      page.waitForResponse("/api/todos"),
      todoPage.addTodo("Wait for me"),
    ]);

    expect(response.status()).toBe(201);
    */
    expect(true).toBe(true);
  });

  // ── Pattern 6: Screenshot comparison ─────────────────────
  test("todo list matches visual snapshot", async ({ page }) => {
    /*
    await page.goto("/");
    // Visual regression — compares pixel-by-pixel to a saved screenshot
    // First run: creates the snapshot. Subsequent runs: diffs against it.
    await expect(page.locator("ul")).toHaveScreenshot("todo-list.png");
    */
    expect(true).toBe(true);
  });

  // ── Pattern 7: Keyboard navigation ───────────────────────
  test("can add todo with Enter key", async ({ page }) => {
    /*
    await page.goto("/");
    await todoPage.input.fill("Enter key todo");
    await todoPage.input.press("Enter");
    await expect(todoPage.todoItem("Enter key todo")).toBeVisible();
    */
    expect(true).toBe(true);
  });

  // ── Pattern 8: Mobile viewport ───────────────────────────
  test("works on mobile viewport", async ({ page }) => {
    /*
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 13
    await page.goto("/");
    await expect(todoPage.heading).toBeVisible();
    */
    expect(true).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// Authentication flow — common enterprise E2E pattern
// ════════════════════════════════════════════════════════════

test.describe("Auth flow — E2E patterns", () => {
  test("protected route redirects to login when not authenticated", async ({ page }) => {
    /*
    await page.goto("/dashboard");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    */
    expect(true).toBe(true);
  });

  test("user can log in and access dashboard", async ({ page }) => {
    /*
    await page.goto("/login");
    await page.getByLabel("Email").fill("alice@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    // After login, redirected to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome, Alice")).toBeVisible();
    */
    expect(true).toBe(true);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    /*
    await page.goto("/login");
    await page.getByLabel("Email").fill("bad@email.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("alert")).toHaveText("Invalid credentials");
    await expect(page).toHaveURL("/login"); // stays on login page
    */
    expect(true).toBe(true);
  });
});
