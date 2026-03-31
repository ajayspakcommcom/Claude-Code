// FILE: src/routes/users/index.tsx
// ROUTE: /users
//
// A folder = a route segment. index.tsx inside the folder = the parent list page.
// Child route files in the same folder become nested routes.

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

const USERS = [
  { id: "1", name: "Alice Johnson",  role: "Admin"     },
  { id: "2", name: "Bob Smith",      role: "Developer" },
  { id: "3", name: "Carol White",    role: "Designer"  },
  { id: "4", name: "Dave Brown",     role: "Manager"   },
];

export const Route = createFileRoute("/users/")({
  // loader runs before render — return value is fully typed in useLoaderData
  loader: async () => {
    await new Promise((r) => setTimeout(r, 100)); // simulate fetch
    return USERS;
  },
  component: () => {
    const users = Route.useLoaderData();

    return (
      <div style={{ display: "flex", gap: "24px" }}>
        <div style={{ minWidth: "180px" }}>
          <h2>👥 Users</h2>
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
