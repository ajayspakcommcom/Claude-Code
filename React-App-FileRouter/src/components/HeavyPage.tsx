// FILE: src/components/HeavyPage.tsx
//
// This component is NOT imported directly by any route file.
// Instead, lazy-demo.tsx uses lazyRouteComponent(() => import('./HeavyPage'))
// to load it only when the /lazy-demo route is first visited.
//
// Must have a default export — lazyRouteComponent expects that.

export default function HeavyPage() {
  return (
    <div>
      <h2>🏋️ Heavy Page (lazy-loaded)</h2>
      <p>
        This component was <strong>not included in the initial bundle</strong>.
        It was fetched from the server only when you navigated to <code>/lazy-demo</code>.
      </p>
      <p>
        In a real app, this might be a rich text editor, a chart library, a PDF viewer,
        or any large dependency you don't want to ship to every visitor upfront.
      </p>
      <div style={{ marginTop: "16px", padding: "12px", background: "#f0fff0", borderRadius: "6px", fontSize: "13px" }}>
        <strong>How it works:</strong>
        <ol style={{ margin: "8px 0 0", paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>Vite sees <code>import('./HeavyPage')</code> — a dynamic import.</li>
          <li>It code-splits this file into a separate chunk at build time.</li>
          <li>The chunk is only downloaded when the route is first visited.</li>
          <li>On revisit, the browser uses the cached chunk — no re-download.</li>
        </ol>
        <p style={{ margin: "8px 0 0", color: "#666" }}>
          Check the Network tab in DevTools: you'll see a separate JS file load when
          you first navigate here. Navigate away and back — no network request.
        </p>
      </div>

      {/* Simulate a heavy component with lots of content */}
      <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            style={{
              height: "60px",
              background: `hsl(${i * 22}, 70%, 80%)`,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              color: "#333",
            }}
          >
            Widget {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
