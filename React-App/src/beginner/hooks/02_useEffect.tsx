// TOPIC: useEffect
//
// useEffect lets you perform SIDE EFFECTS in a functional component.
// Side effects = anything outside of rendering: API calls, timers, subscriptions, DOM changes.
//
// Syntax:
//   useEffect(() => {
//     // side effect code
//     return () => { /* cleanup (optional) */ };
//   }, [dependencies]);
//
// Dependency array controls WHEN the effect runs:
//   • No array         → runs after EVERY render
//   • []               → runs ONCE after the first render (mount)
//   • [a, b]           → runs when `a` or `b` changes
//
// Cleanup function runs before the next effect OR when the component unmounts.

import { useState, useEffect } from "react";

// ─── Example 1: Runs once on mount (empty dep array) ─────────────────────────
const MountOnlyExample = () => {
  const [message, setMessage] = useState("Waiting...");

  useEffect(() => {
    // Simulates something that should run once when the component loads
    setMessage("Component mounted! Effect ran once.");

    // Cleanup: runs when component unmounts
    return () => {
      console.log("MountOnlyExample unmounted");
    };
  }, []); // <- empty array = run once

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Run Once on Mount</h3>
      <p>{message}</p>
    </div>
  );
};

// ─── Example 2: Runs when a dependency changes ────────────────────────────────
const DependencyExample = () => {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    // Runs every time `count` changes
    setLog((prev) => [...prev, `Effect fired — count is now ${count}`]);
  }, [count]); // <- effect depends on count

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Runs When Dependency Changes</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <ul style={{ fontSize: "13px", color: "#555" }}>
        {log.map((entry, i) => <li key={i}>{entry}</li>)}
      </ul>
    </div>
  );
};

// ─── Example 3: Simulated API fetch (async inside useEffect) ─────────────────
interface Post {
  id: number;
  title: string;
}

const FetchExample = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // You cannot make useEffect itself async — define an inner async function
    const fetchPosts = async () => {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
        if (!res.ok) throw new Error("Network error");
        const data: Post[] = await res.json();
        setPosts(data);
      } catch (err) {
        setError("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []); // runs once on mount

  if (loading) return <p>Loading posts…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Simulated API Fetch</h3>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
};

// ─── Example 4: Timer with cleanup ───────────────────────────────────────────
const TimerExample = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return; // do nothing if not running

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // CLEANUP: clear the interval when `running` becomes false or component unmounts
    // Without cleanup, multiple intervals would stack up every time running changes
    return () => clearInterval(interval);
  }, [running]); // effect re-runs when `running` changes

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 4 — Timer with Cleanup</h3>
      <p>Seconds: {seconds}</p>
      <button onClick={() => setRunning(true)} disabled={running}>Start</button>
      <button onClick={() => setRunning(false)} disabled={!running} style={{ marginLeft: "8px" }}>Stop</button>
      <button onClick={() => { setRunning(false); setSeconds(0); }} style={{ marginLeft: "8px" }}>Reset</button>
    </div>
  );
};

// ─── Example 5: Update document title (DOM side effect) ──────────────────────
const DocumentTitleExample = () => {
  const [name, setName] = useState("");

  useEffect(() => {
    // Side effect: change the browser tab title
    document.title = name ? `Hello, ${name}!` : "React Hooks Demo";

    // Cleanup: reset title when component unmounts
    return () => {
      document.title = "React Hooks Demo";
    };
  }, [name]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 5 — DOM Side Effect (document title)</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type your name — watch the tab title"
      />
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseEffectDemo = () => {
  return (
    <div>
      <h2>useEffect Hook</h2>
      <MountOnlyExample />
      <DependencyExample />
      <FetchExample />
      <TimerExample />
      <DocumentTitleExample />
    </div>
  );
};

export default UseEffectDemo;
