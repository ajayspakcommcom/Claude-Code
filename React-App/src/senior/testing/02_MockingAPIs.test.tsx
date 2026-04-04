// TOPIC: Mocking APIs (Senior)
// LEVEL: Senior — Testing (Advanced) #2
//
// ─── WHY MOCK APIs? ──────────────────────────────────────────────────────────
//
//   Real APIs in tests are:
//   - Slow (network latency)
//   - Flaky (server down, rate limits)
//   - Destructive (tests can delete real data)
//   - Hard to control (can't simulate 500 errors or slow responses easily)
//
// ─── THREE MOCKING STRATEGIES ────────────────────────────────────────────────
//
//   1. jest.fn() / jest.spyOn()
//      → Mock a specific function or module
//      → Good for: callbacks, utilities, service functions
//      → Bad for: fetch (too low-level, misses real request/response flow)
//
//   2. MSW (Mock Service Worker)
//      → Intercepts fetch/XHR at the network level using a Service Worker (browser)
//        or a Node.js request interceptor (tests)
//      → Components use real fetch() — no mocking of fetch itself
//      → Good for: full API mocking that works in tests AND in Storybook/dev
//
//   3. Module mocking (jest.mock())
//      → Replace an entire module with a mock version
//      → Good for: date, crypto, third-party SDKs (Stripe, analytics)
//
// ─── MSW PATTERNS COVERED HERE ───────────────────────────────────────────────
//
//   ① Default handlers  — set up in beforeAll, reset after each test
//   ② server.use()      — override a handler for ONE test only
//   ③ ctx.delay()       — simulate slow network
//   ④ ctx.status(500)   — simulate server errors
//   ⑤ req.json()        — inspect what the component actually sent
//   ⑥ Stateful handlers — handlers that track calls or return different data
//   ⑦ jest.spyOn()      — verify fetch was called with correct arguments
//
// ─── MSW v1 SYNTAX (used in this project) ───────────────────────────────────
//
//   import { rest } from 'msw';
//   import { setupServer } from 'msw/node';
//
//   rest.get('/path', (req, res, ctx) => res(ctx.json({ data })))
//   rest.post('/path', async (req, res, ctx) => {
//     const body = await req.json();   // inspect request body
//     return res(ctx.status(201), ctx.json({ id: 1 }));
//   })

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { ShoppingCart, Product } from "./components/ShoppingCart";

// ─── PRODUCTS FIXTURE ─────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  { id: 1, name: "React T-Shirt", price: 29.99, category: "clothing" },
  { id: 2, name: "TypeScript Mug", price: 14.99, category: "accessories" },
];

// ─── SERVER SETUP ─────────────────────────────────────────────────────────────

const server = setupServer(
  rest.get("/api/products", (_req, res, ctx) => res(ctx.json(PRODUCTS))),
  rest.post("/api/checkout", async (_req, res, ctx) =>
    res(ctx.status(201), ctx.json({ orderId: "ORD-MOCK-001", total: 29.99 }))
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers()); // ← critical: prevents handler leaks
afterAll(() => server.close());

// ═══════════════════════════════════════════════════════════════════════════════
// 1. BASIC MSW — inspect request body
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Inspecting what the component sends", () => {
  it("sends correct items and discount code to checkout API", async () => {
    let capturedBody: Record<string, unknown> | null = null;

    // Override the default handler to capture the request body
    server.use(
      rest.post("/api/checkout", async (req, res, ctx) => {
        capturedBody = await req.json();
        return res(ctx.status(201), ctx.json({ orderId: "ORD-CAP", total: 22.49 }));
      })
    );

    const user = userEvent.setup();
    render(<ShoppingCart />);
    await screen.findByText("React T-Shirt");

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.type(screen.getByLabelText("Discount code"), "SAVE10");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByTestId("order-confirmation");

    // Assert the request body
    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.discountCode).toBe("SAVE10");
    expect(capturedBody!.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, qty: 1 }),
      ])
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SLOW NETWORK SIMULATION — ctx.delay()
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Slow network / loading states", () => {
  it("shows loading indicator during a slow product fetch", async () => {
    server.use(
      rest.get("/api/products", (_req, res, ctx) =>
        res(ctx.delay(300), ctx.json(PRODUCTS))
      )
    );

    render(<ShoppingCart />);

    // Loading state is visible
    expect(screen.getByText("Loading products…")).toBeInTheDocument();

    // Eventually resolves
    expect(await screen.findByText("React T-Shirt")).toBeInTheDocument();
    expect(screen.queryByText("Loading products…")).not.toBeInTheDocument();
  });

  it("shows Processing… while checkout is in flight", async () => {
    server.use(
      rest.post("/api/checkout", (_req, res, ctx) =>
        res(ctx.delay(300), ctx.status(201), ctx.json({ orderId: "ORD-SLOW", total: 29.99 }))
      )
    );

    const user = userEvent.setup();
    render(<ShoppingCart />);
    await screen.findByText("React T-Shirt");

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));

    // In-flight state
    const processingBtn = screen.getByRole("button", { name: "Processing…" });
    expect(processingBtn).toBeDisabled();

    await screen.findByTestId("order-confirmation");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ERROR SIMULATION — ctx.status()
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Error responses", () => {
  it("shows error alert when products endpoint returns 503", async () => {
    server.use(
      rest.get("/api/products", (_req, res, ctx) =>
        res(ctx.status(503))
      )
    );

    render(<ShoppingCart />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load products"
    );
  });

  it("preserves cart on checkout 500 error", async () => {
    server.use(
      rest.post("/api/checkout", (_req, res, ctx) => res(ctx.status(500)))
    );

    const user = userEvent.setup();
    render(<ShoppingCart />);
    await screen.findByText("React T-Shirt");

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Checkout failed. Please try again."
    );

    // Cart items preserved for retry
    expect(screen.getByTestId("cart-item-1")).toBeInTheDocument();
    expect(screen.queryByTestId("order-confirmation")).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. STATEFUL HANDLER — handler that changes state between calls
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — Stateful handlers", () => {
  it("succeeds on second attempt after initial failure (retry pattern)", async () => {
    let callCount = 0;

    server.use(
      rest.post("/api/checkout", (_req, res, ctx) => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          return res(ctx.status(500));
        }
        // Second call succeeds
        return res(ctx.status(201), ctx.json({ orderId: "ORD-RETRY", total: 29.99 }));
      })
    );

    const user = userEvent.setup();
    render(<ShoppingCart />);
    await screen.findByText("React T-Shirt");

    await user.click(screen.getByRole("button", { name: "Add React T-Shirt to cart" }));

    // First attempt — fails
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Checkout failed");

    // Second attempt — succeeds
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    const confirmation = await screen.findByTestId("order-confirmation");
    expect(within(confirmation).getByTestId("order-id")).toHaveTextContent("ORD-RETRY");

    expect(callCount).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. jest.spyOn — verify fetch was called (when MSW isn't enough)
// ═══════════════════════════════════════════════════════════════════════════════

describe("5 — jest.spyOn on fetch", () => {
  it("calls /api/products exactly once on mount", async () => {
    const spy = jest.spyOn(global, "fetch");

    render(<ShoppingCart />);
    await screen.findByText("React T-Shirt");

    // Filter to only product calls (other calls might exist)
    const productCalls = spy.mock.calls.filter(([url]) =>
      String(url).includes("/api/products")
    );
    expect(productCalls).toHaveLength(1);

    spy.mockRestore();
  });

  it("does not call /api/checkout when cart is empty", async () => {
    const spy = jest.spyOn(global, "fetch");

    // No checkout button when cart is empty
    render(<ShoppingCart />);
    await screen.findByText("React T-Shirt");

    const checkoutCalls = spy.mock.calls.filter(([url]) =>
      String(url).includes("/api/checkout")
    );
    expect(checkoutCalls).toHaveLength(0);

    spy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. EMPTY / EDGE CASE RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

describe("6 — Edge case responses", () => {
  it("renders gracefully when products API returns empty array", async () => {
    server.use(
      rest.get("/api/products", (_req, res, ctx) => res(ctx.json([])))
    );

    render(<ShoppingCart />);

    await waitFor(() => {
      expect(screen.queryByText("Loading products…")).not.toBeInTheDocument();
    });

    // No products listed — no crash
    expect(screen.queryByRole("button", { name: /Add .* to cart/ })).not.toBeInTheDocument();
    // Cart still accessible
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("handles single product correctly", async () => {
    server.use(
      rest.get("/api/products", (_req, res, ctx) =>
        res(ctx.json([{ id: 99, name: "Solo Item", price: 9.99, category: "misc" }]))
      )
    );

    render(<ShoppingCart />);
    expect(await screen.findByText("Solo Item")).toBeInTheDocument();
    expect(screen.queryByText("React T-Shirt")).not.toBeInTheDocument();
  });
});
