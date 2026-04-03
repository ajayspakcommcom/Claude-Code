// TOPIC: Render Profiling
// LEVEL: Senior — Performance (Deep)
//
// ─── WHEN DOES A COMPONENT RE-RENDER? ────────────────────────────────────────
//
//   1. Its own STATE changes
//   2. Its PROPS change
//   3. Its PARENT re-renders (even if props didn't change) ← the common surprise
//   4. A CONTEXT it consumes changes
//
// ─── THE PROBLEM ─────────────────────────────────────────────────────────────
//
//   Parent updates count → parent re-renders → ALL children re-render,
//   even if their props are identical. React re-renders by default.
//
// ─── THE 3 TOOLS ─────────────────────────────────────────────────────────────
//
//   React.memo(Component)
//   └─ Wraps a component. Skips re-render if ALL props are shallowly equal.
//      Trap: new object/function reference = always unequal → memo is useless.
//
//   useCallback(fn, deps)
//   └─ Returns the SAME function reference between renders (if deps unchanged).
//      Pair with React.memo — memo alone won't help if you pass () => {} as prop.
//
//   useMemo(() => value, deps)
//   └─ Memoizes an expensive computed value.
//      Only re-computes when deps change.
//
// ─── THE RULES ───────────────────────────────────────────────────────────────
//
//   1. MEASURE FIRST. Don't add memo everywhere — it has a cost.
//   2. memo + useCallback together. memo alone is often useless.
//   3. useMemo for expensive derivations only (sorting 10k items, not 5).

import React, {
  useState, useRef, useCallback, useMemo, useLayoutEffect, memo,
} from "react";

// ─── Root ─────────────────────────────────────────────────────────────────────

const RenderProfilingDemo = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");
  return (
    <div style={s.page}>
      <style>{`
        @keyframes flash-in { 0% { outline-color: #f59e0b; } 100% { outline-color: transparent; } }
      `}</style>
      <div style={s.header}>
        <h2 style={s.h2}>Render Profiling</h2>
        <p style={s.subtitle}>Senior Performance — find unnecessary re-renders and eliminate them with memo, useCallback, useMemo</p>
        <div style={s.tabs}>
          {(["concepts", "demo"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
              {t === "concepts" ? "📚 Concepts" : "🔬 Live Demo"}
            </button>
          ))}
        </div>
      </div>
      {tab === "concepts" ? <ConceptsView /> : <LiveDemo />}
    </div>
  );
};

// ─── Concepts view ────────────────────────────────────────────────────────────

const ConceptsView = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

    {/* When re-renders happen */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>When does a component re-render?</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {RENDER_TRIGGERS.map((t, i) => (
          <div key={i} style={{ ...s.triggerBox, borderLeftColor: t.color }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.color, marginBottom: 4 }}>{t.trigger}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{t.desc}</div>
            <pre style={s.code}>{t.code}</pre>
          </div>
        ))}
      </div>
    </div>

    {/* The 3 tools */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      {TOOLS.map((tool, i) => (
        <div key={i} style={{ ...s.card, borderTop: `3px solid ${tool.color}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: tool.color, marginBottom: 4 }}>{tool.name}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 1.6 }}>{tool.desc}</div>
          <pre style={s.code}>{tool.code}</pre>
          <div style={{ marginTop: 10, padding: "8px 10px", background: "#fef3c7", borderRadius: 6, fontSize: 12, color: "#92400e" }}>
            ⚠️ {tool.trap}
          </div>
        </div>
      ))}
    </div>

    {/* useCallback trap */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>The useCallback Trap — why memo alone often fails</h3>
      <div style={s.twoCol}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>❌ memo without useCallback</div>
          <pre style={s.code}>{TRAP_BAD}</pre>
          <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            Every parent render creates a NEW <code style={s.ic}>handleClick</code> reference. Memo sees a new prop → re-renders anyway.
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 8 }}>✅ memo + useCallback</div>
          <pre style={s.code}>{TRAP_GOOD}</pre>
          <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            <code style={s.ic}>useCallback</code> returns the SAME function reference. Memo's shallow compare passes → skips re-render.
          </div>
        </div>
      </div>
    </div>

    {/* Rules */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>The 3 Rules</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {RULES.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: 14, background: "#f8fafc", borderRadius: 8 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{r.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{r.rule}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

  </div>
);

// ─── Live Demo ────────────────────────────────────────────────────────────────
//
// Three panels:
//   A. Unoptimized  — every child re-renders on any parent state change
//   B. memo trap    — memo alone, but callbacks not stable → still re-renders
//   C. Optimized    — memo + useCallback → only changed child re-renders

interface Item { id: number; label: string; value: number; color: string; }

const INITIAL_ITEMS: Item[] = [
  { id: 1, label: "Revenue",   value: 48_200, color: "#3b82f6" },
  { id: 2, label: "Users",     value: 1_284,  color: "#8b5cf6" },
  { id: 3, label: "Sessions",  value: 9_310,  color: "#10b981" },
  { id: 4, label: "Conv. rate",value: 3.7,    color: "#f59e0b" },
];

const LiveDemo = () => {
  const [items, setItems]         = useState<Item[]>(INITIAL_ITEMS);
  const [count, setCount]         = useState(0);
  const [totalRenders, setTotal]  = useState(0);
  const parentRenders             = useRef(0);
  parentRenders.current++;

  const bumpTotal = useCallback(() => setTotal((n) => n + 1), []);

  // ── Controls ───────────────────────────────────────────────────────────────

  const updateItem = (id: number) =>
    setItems((prev) => prev.map((it) =>
      it.id === id ? { ...it, value: it.value + Math.floor(Math.random() * 100) + 1 } : it
    ));

  const updateAll = () =>
    setItems((prev) => prev.map((it) => ({
      ...it, value: it.value + Math.floor(Math.random() * 100) + 1,
    })));

  const reset = () => {
    setItems(INITIAL_ITEMS);
    setCount(0);
    setTotal(0);
    parentRenders.current = 0;
  };

  // Stable callbacks for optimized panel
  const stableHandlers = useMemo(() =>
    Object.fromEntries(
      INITIAL_ITEMS.map((it) => [it.id, () => updateItem(it.id)])
    ), []); // eslint-disable-line

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Controls */}
      <div style={s.card}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setCount((n) => n + 1)} style={s.btn}>
            Update count ({count}) ← unrelated state
          </button>
          {INITIAL_ITEMS.slice(0, 2).map((it) => (
            <button key={it.id} onClick={() => updateItem(it.id)} style={{ ...s.btn, background: it.color }}>
              Update {it.label}
            </button>
          ))}
          <button onClick={updateAll} style={{ ...s.btn, background: "#374151" }}>Update all</button>
          <button onClick={reset} style={{ ...s.btn, background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb" }}>Reset</button>
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>
            Parent renders: <strong>{parentRenders.current}</strong>
          </div>
        </div>
      </div>

      {/* Three-column comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* A — Unoptimized */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...s.panelHeader, background: "#fef2f2", borderColor: "#fca5a5" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>❌ No optimization</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Every child re-renders every time</div>
          </div>
          <pre style={{ ...s.code, fontSize: 10.5 }}>{`// No memo\nconst Card = ({ item, onClick }) => { ... }\n\n// New function every render:\nonClick={() => updateItem(item.id)}`}</pre>
          {items.map((item) => (
            <UnoptimizedCard
              key={item.id}
              item={item}
              onClick={() => updateItem(item.id)}
              onRender={bumpTotal}
            />
          ))}
        </div>

        {/* B — memo trap */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...s.panelHeader, background: "#fffbeb", borderColor: "#fcd34d" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>⚠️ memo — but no useCallback</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Memo is useless without stable refs</div>
          </div>
          <pre style={{ ...s.code, fontSize: 10.5 }}>{`// Has memo — but callbacks aren't stable\nconst Card = memo(({ item, onClick }) => { ... })\n\n// Still new function every render:\nonClick={() => updateItem(item.id)}`}</pre>
          {items.map((item) => (
            <MemoTrapCard
              key={item.id}
              item={item}
              onClick={() => updateItem(item.id)}
              onRender={bumpTotal}
            />
          ))}
        </div>

        {/* C — Optimized */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ ...s.panelHeader, background: "#f0fdf4", borderColor: "#86efac" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>✅ memo + useCallback</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Only changed item re-renders</div>
          </div>
          <pre style={{ ...s.code, fontSize: 10.5 }}>{`// memo + stable callback reference\nconst Card = memo(({ item, onClick }) => { ... })\n\nconst handlers = useMemo(() =>\n  items.map(it => [it.id, useCallback(\n    () => updateItem(it.id), [it.id]\n  )])\n, [])`}</pre>
          {items.map((item) => (
            <OptimizedCard
              key={item.id}
              item={item}
              onClick={stableHandlers[item.id] as () => void}
              onRender={bumpTotal}
            />
          ))}
        </div>

      </div>

      {/* useMemo example */}
      <ExpensiveComputeDemo />

    </div>
  );
};

// ─── Card implementations ─────────────────────────────────────────────────────

// Shared card UI + render flash logic
const useRenderFlash = (ref: React.RefObject<HTMLDivElement | null>, onRender?: () => void) => {
  const count = useRef(0);
  count.current++;

  useLayoutEffect(() => {
    onRender?.();
    if (count.current === 1) return; // skip first mount
    const el = ref.current;
    if (!el) return;
    el.style.outline = "2.5px solid #f59e0b";
    el.style.transition = "";
    const id = setTimeout(() => {
      if (el) { el.style.transition = "outline 0.4s"; el.style.outline = "2.5px solid transparent"; }
    }, 50);
    return () => clearTimeout(id);
  });

  return count.current;
};

interface CardProps { item: Item; onClick: () => void; onRender?: () => void; }

// A — Plain, no memo
const UnoptimizedCard = ({ item, onClick, onRender }: CardProps) => {
  const ref   = useRef<HTMLDivElement>(null);
  const count = useRenderFlash(ref, onRender);
  return <CardUI ref={ref} item={item} onClick={onClick} renderCount={count} />;
};

// B — memo but unstable onClick reference
const MemoTrapCard = memo(({ item, onClick, onRender }: CardProps) => {
  const ref   = useRef<HTMLDivElement>(null);
  const count = useRenderFlash(ref, onRender);
  return <CardUI ref={ref} item={item} onClick={onClick} renderCount={count} />;
});
MemoTrapCard.displayName = "MemoTrapCard";

// C — memo + stable onClick (useCallback in parent via useMemo)
const OptimizedCard = memo(({ item, onClick, onRender }: CardProps) => {
  const ref   = useRef<HTMLDivElement>(null);
  const count = useRenderFlash(ref, onRender);
  return <CardUI ref={ref} item={item} onClick={onClick} renderCount={count} />;
});
OptimizedCard.displayName = "OptimizedCard";

// Pure presentational card
const CardUI = React.forwardRef<HTMLDivElement, { item: Item; onClick: () => void; renderCount: number }>(
  ({ item, onClick, renderCount }, ref) => (
    <div ref={ref} style={s.itemCard} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: item.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
            {item.value > 100 ? item.value.toLocaleString() : item.value.toFixed(1)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Renders</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: renderCount > 1 ? "#f59e0b" : "#22c55e" }}>{renderCount}</div>
        </div>
      </div>
    </div>
  )
);
CardUI.displayName = "CardUI";

// ─── useMemo demo ─────────────────────────────────────────────────────────────

const ExpensiveComputeDemo = () => {
  const [multiplier, setMultiplier] = useState(1);
  const [unrelated, setUnrelated]   = useState(0);
  const computeCount                = useRef(0);

  // Without useMemo — recomputes on EVERY render (including unrelated state changes)
  const rawResult = (() => {
    computeCount.current++;
    return Array.from({ length: 1000 }, (_, i) => i * multiplier).reduce((a, b) => a + b, 0);
  })();

  // With useMemo — only recomputes when multiplier changes
  const memoCount = useRef(0);
  const memoResult = useMemo(() => {
    memoCount.current++;
    return Array.from({ length: 1000 }, (_, i) => i * multiplier).reduce((a, b) => a + b, 0);
  }, [multiplier]);

  return (
    <div style={s.card}>
      <h3 style={s.cardTitle}>useMemo — memoize expensive computations</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setMultiplier((m) => m + 1)} style={s.btn}>Change multiplier ({multiplier})</button>
        <button onClick={() => setUnrelated((n) => n + 1)} style={{ ...s.btn, background: "#6b7280" }}>
          Change unrelated state ({unrelated})
        </button>
      </div>
      <div style={s.twoCol}>
        <div style={{ ...s.halfCard, borderColor: "#fca5a5" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>❌ Without useMemo</div>
          <pre style={s.code}>{`// Recomputes on EVERY render\nconst result = arr\n  .map(i => i * multiplier)\n  .reduce((a, b) => a + b, 0);`}</pre>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>Result: <strong>{rawResult.toLocaleString()}</strong></span>
            <span style={{ color: "#dc2626" }}>Computed: <strong>{computeCount.current}×</strong></span>
          </div>
        </div>
        <div style={{ ...s.halfCard, borderColor: "#86efac" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 6 }}>✅ With useMemo</div>
          <pre style={s.code}>{`// Only recomputes when multiplier changes\nconst result = useMemo(() =>\n  arr\n    .map(i => i * multiplier)\n    .reduce((a, b) => a + b, 0)\n, [multiplier]);`}</pre>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>Result: <strong>{memoResult.toLocaleString()}</strong></span>
            <span style={{ color: "#166534" }}>Computed: <strong>{memoCount.current}×</strong></span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
        Click <em>Change unrelated state</em> — raw result recomputes every time, memo result stays at the same count.
      </div>
    </div>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const RENDER_TRIGGERS = [
  {
    trigger:  "1. Own state changes",
    color:    "#3b82f6",
    desc:     "The most obvious case — calling setState always triggers a re-render.",
    code:     `const [count, setCount] = useState(0);\n// Clicking this button re-renders THIS component\n<button onClick={() => setCount(n => n + 1)}>`,
  },
  {
    trigger:  "2. Props change",
    color:    "#8b5cf6",
    desc:     "When the parent passes a different value for any prop.",
    code:     `// Parent passes new value → Child re-renders\n<Child name={user.name} />\n// name changed? → Child re-renders`,
  },
  {
    trigger:  "3. Parent re-renders ← the surprise",
    color:    "#ef4444",
    desc:     "Even if props are IDENTICAL, a child re-renders when its parent does. This is the most common source of unnecessary renders.",
    code:     `// Parent updates count (unrelated to Child)\nconst [count, setCount] = useState(0);\n// Child STILL re-renders — even with same props!\n<Child name="Alice" />`,
  },
  {
    trigger:  "4. Context changes",
    color:    "#f59e0b",
    desc:     "Any component consuming a context re-renders when that context's value changes, even if it only uses part of the value.",
    code:     `const { theme, user } = useAppContext();\n// If theme changes, component re-renders\n// EVEN if it only uses user`,
  },
];

const TOOLS = [
  {
    name:  "React.memo(Component)",
    color: "#3b82f6",
    desc:  "HOC that skips re-rendering if all props are shallowly equal. Works like PureComponent for function components.",
    code:  `const Card = React.memo(({ item }) => (\n  <div>{item.name}</div>\n));\n\n// Or with comparison function:\nconst Card = memo(Card, (prev, next) =>\n  prev.item.id === next.item.id\n);`,
    trap:  "Useless if you pass inline functions/objects as props — new reference every render = never equal.",
  },
  {
    name:  "useCallback(fn, deps)",
    color: "#8b5cf6",
    desc:  "Returns a memoized function. Same reference between renders if deps don't change. Pair this with React.memo.",
    code:  `const handleClick = useCallback(\n  (id) => dispatch(select(id)),\n  [dispatch]  // only recreate if dispatch changes\n);\n\n// Now safe to pass to memo'd child:\n<MemoCard onClick={handleClick} />`,
    trap:  "Don't wrap every function — only functions passed to memo'd children or used as effect deps.",
  },
  {
    name:  "useMemo(() => val, deps)",
    color: "#10b981",
    desc:  "Memoizes an expensive computed value. Only recalculates when deps change. For heavy derivations, not trivial ones.",
    code:  `const sorted = useMemo(\n  () => [...items].sort((a, b) =>\n    b.revenue - a.revenue\n  ),\n  [items]  // only re-sort when items changes\n);`,
    trap:  "Has overhead. Don't use for simple operations — only when profiling shows a bottleneck.",
  },
];

const TRAP_BAD = `// Parent
const Parent = () => {
  const [count, setCount] = useState(0);

  // ❌ New function reference every render
  const handleClick = (id) => doSomething(id);

  return <Child onClick={handleClick} />;
};

// Child — memo is USELESS here
const Child = memo(({ onClick }) => (
  <button onClick={onClick}>Click</button>
));
// onClick is always new → memo never skips`;

const TRAP_GOOD = `// Parent
const Parent = () => {
  const [count, setCount] = useState(0);

  // ✅ Stable reference — same function between renders
  const handleClick = useCallback(
    (id) => doSomething(id),
    []  // no deps → created once
  );

  return <Child onClick={handleClick} />;
};

// Now memo actually works
const Child = memo(({ onClick }) => (
  <button onClick={onClick}>Click</button>
));
// onClick reference is stable → memo skips ✓`;

const RULES = [
  { icon: "📏", rule: "Measure first", detail: "Use the render counter pattern or React DevTools Profiler. Don't add memo to every component — it has a small cost and makes code harder to read." },
  { icon: "🔗", rule: "memo + useCallback together", detail: "React.memo without stable function props is almost always useless. If you memo a component, audit every function prop it receives." },
  { icon: "🎯", rule: "useMemo for expensive derivations only", detail: "Sorting a 10,000-item list = good candidate. Concatenating two strings = not worth it. Only add useMemo when profiling confirms the bottleneck." },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:        { fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" },
  header:      { marginBottom: 28 },
  h2:          { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 6px" },
  subtitle:    { color: "#6b7280", margin: "0 0 20px" },
  tabs:        { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" },
  tab:         { padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: "#6b7280", fontFamily: "inherit" },
  tabActive:   { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  card:        { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 },
  cardTitle:   { fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" },
  twoCol:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  halfCard:    { background: "#f8fafc", border: "1.5px solid", borderRadius: 10, padding: 16 },
  triggerBox:  { background: "#f8fafc", borderLeft: "4px solid", borderRadius: 8, padding: 14 },
  code:        { fontSize: 11.5, lineHeight: 1.75, background: "#0f172a", color: "#e2e8f0", padding: "10px 14px", borderRadius: 8, margin: 0, fontFamily: "monospace", overflow: "auto" },
  ic:          { fontSize: 11, background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontFamily: "monospace" },
  panelHeader: { border: "1.5px solid", borderRadius: 8, padding: "10px 14px" },
  itemCard:    { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", cursor: "pointer", outline: "2.5px solid transparent" },
  btn:         { padding: "8px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" as const },
};

export default RenderProfilingDemo;
