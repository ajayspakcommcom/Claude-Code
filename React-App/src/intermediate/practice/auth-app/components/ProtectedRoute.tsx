// TOPIC: Route Guards
//
// Two guard components:
//
//   ProtectedRoute — redirects unauthenticated users to the login page.
//                    While the session is being restored (status: "loading"),
//                    shows a spinner so the user doesn't see a flash of the
//                    login page before the token is validated.
//
//   RoleGuard      — renders children only if the user has the required role.
//                    Otherwise shows an "Access Denied" view.
//                    Used inside already-protected routes.
//
// Usage:
//   <ProtectedRoute navigate={setPage}>
//     <DashboardPage />
//   </ProtectedRoute>
//
//   <ProtectedRoute navigate={setPage}>
//     <RoleGuard role="admin" navigate={setPage}>
//       <AdminPage />
//     </RoleGuard>
//   </ProtectedRoute>

import React from "react";
import { useAuth } from "../hooks/useAuth";
import type { Page, Role } from "../types";

// ─── Spinner (inline — no CSS dependency) ─────────────────────────────────────

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <div
      style={{
        width:  40,
        height: 40,
        border: "4px solid #e5e7eb",
        borderTopColor: "#3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children:  React.ReactNode;
  navigate:  (page: Page) => void;
}

export const ProtectedRoute = ({ children, navigate }: ProtectedRouteProps) => {
  const { isAuth, status } = useAuth();

  // Session restore in progress — wait before deciding
  if (status === "loading") return <Spinner />;

  // Not authenticated — redirect to login
  if (!isAuth) {
    // Use setTimeout(0) to defer navigation out of render phase
    setTimeout(() => navigate("login"), 0);
    return null;
  }

  return <>{children}</>;
};

// ─── RoleGuard ────────────────────────────────────────────────────────────────

interface RoleGuardProps {
  role:      Role;
  children:  React.ReactNode;
  navigate:  (page: Page) => void;
}

export const RoleGuard = ({ role, children, navigate }: RoleGuardProps) => {
  const { hasRole, fullName } = useAuth();

  if (!hasRole(role)) {
    return (
      <div style={styles.denied}>
        <div style={styles.deniedCard}>
          <span style={styles.deniedIcon}>🚫</span>
          <h2 style={styles.deniedTitle}>Access Denied</h2>
          <p style={styles.deniedText}>
            Hi {fullName}, this page requires the <strong>{role}</strong> role.
          </p>
          <button style={styles.backBtn} onClick={() => navigate("dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  denied: {
    display:        "flex",
    justifyContent: "center",
    alignItems:     "center",
    minHeight:      "60vh",
  },
  deniedCard: {
    textAlign:    "center",
    padding:      "48px 40px",
    background:   "#fff",
    borderRadius: 12,
    boxShadow:    "0 4px 24px rgba(0,0,0,0.08)",
    maxWidth:     400,
  },
  deniedIcon:  { fontSize: 48 },
  deniedTitle: { fontSize: 24, fontWeight: 700, color: "#1f2937", marginTop: 16 },
  deniedText:  { color: "#6b7280", marginTop: 8 },
  backBtn: {
    marginTop:    24,
    padding:      "10px 24px",
    background:   "#3b82f6",
    color:        "#fff",
    border:       "none",
    borderRadius: 8,
    cursor:       "pointer",
    fontWeight:   600,
  },
};
