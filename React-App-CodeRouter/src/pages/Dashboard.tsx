// FILE: src/pages/Dashboard.tsx
// ROUTE: /dashboard — protected by beforeLoad in router.tsx

import { Link, useNavigate } from "@tanstack/react-router";
import { authStore } from "../auth";

export function DashboardPage() {
  const navigate = useNavigate();
  const user     = authStore.getUser();

  const handleLogout = () => {
    authStore.logout();
    navigate({ to: "/login" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>📊 Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: "6px 12px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
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
      <p style={{ marginTop: "14px", fontSize: "13px", color: "#888" }}>
        Logout then visit <Link to="/dashboard">Dashboard</Link> — <code>beforeLoad</code> in router.tsx redirects you to login.
      </p>
    </div>
  );
}
