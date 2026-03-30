// TOPIC: useDebugValue
//
// useDebugValue adds a LABEL to a custom hook so it appears in React DevTools.
// It has NO effect on the component's behavior — purely a developer tool.
//
// Syntax:
//   useDebugValue(value);
//   useDebugValue(value, (v) => formatExpensively(v)); // lazy format (only in DevTools)
//
// When to use:
//   ✅ Inside custom hooks — to show meaningful state in DevTools
//   ❌ Not meant for use directly inside components (use it inside custom hooks)
//
// How to see it:
//   Open React DevTools → Components panel → click on a component that uses
//   a hook with useDebugValue → look under "hooks" section

import { useState, useEffect, useDebugValue } from "react";

// ════════════════════════════════════════════════════════════
// Custom Hook 1: useOnlineStatus — shows "Online" or "Offline" in DevTools
// ════════════════════════════════════════════════════════════

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // In DevTools this hook will show: "Online" or "Offline"
  useDebugValue(isOnline ? "Online" : "Offline");

  return isOnline;
};

const OnlineStatusExample = () => {
  const isOnline = useOnlineStatus();

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — useOnlineStatus (check DevTools for label)</h3>
      <p>
        Status:{" "}
        <strong style={{ color: isOnline ? "green" : "red" }}>
          {isOnline ? "Online" : "Offline"}
        </strong>
      </p>
      <p style={{ fontSize: "13px", color: "#888" }}>
        In React DevTools → Components, this hook shows its status as a label.
      </p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Custom Hook 2: useLocalStorage — shows key + value in DevTools
// ════════════════════════════════════════════════════════════

const useLocalStorage = <T,>(key: string, initial: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  // Lazy format — the formatter only runs inside DevTools, not in production
  // Useful when formatting is expensive
  useDebugValue({ key, value }, ({ key, value }) => `${key}: ${JSON.stringify(value)}`);

  return [value, setValue] as const;
};

const LocalStorageExample = () => {
  const [name, setName] = useLocalStorage("debug-name", "");

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — useLocalStorage (check DevTools for key + value label)</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type a name — persisted to localStorage"
      />
      <p>Stored value: <strong>{name || "(empty)"}</strong></p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Custom Hook 3: useCounter — shows count in DevTools
// ════════════════════════════════════════════════════════════

const useCounter = (initial = 0) => {
  const [count, setCount] = useState(initial);

  useDebugValue(`count = ${count}`);

  return {
    count,
    increment: () => setCount((c) => c + 1),
    decrement: () => setCount((c) => c - 1),
    reset: () => setCount(initial),
  };
};

const CounterExample = () => {
  const { count, increment, decrement, reset } = useCounter(0);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — useCounter (check DevTools for count label)</h3>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement} style={{ marginLeft: "8px" }}>-1</button>
      <button onClick={reset} style={{ marginLeft: "8px" }}>Reset</button>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseDebugValueDemo = () => {
  return (
    <div>
      <h2>useDebugValue Hook</h2>
      <p style={{ background: "#fff8e1", padding: "8px", borderRadius: "4px", fontSize: "13px" }}>
        ⚠️ Open React DevTools → Components panel to see the debug labels on each hook.
      </p>
      <OnlineStatusExample />
      <LocalStorageExample />
      <CounterExample />
    </div>
  );
};

export default UseDebugValueDemo;
