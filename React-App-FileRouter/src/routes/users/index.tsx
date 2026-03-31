// FILE: src/routes/users/index.tsx
// ROUTE: /users
//
// CONCEPTS DEMONSTRATED:
//   pendingComponent — shows while the loader is running (> defaultPendingMs from main.tsx)
//   staleTime       — cache the loader result; don't re-fetch on revisit until stale
//   Nested routes   — Outlet renders the selected user detail ($userId) alongside this list

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

const USERS = [
  { id: "1", name: "Alice Johnson",  role: "Admin"     },
  { id: "2", name: "Bob Smith",      role: "Developer" },
  { id: "3", name: "Carol White",    role: "Designer"  },
  { id: "4", name: "Dave Brown",     role: "Manager"   },
];

export const Route = createFileRoute("/users/")({
  // CONCEPT: staleTime
  // After the loader resolves, TanStack Router caches the data for `staleTime` ms.
  // During this window, navigating back to /users does NOT re-run the loader.
  // Once expired, the next visit re-fetches. Great for data that rarely changes.
  staleTime: 10_000, // 10 seconds — visit /about then come back; no refetch within 10s

  // CONCEPT: pendingComponent
  // Shown when the loader takes longer than `defaultPendingMs` (set to 500ms in main.tsx).
  // This prevents a flash on fast connections while still giving feedback on slow ones.
  pendingComponent: () => (
    <div style={{ color: "#888" }}>
      <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
      {" "}Loading users...
    </div>
  ),

  loader: async () => {
    // Simulate a network fetch (1200ms > defaultPendingMs=500 → spinner will show)
    await new Promise((r) => setTimeout(r, 1200));
    return USERS;
  },

  component: () => {
    const users = Route.useLoaderData();

    return (
      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ minWidth: "180px" }}>
          <h2>👥 Users</h2>
          <p style={{ fontSize: "12px", color: "#aaa", margin: "0 0 12px" }}>
            staleTime: 10s — revisit without refetch
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {users.map((u) => (
              <li key={u.id} style={{ marginBottom: "8px" }}>
                <Link
                  to="/users/$userId"
                  params={{ userId: u.id }}
                  style={{ textDecoration: "none", color: "#4a90e2" }}
                  activeProps={{ style: { textDecoration: "none", color: "#4a90e2", fontWeight: "bold" } }}
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
  },
});
