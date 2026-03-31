// FILE: src/routes/__root.tsx
// ROUTE: / (root layout — wraps every page)
//
// CONCEPT: createRootRouteWithContext
// Instead of createRootRoute(), we use createRootRouteWithContext<T>().
// This types the `context` object available in every loader across the app.
// The actual context value is set in main.tsx: createRouter({ context: { theme: 'light' } })

import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import type { RouterContext } from "../main";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div style={{ fontFamily: "sans-serif", maxWidth: "860px", margin: "0 auto", padding: "20px" }}>

      {/* Navigation */}
      <nav style={{ display: "flex", gap: "4px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          // CONCEPT: Link activeOptions — exact: true
          // Without exact:true, "/" would be active on EVERY route (since all paths start with /).
          // exact:true means active only when the URL is exactly "/".
          { to: "/",            label: "Home",      exact: true  },
          { to: "/about",       label: "About",     exact: false },
          { to: "/users",       label: "Users",     exact: false },
          { to: "/products",    label: "Products",  exact: false },
          { to: "/contact",     label: "Contact",   exact: false },
          { to: "/lazy-demo",   label: "Lazy Demo", exact: false },
          { to: "/dashboard",   label: "Dashboard", exact: false },
          { to: "/login",       label: "Login",     exact: false },
        ].map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            // CONCEPT: activeOptions.exact
            // exact: true  → only apply activeProps when URL === to
            // exact: false → apply activeProps when URL starts with to
            activeOptions={{ exact }}
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
