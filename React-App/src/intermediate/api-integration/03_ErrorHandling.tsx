// TOPIC: API Integration — Error Handling Patterns
//
// A comprehensive look at how to handle API errors in production React apps.
// Errors come from many sources — network, server, business logic, timeout, auth.
// Good error handling means: users see useful messages, devs see details, and the
// app remains usable even when things go wrong.
//
// KEY CONCEPTS COVERED:
//   Error classification      → network vs HTTP vs business logic vs timeout
//   Error boundary            → catch render errors (not async — separate concern)
//   Global error handling     → axios interceptor pattern for app-wide errors
//   Retry logic               → automatic retry with exponential backoff
//   Optimistic updates        → update UI first, rollback on failure
//   User-facing error messages → map error codes to readable strings
//   Loading states            → skeleton, spinner, disabled buttons during requests
//   Toast notifications       → non-blocking error feedback pattern
//   Error logging             → how/where errors should be sent in production

import React, { useState, useCallback, Component } from "react";
import axios, { AxiosError } from "axios";

const BASE = "https://jsonplaceholder.typicode.com";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR CLASSIFICATION — understand what kind of error you have
// ─────────────────────────────────────────────────────────────────────────────

type ErrorType = "network" | "timeout" | "auth" | "not_found" | "server" | "unknown";

interface ClassifiedError {
  type: ErrorType;
  message: string;     // user-facing
  detail: string;      // dev/debug info
  retryable: boolean;  // should we offer a Retry button?
}

function classifyError(err: unknown): ClassifiedError {
  // Not an axios error (e.g. JSON parse error, programming bug)
  if (!axios.isAxiosError(err)) {
    return { type: "unknown", message: "Something went wrong.", detail: String(err), retryable: false };
  }

  const axiosErr = err as AxiosError;

  // Network error — server unreachable, no internet, CORS, DNS failure
  if (!axiosErr.response) {
    if (axiosErr.code === "ECONNABORTED") {
      return { type: "timeout", message: "Request timed out. Please try again.", detail: `Timeout: ${axiosErr.message}`, retryable: true };
    }
    return { type: "network", message: "Cannot connect to the server. Check your internet connection.", detail: axiosErr.message, retryable: true };
  }

  const status = axiosErr.response.status;

  if (status === 401 || status === 403) {
    return { type: "auth", message: "You're not authorized to do this.", detail: `HTTP ${status}`, retryable: false };
  }
  if (status === 404) {
    return { type: "not_found", message: "The requested resource was not found.", detail: `HTTP 404: ${axiosErr.config?.url}`, retryable: false };
  }
  if (status >= 500) {
    return { type: "server", message: "Server error. We're working on it.", detail: `HTTP ${status}`, retryable: true };
  }

  return { type: "unknown", message: "An unexpected error occurred.", detail: `HTTP ${status}`, retryable: true };
}

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

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "11px", color: "#888", margin: "10px 0 0", lineHeight: "1.6" }}>{children}</p>;
}

function btn(bg: string, disabled = false): React.CSSProperties {
  return { padding: "5px 12px", background: disabled ? "#ccc" : bg, color: "#fff", border: "none", borderRadius: "4px", cursor: disabled ? "not-allowed" : "pointer", fontSize: "12px" };
}

function ErrorBox({ error }: { error: ClassifiedError }) {
  const colors: Record<ErrorType, string> = {
    network: "#e67e22", timeout: "#f39c12", auth: "#8e44ad",
    not_found: "#e74c3c", server: "#c0392b", unknown: "#7f8c8d",
  };
  return (
    <div style={{ padding: "10px 12px", background: "#fff5f5", border: `1px solid ${colors[error.type]}`, borderRadius: "6px", fontSize: "13px" }}>
      <div style={{ color: colors[error.type], fontWeight: "bold", marginBottom: "2px" }}>
        [{error.type.toUpperCase()}] {error.message}
      </div>
      <div style={{ fontSize: "11px", color: "#999" }}>Debug: {error.detail}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Error classification — map HTTP/network errors to typed objects
// ─────────────────────────────────────────────────────────────────────────────

function ClassificationSection() {
  const [classified, setClassified] = useState<ClassifiedError | null>(null);
  const [loading, setLoading]       = useState(false);

  async function triggerError(scenario: string) {
    setLoading(true);
    setClassified(null);
    try {
      if (scenario === "404") {
        await axios.get(`${BASE}/posts/999999999`);
      } else if (scenario === "timeout") {
        await axios.get(`${BASE}/posts/1`, { timeout: 1 }); // 1ms = always times out
      } else if (scenario === "network") {
        await axios.get("https://this-domain-does-not-exist-xyz.com/api");
      } else if (scenario === "success") {
        await axios.get(`${BASE}/posts/1`);
        setClassified({ type: "unknown", message: "Request succeeded!", detail: "HTTP 200", retryable: false });
        setLoading(false);
        return;
      }
    } catch (err) {
      setClassified(classifyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="1. Error classification — map every error type to a user-readable message">
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
        {[
          { label: "✓ Success", scenario: "success", color: "#27ae60" },
          { label: "404 Not Found", scenario: "404", color: "#e74c3c" },
          { label: "Timeout (1ms)", scenario: "timeout", color: "#f39c12" },
          { label: "Network Error", scenario: "network", color: "#e67e22" },
        ].map(({ label, scenario, color }) => (
          <button key={scenario} onClick={() => triggerError(scenario)} disabled={loading} style={btn(color, loading)}>
            {label}
          </button>
        ))}
      </div>
      {loading && <div style={{ fontSize: "12px", color: "#888" }}>Making request…</div>}
      {classified && <ErrorBox error={classified} />}
      {classified?.retryable && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#27ae60" }}>
          ↺ This error is retryable — show a "Try Again" button to users.
        </div>
      )}
      <Note>
        Always classify errors before showing them. Map <code>err.response?.status</code> and <code>err.code</code>
        to structured objects. Separate user-facing messages from technical debug info.
        Mark errors as retryable/non-retryable to decide whether to show a Retry button.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Retry logic — exponential backoff
// ─────────────────────────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  url: string,
  maxAttempts = 3,
  onAttempt?: (attempt: number, delay: number) => void
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await axios.get<T>(url, { timeout: 5000 });
      return res.data;
    } catch (err) {
      lastError = err;
      const classified = classifyError(err);

      // Don't retry non-retryable errors (404, auth errors)
      if (!classified.retryable || attempt === maxAttempts) break;

      // Exponential backoff: 500ms, 1000ms, 2000ms…
      const delay = 500 * Math.pow(2, attempt - 1);
      onAttempt?.(attempt, delay);
      await sleep(delay);
    }
  }

  throw lastError;
}

function RetrySection() {
  const [log, setLog]         = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);

  async function runWithRetry(willSucceed: boolean) {
    setLog([]);
    setLoading(true);
    setSuccess(null);

    // Simulate: use a valid URL that will succeed, or invalid URL that will fail
    const url = willSucceed
      ? `${BASE}/posts/1`
      : "https://this-will-fail-xyz.invalid/api";

    try {
      const data = await fetchWithRetry<Post>(url, 3, (attempt, delay) => {
        setLog(prev => [...prev, `Attempt ${attempt} failed — retrying in ${delay}ms…`]);
      });
      setLog(prev => [...prev, `✓ Success — got post: "${(data as Post).title}"`]);
      setSuccess(true);
    } catch (err) {
      const classified = classifyError(err);
      setLog(prev => [...prev, `✗ All attempts failed: ${classified.message}`]);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="2. Retry with exponential backoff — automatic retry for transient failures">
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <button onClick={() => runWithRetry(true)} disabled={loading} style={btn("#27ae60", loading)}>
          Fetch (will succeed)
        </button>
        <button onClick={() => runWithRetry(false)} disabled={loading} style={btn("#e74c3c", loading)}>
          Fetch (will fail → 3 retries)
        </button>
      </div>
      {(log.length > 0 || loading) && (
        <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
          {loading && log.length === 0 && <div style={{ color: "#888" }}>Attempting…</div>}
          {log.map((line, i) => (
            <div key={i} style={{
              padding: "3px 0",
              color: line.startsWith("✓") ? "#27ae60" : line.startsWith("✗") ? "#e74c3c" : "#e67e22",
            }}>
              {line}
            </div>
          ))}
        </div>
      )}
      <Note>
        Exponential backoff: wait 500ms → 1000ms → 2000ms between attempts.
        Only retry errors marked as <em>retryable</em> (network, timeout, 5xx).
        Never retry 4xx errors (they won't fix themselves on retry).
        TanStack Query has built-in <code>retry</code> and <code>retryDelay</code> options — no manual implementation needed.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Optimistic updates — update UI immediately, rollback on failure
// ─────────────────────────────────────────────────────────────────────────────

function OptimisticSection() {
  const [items, setItems] = useState([
    { id: 1, title: "First post", liked: false },
    { id: 2, title: "Second post", liked: false },
    { id: 3, title: "Third post", liked: false },
  ]);
  const [log, setLog] = useState<string[]>([]);

  async function toggleLike(id: number, simulateFailure: boolean) {
    const previous = [...items];

    // 1. Update UI immediately (optimistic)
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, liked: !item.liked } : item
    ));
    setLog(prev => [...prev, `⚡ Optimistic: toggled like for post ${id}`]);

    try {
      // 2. Make the API call
      if (simulateFailure) {
        await sleep(800);
        throw new Error("Server rejected the update");
      }
      await axios.patch(`${BASE}/posts/${id}`, { liked: !items.find(i => i.id === id)?.liked });
      setLog(prev => [...prev, `✓ Server confirmed: post ${id} updated`]);
    } catch (err) {
      // 3. On failure: rollback to previous state
      setItems(previous);
      setLog(prev => [...prev, `✗ Rollback: server error — reverted post ${id}`]);
    }
  }

  return (
    <Card title="3. Optimistic updates — instant UI feedback with rollback on failure">
      <div style={{ marginBottom: "10px", fontSize: "12px", color: "#666" }}>
        Click a post to like it. Hold Alt / check "Fail" variant to simulate a server error + rollback.
      </div>
      {items.map(item => (
        <div key={item.id} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
          <button
            onClick={() => toggleLike(item.id, false)}
            style={{ ...btn(item.liked ? "#e74c3c" : "#aaa"), minWidth: "60px" }}
          >
            {item.liked ? "♥ Liked" : "♡ Like"}
          </button>
          <button
            onClick={() => toggleLike(item.id, true)}
            style={{ ...btn("#f39c12"), fontSize: "11px" }}
            title="Simulates server error — UI updates then rolls back"
          >
            Like (fail)
          </button>
          <span style={{ fontSize: "13px" }}>{item.title}</span>
        </div>
      ))}
      <div style={{ fontFamily: "monospace", fontSize: "11px", marginTop: "10px" }}>
        {log.slice(-4).map((line, i) => (
          <div key={i} style={{ color: line.startsWith("✓") ? "#27ae60" : line.startsWith("✗") ? "#e74c3c" : "#4a90e2" }}>
            {line}
          </div>
        ))}
      </div>
      <Note>
        Pattern: (1) save current state, (2) update UI immediately, (3) call API,
        (4) on failure → <code>setState(previous)</code>.
        Best UX for low-latency actions (likes, follows, drag-and-drop).
        TanStack Query's <code>useMutation</code> has <code>onMutate</code>, <code>onError</code>, <code>onSettled</code> for this built-in.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Toast notification pattern — non-blocking error feedback
// ─────────────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let toastId = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px" }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#fff",
            background: toast.type === "success" ? "#27ae60" : toast.type === "error" ? "#e74c3c" : "#4a90e2",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            minWidth: "200px",
            cursor: "pointer",
          }}
          onClick={() => onDismiss(toast.id)}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          <span style={{ opacity: 0.7, fontSize: "11px" }}>✕</span>
        </div>
      ))}
    </div>
  );
}

function ToastSection() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);

  function addToast(message: string, type: Toast["type"]) {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }

  function dismissToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  async function fetchWithToast(shouldFail: boolean) {
    setLoading(true);
    try {
      const url = shouldFail ? `${BASE}/posts/9999999999` : `${BASE}/posts/1`;
      await axios.get(url);
      addToast("Post loaded successfully!", "success");
    } catch (err) {
      const classified = classifyError(err);
      addToast(classified.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="4. Toast notifications — non-blocking error + success feedback">
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <button onClick={() => fetchWithToast(false)} disabled={loading} style={btn("#27ae60", loading)}>
          Fetch (success toast)
        </button>
        <button onClick={() => fetchWithToast(true)} disabled={loading} style={btn("#e74c3c", loading)}>
          Fetch (error toast)
        </button>
        <button onClick={() => addToast("Info message", "info")} style={btn("#4a90e2")}>
          Info toast
        </button>
      </div>
      <div style={{ fontSize: "12px", color: "#888" }}>
        Toasts appear bottom-right. Click to dismiss. Auto-dismiss after 3s.
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Note>
        Toasts are non-blocking — users can keep using the app while the notification shows.
        Better than modal alerts for non-critical errors. Use react-hot-toast or react-toastify
        in production — they handle animations, stacking, and accessibility (aria-live regions).
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Error Boundary — catch render errors (not async)
// ─────────────────────────────────────────────────────────────────────────────

class RenderErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production: send to Sentry, Datadog, etc.
    console.error("[ErrorBoundary] caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "16px", background: "#fff5f5", borderRadius: "8px", border: "1px solid #fcc" }}>
          <strong style={{ color: "#e74c3c", fontSize: "14px" }}>Something went wrong</strong>
          <p style={{ fontSize: "13px", color: "#666", margin: "8px 0" }}>
            {(this.state.error as Error).message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: "5px 12px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// A component that intentionally throws during render
function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("This component crashed during render!");
  }
  return <div style={{ padding: "8px", background: "#f0fff4", borderRadius: "4px", fontSize: "13px" }}>✓ Component rendered successfully</div>;
}

function ErrorBoundarySection() {
  const [crash, setCrash] = useState(false);

  return (
    <Card title="5. Error Boundary — catch component render crashes">
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
        Error boundaries catch errors thrown <em>during render</em> — not in async event handlers or useEffect.
        They are the React equivalent of try/catch for the component tree.
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button onClick={() => setCrash(false)} style={btn("#27ae60")}>Render OK</button>
        <button onClick={() => setCrash(true)} style={btn("#e74c3c")}>Crash component</button>
      </div>
      <RenderErrorBoundary>
        <BrokenComponent shouldThrow={crash} />
      </RenderErrorBoundary>
      <Note>
        Error boundaries must be <em>class components</em> (no hooks equivalent yet).
        Place them strategically — one at the app root (last resort) + smaller ones around
        risky widget areas so one crash doesn't take down the whole page.
        <br /><strong>NOT caught by error boundary:</strong> async errors (useEffect, event handlers),
        errors in the boundary itself, server-side rendering errors.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Global error handler — axios interceptor + window.onerror
// ─────────────────────────────────────────────────────────────────────────────

function GlobalHandlerSection() {
  const [interceptedErrors, setInterceptedErrors] = useState<string[]>([]);

  const makeRequests = useCallback(async () => {
    setInterceptedErrors([]);

    const globalApi = axios.create({ baseURL: BASE, timeout: 5000 });
    globalApi.interceptors.response.use(
      res => res,
      (err: AxiosError) => {
        // This runs for EVERY failed request from this instance
        const classified = classifyError(err);
        setInterceptedErrors(prev => [
          ...prev,
          `[${classified.type.toUpperCase()}] ${classified.message} (${classified.detail})`
        ]);
        // Optionally: send to error monitoring (Sentry.captureException(err))
        return Promise.reject(err);
      }
    );

    // Fire multiple requests — all failures flow through the interceptor
    await Promise.allSettled([
      globalApi.get("/posts/1"),           // succeeds
      globalApi.get("/posts/9999999999"),  // 200 but empty (JSONPlaceholder) — treat as 404
      globalApi.get("/posts/1", { timeout: 1 }), // timeout
    ]);
  }, []);

  return (
    <Card title="6. Global error handler — axios interceptor for app-wide error processing">
      <button onClick={makeRequests} style={{ ...btn("#9b59b6"), marginBottom: "10px" }}>
        Fire 3 requests (1 ok, 1 not found, 1 timeout)
      </button>
      {interceptedErrors.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#555" }}>
            Intercepted errors:
          </div>
          {interceptedErrors.map((e, i) => (
            <div key={i} style={{ fontSize: "12px", fontFamily: "monospace", padding: "3px 6px", background: "#fff5f5", borderLeft: "3px solid #e74c3c", marginBottom: "4px" }}>
              {e}
            </div>
          ))}
        </div>
      )}
      <Note>
        The global response interceptor is your single place to handle all API errors.
        Use it to: log errors, redirect on 401, show a global "offline" banner, send to Sentry.
        Individual <code>catch</code> blocks can still handle local UI state (loading, error messages).
        <br /><strong>Production setup:</strong> <code>Sentry.init()</code> + <code>Sentry.captureException(err)</code>
        in your interceptor catches all unhandled API errors automatically.
      </Note>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function ErrorHandlingDemo() {
  return (
    <div>
      <h2>API Integration — Error Handling Patterns</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
        Production-grade error handling: classification, retry, optimistic updates,
        toast notifications, error boundaries, and global interceptors.
      </p>

      <ClassificationSection />
      <RetrySection />
      <OptimisticSection />
      <ToastSection />
      <ErrorBoundarySection />
      <GlobalHandlerSection />

      <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
        <strong>Error handling checklist for production:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.9" }}>
          <li>Classify errors → separate <em>user messages</em> from <em>debug details</em></li>
          <li>Check <code>err.response</code> exists before reading <code>.status</code> (network errors have no response)</li>
          <li>Mark errors as retryable — show Retry button for transient failures only</li>
          <li>Retry with exponential backoff — or use TanStack Query's built-in <code>retry</code></li>
          <li>Optimistic updates — save snapshot, update UI, rollback on error</li>
          <li>Toast for non-critical errors — modal for critical/blocking errors</li>
          <li>Error boundaries at root + around risky components (charts, third-party widgets)</li>
          <li>Global interceptor → send all errors to Sentry / Datadog in one place</li>
          <li>Never show raw error messages to users (<code>err.message</code> may leak internals)</li>
          <li>Always reset loading state in <code>finally</code> — even on error</li>
        </ul>
      </div>
    </div>
  );
}
