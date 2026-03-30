// CUSTOM HOOK: useDebounce
//
// Delays updating a value until the user has stopped changing it for `delay` ms.
// Classic use case: search-as-you-type — avoid firing an API call on every keystroke.
//
// Returns: debouncedValue (same type as input value)

import { useState, useEffect } from "react";

// ─── The Hook ─────────────────────────────────────────────────────────────────
const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the debounced value after `delay` ms
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timer if value changes before delay expires (restart the clock)
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// ─── Demo ─────────────────────────────────────────────────────────────────────
import { useCallback } from "react";

interface SearchResult {
  id: number;
  title: string;
}

const UseDebounceDemo = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [callCount, setCallCount] = useState(0);

  // This is the debounced value — only updates 500ms after the user stops typing
  const debouncedQuery = useDebounce(query, 500);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setCallCount((c) => c + 1);
    try {
      const res = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_limit=5&q=${encodeURIComponent(q)}`
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // API is only called when debouncedQuery changes (not on every keystroke)
  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return (
    <div>
      <h2>useDebounce — Custom Hook</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search (debounced 500ms)…"
        style={{ width: "280px" }}
      />
      <p style={{ fontSize: "13px", color: "#888" }}>
        Live value: <strong>"{query}"</strong>
        {" | "}Debounced: <strong>"{debouncedQuery}"</strong>
        {" | "}API calls made: <strong>{callCount}</strong>
      </p>
      {loading && <p>Searching…</p>}
      <ul>
        {results.map((r) => <li key={r.id}>{r.title}</li>)}
      </ul>
    </div>
  );
};

export { useDebounce };
export default UseDebounceDemo;
