// FILE: src/pages/UserDetail.tsx
// ROUTE: /users/$userId — defined in router.tsx as userDetailRoute
//
// Dynamic segment: path "$userId" in createRoute() → params.userId is typed
// errorComponent is set directly on the route in router.tsx

import { getRouteApi, useParams } from "@tanstack/react-router";

const routeApi = getRouteApi("/users/$userId");

// CONCEPT: useParams from a nested component — same as file-based routing
// getRouteApi('/users/$userId').useParams() or useParams({ from: '/users/$userId' })
// Both are fully typed — TypeScript knows userId exists.
function UserBadge() {
  const { userId } = useParams({ from: "/users/$userId" });
  return (
    <div style={{ marginTop: "14px", padding: "8px 12px", background: "#fff8f0", borderRadius: "6px", fontSize: "13px" }}>
      <strong>useParams in nested component:</strong>
      <br />
      <code>useParams({"{ from: '/users/$userId' }"}) → userId = "{userId}"</code>
    </div>
  );
}

export function UserDetailPage() {
  const user = routeApi.useLoaderData();

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
      <UserBadge />
    </div>
  );
}
