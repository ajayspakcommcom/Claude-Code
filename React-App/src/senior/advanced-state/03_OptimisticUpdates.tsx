// TOPIC: Optimistic Updates
// LEVEL: Senior — Advanced State
//
// ─── WHAT IS AN OPTIMISTIC UPDATE? ───────────────────────────────────────────
//
//   Pessimistic (default):
//     Click → wait for server → update UI
//     User sees a spinner. Feels slow.
//
//   Optimistic:
//     Click → update UI immediately → send request in background
//     If success → keep the change (user never noticed the wait)
//     If failure → ROLL BACK to previous state + show error
//
// ─── THE 3-PHASE PATTERN ─────────────────────────────────────────────────────
//
//   useMutation({
//     mutationFn: apiCall,
//
//     onMutate: async (variables) => {
//       // 1. Cancel in-flight refetches (they'd overwrite our optimistic data)
//       await queryClient.cancelQueries({ queryKey });
//       // 2. Snapshot previous state (needed for rollback)
//       const previous = queryClient.getQueryData(queryKey);
//       // 3. Apply optimistic update to cache immediately
//       queryClient.setQueryData(queryKey, updater);
//       // 4. Return snapshot so onError can roll back
//       return { previous };
//     },
//
//     onError: (err, variables, context) => {
//       // Roll back to snapshot on failure
//       queryClient.setQueryData(queryKey, context.previous);
//     },
//
//     onSettled: () => {
//       // Always re-sync with server truth (success OR failure)
//       queryClient.invalidateQueries({ queryKey });
//     },
//   });

import React, { useState } from "react";
import {
  useQuery, useMutation, useQueryClient,
  QueryClient, QueryClientProvider,
} from "@tanstack/react-query";
import {
  fetchPosts, toggleLike, editPostTitle, deletePost,
  setChaosMode, isChaosMode, avatarBg,
} from "./optimistic/fakeOptimisticApi";
import type { Post } from "./optimistic/fakeOptimisticApi";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const QUERY_KEY = ["opt-posts"];

// ─── Root ─────────────────────────────────────────────────────────────────────

const OptimisticUpdatesDemo = () => (
  <QueryClientProvider client={queryClient}>
    <style>{`@keyframes cl-spin { to { transform: rotate(360deg); } }`}</style>
    <Inner />
  </QueryClientProvider>
);

const Inner = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");
  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.h2}>Optimistic Updates</h2>
        <p style={s.subtitle}>Senior Advanced State — update the UI instantly, roll back if the server says no</p>
        <div style={s.tabs}>
          {(["concepts", "demo"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
              {t === "concepts" ? "📚 Concepts" : "🔬 Live Demo"}
            </button>
          ))}
        </div>
      </div>
      {tab === "concepts" ? <ConceptsView /> : <LiveDemo />}
    </div>
  );
};

// ─── Concepts view ────────────────────────────────────────────────────────────

const ConceptsView = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

    {/* Pessimistic vs Optimistic */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>Pessimistic vs Optimistic</h3>
      <div style={s.twoCol}>
        <div style={{ ...s.halfCard, borderColor: "#f87171" }}>
          <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 10 }}>🐢 Pessimistic (default)</div>
          <div style={s.flow}>
            {["1. User clicks Like", "2. ⏳ Spinner shows", "3. Request sent to server", "4. Server responds (700ms later)", "5. UI updates"].map((step, i) => (
              <div key={i} style={s.flowStep}>
                <span style={{ ...s.dot, background: i < 2 ? "#f87171" : i === 4 ? "#22c55e" : "#9ca3af" }} />
                <span style={{ fontSize: 13 }}>{step}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#fee2e2", borderRadius: 8, fontSize: 12, color: "#991b1b" }}>
            User waits 700ms for every interaction. Feels sluggish.
          </div>
        </div>

        <div style={{ ...s.halfCard, borderColor: "#86efac" }}>
          <div style={{ fontWeight: 700, color: "#166534", marginBottom: 10 }}>⚡ Optimistic</div>
          <div style={s.flow}>
            {["1. User clicks Like", "2. ✅ UI updates INSTANTLY", "3. Request sent to server (background)", "4a. Success → keep change", "4b. Failure → ROLL BACK + show error"].map((step, i) => (
              <div key={i} style={s.flowStep}>
                <span style={{ ...s.dot, background: i === 1 ? "#22c55e" : i === 4 ? "#ef4444" : "#9ca3af" }} />
                <span style={{ fontSize: 13, color: i === 4 ? "#dc2626" : "inherit" }}>{step}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#dcfce7", borderRadius: 8, fontSize: 12, color: "#166534" }}>
            User sees instant feedback. Server call is invisible.
          </div>
        </div>
      </div>
    </div>

    {/* The 3 phases */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>The 3-Phase Pattern</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {PHASES.map((phase, i) => (
          <div key={i} style={{ background: "#f8fafc", borderLeft: `4px solid ${phase.color}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: phase.color, marginBottom: 4 }}>{phase.fn}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10, lineHeight: 1.5 }}>{phase.desc}</div>
            <pre style={s.code}>{phase.code}</pre>
          </div>
        ))}
      </div>
    </div>

    {/* Full pattern */}
    <div style={s.card}>
      <h3 style={s.cardTitle}>Complete Pattern</h3>
      <pre style={s.code}>{FULL_PATTERN}</pre>
    </div>

    {/* When to use */}
    <div style={s.twoCol}>
      <div style={s.card}>
        <h3 style={s.cardTitle}>✅ Good candidates</h3>
        {GOOD_CASES.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
            <span style={{ color: "#22c55e" }}>✓</span>
            <span>{c}</span>
          </div>
        ))}
      </div>
      <div style={s.card}>
        <h3 style={s.cardTitle}>⚠️ Be careful with</h3>
        {CAREFUL_CASES.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
            <span style={{ color: "#f59e0b" }}>!</span>
            <span>{c}</span>
          </div>
        ))}
      </div>
    </div>

  </div>
);

// ─── Live Demo ────────────────────────────────────────────────────────────────

const LiveDemo = () => {
  const qc = useQueryClient();
  const [chaos, setChaos]     = useState(false);
  const [toasts, setToasts]   = useState<{ id: number; msg: string; type: "error" | "info" }[]>([]);
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(null);

  const addToast = (msg: string, type: "error" | "info" = "error") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const toggleChaos = () => {
    const next = !chaos;
    setChaos(next);
    setChaosMode(next);
    addToast(next ? "Chaos mode ON — all requests will fail" : "Chaos mode OFF — requests will succeed", "info");
  };

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: QUERY_KEY,
    queryFn:  fetchPosts,
    staleTime: Infinity,  // only change via mutations
  });

  // ── Like mutation ───────────────────────────────────────────────────────────

  const likeMutation = useMutation({
    mutationFn: (id: number) => toggleLike(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<Post[]>(QUERY_KEY);

      qc.setQueryData<Post[]>(QUERY_KEY, (old = []) =>
        old.map((p) => p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
        )
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      qc.setQueryData(QUERY_KEY, context?.previous);
      addToast("Failed to update like — rolled back");
    },

    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  // ── Edit mutation ───────────────────────────────────────────────────────────

  const editMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => editPostTitle(id, title),

    onMutate: async ({ id, title }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<Post[]>(QUERY_KEY);

      qc.setQueryData<Post[]>(QUERY_KEY, (old = []) =>
        old.map((p) => p.id === id ? { ...p, title } : p)
      );

      setEditing(null);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      qc.setQueryData(QUERY_KEY, context?.previous);
      addToast("Failed to save edit — rolled back");
    },

    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  // ── Delete mutation ─────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePost(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<Post[]>(QUERY_KEY);

      qc.setQueryData<Post[]>(QUERY_KEY, (old = []) => old.filter((p) => p.id !== id));

      return { previous };
    },

    onError: (_err, _id, context) => {
      qc.setQueryData(QUERY_KEY, context?.previous);
      addToast("Failed to delete post — it's back");
    },

    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Like, edit title, or delete posts. Enable <strong>Chaos Mode</strong> to force failures and watch the rollback.
        </p>
        <button onClick={toggleChaos} style={{
          ...s.chaosBtn,
          background:   chaos ? "#ef4444" : "#fff",
          color:        chaos ? "#fff" : "#374151",
          borderColor:  chaos ? "#ef4444" : "#d1d5db",
        }}>
          {chaos ? "💥 Chaos ON" : "💥 Chaos OFF"}
        </button>
      </div>

      {/* Chaos banner */}
      {chaos && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "10px 16px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>💥</span>
          <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 600 }}>Chaos mode: all mutations will fail → watch the UI roll back</span>
        </div>
      )}

      {/* Toast stack */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 100 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: t.type === "error" ? "#ef4444" : "#374151", color: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)", maxWidth: 320,
          }}>
            {t.type === "error" ? "⚠️" : "ℹ️"} {t.msg}
          </div>
        ))}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "cl-spin 0.7s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              editing={editing?.id === post.id ? editing.value : null}
              onStartEdit={() => setEditing({ id: post.id, value: post.title })}
              onEditChange={(v) => setEditing({ id: post.id, value: v })}
              onSaveEdit={() => editing && editMutation.mutate({ id: post.id, title: editing.value })}
              onCancelEdit={() => setEditing(null)}
              onLike={() => likeMutation.mutate(post.id)}
              onDelete={() => deleteMutation.mutate(post.id)}
              likeLoading={likeMutation.isPending && likeMutation.variables === post.id}
              deleteLoading={deleteMutation.isPending && deleteMutation.variables === post.id}
            />
          ))}
          {posts.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>
              All posts deleted.{" "}
              <button onClick={() => qc.invalidateQueries({ queryKey: QUERY_KEY })} style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
                Reload
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mutation annotation */}
      <div style={s.card}>
        <h3 style={{ ...s.cardTitle, marginBottom: 10 }}>What's happening under the hood</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {ANNOTATIONS.map((a, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 12, borderLeft: `3px solid ${a.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{a.action}</div>
              <pre style={{ ...s.code, fontSize: 10.5, margin: 0 }}>{a.code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Post card ────────────────────────────────────────────────────────────────

interface PostCardProps {
  post:          Post;
  editing:       string | null;
  onStartEdit:   () => void;
  onEditChange:  (v: string) => void;
  onSaveEdit:    () => void;
  onCancelEdit:  () => void;
  onLike:        () => void;
  onDelete:      () => void;
  likeLoading:   boolean;
  deleteLoading: boolean;
}

const PostCard = ({
  post, editing, onStartEdit, onEditChange, onSaveEdit, onCancelEdit,
  onLike, onDelete, likeLoading, deleteLoading,
}: PostCardProps) => (
  <div style={s.postCard}>
    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: avatarBg(post.avatar), color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {post.avatar}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{post.author}</div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>{post.time}</div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        {/* Edit button */}
        <button onClick={onStartEdit} style={s.iconBtn} title="Edit title">✏️</button>
        {/* Delete button */}
        <button
          onClick={onDelete}
          disabled={deleteLoading}
          style={{ ...s.iconBtn, opacity: deleteLoading ? 0.5 : 1 }}
          title="Delete"
        >
          {deleteLoading ? "⏳" : "🗑️"}
        </button>
      </div>
    </div>

    {/* Title — editable */}
    {editing !== null ? (
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          autoFocus
          value={editing}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
          style={{ flex: 1, padding: "6px 10px", border: "1.5px solid #3b82f6", borderRadius: 8, fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={onSaveEdit}   style={{ ...s.smallBtn, background: "#3b82f6", color: "#fff", border: "none" }}>Save</button>
        <button onClick={onCancelEdit} style={{ ...s.smallBtn, background: "#fff", color: "#6b7280", border: "1.5px solid #e5e7eb" }}>✕</button>
      </div>
    ) : (
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{post.title}</div>
    )}

    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 1.5 }}>{post.excerpt}</div>

    {/* Tags */}
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
      {post.tags.map((tag) => (
        <span key={tag} style={{ fontSize: 11, padding: "2px 8px", background: "#f1f5f9", color: "#475569", borderRadius: 20 }}>{tag}</span>
      ))}
    </div>

    {/* Like button */}
    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
      <button
        onClick={onLike}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: post.liked ? "#eff6ff" : "transparent",
          border: `1.5px solid ${post.liked ? "#bfdbfe" : "#e5e7eb"}`,
          borderRadius: 8, padding: "6px 14px", cursor: "pointer",
          fontSize: 13, fontWeight: 600,
          color: post.liked ? "#1d4ed8" : "#6b7280",
          transition: "all 0.15s",
        }}
      >
        {post.liked ? "❤️" : "🤍"} {post.likes}
      </button>
    </div>
  </div>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const PHASES = [
  {
    fn:    "onMutate",
    color: "#3b82f6",
    desc:  "Fires before the request. Cancel refetches, snapshot old data, apply optimistic change.",
    code:  `onMutate: async (id) => {
  await qc.cancelQueries({ queryKey });
  const prev = qc.getQueryData(queryKey);
  qc.setQueryData(queryKey, updater);
  return { prev };   // for rollback
}`,
  },
  {
    fn:    "onError",
    color: "#ef4444",
    desc:  "Fires only on failure. Use the snapshot returned from onMutate to roll back.",
    code:  `onError: (err, vars, context) => {
  // context.prev is what onMutate returned
  qc.setQueryData(
    queryKey,
    context.prev
  );
}`,
  },
  {
    fn:    "onSettled",
    color: "#10b981",
    desc:  "Fires after success OR failure. Always re-sync with server to get the true state.",
    code:  `onSettled: () => {
  // Runs after success AND after error
  qc.invalidateQueries({
    queryKey
  });
}`,
  },
];

const FULL_PATTERN = `useMutation({
  mutationFn: (id) => toggleLike(id),

  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ["posts"] });   // 1. stop in-flight refetches
    const previous = queryClient.getQueryData(["posts"]);        // 2. snapshot
    queryClient.setQueryData(["posts"], (old) =>                 // 3. optimistic update
      old.map(p => p.id === id ? { ...p, liked: !p.liked } : p)
    );
    return { previous };                                          // 4. return for rollback
  },

  onError: (err, id, context) => {
    queryClient.setQueryData(["posts"], context.previous);        // roll back on failure
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });      // always re-sync
  },
});`;

const GOOD_CASES = [
  "Like / unlike (toggle — easy to invert)",
  "Follow / unfollow",
  "Delete an item",
  "Checkbox toggle (done / undone)",
  "Reorder items (drag & drop)",
  "Star / bookmark",
];

const CAREFUL_CASES = [
  "Creating a new item (needs server-generated ID)",
  "Payment / financial transactions",
  "Mutations that cascade many other queries",
  "When failure is common (> 10% error rate)",
];

const ANNOTATIONS = [
  { action: "❤️ Like / Unlike", color: "#3b82f6", code: `// onMutate: flip liked + adjust count
p.liked ? likes - 1 : likes + 1
// onError: restore previous posts[]` },
  { action: "✏️ Edit title", color: "#8b5cf6", code: `// onMutate: replace title in cache
old.map(p => p.id === id
  ? { ...p, title: newTitle }
  : p)
// onError: restore previous posts[]` },
  { action: "🗑️ Delete", color: "#ef4444", code: `// onMutate: remove from cache
old.filter(p => p.id !== id)
// onError: restore (post reappears)` },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:      { fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 900, margin: "0 auto" },
  header:    { marginBottom: 28 },
  h2:        { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 6px" },
  subtitle:  { color: "#6b7280", margin: "0 0 20px" },
  tabs:      { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" },
  tab:       { padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: "#6b7280", fontFamily: "inherit" },
  tabActive: { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  card:      { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" },
  twoCol:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  halfCard:  { background: "#f8fafc", border: "1.5px solid", borderRadius: 10, padding: 16 },
  flow:      { display: "flex", flexDirection: "column", gap: 8 },
  flowStep:  { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  dot:       { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  code:      { fontSize: 11.5, lineHeight: 1.75, background: "#0f172a", color: "#e2e8f0", padding: "10px 14px", borderRadius: 8, margin: 0, fontFamily: "monospace", overflow: "auto" },
  postCard:  { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 20px" },
  iconBtn:   { background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 6 },
  smallBtn:  { padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
  chaosBtn:  { padding: "9px 16px", border: "1.5px solid", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" as const, transition: "all 0.15s" },
};

export default OptimisticUpdatesDemo;
