// TOPIC: Web Vitals
// LEVEL: Senior — Performance (Deep)
//
// ─── WHAT ARE WEB VITALS? ─────────────────────────────────────────────────────
//
//   Web Vitals = a set of browser metrics Google defined to measure
//   real user experience. They affect SEO ranking and are tracked by
//   Google Search Console, Lighthouse, and the `web-vitals` library.
//
// ─── CORE WEB VITALS (the three that matter most) ────────────────────────────
//
//   LCP  — Largest Contentful Paint
//   └─ How fast does the main content load?
//      Measures: when the largest image/text block in the viewport paints
//      Good: < 2.5s   Needs work: 2.5–4s   Poor: > 4s
//
//   INP  — Interaction to Next Paint  (replaced FID in 2024)
//   └─ How fast does the page respond to clicks/taps/keys?
//      Measures: worst interaction delay during the whole page visit
//      Good: < 200ms  Needs work: 200–500ms  Poor: > 500ms
//
//   CLS  — Cumulative Layout Shift
//   └─ Does content jump around as it loads?
//      Measures: sum of unexpected layout shift scores during page lifetime
//      Good: < 0.1    Needs work: 0.1–0.25   Poor: > 0.25
//
// ─── SUPPORTING METRICS ───────────────────────────────────────────────────────
//
//   FCP  — First Contentful Paint
//   └─ First pixel of ANY content on screen (text, image, canvas)
//      Good: < 1.8s
//
//   TTFB — Time to First Byte
//   └─ How long until the browser receives the first byte of HTML
//      Good: < 800ms
//
// ─── THE web-vitals LIBRARY ───────────────────────────────────────────────────
//
//   import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';
//
//   Each function calls your callback once the metric is ready:
//
//   onLCP(metric => {
//     console.log(metric.name);   // "LCP"
//     console.log(metric.value);  // milliseconds
//     console.log(metric.rating); // "good" | "needs-improvement" | "poor"
//   });
//
//   In production: send to analytics → onLCP(m => sendToAnalytics(m));
//
// ─── COMMON REACT CAUSES & FIXES ─────────────────────────────────────────────
//
//   LCP PROBLEMS:
//   - Large unoptimized images (use WebP, set width/height, add loading="eager" on hero)
//   - No SSR/SSG — user waits for JS bundle before seeing content
//   - Heavy JS blocking the main thread on startup
//
//   INP PROBLEMS:
//   - Long synchronous event handlers (sorting 10k items on click)
//   - Expensive re-renders triggered by interaction → use React.memo, startTransition
//   - React 18: wrap non-urgent updates in startTransition(() => setHeavyState(v))
//
//   CLS PROBLEMS:
//   - Images without width/height attributes → browser doesn't reserve space
//   - Fonts loading late and causing text reflow (use font-display: swap + preload)
//   - Dynamically injected banners/ads above existing content
//
// ─── REACT 18 — startTransition ──────────────────────────────────────────────
//
//   React 18 introduced a way to mark state updates as "non-urgent":
//
//   import { startTransition } from 'react';
//
//   // WITHOUT: every keystroke blocks the UI while filtering 50k items
//   setFilter(e.target.value);   // urgent (input) + expensive re-render together
//
//   // WITH: input updates instantly, filter re-render is deferred
//   setInputValue(e.target.value);           // urgent — updates immediately
//   startTransition(() => setFilter(e.target.value)); // deferred — yields to browser
//
//   The browser can interrupt the deferred render to handle new user input.
//   Result: input feels instant even with expensive child re-renders.

import React, { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Rating = "good" | "needs-improvement" | "poor";

interface MetricSnapshot {
  name: string;
  value: number;
  rating: Rating;
  unit: string;
  capturedAt: number;
}

interface VitalInfo {
  name: string;
  full: string;
  description: string;
  good: string;
  unit: string;
  thresholds: [number, number]; // [good_max, ni_max]
  category: "core" | "supporting";
  reactCauses: string[];
  reactFixes: string[];
}

// ─── VITAL DEFINITIONS ────────────────────────────────────────────────────────

const VITALS: VitalInfo[] = [
  {
    name: "LCP",
    full: "Largest Contentful Paint",
    description: "Time until the largest image or text block in the viewport is fully painted.",
    good: "< 2.5s",
    unit: "ms",
    thresholds: [2500, 4000],
    category: "core",
    reactCauses: [
      "Large unoptimised hero images",
      "No SSR — user waits for JS bundle before any content shows",
      "Heavy JS blocking the main thread on startup",
    ],
    reactFixes: [
      'Add width + height to <img> tags to prevent layout shift',
      'Use loading="eager" (default) on hero images, loading="lazy" only on below-fold images',
      "Split large bundles with React.lazy + Suspense",
      "Consider Next.js / Remix for SSR so HTML arrives pre-rendered",
    ],
  },
  {
    name: "INP",
    full: "Interaction to Next Paint",
    description: "Worst interaction delay across the whole visit — click, tap, or key press to next frame.",
    good: "< 200ms",
    unit: "ms",
    thresholds: [200, 500],
    category: "core",
    reactCauses: [
      "Expensive synchronous event handlers (sorting, filtering large arrays on click)",
      "State update triggers heavy re-render tree on the same frame as the interaction",
      "Synchronous third-party scripts blocking the main thread",
    ],
    reactFixes: [
      "Wrap expensive state updates in startTransition() so React can yield to the browser",
      "Memoize child components with React.memo to reduce re-render scope",
      "Move heavy computation off the main thread with Web Workers",
      "Debounce or throttle high-frequency handlers (resize, scroll, input)",
    ],
  },
  {
    name: "CLS",
    full: "Cumulative Layout Shift",
    description: "Sum of unexpected layout shifts during page lifetime. Content jumping around is bad UX.",
    good: "< 0.1",
    unit: "score",
    thresholds: [0.1, 0.25],
    category: "core",
    reactCauses: [
      "Images rendered without width/height — browser can't reserve space",
      "Dynamic content injected above existing content (banners, cookie notices)",
      "Late-loading fonts causing text to reflow",
    ],
    reactFixes: [
      "Always set width and height on <img> (or use aspect-ratio CSS)",
      "Reserve space for async content with skeleton loaders / min-height placeholders",
      'Use font-display: swap and preload critical fonts with <link rel="preload">',
      "Append dynamic banners at bottom or use position:fixed to avoid pushing content",
    ],
  },
  {
    name: "FCP",
    full: "First Contentful Paint",
    description: "Time until the first pixel of any content (text, image, canvas) appears on screen.",
    good: "< 1.8s",
    unit: "ms",
    thresholds: [1800, 3000],
    category: "supporting",
    reactCauses: [
      "Large initial JS bundle blocks rendering",
      "Render-blocking CSS or scripts in <head>",
    ],
    reactFixes: [
      "Code-split with React.lazy — ship only what the current route needs",
      "Inline critical CSS and defer non-critical styles",
    ],
  },
  {
    name: "TTFB",
    full: "Time to First Byte",
    description: "Time from navigation start until the browser receives the first byte of HTML.",
    good: "< 800ms",
    unit: "ms",
    thresholds: [800, 1800],
    category: "supporting",
    reactCauses: [
      "Slow API calls blocking SSR response",
      "No CDN — server far from user",
    ],
    reactFixes: [
      "Cache API responses at the server layer (Redis, CDN edge)",
      "Use a CDN to serve HTML from edge locations near users",
      "Defer non-critical data fetches — stream the shell HTML first",
    ],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getRating = (name: string, value: number): Rating => {
  const v = VITALS.find(v => v.name === name);
  if (!v) return "good";
  if (value <= v.thresholds[0]) return "good";
  if (value <= v.thresholds[1]) return "needs-improvement";
  return "poor";
};

const RATING_COLOR: Record<Rating, string> = {
  good: "#22c55e",
  "needs-improvement": "#f59e0b",
  poor: "#ef4444",
};

const RATING_BG: Record<Rating, string> = {
  good: "#f0fdf4",
  "needs-improvement": "#fffbeb",
  poor: "#fef2f2",
};

const formatValue = (name: string, value: number) => {
  if (name === "CLS") return value.toFixed(4);
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
};

// ─── METRIC CARD ──────────────────────────────────────────────────────────────

const MetricCard: React.FC<{ info: VitalInfo; snapshot?: MetricSnapshot }> = ({ info, snapshot }) => {
  const rating = snapshot?.rating ?? null;
  const border = rating ? RATING_COLOR[rating] : "#e2e8f0";
  const bg = rating ? RATING_BG[rating] : "#f8fafc";

  return (
    <div style={{
      border: `2px solid ${border}`,
      borderRadius: 12,
      padding: "16px 18px",
      background: bg,
      transition: "all 0.4s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontWeight: 700, fontSize: 18, color: "#1e293b",
              fontFamily: "monospace",
            }}>{info.name}</span>
            <span style={{
              fontSize: 11, padding: "2px 7px", borderRadius: 20,
              background: info.category === "core" ? "#dbeafe" : "#e2e8f0",
              color: info.category === "core" ? "#1d4ed8" : "#475569",
              fontWeight: 600,
            }}>{info.category === "core" ? "Core" : "Supporting"}</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{info.full}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{info.description}</div>
        </div>
        {snapshot && (
          <div style={{ textAlign: "right", minWidth: 90 }}>
            <div style={{
              fontSize: 22, fontWeight: 700, color: RATING_COLOR[snapshot.rating],
              fontFamily: "monospace",
            }}>{formatValue(info.name, snapshot.value)}</div>
            <div style={{
              fontSize: 11, fontWeight: 600, color: RATING_COLOR[snapshot.rating],
              textTransform: "uppercase",
            }}>{snapshot.rating.replace("-", " ")}</div>
          </div>
        )}
        {!snapshot && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Good: {info.good}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── VITAL DETAIL PANEL ───────────────────────────────────────────────────────

const VitalDetail: React.FC<{ info: VitalInfo }> = ({ info }) => (
  <div style={{
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: "18px 20px",
  }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
      {info.name} — React causes & fixes
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#ef4444",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
        }}>Common causes</div>
        {info.reactCauses.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
            <span style={{ color: "#ef4444", marginTop: 1 }}>✕</span>
            <span style={{ fontSize: 13, color: "#475569" }}>{c}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#22c55e",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
        }}>React fixes</div>
        {info.reactFixes.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
            <span style={{ color: "#22c55e", marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 13, color: "#475569" }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── LIVE METRICS COLLECTOR ───────────────────────────────────────────────────

const LiveMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([]);
  const [listening, setListening] = useState(false);

  const start = useCallback(() => {
    setListening(true);
    setMetrics([]);

    const record = (name: string, unit: string) => (m: { value: number }) => {
      const rating = getRating(name, m.value);
      setMetrics(prev => {
        const filtered = prev.filter(x => x.name !== name);
        return [...filtered, { name, value: m.value, rating, unit, capturedAt: Date.now() }];
      });
    };

    onLCP(record("LCP", "ms"));
    onINP(record("INP", "ms"));
    onCLS(record("CLS", "score"));
    onFCP(record("FCP", "ms"));
    onTTFB(record("TTFB", "ms"));
  }, []);

  return (
    <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>Live Metrics — this page</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            Collected from your actual browser session via the <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 4 }}>web-vitals</code> library
          </div>
        </div>
        {!listening && (
          <button
            onClick={start}
            style={{
              background: "#3b82f6", color: "#fff", border: "none",
              borderRadius: 8, padding: "8px 18px", fontWeight: 600,
              fontSize: 13, cursor: "pointer",
            }}
          >
            Collect Metrics
          </button>
        )}
        {listening && (
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "#3b82f6", fontWeight: 600,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#3b82f6", display: "inline-block",
              animation: "cl-pulse 1.5s ease-in-out infinite",
            }} />
            Listening...
          </span>
        )}
      </div>

      {listening && metrics.length === 0 && (
        <div style={{
          padding: 20, textAlign: "center", color: "#94a3b8",
          fontSize: 13, border: "1px dashed #cbd5e1", borderRadius: 8,
        }}>
          Interact with the page — click, scroll, type — to trigger metric collection.
          <br />Some metrics (LCP, FCP) fire automatically on page load.
        </div>
      )}

      {metrics.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {metrics.map(m => {
            const info = VITALS.find(v => v.name === m.name)!;
            return <MetricCard key={m.name} info={info} snapshot={m} />;
          })}
        </div>
      )}

      {listening && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe",
        }}>
          <div style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600, marginBottom: 4 }}>
            How the web-vitals library works
          </div>
          <code style={{ fontSize: 11, color: "#1e3a8a", whiteSpace: "pre-wrap" }}>
{`import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

// Each fires once when the metric is ready
onLCP(metric => sendToAnalytics(metric));
onINP(metric => sendToAnalytics(metric));
onCLS(metric => sendToAnalytics(metric));`}
          </code>
        </div>
      )}
    </div>
  );
};

// ─── INTERACTION DEMO (INP) ───────────────────────────────────────────────────

const NAMES = Array.from({ length: 5000 }, (_, i) => `User ${i + 1} — item data point ${i}`);

const InteractionDemo: React.FC = () => {
  const [filter, setFilter] = useState("");
  const [optimisedFilter, setOptimisedFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"blocking" | "transition">("blocking");
  const [inputValue, setInputValue] = useState("");
  const lastRenderMs = useRef(0);

  const filtered = (mode === "blocking" ? filter : optimisedFilter)
    ? NAMES.filter(n => n.toLowerCase().includes((mode === "blocking" ? filter : optimisedFilter).toLowerCase()))
    : NAMES.slice(0, 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (mode === "blocking") {
      // Blocking: state update + expensive re-render happen synchronously
      setFilter(val);
    } else {
      // Optimised: input update is urgent, filter update is deferred
      setInputValue(val);
      startTransition(() => setOptimisedFilter(val));
    }
    lastRenderMs.current = performance.now();
  };

  const displayValue = mode === "blocking" ? filter : inputValue;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        INP Demo — startTransition
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Filter 5,000 items. Toggle between blocking and non-blocking to feel the difference in input responsiveness.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["blocking", "transition"] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setFilter(""); setOptimisedFilter(""); setInputValue(""); }}
            style={{
              padding: "6px 14px", borderRadius: 8, fontWeight: 600,
              fontSize: 12, cursor: "pointer", border: "2px solid",
              borderColor: mode === m ? (m === "blocking" ? "#ef4444" : "#22c55e") : "#e2e8f0",
              background: mode === m ? (m === "blocking" ? "#fef2f2" : "#f0fdf4") : "#f8fafc",
              color: mode === m ? (m === "blocking" ? "#dc2626" : "#16a34a") : "#64748b",
            }}
          >
            {m === "blocking" ? "Blocking (no startTransition)" : "Optimised (startTransition)"}
          </button>
        ))}
      </div>

      <div style={{
        padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: 12,
        background: mode === "blocking" ? "#fef2f2" : "#f0fdf4",
        color: mode === "blocking" ? "#dc2626" : "#16a34a",
        fontFamily: "monospace",
      }}>
        {mode === "blocking"
          ? "setFilter(val)  // urgent update + expensive re-render together"
          : "setInputValue(val);  startTransition(() => setOptimisedFilter(val));"}
      </div>

      <input
        type="text"
        placeholder="Type to filter 5,000 names..."
        value={displayValue}
        onChange={handleChange}
        style={{
          width: "100%", padding: "10px 14px",
          border: "2px solid #e2e8f0", borderRadius: 8,
          fontSize: 14, outline: "none", boxSizing: "border-box",
          marginBottom: 8,
        }}
      />

      {isPending && (
        <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginBottom: 8 }}>
          Rendering list... (input stays responsive while this works in background)
        </div>
      )}

      <div style={{
        height: 200, overflowY: "auto",
        border: "1px solid #e2e8f0", borderRadius: 8,
        background: "#f8fafc",
      }}>
        {filtered.slice(0, 200).map((name, i) => (
          <div key={i} style={{
            padding: "6px 12px", fontSize: 12, color: "#374151",
            borderBottom: "1px solid #f1f5f9",
          }}>{name}</div>
        ))}
        {filtered.length > 200 && (
          <div style={{ padding: "6px 12px", fontSize: 11, color: "#94a3b8" }}>
            …and {filtered.length - 200} more
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
        Showing {Math.min(filtered.length, 200)} of {filtered.length} results from 5,000 total
      </div>
    </div>
  );
};

// ─── CLS DEMO ─────────────────────────────────────────────────────────────────

const ClsDemo: React.FC = () => {
  const [showBad, setShowBad] = useState(false);
  const [showGood, setShowGood] = useState(false);

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        CLS Demo — Layout Shift
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Simulate content appearing dynamically. Watch how reserving space prevents text from jumping.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* BAD */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#ef4444",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
          }}>Bad — No space reserved</div>
          <button
            onClick={() => { setShowBad(false); setTimeout(() => setShowBad(true), 500); }}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12,
              background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
              cursor: "pointer", fontWeight: 600, marginBottom: 10,
            }}
          >
            Load image
          </button>
          <div style={{
            border: "1px solid #fecaca", borderRadius: 8, padding: 12,
            background: "#fff",
          }}>
            {showBad && (
              <div style={{
                background: "#fca5a5", height: 80, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: "#7f1d1d", fontWeight: 600,
                marginBottom: 8, transition: "none",
              }}>
                Hero Image (arrived late)
              </div>
            )}
            <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
              This text shifts down when the image loads above it.
              Layout shift score increases. Google penalises this.
            </p>
          </div>
        </div>

        {/* GOOD */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#22c55e",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
          }}>Good — Space reserved with aspect-ratio</div>
          <button
            onClick={() => { setShowGood(false); setTimeout(() => setShowGood(true), 500); }}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12,
              background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
              cursor: "pointer", fontWeight: 600, marginBottom: 10,
            }}
          >
            Load image
          </button>
          <div style={{
            border: "1px solid #bbf7d0", borderRadius: 8, padding: 12,
            background: "#fff",
          }}>
            <div style={{
              aspectRatio: "16/3", background: showGood ? "#86efac" : "#e2e8f0",
              borderRadius: 6, marginBottom: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: showGood ? "#14532d" : "#94a3b8", fontWeight: 600,
              transition: "background 0.3s",
            }}>
              {showGood ? "Hero Image (loaded)" : "Space reserved (skeleton)"}
            </div>
            <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
              This text does NOT move. Space was reserved with aspect-ratio.
              CLS score stays at 0.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 14, padding: "10px 14px",
        background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe",
        fontSize: 12, color: "#1d4ed8",
      }}>
        <strong>Fix:</strong> Always give images a fixed aspect ratio or explicit width/height.
        Use skeleton loaders (grey placeholder boxes) for async content.
      </div>
    </div>
  );
};

// ─── CONCEPTS TAB ─────────────────────────────────────────────────────────────

const ConceptsTab: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedInfo = selected ? VITALS.find(v => v.name === selected) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Threshold bar */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
          Core Web Vitals — Thresholds
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          Click a metric to see React causes and fixes.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {VITALS.map(v => {
            const isSelected = selected === v.name;
            const [good, ni] = v.thresholds;
            const max = ni * 1.5;
            const goodPct = (good / max) * 100;
            const niPct = ((ni - good) / max) * 100;
            const poorPct = 100 - goodPct - niPct;

            return (
              <div key={v.name}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setSelected(isSelected ? null : v.name)}
                      style={{
                        fontFamily: "monospace", fontWeight: 700, fontSize: 14,
                        color: isSelected ? "#3b82f6" : "#1e293b",
                        background: isSelected ? "#eff6ff" : "transparent",
                        border: isSelected ? "1px solid #93c5fd" : "1px solid transparent",
                        borderRadius: 6, padding: "2px 10px", cursor: "pointer",
                      }}
                    >{v.name}</button>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{v.full}</span>
                    <span style={{
                      fontSize: 10, padding: "1px 6px", borderRadius: 20,
                      background: v.category === "core" ? "#dbeafe" : "#e2e8f0",
                      color: v.category === "core" ? "#1d4ed8" : "#475569",
                      fontWeight: 600,
                    }}>{v.category}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Good: {v.good}</span>
                </div>
                <div style={{
                  display: "flex", height: 12, borderRadius: 6, overflow: "hidden",
                }}>
                  <div style={{ width: `${goodPct}%`, background: "#22c55e" }} title={`Good: 0–${formatValue(v.name, good)}`} />
                  <div style={{ width: `${niPct}%`, background: "#f59e0b" }} title={`Needs work: ${formatValue(v.name, good)}–${formatValue(v.name, ni)}`} />
                  <div style={{ width: `${poorPct}%`, background: "#ef4444" }} title={`Poor: > ${formatValue(v.name, ni)}`} />
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 3, fontSize: 10, color: "#94a3b8" }}>
                  <span style={{ width: `${goodPct}%` }}>Good</span>
                  <span style={{ width: `${niPct}%` }}>Needs work</span>
                  <span>Poor</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          {[["#22c55e", "Good"], ["#f59e0b", "Needs improvement"], ["#ef4444", "Poor"]].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Selected detail */}
      {selectedInfo && <VitalDetail info={selectedInfo} />}

      {/* Code snippet */}
      <div style={{
        background: "#0f172a", borderRadius: 12, padding: 20,
        border: "1px solid #1e293b",
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
          Sending Web Vitals to analytics
        </div>
        <pre style={{
          margin: 0, fontSize: 12, lineHeight: 1.7,
          color: "#e2e8f0", fontFamily: "monospace", overflow: "auto",
        }}>{`// src/reportWebVitals.ts
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Option A — Google Analytics 4
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating,  // "good" | "needs-improvement" | "poor"
    non_interaction: true,
  });

  // Option B — any endpoint
  navigator.sendBeacon('/analytics', JSON.stringify(metric));
}

// Call once at app startup (e.g., in main.tsx)
onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);`}
        </pre>
      </div>

      {/* startTransition explainer */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
          React 18 — startTransition for INP
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#ef4444",
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
            }}>Without (blocks input)</div>
            <div style={{
              background: "#0f172a", borderRadius: 8, padding: 14,
              fontFamily: "monospace", fontSize: 12, color: "#fca5a5",
              lineHeight: 1.7,
            }}>
              {`const handleChange = (e) => {\n  // ONE update: triggers\n  // expensive re-render NOW\n  setFilter(e.target.value);\n  // input feels laggy\n};`}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#22c55e",
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
            }}>With startTransition (input stays snappy)</div>
            <div style={{
              background: "#0f172a", borderRadius: 8, padding: 14,
              fontFamily: "monospace", fontSize: 12, color: "#86efac",
              lineHeight: 1.7,
            }}>
              {`const handleChange = (e) => {\n  // urgent — input updates instantly\n  setInputValue(e.target.value);\n  // deferred — React can interrupt\n  startTransition(() =>\n    setFilter(e.target.value)\n  );\n};`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DEMO TAB ─────────────────────────────────────────────────────────────────

const DemoTab: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <LiveMetrics />
    <InteractionDemo />
    <ClsDemo />
  </div>
);

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export const WebVitals: React.FC = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <style>{`
        @keyframes cl-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            background: "#3b82f6", color: "#fff", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Senior — Performance #3</span>
          <span style={{
            background: "#f0fdf4", color: "#16a34a", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            border: "1px solid #bbf7d0",
          }}>web-vitals library</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          Web Vitals
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          Browser metrics Google uses to measure real user experience —{" "}
          <strong>LCP</strong> (loading), <strong>INP</strong> (responsiveness),{" "}
          <strong>CLS</strong> (visual stability). Affects SEO ranking and production monitoring.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        {(["concepts", "demo"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px", background: "none", border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 14,
              color: tab === t ? "#3b82f6" : "#64748b",
              borderBottom: `3px solid ${tab === t ? "#3b82f6" : "transparent"}`,
              marginBottom: -2,
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "concepts" ? <ConceptsTab /> : <DemoTab />}
    </div>
  );
};

export default WebVitals;
