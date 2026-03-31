// ROOT ROUTE
// Every TanStack Router app has one root route.
// It acts as the top-level layout — nav, header, footer go here.
// <Outlet /> is where child routes render their content.

import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

const navLinks = [
  { to: "/demo",            label: "Home" },
  { to: "/demo/about",      label: "About" },
  { to: "/demo/users",      label: "Users" },
  { to: "/demo/dashboard",  label: "Dashboard" },
  { to: "/demo/login",      label: "Login" },
];

const RootLayout = () => (
  <div style={{ fontFamily: "sans-serif", border: "2px solid #4a90e2", borderRadius: "10px", overflow: "hidden" }}>
    {/* Navigation */}
    <nav style={{ background: "#4a90e2", padding: "10px 16px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
      {navLinks.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          style={{ color: "#fff", textDecoration: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "14px" }}
          activeProps={{ style: { color: "#fff", textDecoration: "none", padding: "6px 12px", borderRadius: "4px", fontSize: "14px", background: "rgba(255,255,255,0.25)", fontWeight: "bold" } }}
        >
          {label}
        </Link>
      ))}
    </nav>

    {/* Page content — child routes render here */}
    <div style={{ padding: "20px", minHeight: "200px" }}>
      <Outlet />
    </div>
  </div>
);

export const rootRoute = createRootRoute({
  component: RootLayout,
  // notFoundComponent renders when no route matches
  notFoundComponent: () => (
    <div style={{ textAlign: "center", color: "#e74c3c" }}>
      <h3>404 — Page Not Found</h3>
      <Link to="/demo">Go Home</Link>
    </div>
  ),
});
