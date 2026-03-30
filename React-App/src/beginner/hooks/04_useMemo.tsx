// TOPIC: useMemo
//
// useMemo caches (memoizes) the RESULT of an expensive calculation.
// It only recalculates when its dependencies change.
//
// Syntax:
//   const result = useMemo(() => expensiveCalc(a, b), [a, b]);
//
// When to use:
//   ✅ Expensive computations (sorting, filtering large lists, heavy math)
//   ✅ Stable object/array reference passed as prop to a memoized child
//   ❌ Don't use for simple calculations — the overhead isn't worth it

import { useState, useMemo } from "react";

// ─── Example 1: Expensive calculation ────────────────────────────────────────
// Simulate a slow function
const slowSquare = (n: number): number => {
  let i = 0;
  while (i < 1_000_000) i++; // artificial delay
  return n * n;
};

const ExpensiveCalcExample = () => {
  const [number, setNumber] = useState(5);
  const [darkMode, setDarkMode] = useState(false);

  // Without useMemo: slowSquare runs on EVERY render (even when toggling dark mode)
  // With useMemo: slowSquare only runs when `number` changes
  const squared = useMemo(() => slowSquare(number), [number]);

  return (
    <div
      style={{
        marginBottom: "16px",
        background: darkMode ? "#333" : "#fff",
        color: darkMode ? "#fff" : "#000",
        padding: "10px",
      }}
    >
      <h3>Example 1 — Expensive Calculation</h3>
      <p>
        Number: {number} | Squared (memoized): {squared}
      </p>
      <button onClick={() => setNumber((n) => n + 1)}>Increase Number</button>
      <button onClick={() => setDarkMode((d) => !d)} style={{ marginLeft: "8px" }}>
        Toggle Theme (no recalc)
      </button>
    </div>
  );
};

// ─── Example 2: Filter a large list ──────────────────────────────────────────
const ITEMS = Array.from({ length: 1000 }, (_, i) => `Item ${i + 1}`);

const FilterListExample = () => {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0); // unrelated state to trigger re-renders

  // Filtering only re-runs when `query` changes, not when `count` changes
  const filtered = useMemo(
    () => ITEMS.filter((item) => item.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Filter Large List</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search items…"
      />
      <button onClick={() => setCount((c) => c + 1)} style={{ marginLeft: "8px" }}>
        Re-render ({count}) — filter stays cached
      </button>
      <p>Showing {filtered.length} / {ITEMS.length} items</p>
      <ul style={{ maxHeight: "120px", overflowY: "auto", fontSize: "13px" }}>
        {filtered.slice(0, 20).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
};

// ─── Example 3: Stable object reference for child prop ───────────────────────
import { memo } from "react";

const ChildComponent = memo(({ config }: { config: { color: string } }) => {
  console.log("ChildComponent rendered");
  return <p style={{ color: config.color }}>Child sees color: {config.color}</p>;
});

const StableReferenceExample = () => {
  const [toggle, setToggle] = useState(false);
  const [color, setColor] = useState("blue");

  // Without useMemo: new object on every render → child always re-renders
  // With useMemo: same object reference when color hasn't changed → child skips render
  const config = useMemo(() => ({ color }), [color]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Stable Object Reference</h3>
      <ChildComponent config={config} />
      <button onClick={() => setToggle((t) => !t)}>
        Re-render parent (child won't re-render)
      </button>
      <button
        onClick={() => setColor((c) => (c === "blue" ? "red" : "blue"))}
        style={{ marginLeft: "8px" }}
      >
        Change Color (child will re-render)
      </button>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseMemoDemo = () => {
  return (
    <div>
      <h2>useMemo Hook</h2>
      <ExpensiveCalcExample />
      <FilterListExample />
      <StableReferenceExample />
    </div>
  );
};

export default UseMemoDemo;
