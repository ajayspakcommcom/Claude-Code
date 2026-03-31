// USERS ROUTE  →  /demo/users
// Demonstrates:
//   • Route with loader — fetch data before rendering
//   • Nested child route — /demo/users/$userId
//   • useParams — fully type-safe dynamic segment
//   • useLoaderData — type-safe loader return value
//   • Link with params

import { createRoute, Link, Outlet, useParams, useLoaderData } from "@tanstack/react-router";
import { rootRoute } from "./__root";

// ─── Mock data ────────────────────────────────────────────────────────────────
const USERS = [
  { id: "1", name: "Alice Johnson",  role: "Admin",     email: "alice@example.com" },
  { id: "2", name: "Bob Smith",      role: "Developer", email: "bob@example.com"   },
  { id: "3", name: "Carol White",    role: "Designer",  email: "carol@example.com" },
  { id: "4", name: "Dave Brown",     role: "Manager",   email: "dave@example.com"  },
];

// ─── /demo/users  (parent — shows list + nested <Outlet />) ──────────────────
const UsersPage = () => {
  // useLoaderData is fully typed — TS knows the shape returned by the loader below
  const users = useLoaderData({ from: usersRoute.id });

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* User list */}
      <div style={{ minWidth: "180px" }}>
        <h3>👥 Users</h3>
        <p style={{ fontSize: "12px", color: "#888" }}>Click a user to see details.</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {users.map((user) => (
            <li key={user.id} style={{ marginBottom: "6px" }}>
              <Link
                to="/demo/users/$userId"
                params={{ userId: user.id }}
                style={{ textDecoration: "none", color: "#4a90e2" }}
                activeProps={{ style: { textDecoration: "none", color: "#4a90e2", fontWeight: "bold" } }}
              >
                {user.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Nested child route renders here */}
      <div style={{ flex: 1, borderLeft: "1px solid #eee", paddingLeft: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
};

export const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo/users",
  component: UsersPage,
  // loader runs before the component renders
  // return value is available in useLoaderData — fully typed
  loader: async () => {
    // Simulate async fetch
    await new Promise((r) => setTimeout(r, 200));
    return USERS;
  },
});

// ─── /demo/users/$userId  (child — shows detail) ─────────────────────────────
const UserDetailPage = () => {
  // $userId is the dynamic segment — TypeScript knows it exists
  const { userId } = useParams({ from: userDetailRoute.id });
  const user = USERS.find((u) => u.id === userId);

  if (!user) return <p style={{ color: "red" }}>User not found.</p>;

  return (
    <div>
      <h4>{user.name}</h4>
      <table>
        <tbody>
          <tr><td style={{ paddingRight: "12px", color: "#888" }}>Role</td><td>{user.role}</td></tr>
          <tr><td style={{ paddingRight: "12px", color: "#888" }}>Email</td><td>{user.email}</td></tr>
          <tr><td style={{ paddingRight: "12px", color: "#888" }}>ID</td><td>{user.id}</td></tr>
        </tbody>
      </table>
    </div>
  );
};

const UserIndexPage = () => <p style={{ color: "#aaa" }}>← Select a user to see their details.</p>;

// Child route — nested under usersRoute
export const userDetailRoute = createRoute({
  getParentRoute: () => usersRoute,  // parent is the users list route
  path: "$userId",                   // $userId is the dynamic segment
  component: UserDetailPage,
});

// Index of /demo/users — renders when no user is selected
export const usersIndexRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "/",
  component: UserIndexPage,
});
