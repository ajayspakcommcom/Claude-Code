// FILE: src/pages/About.tsx
// ROUTE: /about — defined in router.tsx as aboutRoute

export function AboutPage() {
  return (
    <div>
      <h2>ℹ️ About</h2>
      <p>
        In code-based routing, this page exists because of these two lines in
        <code>src/router.tsx</code>:
      </p>
      <pre style={{ background: "#f5f5f5", padding: "12px", borderRadius: "6px", fontSize: "13px", overflowX: "auto" }}>
{`const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

// Then added to the tree:
rootRoute.addChildren([..., aboutRoute, ...])`}
      </pre>
      <p style={{ color: "#888", fontSize: "13px" }}>
        Compare: in file-based routing, just creating this file would be enough.
        Here you must register it in the route tree manually.
      </p>
    </div>
  );
}
