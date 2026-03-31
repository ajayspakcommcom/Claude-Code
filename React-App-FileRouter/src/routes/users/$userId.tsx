// FILE: src/routes/users/$userId.tsx
// ROUTE: /users/:userId
//
// $ prefix = dynamic segment. The filename becomes the param name.
// $userId.tsx → params.userId (fully typed — TS knows this param exists)

import { createFileRoute } from "@tanstack/react-router";

const USERS = [
  { id: "1", name: "Alice Johnson", role: "Admin",     email: "alice@example.com", joined: "Jan 2022" },
  { id: "2", name: "Bob Smith",     role: "Developer", email: "bob@example.com",   joined: "Mar 2022" },
  { id: "3", name: "Carol White",   role: "Designer",  email: "carol@example.com", joined: "Jun 2023" },
  { id: "4", name: "Dave Brown",    role: "Manager",   email: "dave@example.com",  joined: "Sep 2023" },
];

export const Route = createFileRoute("/users/$userId")({
  // loader receives typed params — TS knows `params.userId` exists
  loader: async ({ params }) => {
    const user = USERS.find((u) => u.id === params.userId);
    if (!user) throw new Error("User not found");
    return user;
  },
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
      </div>
    );
  },
  errorComponent: ({ error }) => (
    <p style={{ color: "red" }}>Error: {(error as Error).message}</p>
  ),
});
