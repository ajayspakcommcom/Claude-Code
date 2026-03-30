// CUSTOM HOOK: useFetch
//
// Reusable data fetching hook with loading, error, and data state.
// Automatically fetches when the URL changes and cleans up on unmount.
//
// Returns: { data, loading, error, refetch }

import { useState, useEffect, useCallback } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ─── The Hook ─────────────────────────────────────────────────────────────────
const useFetch = <T,>(url: string) => {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    const controller = new AbortController(); // cancel request on unmount

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json: T = await res.json();
      setState({ data: json, loading: false, error: null });
    } catch (err: any) {
      if (err.name === "AbortError") return; // ignore cleanup cancellations
      setState({ data: null, loading: false, error: err.message });
    }

    return () => controller.abort(); // cleanup
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

// ─── Demo ─────────────────────────────────────────────────────────────────────
interface Post {
  id: number;
  title: string;
  body: string;
}

const UseFetchDemo = () => {
  const { data, loading, error, refetch } = useFetch<Post[]>(
    "https://jsonplaceholder.typicode.com/posts?_limit=5"
  );

  return (
    <div>
      <h2>useFetch — Custom Hook</h2>
      <button onClick={refetch} disabled={loading}>
        {loading ? "Loading…" : "Refetch"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {data && (
        <ul>
          {data.map((post) => (
            <li key={post.id}>
              <strong>{post.title}</strong>
              <p style={{ fontSize: "13px", color: "#555" }}>{post.body.slice(0, 80)}…</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export { useFetch };
export default UseFetchDemo;
