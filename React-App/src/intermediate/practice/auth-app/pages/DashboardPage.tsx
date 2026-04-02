// TOPIC: Dashboard — Protected Page + React Query + Role-based UI
//
// Production patterns:
//   - useQuery to fetch user activity stats (server state, not Redux)
//   - Optimistic "refresh" — show stale data while refetching in background
//   - Role-based UI: admin sees extra controls, moderator sees moderation panel
//   - Derived data with useMemo — sort/filter without re-running on every render
//   - Skeleton loading — show bone layout while data loads (better UX than spinner)

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import type { Page } from "../types";

// ─── Mock API: user activity stats ───────────────────────────────────────────

interface ActivityItem {
  id:        number;
  action:    string;
  timestamp: string;
  status:    "success" | "warning" | "info";
}

interface DashboardStats {
  totalLogins:   number;
  lastLoginAt:   string;
  sessionsActive: number;
  recentActivity: ActivityItem[];
}

const fetchDashboardStats = async (userId: string): Promise<DashboardStats> => {
  await new Promise((r) => setTimeout(r, 800));
  return {
    totalLogins:    42,
    lastLoginAt:    new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sessionsActive: 1,
    recentActivity: [
      { id: 1, action: "Logged in",              timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(), status: "success" },
      { id: 2, action: "Updated profile",         timestamp: new Date(Date.now() - 5 * 3600_000).toISOString(), status: "info"    },
      { id: 3, action: "Failed login attempt",    timestamp: new Date(Date.now() - 24 * 3600_000).toISOString(), status: "warning" },
      { id: 4, action: "Changed password",        timestamp: new Date(Date.now() - 48 * 3600_000).toISOString(), status: "success" },
      { id: 5, action: "Logged in from new device", timestamp: new Date(Date.now() - 72 * 3600_000).toISOString(), status: "warning" },
    ],
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon }: { label: string; value: string | number; icon: string }) => (
  <div style={s.statCard}>
    <span style={s.statIcon}>{icon}</span>
    <div>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div style={{ ...s.statCard, ...s.skeleton }} />
);

const statusDot: Record<string, string> = {
  success: "#22c55e",
  warning: "#f97316",
  info:    "#3b82f6",
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h    = Math.floor(diff / 3_600_000);
  const d    = Math.floor(h / 24);
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  return "just now";
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  navigate: (page: Page) => void;
}

export const DashboardPage = ({ navigate }: Props) => {
  const { user, fullName, initials, isAdmin, isMod, logout } = useAuth();

  const { data: stats, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey:  ["dashboard-stats", user?.id],
    queryFn:   () => fetchDashboardStats(user!.id),
    enabled:   !!user,
    staleTime: 30_000,   // consider fresh for 30 s
  });

  // Sort activity newest-first (memoized — only recalculates when stats change)
  const sortedActivity = useMemo(
    () => [...(stats?.recentActivity ?? [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    [stats]
  );

  return (
    <div style={s.page}>

      {/* Welcome header */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.welcome}>Good morning, {user?.firstName} 👋</h1>
          <p style={s.sub}>Here's what's happening with your account.</p>
        </div>
        <button style={s.logoutBtn} onClick={() => logout()}>Sign out</button>
      </div>

      {/* Role badge */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ ...s.badge, ...(isAdmin ? s.badgeAdmin : isMod ? s.badgeMod : s.badgeUser) }}>
          {user?.role?.toUpperCase()}
        </span>
        {isFetching && !isLoading && (
          <span style={s.refreshing}>↻ Refreshing…</span>
        )}
      </div>

      {/* Stats row */}
      <div style={s.statsGrid}>
        {isLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : isError ? (
          <div style={s.errorBox}>
            Failed to load stats.{" "}
            <button style={s.retryBtn} onClick={() => refetch()}>Retry</button>
          </div>
        ) : (
          <>
            <StatCard label="Total logins"    value={stats!.totalLogins}    icon="🔑" />
            <StatCard label="Active sessions" value={stats!.sessionsActive} icon="💻" />
            <StatCard label="Last login"      value={timeAgo(stats!.lastLoginAt)} icon="🕐" />
          </>
        )}
      </div>

      {/* Role-specific panels */}
      {isAdmin && (
        <div style={{ ...s.panel, ...s.adminPanel }}>
          <h3 style={s.panelTitle}>🛡️ Admin Panel</h3>
          <p style={s.panelText}>You have full system access. Manage users, view audit logs, and configure system settings.</p>
          <div style={s.adminBtns}>
            <button style={s.adminBtn}>Manage Users</button>
            <button style={s.adminBtn}>Audit Logs</button>
            <button style={s.adminBtn}>System Settings</button>
          </div>
        </div>
      )}

      {isMod && (
        <div style={{ ...s.panel, ...s.modPanel }}>
          <h3 style={s.panelTitle}>🔧 Moderation Panel</h3>
          <p style={s.panelText}>Review reported content and manage community guidelines.</p>
          <div style={s.adminBtns}>
            <button style={s.adminBtn}>Review Reports</button>
            <button style={s.adminBtn}>Community Rules</button>
          </div>
        </div>
      )}

      {/* Activity feed */}
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <h3 style={s.panelTitle}>Recent Activity</h3>
          <button style={s.link} onClick={() => refetch()}>Refresh</button>
        </div>

        {isLoading ? (
          <div style={s.skeletonList}>
            {[1, 2, 3].map((n) => <div key={n} style={s.skeletonRow} />)}
          </div>
        ) : (
          <ul style={s.activityList}>
            {sortedActivity.map((item) => (
              <li key={item.id} style={s.activityItem}>
                <span
                  style={{ ...s.activityDot, background: statusDot[item.status] }}
                  aria-hidden="true"
                />
                <span style={s.activityAction}>{item.action}</span>
                <span style={s.activityTime}>{timeAgo(item.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick actions */}
      <div style={s.quickActions}>
        <button style={s.actionBtn} onClick={() => navigate("profile")}>
          <span>👤</span>
          <span>Edit Profile</span>
        </button>
        {isAdmin && (
          <button style={s.actionBtn} onClick={() => navigate("admin")}>
            <span>⚙️</span>
            <span>Admin Area</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:         { maxWidth: 800, margin: "0 auto", padding: "32px 24px" },
  topBar:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  welcome:      { fontSize: 26, fontWeight: 700, color: "#111827", margin: 0 },
  sub:          { color: "#6b7280", marginTop: 4 },
  logoutBtn:    { padding: "8px 20px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  badge:        { display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 },
  badgeAdmin:   { background: "#fef3c7", color: "#92400e" },
  badgeMod:     { background: "#ede9fe", color: "#6d28d9" },
  badgeUser:    { background: "#dcfce7", color: "#166534" },
  refreshing:   { marginLeft: 12, fontSize: 12, color: "#9ca3af" },
  statsGrid:    { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 },
  statCard:     { display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" },
  statIcon:     { fontSize: 28 },
  statValue:    { fontSize: 24, fontWeight: 700, color: "#111827" },
  statLabel:    { fontSize: 13, color: "#6b7280", marginTop: 2 },
  skeleton:     { height: 84, background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" },
  errorBox:     { gridColumn: "1 / -1", background: "#fef2f2", padding: "20px", borderRadius: 12, color: "#dc2626" },
  retryBtn:     { background: "none", border: "none", color: "#dc2626", cursor: "pointer", textDecoration: "underline" },
  panel:        { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20 },
  adminPanel:   { borderLeft: "4px solid #f59e0b" },
  modPanel:     { borderLeft: "4px solid #8b5cf6" },
  panelHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  panelTitle:   { fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 },
  panelText:    { color: "#6b7280", fontSize: 14, margin: "8px 0 16px" },
  adminBtns:    { display: "flex", gap: 10 },
  adminBtn:     { padding: "8px 16px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 },
  link:         { background: "none", border: "none", color: "#3b82f6", fontSize: 14, cursor: "pointer", padding: 0, fontWeight: 500 },
  skeletonList: { display: "flex", flexDirection: "column", gap: 12 },
  skeletonRow:  { height: 20, background: "#f3f4f6", borderRadius: 4 },
  activityList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 },
  activityItem: { display: "flex", alignItems: "center", gap: 12 },
  activityDot:  { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  activityAction: { flex: 1, fontSize: 14, color: "#374151" },
  activityTime:   { fontSize: 12, color: "#9ca3af" },
  quickActions:   { display: "flex", gap: 12 },
  actionBtn:      { display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14 },
};
