// TOPIC: Performance — Code Splitting & Lazy Loading
//
// By default, Webpack bundles ALL your code into one file (bundle.js).
// Code splitting breaks it into smaller chunks that load ON DEMAND.
//
// RESULT: Faster initial page load — users only download what they need right now.
//
// KEY CONCEPTS COVERED:
//   React.lazy()         → dynamically import a component (creates a separate chunk)
//   Suspense             → shows a fallback while the lazy component loads
//   Named exports        → lazy() requires default exports — workaround shown
//   Error boundary       → catch chunk load failures (network error, 404)
//   Lazy with preload    → start loading before user clicks (hover-to-preload)
//   Route-based splitting→ each route = separate chunk (most common pattern)
//   Component-based      → split heavy components (charts, editors, maps)
//   loadable-components  → SSR-compatible alternative (mentioned)

import React, { useState, Suspense, lazy, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATED LAZY COMPONENTS
// In a real app these would be:  const Dashboard = lazy(() => import('./Dashboard'))
// Here we simulate the async load with a factory that returns a promise
// ─────────────────────────────────────────────────────────────────────────────

// Simulates a component that takes time to load (network latency)
function createFakeModule(name: string, delay: number, content: string) {
  return lazy(() =>
    new Promise<{ default: React.ComponentType }>((resolve) =>
      setTimeout(() => resolve({
        default: function LazyLoaded() {
          return (
            <div style={{ padding: "14px", background: "#f0fff4", borderRadius: "6px", border: "1px solid #b7e4c7" }}>
              <strong style={{ fontSize: "13px", color: "#27ae60" }}>✓ {name} loaded</strong>
              <p style={{ fontSize: "12px", color: "#555", margin: "4px 0 0" }}>{content}</p>
              <p style={{ fontSize: "11px", color: "#aaa", margin: "4px 0 0" }}>
                Simulated load time: {delay}ms — in production this is a real network request for a JS chunk.
              </p>
            </div>
          );
        }
      }), delay)
    )
  );
}

// Each "import" simulates a separate JS chunk
const HeavyDashboard  = createFakeModule("HeavyDashboard",  1200, "Complex analytics dashboard with charts and tables.");
const RichTextEditor  = createFakeModule("RichTextEditor",   800, "WYSIWYG editor — would be ~300KB in production (Quill, TipTap, etc.).");
const MapComponent    = createFakeModule("MapComponent",    1500, "Map with markers — would be ~400KB (Leaflet, Google Maps, etc.).");
const DataGridFast    = createFakeModule("DataGrid",         300, "Fast-loading data grid.");

// ─────────────────────────────────────────────────────────────────────────────
// LOADING FALLBACKS — what Suspense shows while the chunk loads
// ─────────────────────────────────────────────────────────────────────────────

function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px", color: "#888", fontSize: "13px" }}>
      <div style={{
        width: "16px", height: "16px", border: "2px solid #ddd",
        borderTopColor: "#4a90e2", borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ padding: "14px", background: "#f8f8f8", borderRadius: "6px", border: "1px solid #eee" }}>
      {[100, 60, 80].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? "14px" : "10px",
          width: `${w}%`,
          background: "linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)",
          backgroundSize: "200% 100%",
          borderRadius: "4px",
          marginBottom: i < 2 ? "8px" : 0,
          animation: "shimmer 1.5s infinite",
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARY — catches chunk load failures
// ─────────────────────────────────────────────────────────────────────────────

class ChunkErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "12px", background: "#fff5f5", borderRadius: "6px", border: "1px solid #fcc", fontSize: "13px", color: "#e74c3c" }}>
          ✗ Failed to load component chunk.
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginLeft: "10px", padding: "3px 10px", border: "1px solid #e74c3c", background: "#fff", color: "#e74c3c", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
          >
            Retry
          </button>
          <p style={{ fontSize: "11px", color: "#aaa", margin: "4px 0 0" }}>
            In production: network failure, CDN timeout, chunk hash mismatch after deploy.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic lazy + Suspense
// ─────────────────────────────────────────────────────────────────────────────

function BasicLazySection() {
  const [show, setShow] = useState(false);

  return (
    <Section title="1. React.lazy() + Suspense — load on demand" bg="#fafafa">
      <p style={desc}>Component is NOT in the initial bundle. It downloads only when shown.</p>
      <button onClick={() => setShow(s => !s)} style={btn("#4a90e2")}>
        {show ? "Hide" : "Load"} HeavyDashboard (simulated 1200ms load)
      </button>

      {show && (
        // Suspense wraps the lazy component — shows fallback during load
        <div style={{ marginTop: "10px" }}>
          <ChunkErrorBoundary>
            <Suspense fallback={<Spinner label="Downloading dashboard chunk…" />}>
              <HeavyDashboard />
            </Suspense>
          </ChunkErrorBoundary>
        </div>
      )}

      <Note>
        Open DevTools → Network tab → click Load. You'll see a separate JS file download.
        Click again → instant (browser caches the chunk).
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Different fallback UIs — Spinner vs Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function FallbackSection() {
  const [which, setWhich] = useState<"spinner" | "skeleton" | null>(null);

  return (
    <Section title="2. Fallback UI — Spinner vs Skeleton screens" bg="#fafafa">
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button onClick={() => setWhich("spinner")}  style={btn("#4a90e2")}>Load with Spinner</button>
        <button onClick={() => setWhich("skeleton")} style={btn("#9b59b6")}>Load with Skeleton</button>
        <button onClick={() => setWhich(null)}       style={btn("#888")}>Reset</button>
      </div>

      {which === "spinner" && (
        <ChunkErrorBoundary>
          <Suspense fallback={<Spinner label="Loading editor…" />}>
            <RichTextEditor />
          </Suspense>
        </ChunkErrorBoundary>
      )}

      {which === "skeleton" && (
        <ChunkErrorBoundary>
          <Suspense fallback={<SkeletonCard />}>
            <RichTextEditor />
          </Suspense>
        </ChunkErrorBoundary>
      )}

      <Note>
        <strong>Spinner:</strong> simple, good for fast loads. <br />
        <strong>Skeleton:</strong> matches the shape of the content — better UX for slow loads (reduces perceived wait time).
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Preloading — start loading before user clicks
// ─────────────────────────────────────────────────────────────────────────────
//
// Problem: user clicks a button, then waits for the chunk to download.
// Solution: start downloading on hover — by the time they click, chunk is ready.

// Keep a reference to trigger the import early
let mapPreloaded = false;

function preloadMap() {
  if (!mapPreloaded) {
    // Triggering the lazy import early warms the module cache
    // In a real app: import('./MapComponent') — webpack starts fetching the chunk
    mapPreloaded = true;
  }
}

function PreloadSection() {
  const [show, setShow] = useState(false);

  return (
    <Section title="3. Preloading — hover to warm the cache, click to show instantly" bg="#fafafa">
      <p style={desc}>Hover the button to start downloading the chunk. Click to render it.</p>
      <button
        onMouseEnter={preloadMap}   // ← preload starts on hover
        onClick={() => setShow(s => !s)}
        style={btn("#27ae60")}
      >
        {show ? "Hide" : "Load"} MapComponent (hover first, then click)
      </button>

      {show && (
        <div style={{ marginTop: "10px" }}>
          <ChunkErrorBoundary>
            <Suspense fallback={<Spinner label="Loading map chunk…" />}>
              <MapComponent />
            </Suspense>
          </ChunkErrorBoundary>
        </div>
      )}

      <Note>
        Same pattern used in TanStack Router's <code>prefetchQuery</code> — warm the cache before the user acts.
        In production: <code>import('./MapComponent')</code> on hover = chunk downloads in background.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Multiple lazy components — Suspense boundary placement matters
// ─────────────────────────────────────────────────────────────────────────────

function SuspensePlacementSection() {
  const [show, setShow] = useState(false);
  const [separate, setSeparate] = useState(false);

  return (
    <Section title="4. Suspense boundary placement — one vs separate boundaries" bg="#fafafa">
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button onClick={() => { setShow(true); setSeparate(false); }} style={btn("#4a90e2")}>
          One Suspense (all wait together)
        </button>
        <button onClick={() => { setShow(true); setSeparate(true); }} style={btn("#27ae60")}>
          Separate Suspense (each loads independently)
        </button>
        <button onClick={() => setShow(false)} style={btn("#888")}>Reset</button>
      </div>

      {show && !separate && (
        // One boundary — BOTH wait until BOTH are loaded
        <ChunkErrorBoundary>
          <Suspense fallback={<Spinner label="Waiting for all chunks…" />}>
            <DataGridFast />
            <div style={{ marginTop: "8px" }}>
              <MapComponent />
            </div>
          </Suspense>
        </ChunkErrorBoundary>
      )}

      {show && separate && (
        // Separate boundaries — each shows its own fallback independently
        <>
          <ChunkErrorBoundary>
            <Suspense fallback={<Spinner label="Loading DataGrid (fast)…" />}>
              <DataGridFast />
            </Suspense>
          </ChunkErrorBoundary>
          <div style={{ marginTop: "8px" }}>
            <ChunkErrorBoundary>
              <Suspense fallback={<Spinner label="Loading Map (slow)…" />}>
                <MapComponent />
              </Suspense>
            </ChunkErrorBoundary>
          </div>
        </>
      )}

      <Note>
        <strong>One boundary:</strong> fast DataGrid waits for slow Map — users see nothing until both load. <br />
        <strong>Separate boundaries:</strong> DataGrid shows instantly, Map shows when ready — better UX.
        <br />Rule: wrap each independently-loadable section in its own Suspense.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function CodeSplittingDemo() {
  return (
    <div>
      <h2>Performance — Code Splitting & Lazy Loading</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
        Split your bundle into chunks that load on demand.
        Faster initial load — users only download what they actually visit.
      </p>

      <BasicLazySection />
      <FallbackSection />
      <PreloadSection />
      <SuspensePlacementSection />

      <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
        <strong>Code splitting reference:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.9" }}>
          <li><code>const X = lazy(() =&gt; import('./X'))</code> — split X into a separate chunk</li>
          <li><code>&lt;Suspense fallback=&#123;&lt;Spinner/&gt;&#125;&gt;</code> — required wrapper for lazy components</li>
          <li>Lazy components MUST have a <strong>default export</strong></li>
          <li>Wrap in <code>ErrorBoundary</code> to handle chunk load failures gracefully</li>
          <li>Place Suspense boundaries <strong>as close as possible</strong> to the lazy component</li>
          <li>Preload: call <code>import('./X')</code> early (hover, route entry) to warm the cache</li>
          <li>Route-based splitting: each page = <code>lazy(() =&gt; import('./pages/Page'))</code></li>
          <li>Webpack output: <code>Page.[hash].js</code> appears as a separate file in <code>dist/</code></li>
        </ul>
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function Section({ title, bg, children }: { title: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px", background: bg, borderRadius: "8px", marginBottom: "16px", border: "1px solid #eee" }}>
      <h4 style={{ margin: "0 0 12px", fontSize: "14px" }}>{title}</h4>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "11px", color: "#888", margin: "10px 0 0", lineHeight: "1.6" }}>{children}</p>;
}

function btn(bg: string): React.CSSProperties {
  return { padding: "5px 12px", background: bg, color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
}

const desc: React.CSSProperties = { fontSize: "12px", color: "#666", margin: "0 0 10px" };
