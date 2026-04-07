// Visual explainer for Expert — Advanced Rendering
// Covers SSR, SSG, Streaming, Hydration strategies

import React, { useState } from "react";

const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, ...extra,
});
const codeStyle = (color = "#86efac"): React.CSSProperties => ({
  background: "#0f172a", borderRadius: 8, padding: 12,
  fontFamily: "monospace", fontSize: 11, color, lineHeight: 1.75,
  whiteSpace: "pre", overflowX: "auto",
});
const pill = (active: boolean, c = "#3b82f6"): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 8, fontWeight: 600, fontSize: 12,
  cursor: "pointer", border: "2px solid",
  borderColor: active ? c : "#e2e8f0",
  background: active ? c + "22" : "#f8fafc",
  color: active ? c : "#64748b",
});
const tag = (bg: string, color: string): React.CSSProperties => ({
  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
  background: bg, color, display: "inline-block",
  textTransform: "uppercase" as const, letterSpacing: 0.5,
});

// ─── DEMO 1 — SSR vs CSR vs SSG comparison ────────────────────────────────────

const StrategyComparisonDemo: React.FC = () => {
  const strategies = [
    {
      id: "csr",
      label: "CSR",
      fullName: "Client-Side Rendering",
      color: "#dc2626",
      bg: "#fef2f2",
      serverHtml: `<!-- Server sends: empty shell -->
<html>
  <body>
    <div id="root"></div>
    <script src="/bundle.js"></script>
  </body>
</html>`,
      clientWork: `// Browser downloads bundle, runs React:
ReactDOM.createRoot(root).render(<App />);
// Content appears only after JS runs`,
      metrics: { fcp: "Slow", seo: "Poor", dynamic: "Yes", serverCost: "Low" },
      bestFor: "Dashboards, authenticated apps, no SEO requirement",
    },
    {
      id: "ssr",
      label: "SSR",
      fullName: "Server-Side Rendering",
      color: "#3b82f6",
      bg: "#eff6ff",
      serverHtml: `<!-- Server sends: full HTML on every request -->
<html>
  <body>
    <article>
      <h1>Blog Post Title</h1>
      <p>Full content in HTML — visible to crawlers</p>
    </article>
    <script src="/bundle.js"></script>
  </body>
</html>`,
      clientWork: `// Browser hydrates (attaches handlers):
hydrateRoot(document, <App />);
// No content change — DOM already there`,
      metrics: { fcp: "Fast", seo: "Great", dynamic: "Yes", serverCost: "High" },
      bestFor: "E-commerce, news, any content needing SEO + freshness",
    },
    {
      id: "ssg",
      label: "SSG",
      fullName: "Static Site Generation",
      color: "#16a34a",
      bg: "#f0fdf4",
      serverHtml: `<!-- Pre-built at build time, served by CDN: -->
<html>
  <body>
    <article>
      <h1>Blog Post Title</h1>
      <p>Content baked into HTML at npm run build</p>
    </article>
    <script src="/bundle.js"></script>
  </body>
</html>`,
      clientWork: `// Same hydration as SSR:
hydrateRoot(document, <App />);
// But HTML came from CDN — no server involved`,
      metrics: { fcp: "Fastest", seo: "Great", dynamic: "No", serverCost: "None" },
      bestFor: "Blogs, docs, marketing — content that rarely changes",
    },
    {
      id: "isr",
      label: "ISR",
      fullName: "Incremental Static Regeneration",
      color: "#6366f1",
      bg: "#f5f3ff",
      serverHtml: `// Next.js page with ISR:
export async function getStaticProps() {
  const data = await fetch('/api/posts');
  return {
    props: { posts: data },
    revalidate: 60, // re-generate after 60s
  };
}
// Page is static until revalidate expires
// Then regenerated on next request`,
      clientWork: `// Serve: return cached static HTML
// Stale? Regenerate in background
// Next request gets the fresh version`,
      metrics: { fcp: "Fastest", seo: "Great", dynamic: "Mostly", serverCost: "Minimal" },
      bestFor: "Product pages, dashboards with acceptable staleness",
    },
  ];

  const [selected, setSelected] = useState("ssr");
  const s = strategies.find(st => st.id === selected)!;

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Rendering Strategy Comparison
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Pick the right strategy based on freshness requirements, SEO, and traffic patterns.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {strategies.map(st => (
          <button key={st.id} style={pill(selected === st.id, st.color)} onClick={() => setSelected(st.id)}>
            {st.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: s.color }}>{s.fullName}</span>
        <span style={tag(s.bg, s.color)}>{s.bestFor.split(",")[0]}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 }}>Server output</div>
          <div style={codeStyle("#93c5fd")}>{s.serverHtml}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 }}>Client work</div>
          <div style={codeStyle("#86efac")}>{s.clientWork}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {Object.entries(s.metrics).map(([key, val]) => {
          const good = ["Fast", "Fastest", "Great", "Yes", "Low", "None", "Minimal", "Mostly"].includes(val);
          return (
            <div key={key} style={{ padding: "8px 10px", borderRadius: 8, background: good ? "#f0fdf4" : "#fef2f2", border: `1px solid ${good ? "#86efac" : "#fca5a5"}`, textAlign: "center" as const }}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase" as const, marginBottom: 2 }}>{key}</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: good ? "#16a34a" : "#dc2626" }}>{val}</div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12, color: "#475569" }}>
        <strong>Best for:</strong> {s.bestFor}
      </div>
    </div>
  );
};

// ─── DEMO 2 — Streaming flow visualiser ──────────────────────────────────────

const StreamingDemo: React.FC = () => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      label: "Request",
      server: "Browser: GET /product/42",
      client: "Waiting for first byte…",
      color: "#94a3b8",
      bg: "#f8fafc",
    },
    {
      label: "Shell streams",
      server: "onShellReady() fires → pipe(res)\nSending: <nav>, <header>, <Suspense fallback>…",
      client: "Receives shell HTML\nRenders nav + header\nShows Suspense fallbacks",
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      label: "Data resolves",
      server: "DB query for product #42 completes\nStreaming: <script>$RC(...)</script> + real content",
      client: "React swaps fallback → real product card\nNo full page reload",
      color: "#d97706",
      bg: "#fffbeb",
    },
    {
      label: "Reviews resolve",
      server: "Review fetch completes (was slower)\nStreams second Suspense replacement",
      client: "Review section appears\nUser can already interact with product",
      color: "#6366f1",
      bg: "#f5f3ff",
    },
    {
      label: "Complete",
      server: "onAllReady() — all Suspense resolved\nConnection closed",
      client: "Full page interactive\nHydration complete",
      color: "#16a34a",
      bg: "#f0fdf4",
    },
  ];

  const streamCode = `// Server (Node.js + Express)
app.get("/product/:id", async (req, res) => {
  res.setHeader("Content-Type", "text/html");

  const { pipe, abort } = renderToPipeableStream(
    <App productId={req.params.id} />,
    {
      bootstrapScripts: ["/bundle.js"],
      onShellReady() {
        res.statusCode = 200;
        pipe(res); // start streaming immediately
      },
      onShellError(err) {
        res.statusCode = 500;
        res.send("<h1>Something went wrong</h1>");
      },
      onError(err) {
        console.error(err); // non-fatal Suspense error
      },
    }
  );
  // Timeout: abort if it takes too long
  setTimeout(abort, 10_000);
});`;

  const suspenseCode = `// App uses Suspense for slow data
const ProductPage = ({ productId }) => (
  <html>
    <body>
      {/* Shell: instant — no data needed */}
      <Nav />
      <Header />

      {/* Suspense 1: fast data */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails id={productId} />  {/* suspends → fetches */}
      </Suspense>

      {/* Suspense 2: slower data */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={productId} />  {/* suspends → fetches */}
      </Suspense>
    </body>
  </html>
);`;

  const [codeTab, setCodeTab] = useState<"server" | "component">("server");

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Streaming — renderToPipeableStream
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Shell sends immediately. Each Suspense boundary streams its content when data is ready.
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
          Timeline — click to step through
        </div>
        <div style={{ display: "flex", marginBottom: 8 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                flex: 1, padding: "8px 4px", textAlign: "center" as const,
                cursor: "pointer", fontSize: 10, fontWeight: 600,
                background: step === i ? s.bg : "#f8fafc",
                border: "1px solid",
                borderColor: step === i ? s.color : "#e2e8f0",
                borderRadius: i === 0 ? "8px 0 0 8px" : i === steps.length - 1 ? "0 8px 8px 0" : 0,
                color: step === i ? s.color : "#94a3b8",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 2 }}>
                {["📡", "📦", "🗄️", "💬", "✅"][i]}
              </div>
              {s.label}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {["server", "client"].map((side, j) => (
            <div key={side} style={{ padding: "10px 12px", borderRadius: 8, background: steps[step].bg, border: `1px solid ${steps[step].color}44` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: steps[step].color, textTransform: "uppercase" as const, marginBottom: 4 }}>
                {side === "server" ? "🖥 Server" : "🌐 Browser"}
              </div>
              <div style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-line" }}>
                {j === 0 ? steps[step].server : steps[step].client}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button style={pill(codeTab === "server")} onClick={() => setCodeTab("server")}>Server code</button>
        <button style={pill(codeTab === "component")} onClick={() => setCodeTab("component")}>Component</button>
      </div>
      <div style={codeStyle()}>{codeTab === "server" ? streamCode : suspenseCode}</div>
    </div>
  );
};

// ─── DEMO 3 — Hydration strategies ───────────────────────────────────────────

const HydrationDemo: React.FC = () => {
  const strategies = [
    {
      id: "full",
      label: "Full hydration",
      color: "#3b82f6",
      code: `// Hydrate the entire document
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document, <App />, {
  onRecoverableError(err) {
    console.error("Hydration error (recoverable):", err);
  },
});
// React walks ALL fibers, attaches ALL handlers
// Simple but expensive for large pages`,
      pros: ["Simple — one call", "Standard React approach", "Works with all frameworks"],
      cons: ["Hydrates entire tree before interactive", "CPU-intensive on large pages", "TTI delayed until full hydration"],
    },
    {
      id: "selective",
      label: "Selective (React 18)",
      color: "#6366f1",
      code: `// React 18 hydrates Suspense boundaries independently
// in priority order — user interaction wins

hydrateRoot(document, (
  <App>
    {/* Hydrated as a unit — independently of other sections */}
    <Suspense fallback={<Skeleton />}>
      <ProductDetails />  {/* hydrates first if user clicks here */}
    </Suspense>

    {/* Lower priority — hydrated later */}
    <Suspense fallback={<Skeleton />}>
      <Reviews />  {/* hydrated when idle */}
    </Suspense>
  </App>
));
// If user clicks Reviews before it's hydrated,
// React prioritizes it immediately`,
      pros: ["User interactions unblock hydration", "Concurrent — no waterfall", "Built into React 18 + Suspense"],
      cons: ["Requires Suspense boundaries", "Not all interactions pre-hydrated", "Complexity in error handling"],
    },
    {
      id: "partial",
      label: "Partial / Islands",
      color: "#d97706",
      code: `// Island Architecture (Astro, Fresh, Marko)
// Only interactive components are hydrated

// Astro component:
---
import StaticNav from './Nav.astro';       // zero JS
import InteractiveCart from './Cart.jsx';  // hydrated
---
<html>
  <StaticNav />  <!-- pure HTML, no JS -->

  <!-- client:visible = hydrate when in viewport -->
  <InteractiveCart client:visible />

  <!-- client:idle = hydrate when browser is idle -->
  <NewsletterForm client:idle />

  <!-- client:load = hydrate immediately -->
  <CheckoutButton client:load />
</html>`,
      pros: ["Minimal JS shipped", "Static areas: zero runtime cost", "Fine-grained control"],
      cons: ["Framework-specific (Astro, Fresh)", "Cross-island state is complex", "Not standard React"],
    },
    {
      id: "progressive",
      label: "Progressive",
      color: "#16a34a",
      code: `// Hydrate high-priority parts immediately,
// defer the rest using requestIdleCallback

// 1. Hydrate critical UI immediately
hydrateRoot(document.querySelector("#header"), <Header />);
hydrateRoot(document.querySelector("#checkout"), <Checkout />);

// 2. Defer non-critical islands
const idleHydrate = (selector, Component) => {
  requestIdleCallback(() => {
    const el = document.querySelector(selector);
    if (el) hydrateRoot(el, Component);
  }, { timeout: 3000 });
};

idleHydrate("#comments", <Comments />);
idleHydrate("#recommendations", <Recommendations />);
idleHydrate("#newsletter", <Newsletter />);`,
      pros: ["Interactive ASAP for critical parts", "Non-critical parts don't block TTI", "Works with standard React"],
      cons: ["Manual orchestration", "Easy to get wrong", "requestIdleCallback not available in all envs"],
    },
  ];

  const [selected, setSelected] = useState("selective");
  const s = strategies.find(st => st.id === selected)!;

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Hydration Strategies
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Hydration attaches React event handlers to server-rendered HTML without re-creating the DOM.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 14 }}>
        {strategies.map(st => (
          <button key={st.id} style={pill(selected === st.id, st.color)} onClick={() => setSelected(st.id)}>
            {st.label}
          </button>
        ))}
      </div>

      <div style={codeStyle()}>{s.code}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <div style={{ padding: 12, borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac" }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#16a34a", marginBottom: 6 }}>✅ Pros</div>
          {s.pros.map(p => <div key={p} style={{ fontSize: 11, color: "#374151", marginBottom: 4 }}>› {p}</div>)}
        </div>
        <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5" }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#dc2626", marginBottom: 6 }}>⚠️ Cons</div>
          {s.cons.map(c => <div key={c} style={{ fontSize: 11, color: "#374151", marginBottom: 4 }}>› {c}</div>)}
        </div>
      </div>
    </div>
  );
};

// ─── DEMO 4 — Hydration mismatch pitfalls ────────────────────────────────────

const HydrationMismatchDemo: React.FC = () => {
  const [show, setShow] = useState<"bad" | "fix">("bad");

  const badCode = `// ❌ Hydration mismatch — server ≠ client render
const DateBadge = () => (
  // new Date() gives different result on server vs client
  <span>{new Date().toLocaleDateString()}</span>
  // Server: "1/1/2026" → Client: "4/7/2026" → MISMATCH
);

const RandomBadge = () => (
  // Math.random() is different on every call
  <span id={\`badge-\${Math.random()}\`}>New!</span>
  // Server: "badge-0.123" → Client: "badge-0.456" → MISMATCH
);

const BrowserOnlyComp = () => (
  // window doesn't exist on server
  <span>{window.innerWidth}px wide</span>
  // Server: throws ReferenceError
);`;

  const fixCode = `// ✅ Fix 1: useEffect for client-only values
const DateBadge = () => {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => {
    setDate(new Date().toLocaleDateString());
  }, []);
  return <span>{date ?? "Loading…"}</span>;
  // Server: "Loading…" → Client: "4/7/2026" (after effect)
};

// ✅ Fix 2: suppressHydrationWarning for known diffs
const RandomBadge = () => {
  const id = useId(); // useId generates same id on server AND client
  return <span id={id}>New!</span>;
};

// ✅ Fix 3: Check for client environment
const BrowserOnlyComp = () => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  return <span>{width > 0 ? \`\${width}px wide\` : "Loading…"}</span>;
};`;

  const causes = [
    { bad: "new Date()", fix: "useEffect(() => setDate(new Date()), [])" },
    { bad: "Math.random()", fix: "useId() or server-generated stable id" },
    { bad: "window / document in render", fix: "useEffect or typeof window !== 'undefined'" },
    { bad: "User-agent detection in render", fix: "Server sends hint, client reads from cookie" },
    { bad: "localStorage in render", fix: "useEffect to read after mount" },
  ];

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Hydration Mismatch — Causes &amp; Fixes
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Mismatch = server HTML differs from client render. React replaces DOM → layout shift &amp; lost interactions.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={pill(show === "bad", "#dc2626")} onClick={() => setShow("bad")}>❌ Common mistakes</button>
        <button style={pill(show === "fix", "#16a34a")} onClick={() => setShow("fix")}>✅ Fixes</button>
      </div>

      <div style={codeStyle(show === "bad" ? "#fca5a5" : "#86efac")}>{show === "bad" ? badCode : fixCode}</div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
          Common mismatch sources
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {causes.map(c => (
            <div key={c.bad} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "8px 10px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#dc2626" }}>❌ {c.bad}</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#16a34a" }}>✅ {c.fix}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ROOT EXPLAINER ───────────────────────────────────────────────────────────

export const AdvancedRenderingExplainer: React.FC = () => (
  <div>
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: "0 0 4px", color: "#0f172a", fontSize: 22 }}>
        Expert — Advanced Rendering
      </h2>
      <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
        SSR / SSG · Streaming · Hydration strategies
      </p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <StrategyComparisonDemo />
      <StreamingDemo />
      <HydrationDemo />
      <HydrationMismatchDemo />
    </div>
  </div>
);

export default AdvancedRenderingExplainer;
