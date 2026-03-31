// TOPIC: Performance — Memoization (useMemo, useCallback, React.memo)
//
// We saw these individually in Beginner hooks.
// Here we use them TOGETHER in realistic scenarios and show:
//   - WHEN to memoize (expensive compute, stable references)
//   - WHEN NOT to memoize (simple values, always-changing deps)
//   - How to VERIFY the optimization is working (render counters)
//   - Common mistakes that break memoization
//
// THREE TOOLS:
//   React.memo(Component)  → skip re-render if props didn't change (shallow equal)
//   useMemo(fn, deps)      → cache a computed value
//   useCallback(fn, deps)  → cache a function reference

import React, { useState, useMemo, useCallback, memo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// RENDER COUNTER — helper to visualise re-renders
// ─────────────────────────────────────────────────────────────────────────────

function useRenderCount(label: string) {
  const count = React.useRef(0);
  count.current++;
  return count.current;
}

function RenderBadge({ count }: { count: number }) {
  return (
    <span style={{
      fontSize: "10px", padding: "1px 6px", borderRadius: "10px", marginLeft: "8px",
      background: count === 1 ? "#27ae60" : count <= 3 ? "#e67e22" : "#e74c3c",
      color: "#fff",
    }}>
      renders: {count}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. React.memo — skip child re-render when parent re-renders
// ─────────────────────────────────────────────────────────────────────────────

// WITHOUT memo — re-renders every time parent renders, even if props are same
function UnmemoizedChild({ name }: { name: string }) {
  const renders = useRenderCount("UnmemoizedChild");
  return (
    <div style={childBox("#fff5f5")}>
      <strong>UnmemoizedChild</strong> (no memo) <RenderBadge count={renders} />
      <p style={note}>name: {name}</p>
    </div>
  );
}

// WITH memo — only re-renders when `name` prop actually changes
const MemoizedChild = memo(function MemoizedChild({ name }: { name: string }) {
  const renders = useRenderCount("MemoizedChild");
  return (
    <div style={childBox("#f0fff4")}>
      <strong>MemoizedChild</strong> (React.memo) <RenderBadge count={renders} />
      <p style={note}>name: {name}</p>
    </div>
  );
});

// memo with custom comparison — only re-render when id changes (ignore name)
const CustomMemoChild = memo(
  function CustomMemoChild({ id, name }: { id: number; name: string }) {
    const renders = useRenderCount("CustomMemoChild");
    return (
      <div style={childBox("#f0f8ff")}>
        <strong>CustomMemoChild</strong> (custom areEqual) <RenderBadge count={renders} />
        <p style={note}>id: {id}, name: {name} (only re-renders when id changes)</p>
      </div>
    );
  },
  (prev, next) => prev.id === next.id   // return true = skip re-render
);

function ReactMemoSection() {
  const [count, setCount] = useState(0);
  const [name, setName]   = useState("Alice");
  const [id, setId]       = useState(1);
  const renders           = useRenderCount("Parent");

  return (
    <Section title="1. React.memo — skip re-render when props unchanged" bg="#fafafa">
      <div style={{ marginBottom: "12px" }}>
        <strong>Parent</strong> <RenderBadge count={renders} />
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
          <button onClick={() => setCount(c => c + 1)} style={btn("#4a90e2")}>
            Re-render parent (count: {count})
          </button>
          <button onClick={() => setName(n => n === "Alice" ? "Bob" : "Alice")} style={btn("#e67e22")}>
            Change name prop → {name === "Alice" ? "Bob" : "Alice"}
          </button>
          <button onClick={() => setId(i => i + 1)} style={btn("#9b59b6")}>
            Change id prop → {id + 1}
          </button>
        </div>
      </div>

      <UnmemoizedChild name={name} />
      <MemoizedChild name={name} />
      <CustomMemoChild id={id} name={name} />

      <Note>
        Click "Re-render parent" → <strong>UnmemoizedChild</strong> always re-renders,
        <strong> MemoizedChild</strong> only when name changes,
        <strong> CustomMemoChild</strong> only when id changes.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. useMemo — cache expensive computed values
// ─────────────────────────────────────────────────────────────────────────────

// Simulate an expensive filter/sort operation
function expensiveFilter(items: number[], query: string, multiplier: number): number[] {
  // Artificial delay to simulate heavy work
  const start = performance.now();
  while (performance.now() - start < 5) {} // 5ms busy-wait

  return items
    .filter(n => String(n * multiplier).includes(query))
    .sort((a, b) => a - b);
}

const BIG_LIST = Array.from({ length: 500 }, (_, i) => i + 1);

function UseMemoSection() {
  const [query,      setQuery]      = useState("");
  const [multiplier, setMultiplier] = useState(1);
  const [unrelated,  setUnrelated]  = useState(0);

  // WITHOUT useMemo — runs expensiveFilter on EVERY render (including unrelated state changes)
  const resultWithout = expensiveFilter(BIG_LIST, query, multiplier);

  // WITH useMemo — only re-runs when query or multiplier changes
  const resultWith = useMemo(
    () => expensiveFilter(BIG_LIST, query, multiplier),
    [query, multiplier]   // ← deps: only recompute when these change
  );

  const renders = useRenderCount("UseMemoSection");

  return (
    <Section title="2. useMemo — cache expensive computations" bg="#fafafa">
      <RenderBadge count={renders} />
      <div style={{ display: "flex", gap: "8px", marginTop: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter numbers…"
          style={inputStyle}
        />
        <button onClick={() => setMultiplier(m => m + 1)} style={btn("#4a90e2")}>
          Multiplier: {multiplier}
        </button>
        <button onClick={() => setUnrelated(u => u + 1)} style={btn("#888")}>
          Unrelated state ({unrelated}) — triggers re-render
        </button>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={resultBox("#fff5f5")}>
          <strong style={{ fontSize: "12px", color: "#e74c3c" }}>Without useMemo</strong>
          <p style={note}>Recomputes on EVERY render (even unrelated state)</p>
          <p style={note}>{resultWithout.length} results</p>
        </div>
        <div style={resultBox("#f0fff4")}>
          <strong style={{ fontSize: "12px", color: "#27ae60" }}>With useMemo</strong>
          <p style={note}>Only recomputes when query or multiplier changes</p>
          <p style={note}>{resultWith.length} results: [{resultWith.slice(0,5).join(", ")}{resultWith.length > 5 ? "…" : ""}]</p>
        </div>
      </div>

      <Note>
        Click "Unrelated state" → both show the same result but useMemo skips the expensive computation.
        <br />
        <strong>When NOT to use useMemo:</strong> simple values, cheap operations — the memo overhead costs more than it saves.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. useCallback — stable function references for memo'd children
// ─────────────────────────────────────────────────────────────────────────────
//
// KEY INSIGHT: React.memo only works if ALL props are stable.
// If you pass a function as a prop, a new function is created every render → memo is broken.
// useCallback fixes this by returning the same function reference across renders.

const ItemList = memo(function ItemList({
  items,
  onDelete,
  onToggle,
}: {
  items:    { id: number; text: string; done: boolean }[];
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  const renders = useRenderCount("ItemList");
  return (
    <div style={childBox("#f0fff4")}>
      <strong>ItemList</strong> (React.memo) <RenderBadge count={renders} />
      <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ display: "flex", gap: "8px", padding: "4px 0", fontSize: "13px" }}>
            <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} />
            <span style={{ textDecoration: item.done ? "line-through" : "none", flex: 1, color: item.done ? "#aaa" : "#333" }}>
              {item.text}
            </span>
            <button onClick={() => onDelete(item.id)} style={{ border: "none", background: "none", color: "#e74c3c", cursor: "pointer" }}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
});

function UseCallbackSection() {
  const [items, setItems]     = useState([
    { id: 1, text: "Buy groceries", done: false },
    { id: 2, text: "Write tests",   done: false },
    { id: 3, text: "Review PR",     done: true  },
  ]);
  const [unrelated, setUnrelated] = useState(0);
  const [useStable,  setUseStable]  = useState(true);

  // UNSTABLE — new function every render → breaks React.memo on ItemList
  const onDeleteUnstable = (id: number) => setItems(prev => prev.filter(i => i.id !== id));
  const onToggleUnstable = (id: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));

  // STABLE — same reference across renders → React.memo works correctly
  const onDeleteStable = useCallback(
    (id: number) => setItems(prev => prev.filter(i => i.id !== id)),
    []   // no deps — setItems is stable (from useState)
  );
  const onToggleStable = useCallback(
    (id: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i)),
    []
  );

  const renders = useRenderCount("UseCallbackParent");

  return (
    <Section title="3. useCallback — stable function refs for memo'd children" bg="#fafafa">
      <strong>Parent</strong> <RenderBadge count={renders} />
      <div style={{ display: "flex", gap: "8px", marginTop: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <button onClick={() => setUnrelated(u => u + 1)} style={btn("#888")}>
          Unrelated state ({unrelated}) — re-renders parent
        </button>
        <button
          onClick={() => setUseStable(s => !s)}
          style={btn(useStable ? "#27ae60" : "#e74c3c")}
        >
          {useStable ? "Using useCallback (stable)" : "NOT using useCallback (unstable)"}
        </button>
      </div>

      <ItemList
        items={items}
        onDelete={useStable ? onDeleteStable : onDeleteUnstable}
        onToggle={useStable ? onToggleStable : onToggleUnstable}
      />

      <Note>
        Toggle "Unrelated state" repeatedly.
        <br />
        <strong>With useCallback:</strong> ItemList stays at same render count — stable function refs.
        <br />
        <strong>Without useCallback:</strong> ItemList re-renders every time parent does — new functions every render break memo.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Common mistakes that BREAK memoization
// ─────────────────────────────────────────────────────────────────────────────

const StableChild = memo(function StableChild({ config }: { config: { label: string; value: number } }) {
  const renders = useRenderCount("StableChild");
  return (
    <div style={childBox("#f0f8ff")}>
      <strong>Memoized child</strong> <RenderBadge count={renders} />
      <p style={note}>label: {config.label}, value: {config.value}</p>
    </div>
  );
});

function CommonMistakesSection() {
  const [count, setCount] = useState(0);
  const [fix,   setFix]   = useState(false);

  // ❌ MISTAKE: object/array literal created inline → new reference every render → memo broken
  const configBroken = { label: "demo", value: 42 };

  // ✅ FIX: useMemo stabilises the object reference
  const configFixed  = useMemo(() => ({ label: "demo", value: 42 }), []);

  return (
    <Section title="4. Common mistake — inline objects/arrays break React.memo" bg="#fafafa">
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <button onClick={() => setCount(c => c + 1)} style={btn("#4a90e2")}>
          Re-render parent (count: {count})
        </button>
        <button onClick={() => setFix(f => !f)} style={btn(fix ? "#27ae60" : "#e74c3c")}>
          {fix ? "✅ Using useMemo (fixed)" : "❌ Inline object (broken)"}
        </button>
      </div>

      <StableChild config={fix ? configFixed : configBroken} />

      <div style={{ marginTop: "10px", padding: "10px", background: "#fff8dc", borderRadius: "6px", fontSize: "12px" }}>
        <strong>Common memo-breaking mistakes:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "16px", lineHeight: "1.8" }}>
          <li>❌ <code>{'<Child config={{ label: "x" }} />'}</code> — new object every render</li>
          <li>❌ <code>{'<Child items={[1,2,3]} />'}</code> — new array every render</li>
          <li>❌ <code>{'<Child onAction={() => doSomething()} />'}</code> — new function every render</li>
          <li>✅ <code>const config = useMemo(() =&gt; ({"{ label: 'x' }"}), [])</code></li>
          <li>✅ <code>const onAction = useCallback(() =&gt; doSomething(), [])</code></li>
        </ul>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function MemoOptimizationDemo() {
  return (
    <div>
      <h2>Performance — Memoization</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
        <code>React.memo</code> skips component re-renders.
        <code> useMemo</code> caches computed values.
        <code> useCallback</code> stabilises function references.
        Watch the render counters to see the difference.
      </p>

      <ReactMemoSection />
      <UseMemoSection />
      <UseCallbackSection />
      <CommonMistakesSection />

      <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
        <strong>When to memoize — decision guide:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.9" }}>
          <li><strong>React.memo</strong> — component receives same props often AND is expensive to render</li>
          <li><strong>useMemo</strong> — computation is expensive (filter/sort large lists, heavy math)</li>
          <li><strong>useCallback</strong> — function is passed as prop to a memo'd child</li>
          <li><strong>Don't memo</strong> — simple components, cheap computations, deps change every render anyway</li>
          <li><strong>Rule:</strong> profile first (<code>React DevTools Profiler</code>), then optimise — don't guess</li>
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

function childBox(bg: string): React.CSSProperties {
  return { padding: "10px 12px", background: bg, borderRadius: "6px", marginBottom: "8px", border: "1px solid #eee" };
}

function resultBox(bg: string): React.CSSProperties {
  return { flex: 1, padding: "10px", background: bg, borderRadius: "6px", minWidth: "180px" };
}

const inputStyle: React.CSSProperties = { padding: "5px 10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px" };
const note: React.CSSProperties = { margin: "4px 0 0", fontSize: "12px", color: "#555" };
