// TOPIC: API Integration — Axios
//
// Axios is the most popular HTTP library for React apps.
// It wraps fetch with automatic JSON parsing, better error handling, interceptors, and more.
//
// KEY CONCEPTS COVERED:
//   axios.get / post / put / patch / delete → CRUD methods
//   Automatic JSON parsing    → no response.json() needed
//   Throws on 4xx/5xx         → unlike fetch, axios rejects on error status
//   axios.create()            → create an instance with base URL + default headers
//   Request interceptors      → add auth token to every request
//   Response interceptors     → global error handling, token refresh
//   Request cancellation      → AbortController (same as fetch)
//   Timeout config            → built-in (no setTimeout hack needed)
//   Parallel requests         → axios.all / Promise.all
//   TypeScript generics       → axios.get<T>(url) → typed response.data
//   Upload progress           → onUploadProgress callback
//   Query params              → { params: { key: value } } option

import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError, AxiosInstance } from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AXIOS INSTANCE — configured with base URL, timeout, and default headers
// ─────────────────────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 10000,   // ← built-in timeout (ms) — no AbortController needed for this
  headers: {
    "Content-Type": "application/json",
    // "Authorization": "Bearer <token>",  ← set per-instance default auth
  },
});

// REQUEST INTERCEPTOR — runs before every request leaves the browser
// Common use: inject auth token from storage
api.interceptors.request.use(
  (config) => {
    // In a real app: config.headers.Authorization = `Bearer ${getToken()}`;
    // Here we just log the outgoing request method + URL
    console.log(`[Axios] → ${config.method?.toUpperCase()} ${config.url}`);
    return config; // must return config (or a modified version)
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR — runs after every response (or error)
// Common use: global 401 redirect, error logging, token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`[Axios] ← ${response.status} ${response.config.url}`);
    return response; // must return response
  },
  (error: AxiosError) => {
    // Centralised error handling — runs for ALL requests from this instance
    if (error.response?.status === 401) {
      console.warn("[Axios] Unauthorized — redirect to login");
    }
    if (error.response?.status === 500) {
      console.error("[Axios] Server error");
    }
    return Promise.reject(error); // re-throw so individual .catch() still fires
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px", background: "#fafafa", borderRadius: "8px", border: "1px solid #eee", marginBottom: "16px" }}>
      <h4 style={{ margin: "0 0 12px", fontSize: "14px" }}>{title}</h4>
      {children}
    </div>
  );
}

function JsonPreview({ data }: { data: unknown }) {
  return (
    <pre style={{ fontSize: "11px", background: "#f5f5f5", padding: "8px", borderRadius: "4px", overflow: "auto", maxHeight: "160px", margin: "8px 0 0" }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "11px", color: "#888", margin: "10px 0 0", lineHeight: "1.6" }}>{children}</p>;
}

function btn(bg: string): React.CSSProperties {
  return { padding: "5px 12px", background: bg, color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
}

function badge(bg: string): React.CSSProperties {
  return { display: "inline-block", padding: "2px 8px", background: bg, color: "#fff", borderRadius: "10px", fontSize: "11px" };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic GET — axios.get<T> with automatic JSON parsing
// ─────────────────────────────────────────────────────────────────────────────

function BasicGetSection() {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function fetchPosts() {
    setLoading(true);
    setError(null);
    try {
      // axios.get<Post[]> → response.data is typed as Post[]
      // No need for response.ok check or .json() — axios handles both
      const response = await api.get<Post[]>("/posts", {
        params: { _limit: 3 },  // ← query params as an object (axios builds the URL)
      });
      setPosts(response.data); // ← data is already parsed JSON
    } catch (err) {
      const axiosErr = err as AxiosError;
      // axios.isAxiosError(err) → true for network errors AND 4xx/5xx
      setError(axiosErr.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPosts(); }, []);

  return (
    <Card title="1. Basic GET — axios.get<T>, automatic JSON, params object">
      <button onClick={fetchPosts} disabled={loading} style={{ ...btn("#4a90e2"), marginBottom: "10px" }}>
        {loading ? "Loading…" : "Refetch"}
      </button>
      {error && <span style={{ ...badge("#e74c3c"), display: "block", marginBottom: "6px" }}>{error}</span>}
      {posts.map(p => (
        <div key={p.id} style={{ padding: "4px 0", fontSize: "12px", borderBottom: "1px solid #eee" }}>
          <strong>#{p.id}</strong> {p.title}
        </div>
      ))}
      <Note>
        Fetch: <code>const res = await fetch(url); const data = await res.json();</code> — two steps, manual OK check.
        Axios: <code>const {"{ data }"} = await axios.get&lt;T&gt;(url)</code> — one step, throws on 4xx/5xx automatically.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST / PUT / PATCH / DELETE
// ─────────────────────────────────────────────────────────────────────────────

function MutationsSection() {
  const [method, setMethod] = useState<"POST" | "PUT" | "PATCH" | "DELETE">("POST");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function runMutation() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let response;
      const payload = { title: "Axios demo", body: "sent via axios", userId: 1 };

      if (method === "POST") {
        response = await api.post<Post>("/posts", payload);
      } else if (method === "PUT") {
        response = await api.put<Post>("/posts/1", { id: 1, ...payload });
      } else if (method === "PATCH") {
        response = await api.patch<Post>("/posts/1", { title: "Patched title" });
      } else {
        response = await api.delete("/posts/1");
      }
      setResult((method === "DELETE" ? { deleted: true } : response.data) as Record<string, unknown>);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? axiosErr.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="2. POST / PUT / PATCH / DELETE — axios mutation methods">
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        {(["POST", "PUT", "PATCH", "DELETE"] as const).map(m => (
          <button key={m} onClick={() => setMethod(m)} style={btn(method === m ? "#e67e22" : "#aaa")}>{m}</button>
        ))}
        <button onClick={runMutation} disabled={loading} style={btn("#27ae60")}>
          {loading ? "…" : "Run"}
        </button>
      </div>
      {error && <span style={{ ...badge("#e74c3c"), display: "block", marginBottom: "6px" }}>{error}</span>}
      {result && <JsonPreview data={result} />}
      <Note>
        Axios automatically sets <code>Content-Type: application/json</code> when you pass an object body —
        no need to <code>JSON.stringify</code> manually. The Content-Type header from <code>axios.create()</code> applies to all requests.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Error handling — AxiosError structure
// ─────────────────────────────────────────────────────────────────────────────

function ErrorHandlingSection() {
  const [statusCode, setStatusCode] = useState(404);
  const [errInfo, setErrInfo]       = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading]       = useState(false);

  async function triggerError() {
    setLoading(true);
    setErrInfo(null);
    try {
      // Use a route that returns the given status code for demo purposes
      // JSONPlaceholder doesn't reliably return error codes, so we'll use a non-existent post id
      await api.get(statusCode === 404 ? "/posts/99999999" : "/posts/1");
      setErrInfo({ type: "Success", message: "No error thrown" });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // AxiosError has a structured shape — response, request, config
        setErrInfo({
          type:           "AxiosError",
          message:        err.message,
          status:         err.response?.status ?? "No response (network error)",
          statusText:     err.response?.statusText,
          responseData:   err.response?.data,
          isNetworkError: !err.response,  // true when server is unreachable
          isTimeout:      err.code === "ECONNABORTED",
        });
      } else {
        setErrInfo({ type: "Unknown error", message: String(err) });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="3. Error handling — AxiosError structure">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px" }}>Simulate:</span>
        <button onClick={() => { setStatusCode(404); }} style={btn(statusCode === 404 ? "#e74c3c" : "#aaa")}>404 Not Found</button>
        <button onClick={triggerError} disabled={loading} style={btn("#4a90e2")}>
          {loading ? "…" : "Trigger"}
        </button>
      </div>
      {errInfo && <JsonPreview data={errInfo} />}
      <Note>
        <code>axios.isAxiosError(err)</code> → type guard for AxiosError.
        <code>err.response</code> → exists for 4xx/5xx (server responded).
        <code>err.response</code> is <code>undefined</code> for network errors (no internet, CORS, timeout).
        <code>err.code === "ECONNABORTED"</code> → timeout exceeded.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Request cancellation — AbortController (same as fetch)
// ─────────────────────────────────────────────────────────────────────────────

function CancellationSection() {
  const [postId, setPostId]   = useState(1);
  const [post, setPost]       = useState<Post | null>(null);
  const [status, setStatus]   = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchPost = useCallback(async (id: number) => {
    const controller = new AbortController();
    setLoading(true);
    setStatus(`Fetching post ${id}…`);

    try {
      const res = await api.get<Post>(`/posts/${id}`, {
        signal: controller.signal,  // ← same AbortController API as fetch
      });
      setPost(res.data);
      setStatus(`✓ Loaded post ${id}`);
    } catch (err) {
      if (axios.isCancel(err) || (err as Error).name === "CanceledError") {
        setStatus(`✗ Request for post ${id} was cancelled`);
      } else {
        setStatus(`✗ ${(err as Error).message}`);
      }
    } finally {
      setLoading(false);
    }

    return controller; // return so caller can abort
  }, []);

  useEffect(() => {
    let controller: AbortController;
    (async () => {
      controller = await fetchPost(postId) as unknown as AbortController;
    })();
    return () => controller?.abort(); // abort previous when postId changes
  }, [postId, fetchPost]);

  return (
    <Card title="4. Request cancellation — AbortController (axios ≥ 0.22)">
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px" }}>Post:</span>
        {[1, 2, 3, 4, 5].map(id => (
          <button key={id} onClick={() => setPostId(id)} style={btn(postId === id ? "#4a90e2" : "#aaa")}>{id}</button>
        ))}
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>{status}</div>
      {post && !loading && (
        <div style={{ fontSize: "13px" }}><strong>{post.title}</strong></div>
      )}
      <Note>
        Axios ≥ 0.22 uses the standard <code>AbortController</code> (deprecated <code>CancelToken</code> removed).
        Click buttons fast — previous requests are cancelled before the new one starts.
        Check the browser Network tab to see cancelled (red) requests.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Parallel requests — Promise.all with axios
// ─────────────────────────────────────────────────────────────────────────────

function ParallelSection() {
  const [data, setData]       = useState<{ users: User[]; posts: Post[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function fetchParallel() {
    setLoading(true);
    setError(null);
    try {
      // Both fire at the same time — typed independently
      const [usersRes, postsRes] = await Promise.all([
        api.get<User[]>("/users?_limit=3"),
        api.get<Post[]>("/posts?_limit=3"),
      ]);
      setData({ users: usersRes.data, posts: postsRes.data });
    } catch (err) {
      setError((err as AxiosError).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="5. Parallel requests — Promise.all with typed responses">
      <button onClick={fetchParallel} disabled={loading} style={{ ...btn("#27ae60"), marginBottom: "10px" }}>
        {loading ? "Fetching…" : "Fetch Users + Posts in parallel"}
      </button>
      {error && <span style={{ ...badge("#e74c3c"), display: "block" }}>{error}</span>}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <strong style={{ fontSize: "12px" }}>Users ({data.users.length})</strong>
            {data.users.map(u => (
              <div key={u.id} style={{ fontSize: "11px", color: "#555", padding: "2px 0" }}>{u.name}</div>
            ))}
          </div>
          <div>
            <strong style={{ fontSize: "12px" }}>Posts ({data.posts.length})</strong>
            {data.posts.map(p => (
              <div key={p.id} style={{ fontSize: "11px", color: "#555", padding: "2px 0" }}>{p.title.slice(0, 40)}…</div>
            ))}
          </div>
        </div>
      )}
      <Note>
        Each <code>api.get&lt;T&gt;</code> is typed independently — <code>usersRes.data</code> is <code>User[]</code>,
        <code>postsRes.data</code> is <code>Post[]</code>. TypeScript infers both correctly from <code>Promise.all</code>.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Interceptors demo — live log
// ─────────────────────────────────────────────────────────────────────────────

function InterceptorSection() {
  const [log, setLog]         = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function makeRequest() {
    setLoading(true);
    setLog([]);

    // Create a fresh instance to attach logging interceptors for this demo
    const demoApi = axios.create({ baseURL: "https://jsonplaceholder.typicode.com", timeout: 8000 });

    demoApi.interceptors.request.use((config) => {
      setLog(prev => [...prev, `→ REQUEST: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`]);
      // Simulate attaching auth token
      config.headers["X-Demo-Token"] = "demo-token-123";
      setLog(prev => [...prev, `→ Added header: X-Demo-Token: demo-token-123`]);
      return config;
    });

    demoApi.interceptors.response.use(
      (res) => {
        setLog(prev => [...prev, `← RESPONSE: ${res.status} ${res.statusText} (${JSON.stringify(res.data).length} bytes)`]);
        return res;
      },
      (err: AxiosError) => {
        setLog(prev => [...prev, `← ERROR: ${err.response?.status ?? "Network"} — ${err.message}`]);
        return Promise.reject(err);
      }
    );

    try {
      await demoApi.get("/posts/1");
      setLog(prev => [...prev, "✓ Data received successfully"]);
    } catch {
      // handled in interceptor
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="6. Interceptors — request (auth headers) + response (logging, error handling)">
      <button onClick={makeRequest} disabled={loading} style={{ ...btn("#9b59b6"), marginBottom: "10px" }}>
        {loading ? "…" : "Make intercepted request"}
      </button>
      {log.map((line, i) => (
        <div key={i} style={{
          fontSize: "12px", padding: "3px 8px", marginBottom: "2px",
          background: line.startsWith("→") ? "#f0f4ff" : line.startsWith("←") ? "#f0fff4" : "#f5f5f5",
          borderLeft: `3px solid ${line.startsWith("→") ? "#4a90e2" : line.startsWith("←") ? "#27ae60" : "#aaa"}`,
          borderRadius: "2px", fontFamily: "monospace",
        }}>
          {line}
        </div>
      ))}
      <Note>
        Interceptors are middleware for every request/response through this axios instance.
        <br /><strong>Request interceptor:</strong> inject auth token, add headers, log outgoing requests.
        <br /><strong>Response interceptor:</strong> log responses, handle 401 (redirect to login), refresh tokens, transform data.
        <br />Use <code>axios.create()</code> to create separate instances for different APIs (each with own interceptors).
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function AxiosDemo() {
  return (
    <div>
      <h2>API Integration — Axios</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
        The most popular HTTP library for React. Automatic JSON parsing, throws on 4xx/5xx,
        axios.create() for per-instance config, interceptors for global logic.
      </p>

      <BasicGetSection />
      <MutationsSection />
      <ErrorHandlingSection />
      <CancellationSection />
      <ParallelSection />
      <InterceptorSection />

      <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
        <strong>Fetch vs Axios:</strong>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={th}>Feature</th>
              <th style={th}>Fetch</th>
              <th style={th}>Axios</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["JSON parsing",       "Manual .json()",        "Automatic"],
              ["4xx/5xx errors",     "Does NOT throw",        "Throws automatically"],
              ["Timeout",            "AbortController hack",  "Built-in timeout option"],
              ["Request config",     "Spread options object", "axios.create() instance"],
              ["Interceptors",       "No built-in",           "request + response interceptors"],
              ["Upload progress",    "No built-in",           "onUploadProgress callback"],
              ["Bundle size",        "0 KB (built-in)",       "~14 KB gzipped"],
              ["TypeScript",         "Manual generics",       "axios.get<T>() built-in"],
            ].map(([f, fetch, axiosVal]) => (
              <tr key={f}>
                <td style={td}><strong>{f}</strong></td>
                <td style={td}>{fetch}</td>
                <td style={{ ...td, color: "#27ae60" }}>{axiosVal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#666" }}>
          <strong>When to use fetch:</strong> simple requests, no library budget, service workers.
          <br /><strong>When to use axios:</strong> interceptors needed, file uploads, complex APIs, team consistency.
          <br /><strong>In production:</strong> pair either with TanStack Query for caching + background refetch.
        </p>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #ddd" };
const td: React.CSSProperties = { padding: "5px 8px", borderBottom: "1px solid #eee" };
