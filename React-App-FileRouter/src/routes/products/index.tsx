// FILE: src/routes/products/index.tsx
// ROUTE: /products
//
// CONCEPTS DEMONSTRATED:
//   validateSearch  — typed + validated search params via Zod
//   useSearch       — read current search params (typed)
//   useNavigate     — update search params without full navigation
//   loaderDeps      — tell the router when to re-run loader (when search changes)
//   staleTime       — cache loader result across revisits
//   pendingComponent — spinner while loader runs
//   Link activeOptions includeSearch — active state includes search params
//   Route masking   — navigate to /products/$productId but show /products in URL

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

// --- Data ---
const ALL_PRODUCTS = [
  { id: "1", name: "Mechanical Keyboard",  category: "tech",     price: 129 },
  { id: "2", name: "Ergonomic Chair",       category: "furniture", price: 399 },
  { id: "3", name: "USB-C Hub",             category: "tech",     price: 49  },
  { id: "4", name: "Standing Desk",         category: "furniture", price: 599 },
  { id: "5", name: "Noise-Cancelling Headphones", category: "tech", price: 249 },
  { id: "6", name: "Monitor Light Bar",     category: "tech",     price: 39  },
];

// CONCEPT: validateSearch
// Zod schema that types + validates the URL search params.
// ?category=tech&sort=price becomes { category: "tech", sort: "price" } — fully typed.
// Invalid params (e.g. ?sort=unknown) fall back to the default value.
const searchSchema = z.object({
  category: z.enum(["all", "tech", "furniture"]).optional().default("all"),
  sort:     z.enum(["name", "price"]).optional().default("name"),
});

export const Route = createFileRoute("/products/")({
  validateSearch: searchSchema,

  // CONCEPT: loaderDeps
  // Tells the router which search params affect the loader output.
  // When category or sort changes, the loader re-runs automatically.
  // Without this, changing search params would NOT re-run the loader.
  loaderDeps: ({ search }) => ({ category: search.category, sort: search.sort }),

  // CONCEPT: staleTime
  // Loader result is cached per unique set of deps (category + sort combo).
  // Navigating away and back within 15s skips the loader entirely.
  staleTime: 15_000,

  // CONCEPT: pendingComponent
  // Shown when the loader takes > defaultPendingMs (500ms set in main.tsx).
  pendingComponent: () => (
    <div style={{ padding: "20px", color: "#888" }}>
      ⟳ Filtering products...
    </div>
  ),

  // CONCEPT: context in loaders
  // `context` comes from createRouter({ context: { theme: 'light' } }) in main.tsx.
  // The type is enforced by createRootRouteWithContext<RouterContext>() in __root.tsx.
  loader: async ({ deps, context }) => {
    await new Promise((r) => setTimeout(r, 700)); // simulate fetch

    // context.theme is typed as 'light' | 'dark' — from main.tsx
    const themeNote = `Loaded with theme: ${context.theme}`;

    let products = deps.category === "all"
      ? ALL_PRODUCTS
      : ALL_PRODUCTS.filter((p) => p.category === deps.category);

    products = [...products].sort((a, b) =>
      deps.sort === "price" ? a.price - b.price : a.name.localeCompare(b.name)
    );

    return { products, themeNote };
  },

  component: Products,
});

function Products() {
  const { products, themeNote } = Route.useLoaderData();
  const navigate = useNavigate();

  // CONCEPT: useSearch
  // Reads the current typed search params — no URL parsing needed.
  // { category: "tech", sort: "name" } — fully typed from the Zod schema.
  const { category, sort } = Route.useSearch();

  // CONCEPT: useNavigate to update search params
  // Specify `to` so TanStack Router knows the search type belongs to this route.
  // We already have the current values from useSearch(), so a plain object works fine.
  // The loader re-runs because `category`/`sort` are in loaderDeps.
  const setCategory = (cat: typeof category) =>
    navigate({ to: "/products", search: { category: cat, sort } });

  const setSort = (s: typeof sort) =>
    navigate({ to: "/products", search: { category, sort: s } });

  return (
    <div>
      <h2>🛍️ Products</h2>
      <p style={{ fontSize: "12px", color: "#888", margin: "0 0 16px" }}>{themeNote}</p>

      {/* CONCEPT: Link activeOptions — includeSearch */}
      {/* Active state only applies when BOTH the path AND search match. */}
      {/* Without includeSearch, all three category buttons would be "active" since they're all /products. */}
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "13px", color: "#666", marginRight: "8px" }}>Category:</span>
        {(["all", "tech", "furniture"] as const).map((cat) => (
          <Link
            key={cat}
            to="/products"
            search={{ category: cat, sort }}
            // includeSearch: true — the link is only "active" when search params also match
            activeOptions={{ exact: true, includeSearch: true }}
            style={{ padding: "4px 10px", marginRight: "4px", borderRadius: "4px", textDecoration: "none", background: "#eee", color: "#333", fontSize: "13px" }}
            activeProps={{ style: { padding: "4px 10px", marginRight: "4px", borderRadius: "4px", textDecoration: "none", background: "#4a90e2", color: "#fff", fontSize: "13px", fontWeight: "bold" } }}
          >
            {cat}
          </Link>
        ))}

        <span style={{ fontSize: "13px", color: "#666", margin: "0 8px" }}>Sort:</span>
        {(["name", "price"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            style={{ padding: "4px 10px", marginRight: "4px", borderRadius: "4px", border: "1px solid #ccc", background: sort === s ? "#4a90e2" : "#fff", color: sort === s ? "#fff" : "#333", cursor: "pointer", fontSize: "13px" }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* useSearch display */}
      <p style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>
        <code>useSearch() → {JSON.stringify({ category, sort })}</code>
        <br />URL: <code>/products?category={category}&sort={sort}</code>
      </p>

      {/* Product list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{p.name}</div>
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
              {p.category} · ${p.price}
            </div>
            <div style={{ display: "flex", gap: "6px", fontSize: "12px" }}>
              {/* Normal navigation → /products/$productId */}
              <Link
                to="/products/$productId"
                params={{ productId: p.id }}
                style={{ padding: "4px 8px", background: "#4a90e2", color: "#fff", borderRadius: "4px", textDecoration: "none" }}
              >
                Detail
              </Link>

              {/* CONCEPT: Route masking */}
              {/* Clicking this navigates to /products/$productId (the real route renders), */}
              {/* but the browser URL stays as /products (the mask URL). */}
              {/* If you copy/share the masked URL, it opens /products — not the detail page. */}
              {/* Use case: modal overlays — the page behind shows in the URL bar. */}
              <Link
                to="/products/$productId"
                params={{ productId: p.id }}
                mask={{ to: "/products", search: { category, sort } }}
                style={{ padding: "4px 8px", background: "#f0f0f0", color: "#333", borderRadius: "4px", textDecoration: "none" }}
              >
                Preview (masked)
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", padding: "12px", background: "#f9f9f9", borderRadius: "6px", fontSize: "13px" }}>
        <strong>Route masking:</strong> Click "Preview (masked)" — the detail page renders
        but the URL stays at <code>/products?category={category}&sort={sort}</code>.
        If you share that URL, it opens the list, not the detail. Reload to see the difference.
      </div>
    </div>
  );
}
