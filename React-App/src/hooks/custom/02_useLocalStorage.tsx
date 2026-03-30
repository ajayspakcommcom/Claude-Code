// CUSTOM HOOK: useLocalStorage
//
// Works exactly like useState but syncs the value with localStorage.
// Survives page refreshes. Listens to storage events so multiple tabs stay in sync.
//
// Returns: [value, setValue, removeValue]

import { useState, useEffect, useCallback } from "react";

// ─── The Hook ─────────────────────────────────────────────────────────────────
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Keep localStorage in sync whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`useLocalStorage: failed to write key "${key}"`);
    }
  }, [key, value]);

  // Sync across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);

  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setValue, removeValue] as const;
};

// ─── Demo ─────────────────────────────────────────────────────────────────────
const UseLocalStorageDemo = () => {
  const [name, setName, removeName] = useLocalStorage("ls-name", "");
  const [count, setCount] = useLocalStorage("ls-count", 0);
  const [darkMode, setDarkMode] = useLocalStorage("ls-dark", false);

  return (
    <div>
      <h2>useLocalStorage — Custom Hook</h2>
      <p style={{ fontSize: "13px", color: "#888" }}>
        Refresh the page — all values persist in localStorage.
      </p>

      <div style={{ marginBottom: "12px" }}>
        <strong>String value (key: "ls-name")</strong>
        <br />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
        />
        <button onClick={removeName} style={{ marginLeft: "8px" }}>Remove</button>
        <p>Stored: {name || "(empty)"}</p>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <strong>Number value (key: "ls-count")</strong>
        <br />
        <button onClick={() => setCount((c) => c + 1)}>+1</button>
        <button onClick={() => setCount(0)} style={{ marginLeft: "8px" }}>Reset</button>
        <p>Count: {count}</p>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <strong>Boolean value (key: "ls-dark")</strong>
        <br />
        <button onClick={() => setDarkMode((d) => !d)}>
          Toggle Dark Mode: {darkMode ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
};

export { useLocalStorage };
export default UseLocalStorageDemo;
