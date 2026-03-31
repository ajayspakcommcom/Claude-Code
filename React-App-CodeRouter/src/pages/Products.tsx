// FILE: src/pages/Products.tsx
// ROUTE: /products — defined in router.tsx as productsRoute
//
// Demonstrates: useSearch, navigate to update search params, Link activeOptions

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

const routeApi = getRouteApi("/products");

export function ProductsPage() {
  const products  = routeApi.useLoaderData();
  const { category, sort } = routeApi.useSearch();
  const navigate  = useNavigate();

  const setCategory = (cat: typeof category) =>
    navigate({ to: "/products", search: { category: cat, sort } });

  const setSort = (s: typeof sort) =>
    navigate({ to: "/products", search: { category, sort: s } });

  return (
    <div>
      <h2>🛍️ Products</h2>

      {/* Category filter using Link activeOptions */}
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "13px", color: "#666", marginRight: "8px" }}>Category:</span>
        {(["all", "tech", "furniture"] as const).map((cat) => (
          <Link
            key={cat}
            to="/products"
            search={{ category: cat, sort }}
            activeOptions={{ exact: true, includeSearch: true }}
            style={{ padding: "4px 10px", marginRight: "4px", borderRadius: "4px", textDecoration: "none", background: "#eee", color: "#333", fontSize: "13px" }}
            activeProps={{ style: { padding: "4px 10px", marginRight: "4px", borderRadius: "4px", textDecoration: "none", background: "#e67e22", color: "#fff", fontSize: "13px", fontWeight: "bold" } }}
          >
            {cat}
          </Link>
        ))}

        <span style={{ fontSize: "13px", color: "#666", margin: "0 8px" }}>Sort:</span>
        {(["name", "price"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            style={{ padding: "4px 10px", marginRight: "4px", borderRadius: "4px", border: "1px solid #ccc", background: sort === s ? "#e67e22" : "#fff", color: sort === s ? "#fff" : "#333", cursor: "pointer", fontSize: "13px" }}
          >
            {s}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "12px", color: "#888" }}>
        <code>useSearch() → {JSON.stringify({ category, sort })}</code>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: "10px", marginTop: "12px" }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{p.name}</div>
            <div style={{ fontSize: "13px", color: "#888" }}>{p.category} · ${p.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
