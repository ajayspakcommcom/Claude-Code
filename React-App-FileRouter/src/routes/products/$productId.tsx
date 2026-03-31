// FILE: src/routes/products/$productId.tsx
// ROUTE: /products/:productId
//
// CONCEPTS DEMONSTRATED:
//   Parallel loaders  — Promise.all runs multiple fetches simultaneously
//   useParams         — reading typed params from a deeply nested component
//   pendingComponent  — spinner while parallel fetches complete
//   errorComponent    — per-route error boundary

import { createFileRoute, Link, useParams } from "@tanstack/react-router";

// --- Mock data ---
const PRODUCTS: Record<string, { name: string; category: string; price: number; description: string }> = {
  "1": { name: "Mechanical Keyboard",  category: "tech",      price: 129, description: "Tactile switches, RGB backlight, TKL layout." },
  "2": { name: "Ergonomic Chair",       category: "furniture", price: 399, description: "Lumbar support, adjustable arms, mesh back." },
  "3": { name: "USB-C Hub",             category: "tech",      price: 49,  description: "7-in-1 hub: HDMI, USB-A×3, SD, microSD, PD." },
  "4": { name: "Standing Desk",         category: "furniture", price: 599, description: "Electric height adjustment, memory presets." },
  "5": { name: "Noise-Cancelling Headphones", category: "tech", price: 249, description: "30h battery, ANC, foldable, USB-C charging." },
  "6": { name: "Monitor Light Bar",     category: "tech",      price: 39,  description: "No-glare screen bar, touch controls, USB powered." },
};

const REVIEWS: Record<string, { reviewer: string; rating: number; comment: string }[]> = {
  "1": [{ reviewer: "Alice", rating: 5, comment: "Love the tactile feel!" }, { reviewer: "Bob", rating: 4, comment: "Great but a bit loud." }],
  "2": [{ reviewer: "Carol", rating: 5, comment: "Back pain gone in a week." }],
  "3": [{ reviewer: "Dave",  rating: 4, comment: "Works perfectly with MacBook." }, { reviewer: "Alice", rating: 3, comment: "HDMI only 4K@30." }],
  "4": [{ reviewer: "Bob",   rating: 5, comment: "Changed my work life." }],
  "5": [{ reviewer: "Carol", rating: 5, comment: "Best ANC headphones I've tried." }, { reviewer: "Dave", rating: 4, comment: "Slightly tight at first." }],
  "6": [{ reviewer: "Alice", rating: 5, comment: "Subtle and effective." }],
};

// CONCEPT: useParams from a nested component
// This is NOT the route component — it's a child rendered deep inside it.
// It reads the productId param independently without prop drilling.
function ProductBreadcrumb() {
  // useParams({ from: '/products/$productId' }) gives { productId: string }
  // — typed by TanStack Router based on the route definition.
  const { productId } = useParams({ from: "/products/$productId" });
  return (
    <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
      <Link to="/products" style={{ color: "#4a90e2", textDecoration: "none" }}>Products</Link>
      {" › "}Product #{productId}
      {" · "}
      <code style={{ fontSize: "11px" }}>
        useParams({"{ from: '/products/$productId' }"}) → {"{"}productId: "{productId}"{"}"}
      </code>
    </div>
  );
}

export const Route = createFileRoute("/products/$productId")({
  pendingComponent: () => (
    <div style={{ color: "#888" }}>⟳ Loading product + reviews in parallel...</div>
  ),

  errorComponent: ({ error }) => (
    <div style={{ color: "#e74c3c", padding: "12px", background: "#fff5f5", borderRadius: "6px" }}>
      <strong>Product not found:</strong> {(error as Error).message}
      <br />
      <Link to="/products" style={{ color: "#4a90e2", fontSize: "13px" }}>← Back to products</Link>
    </div>
  ),

  // CONCEPT: Parallel loaders
  // Promise.all runs both fetches at the same time.
  // Total wait time = max(fetchProduct, fetchReviews) — NOT their sum.
  // If each takes 400ms, parallel = 400ms total vs sequential = 800ms.
  loader: async ({ params }) => {
    const [product, reviews] = await Promise.all([
      // Fetch 1: product details
      new Promise<(typeof PRODUCTS)[string]>((resolve, reject) =>
        setTimeout(() => {
          const p = PRODUCTS[params.productId];
          if (p) resolve(p);
          else reject(new Error(`Product "${params.productId}" not found`));
        }, 600)
      ),
      // Fetch 2: product reviews (independent — runs simultaneously with fetch 1)
      new Promise<(typeof REVIEWS)[string]>((resolve) =>
        setTimeout(() => resolve(REVIEWS[params.productId] ?? []), 400)
      ),
    ]);

    return { product, reviews };
  },

  component: () => {
    const { product, reviews } = Route.useLoaderData();

    return (
      <div>
        {/* Nested component reads params independently */}
        <ProductBreadcrumb />

        <h2>{product.name}</h2>
        <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
          {product.category} · <strong style={{ color: "#2ecc71" }}>${product.price}</strong>
        </div>
        <p>{product.description}</p>

        <h3 style={{ marginTop: "20px" }}>Reviews ({reviews.length})</h3>
        {reviews.length === 0 && <p style={{ color: "#aaa" }}>No reviews yet.</p>}
        {reviews.map((r, i) => (
          <div key={i} style={{ marginBottom: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "6px" }}>
            <strong>{r.reviewer}</strong>
            <span style={{ color: "#f39c12", marginLeft: "8px" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
            <p style={{ margin: "4px 0 0", fontSize: "13px" }}>{r.comment}</p>
          </div>
        ))}

        <div style={{ marginTop: "16px", padding: "10px", background: "#f0fff0", borderRadius: "6px", fontSize: "13px" }}>
          <strong>Parallel loaders:</strong> product (600ms) + reviews (400ms) fetched
          simultaneously via <code>Promise.all</code> — total wait ≈ 600ms, not 1000ms.
        </div>
      </div>
    );
  },
});
