// TOPIC: useCallback
//
// useCallback caches a FUNCTION reference so it doesn't get recreated on every render.
//
// Syntax:
//   const fn = useCallback(() => { ... }, [dependencies]);
//
// Why it matters:
//   Every render creates a NEW function instance in memory.
//   If you pass that function as a prop to a memoized child (React.memo),
//   the child sees a "new" prop and re-renders even if nothing changed.
//   useCallback keeps the same function reference between renders.
//
// When to use:
//   ✅ Functions passed as props to memoized children
//   ✅ Functions used as useEffect dependencies
//   ❌ Don't wrap every function — only when re-renders are a real problem

import { useState, useCallback, memo, useEffect } from "react";

// ─── Example 1: Without vs With useCallback ───────────────────────────────────
// Child that only re-renders when its props actually change
const Button = memo(({ label, onClick }: { label: string; onClick: () => void }) => {
  console.log(`Button "${label}" rendered`);
  return <button onClick={onClick}>{label}</button>;
});

const WithoutVsWithExample = () => {
  const [countA, setCountA] = useState(0);
  const [countB, setCountB] = useState(0);

  // NOT memoized — new function every render → Button A always re-renders
  const incrementA = () => setCountA((c) => c + 1);

  // Memoized — same function reference as long as deps don't change → Button B skips render
  const incrementB = useCallback(() => setCountB((c) => c + 1), []);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Without vs With useCallback</h3>
      <p>Count A (no memo): {countA}</p>
      <p>Count B (memoized): {countB}</p>
      {/* Open console to see which button re-renders */}
      <Button label="Increment A (re-renders every time)" onClick={incrementA} />
      {" "}
      <Button label="Increment B (stable reference)" onClick={incrementB} />
    </div>
  );
};

// ─── Example 2: useCallback with dependencies ─────────────────────────────────
const SearchExample = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const data = ["Apple", "Banana", "Avocado", "Blueberry", "Apricot", "Cherry"];

  // Recreated only when `query` changes (it's in the dependency array)
  const search = useCallback(() => {
    const found = data.filter((item) =>
      item.toLowerCase().startsWith(query.toLowerCase())
    );
    setResults(found);
  }, [query]);

  // useEffect uses search as a dependency — stable reference prevents infinite loops
  useEffect(() => {
    search();
  }, [search]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — useCallback as useEffect Dependency</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a letter to search fruits"
      />
      <ul>
        {results.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
};

// ─── Example 3: useCallback in a list of items ────────────────────────────────
const ItemRow = memo(({ item, onRemove }: { item: string; onRemove: (item: string) => void }) => {
  console.log(`ItemRow "${item}" rendered`);
  return (
    <li>
      {item}{" "}
      <button onClick={() => onRemove(item)}>Remove</button>
    </li>
  );
});

const ListExample = () => {
  const [items, setItems] = useState(["React", "TypeScript", "Webpack"]);

  // Stable reference — ItemRow components only re-render when items array changes
  const handleRemove = useCallback((item: string) => {
    setItems((prev) => prev.filter((i) => i !== item));
  }, []);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Stable Callback in a List</h3>
      <ul>
        {items.map((item) => (
          <ItemRow key={item} item={item} onRemove={handleRemove} />
        ))}
      </ul>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseCallbackDemo = () => {
  return (
    <div>
      <h2>useCallback Hook</h2>
      <WithoutVsWithExample />
      <SearchExample />
      <ListExample />
    </div>
  );
};

export default UseCallbackDemo;
