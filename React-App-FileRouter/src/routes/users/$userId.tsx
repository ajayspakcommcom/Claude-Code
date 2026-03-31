// FILE: src/routes/users/$userId.tsx
// ROUTE: /users/:userId
//
// CONCEPTS DEMONSTRATED:
//   pendingComponent — spinner while this route's loader fetches
//   errorComponent  — per-route error boundary (shown when loader throws)
//   useParams       — reading typed dynamic params from a deeply nested component
//
// $ prefix = dynamic segment. The filename becomes the param name.
// $userId.tsx → params.userId (fully typed — TS knows this param exists)

import { createFileRoute, useParams } from "@tanstack/react-router";

const USERS = [
  { id: "1", name: "Alice Johnson", role: "Admin",     email: "alice@example.com", joined: "Jan 2022" },
  { id: "2", name: "Bob Smith",     role: "Developer", email: "bob@example.com",   joined: "Mar 2022" },
  { id: "3", name: "Carol White",   role: "Designer",  email: "carol@example.com", joined: "Jun 2023" },
  { id: "4", name: "Dave Brown",    role: "Manager",   email: "dave@example.com",  joined: "Sep 2023" },
];

// CONCEPT: useParams from a nested component
// This component is NOT the route component — it's a child component nested inside it.
// It reads the dynamic param directly using useParams({ from: '...' }).
// This is the pattern when params need to reach deep into a component tree
// without prop-drilling.
function UserBadge() {
  // useParams({ from: '/users/$userId' }) — typed to only return { userId: string }
  // TanStack Router knows exactly which params this route has at compile time.
  const { userId } = useParams({ from: "/users/$userId" });

  return (
    <div style={{ marginTop: "16px", padding: "8px 12px", background: "#f0f7ff", borderRadius: "6px", fontSize: "13px" }}>
      <strong>useParams demo (from nested component):</strong>
      <br />
      <code>useParams({"{ from: '/users/$userId' }"}) → userId = "{userId}"</code>
      <br />
      <span style={{ color: "#888" }}>
        This component is not the route component — it reads params independently via useParams.
      </span>
    </div>
  );
}

export const Route = createFileRoute("/users/$userId")({
  // CONCEPT: pendingComponent
  // Shown while this route's loader is running (after defaultPendingMs from main.tsx).
  // Each route can have its own pending UI — granular control per route.
  pendingComponent: () => (
    <div style={{ color: "#888" }}>⟳ Loading user details...</div>
  ),

  // loader receives typed params — TS knows `params.userId` exists
  loader: async ({ params }) => {
    await new Promise((r) => setTimeout(r, 800)); // simulate network
    const user = USERS.find((u) => u.id === params.userId);
    if (!user) throw new Error(`User ${params.userId} not found`);
    return user;
  },

  // CONCEPT: errorComponent
  // Per-route error boundary — only this route's UI is replaced on error.
  // The rest of the page (nav, parent routes) keeps rendering normally.
  // Much more granular than a global error boundary.
  errorComponent: ({ error }) => (
    <div style={{ color: "#e74c3c", padding: "12px", background: "#fff5f5", borderRadius: "6px" }}>
      <strong>Error (per-route boundary):</strong> {(error as Error).message}
      <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
        Try URL <code>/users/999</code> to trigger this.
      </p>
    </div>
  ),

  component: () => {
    const user = Route.useLoaderData();
    return (
      <div>
        <h3>{user.name}</h3>
        <table>
          <tbody>
            {[
              ["Role",   user.role],
              ["Email",  user.email],
              ["Joined", user.joined],
              ["ID",     user.id],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ color: "#888", paddingRight: "12px", paddingBottom: "4px" }}>{label}</td>
                <td style={{ paddingBottom: "4px" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Nested component that reads params independently */}
        <UserBadge />
      </div>
    );
  },
});
