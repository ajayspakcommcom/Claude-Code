// TOPIC: Integration Tests (Senior)
// LEVEL: Senior — Testing (Advanced) #1
//
// ─── WHAT ARE INTEGRATION TESTS? ─────────────────────────────────────────────
//
//   Tests that verify MULTIPLE components working together through a real
//   user flow — not a single unit in isolation.
//
//   Unit test:        render <Button />, click it, check callback called
//   Integration test: render <CheckoutPage />, add items, apply discount,
//                     submit, verify confirmation screen
//
// ─── WHY INTEGRATION TESTS ARE MORE VALUABLE ──────────────────────────────────
//
//   Unit tests can all pass while the app is broken — because they test
//   pieces in isolation. Integration tests catch:
//   - Props not being passed correctly between components
//   - State not flowing through to the right places
//   - Event handlers wired to the wrong actions
//   - Side effects (fetch, navigation) that don't fire at the right time
//
// ─── TESTING PYRAMID (senior perspective) ────────────────────────────────────
//
//   E2E (few)        ← expensive, slow, test critical paths only
//   Integration (many) ← the sweet spot, catches most real bugs
//   Unit (some)      ← pure logic: reducers, utils, custom hooks
//
//   "Write tests. Not too many. Mostly integration." — Kent C. Dodds
//
// ─── KEY TOOLS ───────────────────────────────────────────────────────────────
//
//   @testing-library/react  — render, screen, waitFor, within, fireEvent
//   @testing-library/user-event — realistic user interactions (types, clicks)
//   msw (Mock Service Worker)   — intercept fetch/XHR at the network level
//
// ─── GUIDING PRINCIPLE ───────────────────────────────────────────────────────
//
//   "The more your tests resemble the way your software is used,
//    the more confidence they give you." — Testing Library motto
//
//   → Query by role/label (what the user sees), not by className or testId.
//   → Use userEvent, not fireEvent — it simulates real browser interactions.
//   → Use within() to scope queries to a specific container.
//   → Prefer findBy* (async) over getBy* + waitFor where possible.

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { ShoppingCart, Product } from "./components/ShoppingCart";

// ─── MSW SERVER SETUP ─────────────────────────────────────────────────────────
//
// MSW intercepts real fetch() calls at the network level.
// Components don't know they're being intercepted — identical to production.

const PRODUCTS: Product[] = [
  { id: 1, name: "React T-Shirt", price: 29.99, category: "clothing" },
  { id: 2, name: "TypeScript Mug", price: 14.99, category: "accessories" },
  { id: 3, name: "Node.js Hoodie", price: 49.99, category: "clothing" },
  { id: 4, name: "VS Code Sticker", price: 4.99, category: "accessories" },
];

const server = setupServer(
  rest.get("/api/products", (_req, res, ctx) =>
    res(ctx.json(PRODUCTS))
  ),
  rest.post("/api/checkout", async (_req, res, ctx) =>
    res(ctx.status(201), ctx.json({ orderId: "ORD-001", total: 44.98 }))
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Wait for products to appear (used in many tests)
const waitForProducts = () => screen.findByText("React T-Shirt");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LOAD FLOW
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Load flow", () => {
  it("shows loading indicator then renders all products", async () => {
    render(<ShoppingCart />);

    // Loading state appears first
    expect(screen.getByText("Loading products…")).toBeInTheDocument();

    // All products render after fetch resolves
    expect(await screen.findByText("React T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("TypeScript Mug")).toBeInTheDocument();
    expect(screen.getByText("Node.js Hoodie")).toBeInTheDocument();

    // Loading indicator is gone
    expect(screen.queryByText("Loading products…")).not.toBeInTheDocument();
  });

  it("shows error message when API fails", async () => {
    // Override the default handler for this one test
    server.use(
      rest.get("/api/products", (_req, res, ctx) => res(ctx.status(500)))
    );

    render(<ShoppingCart />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load products"
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CATEGORY FILTER FLOW
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Category filter flow", () => {
  it("filters products by category when a filter is clicked", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    // Click the "clothing" filter
    await user.click(screen.getByTestId("filter-clothing"));

    // Only clothing items visible
    expect(screen.getByText("React T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Node.js Hoodie")).toBeInTheDocument();
    expect(screen.queryByText("TypeScript Mug")).not.toBeInTheDocument();
    expect(screen.queryByText("VS Code Sticker")).not.toBeInTheDocument();
  });

  it("shows all products when 'all' filter is selected", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByTestId("filter-clothing"));
    await user.click(screen.getByTestId("filter-all"));

    expect(screen.getByText("TypeScript Mug")).toBeInTheDocument();
    expect(screen.getByText("VS Code Sticker")).toBeInTheDocument();
  });

  it("marks the active filter button with aria-pressed=true", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByTestId("filter-accessories"));

    expect(screen.getByTestId("filter-accessories")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByTestId("filter-all")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ADD TO CART FLOW
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Add to cart flow", () => {
  it("adds a product to the cart", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));

    // Cart heading updates
    expect(screen.getByRole("heading", { name: "Cart (1 items)" })).toBeInTheDocument();

    // Item appears in cart section — use within() to scope to cart
    const cartItem = screen.getByTestId("cart-item-1");
    expect(within(cartItem).getByText("React T-Shirt")).toBeInTheDocument();
    // Subtotal equals item price
    expect(screen.getByTestId("subtotal")).toHaveTextContent("$29.99");
  });

  it("increments quantity when the same product is added twice", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));

    const cartItem = screen.getByTestId("cart-item-1");
    expect(within(cartItem).getByText("×2")).toBeInTheDocument();
    expect(within(cartItem).getByText("$59.98")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Cart (2 items)" })).toBeInTheDocument();
  });

  it("updates the subtotal when multiple products are added", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Add TypeScript Mug to cart" }));

    // $29.99 + $14.99 = $44.98
    expect(screen.getByTestId("subtotal")).toHaveTextContent("$44.98");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. REMOVE FROM CART
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — Remove from cart flow", () => {
  it("removes an item when the remove button is clicked", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Add TypeScript Mug to cart" }));

    expect(screen.getByRole("heading", { name: "Cart (2 items)" })).toBeInTheDocument();

    // Remove T-Shirt specifically — within() prevents ambiguity
    const cartItem = screen.getByTestId("cart-item-1");
    await user.click(within(cartItem).getByRole("button", { name: "Remove React T-Shirt" }));

    expect(screen.queryByTestId("cart-item-1")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cart (1 items)" })).toBeInTheDocument();
    expect(screen.getByTestId("subtotal")).toHaveTextContent("$14.99");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. DISCOUNT CODE FLOW
// ═══════════════════════════════════════════════════════════════════════════════

describe("5 — Discount code flow", () => {
  const addItemToCart = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Add TypeScript Mug to cart" }));
    // subtotal = $44.98
  };

  it("applies a valid 10% discount code", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();
    await addItemToCart(user);

    await user.type(screen.getByLabelText("Discount code"), "SAVE10");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByTestId("discount-applied")).toHaveTextContent("10% discount applied!");
    // $44.98 * 0.9 = $40.48
    expect(screen.getByTestId("total")).toHaveTextContent("$40.48");
  });

  it("applies a 50% discount with HALF50", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();
    await addItemToCart(user);

    await user.type(screen.getByLabelText("Discount code"), "HALF50");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    // $44.98 * 0.5 = $22.49
    expect(screen.getByTestId("total")).toHaveTextContent("$22.49");
  });

  it("shows an error for an invalid discount code", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();
    await addItemToCart(user);

    await user.type(screen.getByLabelText("Discount code"), "BADCODE");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid code");
    // Total unchanged
    expect(screen.getByTestId("total")).toHaveTextContent("$44.98");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. FULL CHECKOUT FLOW (the most valuable integration test)
// ═══════════════════════════════════════════════════════════════════════════════

describe("6 — Full checkout flow", () => {
  it("completes a checkout and shows confirmation", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    // 1. Add products
    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Add TypeScript Mug to cart" }));

    // 2. Apply discount
    await user.type(screen.getByLabelText("Discount code"), "SAVE10");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    // 3. Submit
    await user.click(screen.getByRole("button", { name: "Checkout" }));

    // 4. Confirmation screen
    const confirmation = await screen.findByTestId("order-confirmation");
    expect(within(confirmation).getByText("Order confirmed!")).toBeInTheDocument();
    expect(within(confirmation).getByTestId("order-id")).toHaveTextContent("ORD-001");

    // 5. Cart is cleared
    expect(screen.queryByTestId("cart-item-1")).not.toBeInTheDocument();
  });

  it("shows error and allows retry when checkout API fails", async () => {
    server.use(
      rest.post("/api/checkout", (_req, res, ctx) => res(ctx.status(500)))
    );

    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));

    // Error shown, cart items preserved
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Checkout failed. Please try again."
    );
    expect(screen.getByTestId("cart-item-1")).toBeInTheDocument();

    // Fix the server and retry
    server.use(
      rest.post("/api/checkout", (_req, res, ctx) =>
        res(ctx.status(201), ctx.json({ orderId: "ORD-RETRY", total: 29.99 }))
      )
    );

    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByTestId("order-confirmation");
    expect(screen.getByTestId("order-id")).toHaveTextContent("ORD-RETRY");
  });

  it("disables checkout button while submitting", async () => {
    // Delay server response to observe the in-flight state
    server.use(
      rest.post("/api/checkout", (_req, res, ctx) =>
        res(ctx.delay(200), ctx.status(201), ctx.json({ orderId: "ORD-SLOW", total: 29.99 }))
      )
    );

    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));

    // Button text changes and becomes disabled during submission
    expect(screen.getByRole("button", { name: "Processing…" })).toBeDisabled();

    // Resolves to confirmation
    await screen.findByTestId("order-confirmation");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. "SHOP AGAIN" FLOW
// ═══════════════════════════════════════════════════════════════════════════════

describe("7 — Shop again flow", () => {
  it("resets to product list after clicking Shop again", async () => {
    const user = userEvent.setup();
    render(<ShoppingCart />);
    await waitForProducts();

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByTestId("order-confirmation");

    await user.click(screen.getByRole("button", { name: "Shop again" }));

    // Back to product list
    expect(await screen.findByText("React T-Shirt")).toBeInTheDocument();
    expect(screen.queryByTestId("order-confirmation")).not.toBeInTheDocument();
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });
});
