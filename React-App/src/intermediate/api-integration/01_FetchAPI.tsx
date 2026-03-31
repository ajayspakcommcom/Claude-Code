// TOPIC: API Integration — Fetch API (built-in browser API)
//
// The Fetch API is the native browser way to make HTTP requests.
// No library needed — but requires manual error handling and JSON parsing.
//
// KEY CONCEPTS COVERED:
//   Basic GET                → fetch(url), response.json()
//   POST / PUT / PATCH / DELETE → method + headers + JSON.stringify(body)
//   Response status checking → response.ok, response.status
//   AbortController         → cancel in-flight requests (cleanup in useEffect)
//   Request headers          → Authorization, Content-Type, custom headers
//   Query params             → URLSearchParams
//   Timeout                  → AbortController + setTimeout
//   Parallel requests        → Promise.all
//   Sequential (chained)     → await in sequence
//   useEffect cleanup        → abort on unmount / dependency change
//   Loading / error / data states → standard async state pattern

import React, { useState, useEffect, useRef, useCallback } from "react";

const BASE = "https://jsonplaceholder.typicode.com";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px", background: "#fafafa", borderRadius: "8px", border: "1px solid #eee", marginBottom: "16px" }}>
      <h4 style={{ margin: "0 0 12px", fontSize: "14px" }}>{title}</h4>
      {children}
    </div>
  );
}

function StatusBadge({ loading, error, count }: { loading: boolean; error: string | null; count?: number }) {
  if (loading) return <span style={badge("#4a90e2")}>Loading…</span>;
  if (error)   return <span style={badge("#e74c3c")}>{error}</span>;
  if (count !== undefined) return <span style={badge("#27ae60")}>{count} results</span>;
  return null;
}

function JsonPreview({ data }: { data: unknown }) {
  return (
    <pre style={{ fontSize: "11px", background: "#f5f5f5", padding: "8px", borderRadius: "4px", overflow: "auto", maxHeight: "160px", margin: "8px 0 0" }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic GET — fetch on mount, abort on unmount
// ─────────────────────────────────────────────────────────────────────────────

function BasicGetSection() {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    // AbortController lets us cancel the request when the component unmounts
    const controller = new AbortController();

    async function fetchPosts() {
      setLoading(true);
      setError(null);
      try {
        // fetch() returns a Response object — NOT the data yet
        const res = await fetch(`${BASE}/posts?_limit=3`, {
          signal: controller.signal,  // ← link to controller
        });

        // fetch does NOT throw on 4xx/5xx — you must check response.ok
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        // Parse body as JSON — this is also async
        const data: Post[] = await res.json();
        setPosts(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // ignore cleanup aborts
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();

    // Cleanup: abort the request if component unmounts before fetch completes
    return () => controller.abort();
  }, []); // ← empty deps: run once on mount

  return (
    <Card title="1. Basic GET — fetch on mount, abort on unmount">
      <StatusBadge loading={loading} error={error} count={posts.length} />
      {posts.map(p => (
        <div key={p.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee", fontSize: "13px" }}>
          <strong>#{p.id}</strong> {p.title}
        </div>
      ))}
      <Note>
        <code>fetch(url, {"{ signal }"}</code>) — <code>signal: controller.signal</code> links the request to the
        controller. <code>controller.abort()</code> in the cleanup cancels it.
        Without abort → state update on unmounted component (memory leak + warning).
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET with query params — URLSearchParams
// ─────────────────────────────────────────────────────────────────────────────

function QueryParamsSection() {
  const [userId, setUserId] = useState(1);
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const fetchByUser = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    try {
      // URLSearchParams builds ?userId=1&_limit=3 safely (handles encoding)
      const params = new URLSearchParams({ userId: String(userId), _limit: "3" });
      const res = await fetch(`${BASE}/posts?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPosts(await res.json());
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [userId]);

  useEffect(() => { fetchByUser(); }, [fetchByUser]);

  return (
    <Card title="2. GET with query params — URLSearchParams">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
        <label style={{ fontSize: "13px" }}>User ID:</label>
        {[1, 2, 3].map(id => (
          <button key={id} onClick={() => setUserId(id)} style={btn(userId === id ? "#4a90e2" : "#aaa")}>
            {id}
          </button>
        ))}
        <StatusBadge loading={loading} error={error} count={posts.length} />
      </div>
      {posts.slice(0, 2).map(p => (
        <div key={p.id} style={{ padding: "4px 0", fontSize: "12px", borderBottom: "1px solid #eee" }}>
          <strong>#{p.id}</strong> {p.title.slice(0, 60)}…
        </div>
      ))}
      <Note>
        <code>new URLSearchParams({"{ userId: '1', _limit: '3' }"})</code> → <code>?userId=1&_limit=3</code>.
        Always use URLSearchParams instead of string concatenation — it handles encoding (spaces → %20, etc.).
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST — create a resource
// ─────────────────────────────────────────────────────────────────────────────

function PostSection() {
  const [title, setTitle]     = useState("");
  const [result, setResult]   = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",  // ← tell server you're sending JSON
          // "Authorization": "Bearer <token>",  // ← where auth tokens go
        },
        body: JSON.stringify({ title, body: "demo body", userId: 1 }),  // ← must be a string
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json()); // JSONPlaceholder returns the created object with id: 101
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="3. POST — create a resource">
      <form onSubmit={createPost} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title"
          required
          style={{ flex: 1, padding: "5px 8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px" }}
        />
        <button type="submit" disabled={loading} style={btn("#27ae60")}>
          {loading ? "Posting…" : "POST"}
        </button>
      </form>
      {error && <span style={badge("#e74c3c")}>{error}</span>}
      {result && (
        <>
          <span style={badge("#27ae60")}>Created! id: {result.id}</span>
          <JsonPreview data={result} />
        </>
      )}
      <Note>
        POST requires: <code>method: "POST"</code>, <code>headers: {"{ 'Content-Type': 'application/json' }"}</code>,
        <code>body: JSON.stringify(data)</code>. Without Content-Type the server may reject or misparse the body.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PUT / PATCH / DELETE
// ─────────────────────────────────────────────────────────────────────────────

function MutationSection() {
  const [postId, setPostId]   = useState(1);
  const [result, setResult]   = useState<Record<string, unknown> | null>(null);
  const [method, setMethod]   = useState<"PUT" | "PATCH" | "DELETE">("PUT");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function runRequest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const options: RequestInit = { method };

      if (method !== "DELETE") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(
          method === "PUT"
            ? { id: postId, title: "Full replace (PUT)", body: "All fields replaced", userId: 1 }
            : { title: "Partial update (PATCH)" }  // PATCH only sends changed fields
        );
      }

      const res = await fetch(`${BASE}/posts/${postId}`, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Record<string, unknown> = method === "DELETE" ? { deleted: true, id: postId } : await res.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="4. PUT / PATCH / DELETE — update and delete">
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center" }}>
        {(["PUT", "PATCH", "DELETE"] as const).map(m => (
          <button key={m} onClick={() => setMethod(m)} style={btn(method === m ? "#e67e22" : "#aaa")}>{m}</button>
        ))}
        <span style={{ fontSize: "13px" }}>Post ID:</span>
        {[1, 2, 3].map(id => (
          <button key={id} onClick={() => setPostId(id)} style={btn(postId === id ? "#4a90e2" : "#aaa")}>{id}</button>
        ))}
        <button onClick={runRequest} disabled={loading} style={btn("#27ae60")}>
          {loading ? "…" : "Run"}
        </button>
      </div>
      {error && <span style={badge("#e74c3c")}>{error}</span>}
      {result && <JsonPreview data={result} />}
      <Note>
        <strong>PUT</strong> replaces the entire resource — include ALL fields.{" "}
        <strong>PATCH</strong> merges — send only changed fields.{" "}
        <strong>DELETE</strong> — no body needed, check <code>204 No Content</code> (body is empty).
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Request timeout — AbortController + setTimeout
// ─────────────────────────────────────────────────────────────────────────────

function TimeoutSection() {
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [result, setResult]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  async function fetchWithTimeout() {
    setLoading(true);
    setResult(null);
    const controller = new AbortController();
    // Set a timer that aborts the request after timeoutMs
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${BASE}/posts/1`, { signal: controller.signal });
      clearTimeout(timerId); // ← clear timer if request completed in time
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setResult(`✓ Completed in time (timeout was ${timeoutMs}ms)`);
    } catch (err) {
      const isTimeout = (err as Error).name === "AbortError";
      setResult(isTimeout ? `✗ Timed out after ${timeoutMs}ms` : `✗ ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="5. Timeout — AbortController + setTimeout">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px" }}>Timeout:</span>
        {[100, 1000, 5000].map(ms => (
          <button key={ms} onClick={() => setTimeoutMs(ms)} style={btn(timeoutMs === ms ? "#9b59b6" : "#aaa")}>
            {ms}ms
          </button>
        ))}
        <button onClick={fetchWithTimeout} disabled={loading} style={btn("#4a90e2")}>
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </div>
      {result && (
        <div style={{ padding: "8px", background: result.startsWith("✓") ? "#f0fff4" : "#fff5f5", borderRadius: "4px", fontSize: "13px" }}>
          {result}
        </div>
      )}
      <Note>
        Fetch has no built-in timeout. Pattern: <code>setTimeout(() =&gt; controller.abort(), ms)</code>.
        Set timeout to 100ms to see it fail; 5000ms to succeed (JSONPlaceholder responds in ~200ms).
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Parallel requests — Promise.all
// ─────────────────────────────────────────────────────────────────────────────

function ParallelSection() {
  const [data, setData]       = useState<{ post: Post; comments: Comment[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function fetchParallel() {
    setLoading(true);
    setError(null);
    try {
      // Both requests fire at the same time — total time = slowest request, not sum
      const [postRes, commentsRes] = await Promise.all([
        fetch(`${BASE}/posts/1`),
        fetch(`${BASE}/posts/1/comments`),
      ]);

      if (!postRes.ok || !commentsRes.ok) throw new Error("One or more requests failed");

      const [post, comments]: [Post, Comment[]] = await Promise.all([
        postRes.json(),
        commentsRes.json(),
      ]);

      setData({ post, comments: comments.slice(0, 2) });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="6. Parallel requests — Promise.all">
      <button onClick={fetchParallel} disabled={loading} style={{ ...btn("#4a90e2"), marginBottom: "10px" }}>
        {loading ? "Fetching…" : "Fetch Post + Comments in parallel"}
      </button>
      <StatusBadge loading={loading} error={error} />
      {data && (
        <>
          <div style={{ fontSize: "13px", padding: "6px", background: "#f0fff4", borderRadius: "4px", marginBottom: "6px" }}>
            <strong>Post:</strong> {data.post.title}
          </div>
          {data.comments.map(c => (
            <div key={c.id} style={{ fontSize: "12px", padding: "4px 6px", borderLeft: "3px solid #4a90e2", marginBottom: "4px", color: "#555" }}>
              <strong>{c.name}</strong>: {c.body.slice(0, 80)}…
            </div>
          ))}
        </>
      )}
      <Note>
        <code>Promise.all([f1, f2])</code> fires both at once. Sequential <code>await f1; await f2</code> waits for each.
        Use parallel when requests are independent — faster by the latency of the slower one.
        <br /><strong>Note:</strong> <code>Promise.all</code> fails fast — if one rejects, all are rejected.
        Use <code>Promise.allSettled</code> if you want results regardless of individual failures.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Sequential (chained) requests — dependent data
// ─────────────────────────────────────────────────────────────────────────────

function SequentialSection() {
  const [chain, setChain]     = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function fetchChained() {
    setLoading(true);
    setError(null);
    setChain([]);
    try {
      // Step 1: get a post
      const postRes = await fetch(`${BASE}/posts/1`);
      if (!postRes.ok) throw new Error("Failed to fetch post");
      const post: Post = await postRes.json();
      setChain(prev => [...prev, `✓ Post fetched — userId: ${post.userId}`]);

      // Step 2: use post.userId to fetch that user's other posts
      const userPostsRes = await fetch(`${BASE}/users/${post.userId}/posts?_limit=2`);
      if (!userPostsRes.ok) throw new Error("Failed to fetch user posts");
      const userPosts: Post[] = await userPostsRes.json();
      setChain(prev => [...prev, `✓ User ${post.userId}'s posts — ${userPosts.length} found`]);

      // Step 3: get comments for the first of those posts
      const commentsRes = await fetch(`${BASE}/posts/${userPosts[0].id}/comments?_limit=2`);
      if (!commentsRes.ok) throw new Error("Failed to fetch comments");
      const comments: Comment[] = await commentsRes.json();
      setChain(prev => [...prev, `✓ Comments for post ${userPosts[0].id} — ${comments.length} found`]);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="7. Sequential (chained) requests — each depends on the previous">
      <button onClick={fetchChained} disabled={loading} style={{ ...btn("#9b59b6"), marginBottom: "10px" }}>
        {loading ? "Chaining…" : "Fetch Post → User → Comments"}
      </button>
      {error && <span style={badge("#e74c3c")}>{error}</span>}
      {chain.map((step, i) => (
        <div key={i} style={{ fontSize: "13px", padding: "4px 8px", borderLeft: "3px solid #27ae60", marginBottom: "4px", color: "#444" }}>
          {step}
        </div>
      ))}
      <Note>
        Sequential = <code>await</code> each request in order. Use when step N needs data from step N-1.
        Total time = sum of all request times (unlike parallel). Show progress state between steps for better UX.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Custom useFetch hook — reusable pattern
// ─────────────────────────────────────────────────────────────────────────────

function useFetch<T>(url: string) {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then(data => setData(data))
      .catch(err => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

function CustomHookSection() {
  const [postId, setPostId] = useState(1);
  const { data, loading, error } = useFetch<Post>(`${BASE}/posts/${postId}`);

  return (
    <Card title="8. Custom useFetch hook — reusable fetch pattern">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px" }}>Post ID:</span>
        {[1, 2, 3, 4, 5].map(id => (
          <button key={id} onClick={() => setPostId(id)} style={btn(postId === id ? "#4a90e2" : "#aaa")}>{id}</button>
        ))}
      </div>
      <StatusBadge loading={loading} error={error} />
      {data && (
        <div style={{ fontSize: "13px" }}>
          <strong>{data.title}</strong>
          <p style={{ color: "#666", margin: "4px 0 0" }}>{data.body}</p>
        </div>
      )}
      <Note>
        <code>useFetch&lt;T&gt;(url)</code> encapsulates the loading/error/data pattern + AbortController cleanup.
        Changing <code>url</code> triggers a new fetch (old request is aborted).
        In real apps, use TanStack Query instead — it adds caching, deduplication, background refetch.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function FetchAPIDemo() {
  return (
    <div>
      <h2>API Integration — Fetch API</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
        The built-in browser Fetch API. No library needed — but requires manual error handling,
        JSON parsing, and AbortController for cleanup.
      </p>

      <BasicGetSection />
      <QueryParamsSection />
      <PostSection />
      <MutationSection />
      <TimeoutSection />
      <ParallelSection />
      <SequentialSection />
      <CustomHookSection />

      <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
        <strong>Fetch API reference:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.9" }}>
          <li><code>fetch(url, options)</code> → always returns a resolved Promise (even on 4xx/5xx)</li>
          <li><code>response.ok</code> → true if status 200–299. Always check this!</li>
          <li><code>response.json()</code> → parse body as JSON (async)</li>
          <li><code>response.text()</code> → parse body as text | <code>response.blob()</code> → binary</li>
          <li><code>AbortController</code> → cancel in-flight requests; return cleanup from useEffect</li>
          <li><code>URLSearchParams</code> → build query strings safely (handles encoding)</li>
          <li><code>Promise.all</code> → parallel | <code>await</code> in sequence → sequential</li>
          <li>POST/PUT/PATCH: always set <code>Content-Type: application/json</code> header</li>
        </ul>
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "11px", color: "#888", margin: "10px 0 0", lineHeight: "1.6" }}>{children}</p>;
}

function btn(bg: string): React.CSSProperties {
  return { padding: "5px 12px", background: bg, color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
}

function badge(bg: string): React.CSSProperties {
  return { display: "inline-block", padding: "2px 8px", background: bg, color: "#fff", borderRadius: "10px", fontSize: "11px", marginBottom: "6px" };
}
