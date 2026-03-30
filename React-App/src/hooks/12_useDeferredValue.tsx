// TOPIC: useDeferredValue
//
// useDeferredValue defers updating a value until the browser is idle.
// It is similar to useTransition, but works on a VALUE instead of wrapping a setter.
//
// Syntax:
//   const deferred = useDeferredValue(value);
//
// • `value`    — the up-to-date (urgent) value
// • `deferred` — lags behind during heavy renders, catches up when idle
//
// useDeferredValue vs useTransition:
//   useTransition  → you control the setter (wrap it in startTransition)
//   useDeferredValue → you receive a value from outside (prop, context, parent state)
//                      and want to defer the heavy part that uses it
//
// When to use:
//   ✅ Deferring re-render of a slow child component that depends on a fast-changing value
//   ✅ When you don't control the state setter (e.g., the value comes from a prop)

import { useState, useDeferredValue, memo } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Search input — list defers, input stays instant
// ════════════════════════════════════════════════════════════

const ALL_WORDS = Array.from({ length: 5_000 }, (_, i) => `word-${i + 1}`);

// Slow list — only re-renders when deferredQuery changes
const SearchResults = memo(({ query }: { query: string }) => {
  const results = ALL_WORDS.filter((w) => w.includes(query));

  // Artificial slowdown to simulate heavy render
  let i = 0;
  while (i < 5_000_000) i++;

  return (
    <ul style={{ maxHeight: "120px", overflowY: "auto", fontSize: "13px" }}>
      {results.slice(0, 30).map((w) => <li key={w}>{w}</li>)}
      {results.length > 30 && <li style={{ color: "#888" }}>…{results.length - 30} more</li>}
    </ul>
  );
});

const SearchExample = () => {
  const [query, setQuery] = useState("");

  // deferredQuery lags behind `query` during heavy renders
  // The input updates instantly; the list catches up when idle
  const deferredQuery = useDeferredValue(query);

  // If deferred hasn't caught up yet, we know it's "stale"
  const isStale = query !== deferredQuery;

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Search with Deferred List</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search 5,000 words…"
      />
      <div style={{ opacity: isStale ? 0.5 : 1, transition: "opacity 0.2s" }}>
        {isStale && <span style={{ fontSize: "12px", color: "#888" }}>Updating…  </span>}
        <SearchResults query={deferredQuery} />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Deferred prop from parent
// ════════════════════════════════════════════════════════════

// Imagine this child receives a prop it can't control
const HeavyChart = memo(({ value }: { value: number }) => {
  // Simulate expensive chart render
  let i = 0;
  while (i < 20_000_000) i++;
  return (
    <div
      style={{
        width: `${value * 3}px`,
        height: "30px",
        background: "#4a90e2",
        borderRadius: "4px",
        transition: "width 0.3s",
      }}
    />
  );
});

const ChartExample = () => {
  const [value, setValue] = useState(50);
  const deferredValue = useDeferredValue(value);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Deferred Prop (slider updates instantly, bar defers)</h3>
      <input
        type="range"
        min={1}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <p>Slider value: {value} | Deferred value: {deferredValue}</p>
      <HeavyChart value={deferredValue} />
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseDeferredValueDemo = () => {
  return (
    <div>
      <h2>useDeferredValue Hook</h2>
      <SearchExample />
      <ChartExample />
    </div>
  );
};

export default UseDeferredValueDemo;
