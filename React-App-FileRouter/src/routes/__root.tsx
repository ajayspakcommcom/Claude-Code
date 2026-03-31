// FILE: src/routes/__root.tsx
// ROUTE: / (root layout — wraps every page)
//
// In file-based routing:
//   __root.tsx  → the root layout, always rendered
//   index.tsx   → matches /
//   about.tsx   → matches /about
//   users/      → folder = nested route segment
//   _auth.tsx   → pathless layout (no URL segment, just wraps children)
//   $userId.tsx → dynamic segment

import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", padding: "20px" }}>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "4px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { to: "/",          label: "Home"      },
          { to: "/about",     label: "About"     },
          { to: "/users",     label: "Users"     },
          { to: "/dashboard", label: "Dashboard" },
          { to: "/login",     label: "Login"     },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{ padding: "6px 14px", background: "#eee", borderRadius: "4px", textDecoration: "none", color: "#333", fontSize: "14px" }}
            activeProps={{ style: { padding: "6px 14px", background: "#4a90e2", borderRadius: "4px", textDecoration: "none", color: "#fff", fontSize: "14px", fontWeight: "bold" } }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Page renders here */}
      <Outlet />
    </div>
  ),
  notFoundComponent: () => (
    <div style={{ textAlign: "center", color: "#e74c3c" }}>
      <h2>404 — Not Found</h2>
      <Link to="/">Go Home</Link>
    </div>
  ),
});
