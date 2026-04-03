// TOPIC: Virtualization (Large Lists)
// LEVEL: Senior — Performance (Deep)
//
// ─── THE PROBLEM ─────────────────────────────────────────────────────────────
//
//   Render 10,000 rows naively → 10,000 DOM nodes created simultaneously.
//   Browser layout/paint cost is proportional to DOM size, not visible area.
//   Result: slow mount (100-500ms), janky scroll, wasted memory.
//
// ─── THE SOLUTION ────────────────────────────────────────────────────────────
//
//   Only render items that are VISIBLE in the viewport (+ a small overscan buffer).
//   10,000 items but viewport shows 10 → only 13-16 DOM nodes exist at any time.
//   Scroll → calculate new visible range → swap in new items, remove old ones.
//
// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
//
//   Container: overflow-y: auto, fixed height (400px)
//   Inner div: height = totalItems × itemHeight (creates the full scrollbar)
//   Items: position: absolute, top = index × itemHeight
//
//   On scroll:
//     scrollTop           = pixels scrolled
//     startIndex          = floor(scrollTop / itemHeight) - overscan
//     endIndex            = ceil((scrollTop + containerHeight) / itemHeight) + overscan
//     Render ONLY indices startIndex → endIndex
//
// ─── IN PRODUCTION ───────────────────────────────────────────────────────────
//
//   Use react-window or @tanstack/react-virtual instead of rolling your own.
//   This demo builds it from scratch to show HOW it works under the hood.

import React, {
  useState, useEffect, useLayoutEffect, useRef, useCallback, memo,
} from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_HEIGHT      = 56;
const CONTAINER_HEIGHT = 440;
const OVERSCAN         = 4;          // extra rows above/below viewport
const NAIVE_CAP        = 500;        // cap naive list to avoid crashing the browser
const VIRTUAL_COUNT    = 10_000;

// ─── Deterministic data (no useState array) ───────────────────────────────────

const FIRST = ["Alice","Bob","Carlos","Diana","Eve","Frank","Grace","Hiro","Isla","James","Kara","Leo"];
const LAST  = ["Martin","Chen","Rivas","Park","Taylor","Wu","Kim","Tanaka","Patel","Garcia","Smith","Johnson"];
const ROLES = ["Admin","Editor","Viewer","Manager","Developer","Designer","Analyst","Lead"];
const DEPTS = ["Engineering","Design","Product","Marketing","Finance","HR","Sales","DevOps"];

const getItem = (i: number) => ({
  id:    i + 1,
  name:  `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
  email: `user${i + 1}@company.io`,
  role:  ROLES[i % ROLES.length],
  dept:  DEPTS[(i * 2) % DEPTS.length],
  score: ((i * 37 + 13) % 100),
});

// ─── Custom virtualizer hook ──────────────────────────────────────────────────
//
// This is the core algorithm. react-window does the same thing, plus edge cases.

const useVirtualList = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  itemCount: number,
) => {
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // passive: true → browser can scroll without waiting for JS
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex   = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + OVERSCAN,
  );

  return {
    startIndex,
    endIndex,
    totalHeight:   itemCount * ITEM_HEIGHT,       // full scroll height
    visibleCount:  endIndex - startIndex + 1,
    firstVisible:  Math.floor(scrollTop / ITEM_HEIGHT),
    lastVisible:   Math.floor((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT),
    scrollTop,
  };
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const VirtualizationDemo = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");
  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.h2}>Virtualization (Large Lists)</h2>
        <p style={s.subtitle}>Senior Performance — render only what's visible, not all 10,000 rows</p>
        <div style={s.tabs}>
          {(["concepts", "demo"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
              {t === "concepts" ? "📚 Concepts" : "🔬 Live Demo"}
            </button>
          ))}
        </div>
      </div>
      {tab === "concepts" ? <ConceptsView /> : <ComparisonView />}
    </div>
  );
};

// ─── Concepts view ────────────────────────────────────────────────────────────

const ConceptsView = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

    {/* Problem vs Solution */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>The Problem</h3>
      <div style={s.twoCol}>
        <div style={{ ...s.halfCard, borderColor: "#fca5a5" }}>
          <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 10 }}>❌ Naive rendering</div>
          <pre style={s.code}>{`// 10,000 DOM nodes created at once
{items.map(item => (
  <Row key={item.id} item={item} />
))}
// Viewport shows 8 items
// DOM has 10,000 nodes
// Mount: ~400ms, scroll: janky`}</pre>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {["10,000 DOM nodes in memory", "Layout cost ∝ total DOM size", "Browser calculates all 10k layouts", "~400ms initial paint"].map((p, i) => (
              <div key={i} style={{ fontSize: 12, color: "#991b1b" }}>✗ {p}</div>
            ))}
          </div>
        </div>
        <div style={{ ...s.halfCard, borderColor: "#86efac" }}>
          <div style={{ fontWeight: 700, color: "#166534", marginBottom: 10 }}>✅ Virtualized</div>
          <pre style={s.code}>{`// Only visible items rendered
const { startIndex, endIndex } =
  useVirtualList(ref, 10_000);

// 10,000 logical items
// DOM has ~14 nodes
// Mount: ~5ms, scroll: buttery`}</pre>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {["~14 DOM nodes in memory", "Layout cost stays constant", "Only visible items calculated", "~5ms initial paint"].map((p, i) => (
              <div key={i} style={{ fontSize: 12, color: "#166534" }}>✓ {p}</div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Algorithm diagram */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>How it works — the algorithm</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            Container structure
          </div>
          {/* Visual diagram */}
          <div style={{ border: "2px solid #3b82f6", borderRadius: 10, overflow: "hidden", height: 200, position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 32, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#1d4ed8" }}>
              Container (overflow-y: auto, height: 400px)
            </div>
            <div style={{ position: "absolute", top: 32, left: 0, right: 0, bottom: 0, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Inner div</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>height = 10,000 × 56px = 560,000px</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>(creates the scrollbar)</div>
              {[0,1,2].map((i) => (
                <div key={i} style={{ width: "80%", height: 24, background: i === 1 ? "#3b82f6" : "#e5e7eb", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 8 }}>
                  <span style={{ fontSize: 10, color: i === 1 ? "#fff" : "#9ca3af" }}>
                    {i === 1 ? "position: absolute, top = index × 56px" : "..."}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            The calculation on every scroll
          </div>
          <pre style={s.code}>{ALGO_CODE}</pre>
        </div>
      </div>
    </div>

    {/* Key concepts */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      {CONCEPTS.map((c, i) => (
        <div key={i} style={{ ...s.card, borderLeft: `4px solid ${c.color}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.color, marginBottom: 6 }}>{c.title}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10, lineHeight: 1.6 }}>{c.desc}</div>
          <pre style={s.code}>{c.code}</pre>
        </div>
      ))}
    </div>

    {/* When to use */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>When to virtualise</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 8 }}>✅ Good candidates</div>
          {GOOD.map((g, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>• {g}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>🤔 Probably don't need it</div>
          {NO_NEED.map((g, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>• {g}</div>)}
        </div>
      </div>
      <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#374151" }}>
        Rule of thumb: if rendering the list takes &gt;16ms (one frame) and it's a user-facing bottleneck — virtualise. Use React DevTools Profiler to measure first.
      </div>
    </div>

  </div>
);

// ─── Comparison view — Naive vs Virtual side by side ─────────────────────────

const ComparisonView = () => {
  const [mounted, setMounted]   = useState(false);
  const [mountKey, setMountKey] = useState(0);

  const remount = () => {
    setMounted(false);
    setTimeout(() => { setMounted(true); setMountKey((k) => k + 1); }, 100);
  };

  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Naive list (capped at {NAIVE_CAP} rows) vs Virtual list ({VIRTUAL_COUNT.toLocaleString()} rows).
          Click <strong>Remount</strong> to measure mount time.
        </p>
        <button onClick={remount} style={s.actionBtn}>🔄 Remount both</button>
      </div>

      {mounted && (
        <div style={s.twoCol}>
          <NaiveList key={`naive-${mountKey}`} />
          <VirtualList key={`virtual-${mountKey}`} />
        </div>
      )}
    </div>
  );
};

// ─── Naive list ───────────────────────────────────────────────────────────────

const NaiveList = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountTime    = useRef(performance.now());
  const [paintTime, setPaintTime] = useState<number | null>(null);
  const [nodeCount, setNodeCount] = useState(0);

  useLayoutEffect(() => {
    setPaintTime(Math.round(performance.now() - mountTime.current));
    const el = containerRef.current;
    if (el) setNodeCount(el.querySelectorAll("[data-row]").length);
  }, []);

  const items = Array.from({ length: NAIVE_CAP }, (_, i) => getItem(i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ ...s.listHeader, background: "#fef2f2", borderColor: "#fca5a5" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b" }}>❌ Naive (no virtualisation)</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Showing {NAIVE_CAP} of a real 10,000-row list</div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Stat label="DOM rows" value={String(nodeCount)} bad />
          <Stat label="Mount time" value={paintTime !== null ? `${paintTime}ms` : "…"} bad />
          <Stat label="Total items" value={NAIVE_CAP.toLocaleString()} />
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ ...s.scrollContainer, border: "1.5px solid #fca5a5" }}
      >
        {items.map((item) => (
          <Row key={item.id} item={item} style={{ position: "static", top: "auto" }} />
        ))}
      </div>
    </div>
  );
};

// ─── Virtual list ─────────────────────────────────────────────────────────────

const VirtualList = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountTime    = useRef(performance.now());
  const [paintTime, setPaintTime] = useState<number | null>(null);

  useLayoutEffect(() => {
    setPaintTime(Math.round(performance.now() - mountTime.current));
  }, []);

  const {
    startIndex, endIndex, totalHeight,
    visibleCount, firstVisible, lastVisible,
  } = useVirtualList(containerRef, VIRTUAL_COUNT);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ ...s.listHeader, background: "#f0fdf4", borderColor: "#86efac" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>✅ Virtual list (custom hook)</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Showing rows {firstVisible + 1}–{lastVisible + 1} of {VIRTUAL_COUNT.toLocaleString()}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Stat label="DOM rows" value={String(visibleCount)} good />
          <Stat label="Mount time" value={paintTime !== null ? `${paintTime}ms` : "…"} good />
          <Stat label="Total items" value={VIRTUAL_COUNT.toLocaleString()} />
        </div>
      </div>

      {/* The scroll container */}
      <div
        ref={containerRef}
        style={{ ...s.scrollContainer, border: "1.5px solid #86efac" }}
      >
        {/* Inner spacer — full logical height to create the scrollbar */}
        <div style={{ height: totalHeight, position: "relative" }}>
          {/* Only visible items are rendered */}
          {Array.from({ length: endIndex - startIndex + 1 }, (_, i) => {
            const index = startIndex + i;
            return (
              <Row
                key={index}
                item={getItem(index)}
                style={{ position: "absolute", top: index * ITEM_HEIGHT, left: 0, right: 0 }}
              />
            );
          })}
        </div>
      </div>

      {/* Algorithm state */}
      <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.8 }}>
        <span style={{ color: "#64748b" }}>// useVirtualList state</span>{"\n"}
        startIndex = <span style={{ color: "#86efac" }}>{startIndex}</span>{" "}
        endIndex = <span style={{ color: "#86efac" }}>{endIndex}</span>{" "}
        rendered = <span style={{ color: "#fbbf24" }}>{visibleCount}</span> rows
      </div>
    </div>
  );
};

// ─── Shared row component ─────────────────────────────────────────────────────

const Row = memo(({ item, style }: { item: ReturnType<typeof getItem>; style?: React.CSSProperties }) => {
  const score = item.score;
  const scoreColor = score > 70 ? "#22c55e" : score > 40 ? "#f59e0b" : "#ef4444";

  return (
    <div data-row style={{ ...s.row, ...style }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: AVATAR_COLORS[item.id % AVATAR_COLORS.length], color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {item.name[0]}{item.name.split(" ")[1]?.[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          #{item.id} {item.name}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{item.dept} · {item.role}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{score}</div>
        <div style={{ fontSize: 10, color: "#9ca3af" }}>score</div>
      </div>
    </div>
  );
});
Row.displayName = "Row";

// ─── Small helper components ──────────────────────────────────────────────────

const Stat = ({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: 16, fontWeight: 800, color: good ? "#16a34a" : bad ? "#dc2626" : "#374151" }}>{value}</div>
    <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
  </div>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899","#f97316"];

const ALGO_CODE =
`// On every scroll event:
const startIndex = Math.max(0,
  Math.floor(scrollTop / ITEM_HEIGHT) - overscan
);

const endIndex = Math.min(
  itemCount - 1,
  Math.ceil(
    (scrollTop + containerHeight) / ITEM_HEIGHT
  ) + overscan
);

// Only render startIndex → endIndex
// Position each item absolutely:
// top = index * ITEM_HEIGHT`;

const CONCEPTS = [
  {
    color: "#3b82f6",
    title: "Overscan",
    desc:  "Render a few extra items above and below the visible area. Prevents blank rows appearing during fast scrolling.",
    code:  `const OVERSCAN = 4; // rows above/below
// Without it: fast scroll shows blank
// With it: seamless scroll`,
  },
  {
    color: "#8b5cf6",
    title: "Total height spacer",
    desc:  "An inner div with height = totalItems × itemHeight creates the correct scrollbar without rendering all items.",
    code:  `// Full logical height (for scrollbar)
<div style={{
  height: 10_000 * 56, // 560,000px
  position: "relative",
}}>
  {/* Only visible items */}
</div>`,
  },
  {
    color: "#10b981",
    title: "Absolute positioning",
    desc:  "Each visible item is positioned absolutely at its correct vertical offset. This avoids layout reflow when items are added/removed.",
    code:  `<Row style={{
  position: "absolute",
  top: index * ITEM_HEIGHT, // exact position
  left: 0,
  right: 0,
}} />`,
  },
];

const GOOD     = ["10,000+ row tables","Infinite scroll feeds","Chat message history","Log viewers","Dropdown with thousands of options","Any list where scroll lag is noticeable"];
const NO_NEED  = ["Lists under 100 items (profile dropdown)","Paginated lists (12-24 items per page)","Static content that doesn't scroll","Already paginating server-side"];

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:            { fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" },
  header:          { marginBottom: 28 },
  h2:              { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 6px" },
  subtitle:        { color: "#6b7280", margin: "0 0 20px" },
  tabs:            { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" },
  tab:             { padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: "#6b7280", fontFamily: "inherit" },
  tabActive:       { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  card:            { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 },
  cardTitle:       { fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" },
  twoCol:          { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  halfCard:        { background: "#f8fafc", border: "1.5px solid", borderRadius: 10, padding: 16 },
  code:            { fontSize: 11.5, lineHeight: 1.75, background: "#0f172a", color: "#e2e8f0", padding: "10px 14px", borderRadius: 8, margin: 0, fontFamily: "monospace", overflow: "auto" },
  scrollContainer: { height: CONTAINER_HEIGHT, overflowY: "auto", borderRadius: 10, background: "#fff" },
  listHeader:      { border: "1.5px solid", borderRadius: 10, padding: "12px 16px" },
  row:             { height: ITEM_HEIGHT, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", borderBottom: "1px solid #f1f5f9", background: "#fff", boxSizing: "border-box" as const },
  actionBtn:       { padding: "9px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" as const },
};

export default VirtualizationDemo;
