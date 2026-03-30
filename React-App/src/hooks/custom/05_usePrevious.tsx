// CUSTOM HOOK: usePrevious
//
// Remembers the PREVIOUS value of any state or prop.
// Useful for comparing what changed between renders (animations, undo, diffs).
//
// Returns: previousValue (undefined on the first render)

import { useRef, useEffect, useState } from "react";

// ─── The Hook ─────────────────────────────────────────────────────────────────
const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);

  // useEffect runs AFTER render — so ref.current still holds the OLD value
  // during the current render. After effect runs, it stores the new value.
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

// ─── Demo ─────────────────────────────────────────────────────────────────────
const UsePreiousDemo = () => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("Alice");

  const prevCount = usePrevious(count);
  const prevName = usePrevious(name);

  const names = ["Alice", "Bob", "Carol", "Dave", "Eve"];

  return (
    <div>
      <h2>usePrevious — Custom Hook</h2>

      {/* Number example */}
      <div style={{ marginBottom: "16px" }}>
        <h3>Number tracking</h3>
        <p>
          Current: <strong>{count}</strong>
          {" | "}
          Previous: <strong>{prevCount ?? "(none)"}</strong>
          {" | "}
          {prevCount !== undefined && (
            <span style={{ color: count > prevCount ? "green" : "red" }}>
              {count > prevCount ? "▲ Increased" : "▼ Decreased"}
            </span>
          )}
        </p>
        <button onClick={() => setCount((c) => c + 1)}>+1</button>
        <button onClick={() => setCount((c) => c - 1)} style={{ marginLeft: "8px" }}>-1</button>
        <button onClick={() => setCount(0)} style={{ marginLeft: "8px" }}>Reset</button>
      </div>

      {/* String example */}
      <div style={{ marginBottom: "16px" }}>
        <h3>String tracking</h3>
        <p>
          Current: <strong>{name}</strong>
          {" | "}
          Previous: <strong>{prevName ?? "(none)"}</strong>
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {names.map((n) => (
            <button
              key={n}
              onClick={() => setName(n)}
              style={{ fontWeight: name === n ? "bold" : "normal" }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Transition animation hint */}
      <div>
        <h3>Use case: animate direction of change</h3>
        <div
          style={{
            width: "60px",
            height: "60px",
            background: "#4a90e2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "20px",
            transform: `translateX(${count * 4}px)`,
            transition: "transform 0.2s",
          }}
        >
          {count}
        </div>
      </div>
    </div>
  );
};

export { usePrevious };
export default UsePreiousDemo;
