// TOPIC: Auth App — Root Component
//
// Production patterns demonstrated here:
//
//   1. Provider setup   — Redux store + React Query client wrapped at the root
//   2. Session restore  — on mount, call /auth/me if a token exists in storage
//   3. State-based router — simple currentPage state replaces a router library
//                           (identical concept to React Router / TanStack Router)
//   4. Navbar           — shows user avatar + role, hides on auth pages
//   5. injectStore      — passes Redux dispatch to the Axios interceptor
//                          (needed for silent token refresh → force logout)
//   6. ForgotPasswordPage — inline (simple email form, no separate file needed)
//   7. AdminPage        — inline with RoleGuard wrapping

import React, { useEffect, useState } from "react";
import { Provider }            from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store, useAppDispatch, useAppSelector } from "./store/store";
import { injectStore }         from "./api/client";
import { restoreSessionThunk } from "./store/authSlice";
import { selectIsAuth, selectAuthStatus } from "./store/authSlice";
import { useAuth }             from "./hooks/useAuth";
import { ProtectedRoute, RoleGuard } from "./components/ProtectedRoute";
import { LoginPage }           from "./pages/LoginPage";
import { RegisterPage }        from "./pages/RegisterPage";
import { DashboardPage }       from "./pages/DashboardPage";
import { ProfilePage }         from "./pages/ProfilePage";
import type { Page }           from "./types";

// ─── React Query client ───────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry:     1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Inject store into Axios interceptor (must run before any API calls) ──────

injectStore(store.dispatch);

// ─── Forgot Password page (simple — inline) ───────────────────────────────────

const ForgotPasswordPage = ({ navigate }: { navigate: (p: Page) => void }) => {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate API
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={fp.page}>
      <div style={fp.card}>
        {sent ? (
          <>
            <div style={fp.icon}>📧</div>
            <h2 style={fp.title}>Check your inbox</h2>
            <p style={fp.text}>
              We sent a reset link to <strong>{email}</strong>.
              It expires in 15 minutes.
            </p>
            <button style={fp.btn} onClick={() => navigate("login")}>Back to login</button>
          </>
        ) : (
          <>
            <h2 style={fp.title}>Forgot password?</h2>
            <p style={fp.text}>Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit} style={fp.form}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={fp.input}
              />
              <button type="submit" disabled={loading} style={fp.btn}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <button style={fp.link} onClick={() => navigate("login")}>← Back to login</button>
          </>
        )}
      </div>
    </div>
  );
};

const fp: Record<string, React.CSSProperties> = {
  page:  { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f3f4f6" },
  card:  { background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 400, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" },
  icon:  { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 8px" },
  text:  { color: "#6b7280", lineHeight: 1.6 },
  form:  { display: "flex", flexDirection: "column", gap: 12, marginTop: 20 },
  input: { padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 15 },
  btn:   { padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  link:  { background: "none", border: "none", color: "#6b7280", cursor: "pointer", marginTop: 16, fontSize: 14 },
};

// ─── Admin page (inline with RoleGuard) ──────────────────────────────────────

const AdminPage = ({ navigate }: { navigate: (p: Page) => void }) => (
  <RoleGuard role="admin" navigate={navigate}>
    <div style={ap.page}>
      <button style={ap.back} onClick={() => navigate("dashboard")}>← Dashboard</button>
      <h1 style={ap.title}>🛡️ Admin Area</h1>
      <div style={ap.grid}>
        {[
          { icon: "👥", label: "Users",      count: 1_248 },
          { icon: "📊", label: "Sessions",   count: 87    },
          { icon: "🚨", label: "Alerts",     count: 3     },
          { icon: "📋", label: "Audit Logs", count: 9_421 },
        ].map(({ icon, label, count }) => (
          <div key={label} style={ap.card}>
            <span style={ap.cardIcon}>{icon}</span>
            <div style={ap.cardCount}>{count.toLocaleString()}</div>
            <div style={ap.cardLabel}>{label}</div>
          </div>
        ))}
      </div>
      <div style={ap.section}>
        <h2 style={ap.sectionTitle}>Recent Registrations</h2>
        <table style={ap.table}>
          <thead>
            <tr>
              <th style={ap.th}>User</th>
              <th style={ap.th}>Role</th>
              <th style={ap.th}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Alice Admin",  role: "admin",     joined: "2024-01-01" },
              { name: "Bob User",     role: "user",      joined: "2024-02-01" },
              { name: "Carol Mod",    role: "moderator", joined: "2024-03-01" },
            ].map((u) => (
              <tr key={u.name}>
                <td style={ap.td}>{u.name}</td>
                <td style={ap.td}><span style={ap.rolePill}>{u.role}</span></td>
                <td style={ap.td}>{u.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </RoleGuard>
);

const ap: Record<string, React.CSSProperties> = {
  page:        { maxWidth: 900, margin: "0 auto", padding: "32px 24px" },
  back:        { background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 0, fontSize: 14, marginBottom: 16 },
  title:       { fontSize: 26, fontWeight: 700, color: "#111827", marginBottom: 28 },
  grid:        { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 },
  card:        { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px 20px", textAlign: "center" },
  cardIcon:    { fontSize: 32 },
  cardCount:   { fontSize: 28, fontWeight: 700, color: "#111827", marginTop: 8 },
  cardLabel:   { fontSize: 13, color: "#6b7280", marginTop: 4 },
  section:     { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 },
  sectionTitle:{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" },
  table:       { width: "100%", borderCollapse: "collapse" },
  th:          { textAlign: "left", padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: 0.5 },
  td:          { padding: "12px 16px", fontSize: 14, color: "#374151", borderBottom: "1px solid #f3f4f6" },
  rolePill:    { padding: "2px 10px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 20, fontSize: 12, fontWeight: 600 },
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = ({ currentPage, navigate }: { currentPage: Page; navigate: (p: Page) => void }) => {
  const { user, initials, isAdmin, logout } = useAuth();
  if (!user) return null;

  return (
    <nav style={nav.bar}>
      <div style={nav.brand} onClick={() => navigate("dashboard")}>
        🔐 AuthApp
      </div>
      <div style={nav.links}>
        <NavLink label="Dashboard" active={currentPage === "dashboard"} onClick={() => navigate("dashboard")} />
        <NavLink label="Profile"   active={currentPage === "profile"}   onClick={() => navigate("profile")}   />
        {isAdmin && <NavLink label="Admin" active={currentPage === "admin"} onClick={() => navigate("admin")} />}
      </div>
      <div style={nav.right}>
        <div style={nav.avatar} title={`${user.firstName} ${user.lastName}`}>
          {initials}
        </div>
        <button style={nav.logoutBtn} onClick={() => logout()}>Sign out</button>
      </div>
    </nav>
  );
};

const NavLink = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{ ...nav.link, ...(active ? nav.linkActive : {}) }}
  >
    {label}
  </button>
);

const nav: Record<string, React.CSSProperties> = {
  bar:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100 },
  brand:     { fontSize: 18, fontWeight: 700, color: "#111827", cursor: "pointer", userSelect: "none" },
  links:     { display: "flex", gap: 4 },
  link:      { background: "none", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#6b7280" },
  linkActive: { background: "#eff6ff", color: "#1d4ed8" },
  right:     { display: "flex", alignItems: "center", gap: 12 },
  avatar:    { width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 },
  logoutBtn: { padding: "6px 14px", background: "none", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#6b7280" },
};

// ─── Inner app (has access to Redux + React Query) ────────────────────────────

const AppContent = () => {
  const dispatch   = useAppDispatch();
  const isAuth     = useAppSelector(selectIsAuth);
  const authStatus = useAppSelector(selectAuthStatus);
  const [page, setPage] = useState<Page>("login");

  // On mount: try to restore session if a token is saved
  useEffect(() => {
    const saved = localStorage.getItem("auth_access_token");
    if (saved) {
      dispatch(restoreSessionThunk());
    }
  }, [dispatch]);

  // When auth state changes, redirect appropriately
  useEffect(() => {
    if (isAuth && (page === "login" || page === "register" || page === "forgot-password")) {
      setPage("dashboard");
    }
    if (!isAuth && authStatus === "unauthenticated" && page !== "register" && page !== "forgot-password") {
      setPage("login");
    }
  }, [isAuth, authStatus, page]);

  const authPages: Page[] = ["login", "register", "forgot-password"];
  const showNav = isAuth && !authPages.includes(page);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {showNav && <Navbar currentPage={page} navigate={setPage} />}

      {/* Router — switch on currentPage */}
      {page === "login"          && <LoginPage           navigate={setPage} />}
      {page === "register"       && <RegisterPage        navigate={setPage} />}
      {page === "forgot-password"&& <ForgotPasswordPage  navigate={setPage} />}

      {page === "dashboard"      && (
        <ProtectedRoute navigate={setPage}>
          <DashboardPage navigate={setPage} />
        </ProtectedRoute>
      )}

      {page === "profile"        && (
        <ProtectedRoute navigate={setPage}>
          <ProfilePage navigate={setPage} />
        </ProtectedRoute>
      )}

      {page === "admin"          && (
        <ProtectedRoute navigate={setPage}>
          <AdminPage navigate={setPage} />
        </ProtectedRoute>
      )}
    </div>
  );
};

// ─── Root export ──────────────────────────────────────────────────────────────

const AuthApp = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  </Provider>
);

export default AuthApp;
