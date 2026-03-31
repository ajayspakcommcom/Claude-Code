// FILE: src/pages/Users.tsx
// ROUTE: /users — defined in router.tsx as usersRoute
//
// CONCEPT: getRouteApi() — the code-based way to access route hooks in components
//
// In file-based routing, each route file exports `Route` via createFileRoute(),
// so you call Route.useLoaderData() directly in the same file.
//
// In code-based routing, the route is defined in router.tsx (separate file).
// Importing it back into the component creates a circular dependency.
// Solution: getRouteApi('/users') — returns a typed API for that route's hooks
// without importing the route object itself.

import { Link, Outlet, getRouteApi } from "@tanstack/react-router";

// getRouteApi(path) — typed to the route at that path.
// TypeScript knows the loader return type, search schema, params, etc.
const routeApi = getRouteApi("/users");

export function UsersPage() {
  // Fully typed — same as Route.useLoaderData() in file-based routing
  const users = routeApi.useLoaderData();

  return (
    <div style={{ display: "flex", gap: "24px" }}>
      <div style={{ minWidth: "180px" }}>
        <h2>👥 Users</h2>
        <p style={{ fontSize: "12px", color: "#aaa", margin: "0 0 10px" }}>
          staleTime: 10s · pendingComponent active
        </p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map((u) => (
            <li key={u.id} style={{ marginBottom: "8px" }}>
              <Link
                to="/users/$userId"
                params={{ userId: u.id }}
                style={{ textDecoration: "none", color: "#e67e22" }}
                activeProps={{ style: { textDecoration: "none", color: "#e67e22", fontWeight: "bold" } }}
              >
                {u.name}
              </Link>
              <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "6px" }}>{u.role}</span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, borderLeft: "1px solid #eee", paddingLeft: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
}
