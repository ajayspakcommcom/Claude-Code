// TOPIC: Caching Strategies
// LEVEL: Senior — Advanced State
//
// ─── THE TWO KEY CONTROLS ─────────────────────────────────────────────────────
//
//   staleTime (default: 0)
//   ├─ How long data is considered FRESH
//   ├─ While fresh: no background refetch on mount/focus
//   └─ After staleTime: data is STALE → background refetch fires
//
//   gcTime / cacheTime (default: 5 min)
//   ├─ How long UNUSED data stays in memory
//   ├─ Component unmounts → countdown starts
//   └─ After gcTime: data is GARBAGE COLLECTED (removed from memory)
//
// ─── CACHE LIFECYCLE ─────────────────────────────────────────────────────────
//
//   Fetch → LOADING (no data)
//         → SUCCESS + FRESH (staleTime countdown begins)
//         → STALE (background refetch on next mount/focus)
//   Unmount → INACTIVE (gcTime countdown begins)
//           → GARBAGE COLLECTED (out of memory)
//
// ─── QUERY KEY = CACHE KEY ───────────────────────────────────────────────────
//
//   ["posts"]               → all posts (one cache entry)
//   ["posts", "tech"]       → tech posts (separate cache entry)
//   ["posts", 5]            → post #5 (separate cache entry)
//   ["posts", { page: 2 }]  → page 2 (separate cache entry)
//
//   Change the key → React Query treats it as a NEW query (fresh fetch).
//   Keep the same key → serves from cache.
//
// ─── KEY PATTERNS ────────────────────────────────────────────────────────────
//
//   1. staleTime      — tune per query (user list: 60s, stock price: 0)
//   2. invalidateQueries — after a mutation, force a refetch
//   3. prefetchQuery  — warm cache before user navigates
//   4. enabled flag   — dependent queries (fetch B only after A resolves)
//   5. setQueryData   — write to cache directly (for optimistic updates)

import React, { useState, useEffect } from "react";
import {
  useQuery, useMutation, useQueryClient,
  QueryClient, QueryClientProvider,
} from "@tanstack/react-query";
import {
  fetchTimestamped, fetchPosts, fetchPostById, createPost,
  getCounter, resetCounters,
} from "./caching/fakeCacheApi";
import type { Post } from "./caching/fakeCacheApi";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// ─── Root ─────────────────────────────────────────────────────────────────────

const CachingStrategiesDemo = () => (
  <QueryClientProvider client={queryClient}>
    <style>{`@keyframes cl-spin { to { transform: rotate(360deg); } }`}</style>
    <Inner />
  </QueryClientProvider>
);

const Inner = () => {
  const [tab, setTab] = useState<"concepts" | "staletime" | "patterns">("concepts");
  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.h2}>Caching Strategies</h2>
        <p style={s.subtitle}>Senior Advanced State — staleTime, gcTime, invalidation, prefetch, dependent queries</p>
        <div style={s.tabs}>
          {(["concepts", "staletime", "patterns"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
              {t === "concepts" ? "📚 Concepts" : t === "staletime" ? "⏱ staleTime Demo" : "🔧 Patterns"}
            </button>
          ))}
        </div>
      </div>
      {tab === "concepts"  && <ConceptsView />}
      {tab === "staletime" && <StaleTimeView />}
      {tab === "patterns"  && <PatternsView />}
    </div>
  );
};

// ─── Concepts view ────────────────────────────────────────────────────────────

const ConceptsView = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

    {/* staleTime vs gcTime */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>staleTime vs gcTime — the two cache controls</h3>
      <div style={s.twoCol}>
        <div style={{ ...s.halfCard, borderColor: "#3b82f6" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1d4ed8", marginBottom: 6 }}>⏱ staleTime</div>
          <p style={s.p}>How long data is considered <strong>fresh</strong>. While fresh, React Query serves from cache with NO network request — not even in the background.</p>
          <div style={s.timeline}>
            {[
              { label: "Fetch", color: "#3b82f6", desc: "Network request" },
              { label: "FRESH", color: "#22c55e", desc: "← staleTime window" },
              { label: "STALE", color: "#f59e0b", desc: "Background refetch on next mount/focus" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 13, width: 60 }}>{step.label}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{step.desc}</span>
              </div>
            ))}
          </div>
          <pre style={s.code}>{`useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 60_000,  // fresh for 60s
  //         0        // stale immediately (default)
  //         Infinity // never stale
})`}</pre>
        </div>
        <div style={{ ...s.halfCard, borderColor: "#8b5cf6" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#6d28d9", marginBottom: 6 }}>🗑️ gcTime (cacheTime)</div>
          <p style={s.p}>How long <strong>unused</strong> data stays in memory after a component unmounts. After this, the cache entry is deleted.</p>
          <div style={s.timeline}>
            {[
              { label: "Unmount", color: "#6b7280", desc: "Component removed — countdown begins" },
              { label: "INACTIVE", color: "#f59e0b", desc: "← gcTime window (default 5min)" },
              { label: "DELETED", color: "#ef4444", desc: "Cache entry removed from memory" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 13, width: 60 }}>{step.label}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{step.desc}</span>
              </div>
            ))}
          </div>
          <pre style={s.code}>{`useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  gcTime: 5 * 60_000,  // default: 5 min
  //      0            // remove immediately
  //      Infinity     // keep forever
})`}</pre>
        </div>
      </div>
    </div>

    {/* Cache lifecycle */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>Cache Lifecycle</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "8px 0" }}>
        {LIFECYCLE.map((step, i) => (
          <React.Fragment key={i}>
            <div style={{ ...s.lifecycleBox, borderColor: step.color }}>
              <div style={{ fontSize: 18 }}>{step.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: step.color }}>{step.state}</div>
              <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center", lineHeight: 1.4 }}>{step.desc}</div>
            </div>
            {i < LIFECYCLE.length - 1 && (
              <div style={{ color: "#9ca3af", fontSize: 20, flexShrink: 0 }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>

    {/* Query key strategies */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>Query Key = Cache Key</h3>
      <p style={s.p}>The query key is exactly like a dependency array — change it and React Query treats it as a brand new query with its own cache entry.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {QUERY_KEY_EXAMPLES.map((ex, i) => (
          <div key={i} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{ex.label}</div>
            <pre style={{ ...s.code, marginBottom: 8 }}>{ex.key}</pre>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{ex.desc}</div>
          </div>
        ))}
      </div>
    </div>

  </div>
);

// ─── staleTime view ───────────────────────────────────────────────────────────
// Three live panels — same data, different staleTimes

const StaleTimeView = () => {
  const [mounted, setMounted]     = useState(true);
  const [mountKey, setMountKey]   = useState(0);

  const remount = () => {
    setMounted(false);
    setTimeout(() => { setMounted(true); setMountKey((k) => k + 1); }, 300);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 14, color: "#374151" }}>
            Three panels — same data source, different <code style={s.inlineCode}>staleTime</code>.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            Click <strong>"Simulate re-mount"</strong> to unmount and remount all three. Watch which ones show a loading spinner vs instant data.
          </p>
        </div>
        <button onClick={remount} style={s.actionBtn}>🔄 Simulate re-mount</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {mounted && <StalePanel key={`0-${mountKey}`}   label="staleTime: 0"        staleTime={0}         cacheKey="ts-0"   color="#ef4444" />}
        {mounted && <StalePanel key={`10-${mountKey}`}  label="staleTime: 15 000ms" staleTime={15_000}    cacheKey="ts-15"  color="#f59e0b" />}
        {mounted && <StalePanel key={`inf-${mountKey}`} label="staleTime: Infinity"  staleTime={Infinity}  cacheKey="ts-inf" color="#22c55e" />}
      </div>

      <div style={s.card}>
        <h3 style={{ ...s.cardTitle, marginBottom: 8 }}>What does "re-mount" simulate?</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { color: "#ef4444", title: "staleTime: 0 (default)", result: "Always stale → always background refetches on mount. You see isFetching even though data is already there." },
            { color: "#f59e0b", title: "staleTime: 15s",         result: "Fresh for 15 seconds. Re-mount within 15s → instant, no request. After 15s → background refetch." },
            { color: "#22c55e", title: "staleTime: Infinity",    result: "Never stale → ZERO background requests. Data served from cache until you manually invalidate." },
          ].map((box, i) => (
            <div key={i} style={{ background: "#f8fafc", borderLeft: `3px solid ${box.color}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{box.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{box.result}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StalePanel = ({
  label, staleTime, cacheKey, color,
}: { label: string; staleTime: number; cacheKey: string; color: string }) => {
  const { data, isLoading, isFetching, isStale, dataUpdatedAt } = useQuery({
    queryKey: [cacheKey],
    queryFn:  () => fetchTimestamped(cacheKey),
    staleTime,
  });

  const [age, setAge] = useState(0);
  useEffect(() => {
    if (!dataUpdatedAt) return;
    const id = setInterval(() => setAge(Math.floor((Date.now() - dataUpdatedAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);

  const fetchCount = getCounter(cacheKey);

  return (
    <div style={{ ...s.card, borderTop: `3px solid ${color}`, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 12 }}>{label}</div>

      {/* Status badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ ...s.badge, background: isLoading ? "#fef3c7" : "#dcfce7", color: isLoading ? "#92400e" : "#166534" }}>
          {isLoading ? "⏳ loading" : "✓ has data"}
        </span>
        {isFetching && !isLoading && (
          <span style={{ ...s.badge, background: "#dbeafe", color: "#1d4ed8" }}>↻ background fetch</span>
        )}
        <span style={{ ...s.badge, background: isStale ? "#fee2e2" : "#dcfce7", color: isStale ? "#991b1b" : "#166534" }}>
          {isStale ? "🟡 stale" : "🟢 fresh"}
        </span>
      </div>

      {/* Metrics */}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <Metric label="Fetched at"   value={data.fetchedAt} />
          <Metric label="Data age"     value={`${age}s`} />
          <Metric label="Fetch #"      value={String(data.fetchCount)} />
          <Metric label="API calls"    value={String(fetchCount)} bold />
        </div>
      )}

      {isLoading && <Spinner />}

      {/* Code */}
      <pre style={{ ...s.code, fontSize: 10.5 }}>{
        `useQuery({
  queryKey: ["${cacheKey}"],
  queryFn:  fetchData,
  staleTime: ${staleTime === Infinity ? "Infinity" : staleTime.toLocaleString()},
})`
      }</pre>
    </div>
  );
};

// ─── Patterns view ────────────────────────────────────────────────────────────

const PatternsView = () => {
  const [patternTab, setPatternTab] = useState<"invalidation" | "prefetch" | "dependent">("invalidation");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={s.subTabs}>
        {(["invalidation", "prefetch", "dependent"] as const).map((t) => (
          <button key={t} onClick={() => setPatternTab(t)}
            style={{ ...s.subTab, ...(patternTab === t ? s.subTabActive : {}) }}>
            {t === "invalidation" ? "♻️ Invalidation" : t === "prefetch" ? "🚀 Prefetch" : "🔗 Dependent"}
          </button>
        ))}
      </div>
      {patternTab === "invalidation" && <InvalidationDemo />}
      {patternTab === "prefetch"     && <PrefetchDemo />}
      {patternTab === "dependent"    && <DependentDemo />}
    </div>
  );
};

// ── Pattern 1: Invalidation after mutation ────────────────────────────────────

const InvalidationDemo = () => {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [log, setLog] = useState<string[]>(["Ready. Add a post to trigger invalidation."]);

  const addLog = (msg: string) => setLog((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 5)]);

  const { data: posts = [], isLoading, isFetching } = useQuery({
    queryKey: ["cache-posts"],
    queryFn:  () => { addLog("fetchPosts() called — network request!"); return fetchPosts(); },
    staleTime: Infinity,  // Never auto-refetch — only invalidation triggers it
  });

  const mutation = useMutation({
    mutationFn: (t: string) => createPost(t),
    onSuccess: () => {
      addLog("Mutation succeeded → invalidating [cache-posts]");
      qc.invalidateQueries({ queryKey: ["cache-posts"] });
    },
  });

  const handleAdd = () => {
    if (!title.trim()) return;
    addLog(`createPost("${title}") called`);
    mutation.mutate(title);
    setTitle("");
  };

  return (
    <div style={s.twoCol}>
      <div style={s.card}>
        <h3 style={s.cardTitle}>Cache Invalidation</h3>
        <p style={s.p}>
          The posts list has <code style={s.inlineCode}>staleTime: Infinity</code> — it never auto-refetches.
          After a successful mutation, <code style={s.inlineCode}>invalidateQueries</code> marks it stale and triggers a refetch.
        </p>
        <pre style={s.code}>{INVALIDATION_CODE}</pre>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New post title…"
            style={{ flex: 1, padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
          <button onClick={handleAdd} disabled={mutation.isPending || !title.trim()} style={s.actionBtn}>
            {mutation.isPending ? "Adding…" : "Add Post"}
          </button>
        </div>

        <div style={{ marginTop: 12, background: "#0f172a", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Log</div>
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: 11, color: i === 0 ? "#86efac" : "#64748b", lineHeight: 1.6, fontFamily: "monospace" }}>{entry}</div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ ...s.cardTitle, margin: 0 }}>Posts List</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {isFetching && <span style={{ ...s.badge, background: "#dbeafe", color: "#1d4ed8" }}>↻ refetching</span>}
            <span style={{ ...s.badge, background: "#f1f5f9", color: "#475569" }}>{posts.length} posts</span>
          </div>
        </div>
        {isLoading ? <Spinner /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {posts.slice(0, 6).map((p) => <PostRow key={p.id} post={p} />)}
            {posts.length > 6 && <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>+{posts.length - 6} more</div>}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Pattern 2: Prefetch on hover ──────────────────────────────────────────────

const PrefetchDemo = () => {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoverLog, setHoverLog] = useState<string[]>([]);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["prefetch-posts"],
    queryFn:  () => fetchPosts(),
    staleTime: 60_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["prefetch-post", selectedId],
    queryFn:  () => fetchPostById(selectedId!),
    enabled:  selectedId !== null,  // only fetch when a post is selected
    staleTime: 60_000,
  });

  const handleHover = (id: number) => {
    const cached = qc.getQueryData(["prefetch-post", id]);
    if (!cached) {
      setHoverLog((l) => [`Hovering #${id} → prefetching…`, ...l.slice(0, 4)]);
      qc.prefetchQuery({
        queryKey: ["prefetch-post", id],
        queryFn:  () => fetchPostById(id),
        staleTime: 60_000,
      });
    } else {
      setHoverLog((l) => [`Hovering #${id} → already cached ✓`, ...l.slice(0, 4)]);
    }
  };

  return (
    <div style={s.twoCol}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>Prefetch on Hover</h3>
          <p style={s.p}>
            On <strong>hover</strong>, call <code style={s.inlineCode}>prefetchQuery</code> — data loads in the background.
            By the time you <strong>click</strong>, the data is already in cache → zero loading state.
          </p>
          <pre style={s.code}>{PREFETCH_CODE}</pre>
        </div>

        <div style={{ ...s.card, background: "#0f172a" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Hover Log</div>
          {hoverLog.length === 0 && <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>Hover a post to see prefetching…</div>}
          {hoverLog.map((entry, i) => (
            <div key={i} style={{ fontSize: 11, color: i === 0 ? "#86efac" : "#475569", fontFamily: "monospace", lineHeight: 1.6 }}>{entry}</div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        {isLoading ? <Spinner /> : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {posts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  onMouseEnter={() => handleHover(p.id)}
                  onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                  style={{
                    ...s.listRow,
                    background:  p.id === selectedId ? "#eff6ff" : "#fff",
                    borderColor: p.id === selectedId ? "#3b82f6" : "#e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{p.author} · {p.readTime}min</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>hover → click</span>
                </div>
              ))}
            </div>

            {selectedId && (
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
                {detailLoading ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Spinner /><span style={{ fontSize: 13, color: "#6b7280" }}>Loading… (wasn't prefetched)</span>
                  </div>
                ) : detail ? (
                  <>
                    <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, marginBottom: 8 }}>✓ Instant — served from prefetch cache</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.title}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{detail.excerpt}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <span style={{ ...s.badge, background: "#dbeafe", color: "#1d4ed8" }}>{detail.category}</span>
                      <span style={{ ...s.badge, background: "#f1f5f9", color: "#475569" }}>{detail.readTime} min read</span>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Pattern 3: Dependent queries ──────────────────────────────────────────────

const DependentDemo = () => {
  const [category, setCategory] = useState<Post["category"] | "">("");

  // Step 1: always fetch all posts
  const { data: allPosts = [], isLoading: loadingAll } = useQuery<Post[]>({
    queryKey: ["dep-posts"],
    queryFn:  () => fetchPosts(),
    staleTime: 60_000,
  });

  // Step 2: fetch filtered posts — ONLY when a category is selected
  const { data: filtered = [], isLoading: loadingFiltered, isFetching } = useQuery<Post[]>({
    queryKey: ["dep-posts", category],
    queryFn:  () => fetchPosts(category as Post["category"]),
    enabled:  category !== "",   // ← the key: disabled until category is chosen
    staleTime: 60_000,
  });

  const display = category ? filtered : allPosts;
  const isLoading = category ? loadingFiltered : loadingAll;

  return (
    <div style={s.twoCol}>
      <div style={s.card}>
        <h3 style={s.cardTitle}>Dependent Queries (enabled flag)</h3>
        <p style={s.p}>
          The filtered query has <code style={s.inlineCode}>enabled: category !== ""</code>.
          React Query only runs it when a category is chosen — before that, it stays idle.
          This prevents unnecessary requests.
        </p>
        <pre style={s.code}>{DEPENDENT_CODE}</pre>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Query states:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <QueryState label={`["dep-posts"]`}          active={true}           fetching={loadingAll} />
            <QueryState label={`["dep-posts", category]`} active={category !== ""} fetching={isFetching} />
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setCategory("")} style={{ ...s.catBtn, ...(category === "" ? s.catBtnActive : {}) }}>All posts</button>
          {(["tech", "design", "product"] as const).map((c) => (
            <button key={c} onClick={() => setCategory(c)} style={{ ...s.catBtn, ...(category === c ? s.catBtnActive : {}) }}>
              {c}
            </button>
          ))}
        </div>

        {category !== "" && (
          <div style={{ marginBottom: 12, fontSize: 12, color: "#6b7280" }}>
            Enabled: <code style={s.inlineCode}>["dep-posts", "{category}"]</code>
            {isFetching && <span style={{ color: "#3b82f6", marginLeft: 8 }}>↻ fetching…</span>}
          </div>
        )}

        {isLoading ? <Spinner /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {display.map((p) => <PostRow key={p.id} post={p} />)}
            {display.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 24 }}>No posts.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Shared small components ──────────────────────────────────────────────────

const Metric = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
    <span style={{ color: "#6b7280" }}>{label}</span>
    <span style={{ fontWeight: bold ? 800 : 600, color: bold ? "#111827" : "#374151" }}>{value}</span>
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
    <div style={{ width: 22, height: 22, border: "3px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "cl-spin 0.7s linear infinite" }} />
  </div>
);

const PostRow = ({ post }: { post: Post }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
    <span style={{ ...s.badge, ...CAT_COLORS[post.category] }}>{post.category}</span>
    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{post.title}</span>
    <span style={{ fontSize: 11, color: "#9ca3af" }}>{post.readTime}m</span>
  </div>
);

const QueryState = ({ label, active, fetching }: { label: string; active: boolean; fetching: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e5e7eb" }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? (fetching ? "#f59e0b" : "#22c55e") : "#d1d5db", flexShrink: 0 }} />
    <code style={{ fontSize: 11, flex: 1 }}>{label}</code>
    <span style={{ fontSize: 11, fontWeight: 700, color: active ? (fetching ? "#92400e" : "#166534") : "#9ca3af" }}>
      {active ? (fetching ? "fetching" : "active") : "idle (disabled)"}
    </span>
  </div>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const LIFECYCLE = [
  { icon: "⏳", state: "LOADING",   color: "#3b82f6", desc: "First fetch, no data yet" },
  { icon: "🟢", state: "FRESH",    color: "#22c55e", desc: "Data in cache, no refetch" },
  { icon: "🟡", state: "STALE",    color: "#f59e0b", desc: "Background refetch on mount" },
  { icon: "💤", state: "INACTIVE", color: "#9ca3af", desc: "Component unmounted" },
  { icon: "🗑️", state: "DELETED",  color: "#ef4444", desc: "gcTime expired, cleared" },
];

const QUERY_KEY_EXAMPLES = [
  { label: "All posts",       key: `queryKey: ["posts"]`,               desc: "One cache entry for all posts" },
  { label: "Filtered",        key: `queryKey: ["posts", "tech"]`,       desc: "Separate entry for tech posts — different cache" },
  { label: "Single item",     key: `queryKey: ["posts", 5]`,            desc: "Separate entry for post #5" },
  { label: "With pagination", key: `queryKey: ["posts", { page: 2 }]`,  desc: "Each page has its own cache entry" },
];

const INVALIDATION_CODE = `const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    // Mark ["cache-posts"] stale → triggers refetch
    queryClient.invalidateQueries({
      queryKey: ["cache-posts"],
    });
  },
});`;

const PREFETCH_CODE = `const queryClient = useQueryClient();

// On hover — warm the cache in background
const handleHover = (id: number) => {
  queryClient.prefetchQuery({
    queryKey: ["post", id],
    queryFn:  () => fetchPostById(id),
    staleTime: 60_000,
  });
};

// On click — data is already cached → instant
<div onMouseEnter={() => handleHover(post.id)}
     onClick={() => setSelected(post.id)}>`;

const DEPENDENT_CODE = `// Step 1: always fetch
const { data: allPosts } = useQuery({
  queryKey: ["posts"],
  queryFn:  fetchPosts,
});

// Step 2: only fetch when category chosen
const { data: filtered } = useQuery({
  queryKey: ["posts", category],
  queryFn:  () => fetchPosts(category),
  enabled:  category !== "",  // ← idle until true
});`;

const CAT_COLORS: Record<Post["category"], React.CSSProperties> = {
  tech:    { background: "#dbeafe", color: "#1d4ed8" },
  design:  { background: "#ede9fe", color: "#6d28d9" },
  product: { background: "#dcfce7", color: "#166534" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:        { fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" },
  header:      { marginBottom: 28 },
  h2:          { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 6px" },
  subtitle:    { color: "#6b7280", margin: "0 0 20px" },
  tabs:        { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" },
  tab:         { padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: "#6b7280", fontFamily: "inherit" },
  tabActive:   { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  subTabs:     { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 8, padding: 3 },
  subTab:      { padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: "transparent", color: "#6b7280", fontFamily: "inherit" },
  subTabActive:{ background: "#fff", color: "#111827", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  card:        { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 },
  cardTitle:   { fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 12px" },
  twoCol:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  halfCard:    { background: "#f8fafc", border: "1.5px solid", borderRadius: 10, padding: 16 },
  p:           { fontSize: 13, color: "#374151", lineHeight: 1.65, margin: "0 0 12px" },
  timeline:    { display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" },
  code:        { fontSize: 11.5, lineHeight: 1.75, background: "#0f172a", color: "#e2e8f0", padding: "10px 14px", borderRadius: 8, margin: 0, fontFamily: "monospace", overflow: "auto" },
  inlineCode:  { fontSize: 12, background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", color: "#374151" },
  badge:       { padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" as const },
  actionBtn:   { padding: "9px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" as const },
  lifecycleBox:{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 14px", background: "#f8fafc", border: "1.5px solid", borderRadius: 10, minWidth: 100, flexShrink: 0 },
  listRow:     { display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", border: "1.5px solid", borderRadius: 8, transition: "background 0.15s, border-color 0.15s" },
  catBtn:      { padding: "6px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
  catBtnActive:{ background: "#3b82f6", borderColor: "#3b82f6", color: "#fff" },
};

export default CachingStrategiesDemo;
