// DASHBOARD ROUTE  →  /demo/dashboard
// PROTECTED ROUTE — demonstrates beforeLoad guard.
//
// beforeLoad runs before the component renders.
// If the user is not authenticated, redirect to /demo/login
// and pass the original path as ?redirect= so login can send them back.

import { createRoute, Link, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { authStore } from "../auth";

const DashboardPage = () => {
  const user = authStore.getUser();

  const handleLogout = () => {
    authStore.logout();
    // Force a page reload to re-trigger the route guard
    window.location.href = "/demo/dashboard";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3>📊 Dashboard</h3>
        <button
          onClick={handleLogout}
          style={{ padding: "6px 12px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>

      <p style={{ color: "green" }}>
        ✅ You are logged in as <strong>{user}</strong>.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "16px" }}>
        {[
          { label: "Total Users",   value: "1,284", color: "#4a90e2" },
          { label: "Revenue",       value: "$9,840", color: "#2ecc71" },
          { label: "Open Tickets",  value: "42",    color: "#e67e22" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: "16px", borderRadius: "8px", background: "#f9f9f9", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color }}>{value}</div>
            <div style={{ fontSize: "13px", color: "#888" }}>{label}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: "16px", fontSize: "13px", color: "#888" }}>
        Try clicking <strong>Logout</strong> then navigating back to{" "}
        <Link to="/demo/dashboard">Dashboard</Link> — you'll be redirected to Login.
      </p>
    </div>
  );
};

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo/dashboard",
  component: DashboardPage,

  // beforeLoad — runs before rendering, ideal for auth guards
  beforeLoad: ({ location }) => {
    if (!authStore.isLoggedIn()) {
      // Redirect to login, passing the current path as ?redirect=
      throw redirect({
        to: "/demo/login",
        search: { redirect: location.href },
      });
    }
  },
});
