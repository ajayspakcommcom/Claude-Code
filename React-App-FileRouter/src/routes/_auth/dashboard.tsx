// FILE: src/routes/_auth/dashboard.tsx
// ROUTE: /dashboard  (protected by _auth.tsx parent guard)
//
// This file is inside _auth/ folder, so it inherits the auth guard.
// URL is /dashboard (the _auth prefix is invisible in the URL).

import { createFileRoute, Link } from "@tanstack/react-router";
import { authStore } from "../../auth";

export const Route = createFileRoute("/_auth/dashboard")({
  component: () => {
    const user = authStore.getUser();

    const handleLogout = () => {
      authStore.logout();
      window.location.href = "/dashboard"; // re-trigger guard
    };

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>📊 Dashboard</h2>
          <button
            onClick={handleLogout}
            style={{ padding: "6px 12px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>

        <p style={{ color: "green" }}>✅ Logged in as <strong>{user}</strong></p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginTop: "12px" }}>
          {[
            { label: "Users",   value: "1,284", color: "#4a90e2" },
            { label: "Revenue", value: "$9,840", color: "#2ecc71" },
            { label: "Tickets", value: "42",     color: "#e67e22" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: "16px", background: "#f9f9f9", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "bold", color }}>{value}</div>
              <div style={{ fontSize: "13px", color: "#888" }}>{label}</div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: "16px", fontSize: "13px", color: "#888" }}>
          Click Logout, then try visiting <Link to="/dashboard">Dashboard</Link> — you'll be redirected to Login.
        </p>
      </div>
    );
  },
});
