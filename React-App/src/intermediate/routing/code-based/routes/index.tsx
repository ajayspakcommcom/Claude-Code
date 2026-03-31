// HOME ROUTE  →  /demo
// createRoute requires a getParentRoute function and a path string.

import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./__root";

const HomePage = () => (
  <div>
    <h3>🏠 Home Page</h3>
    <p>Welcome to the TanStack Router — Code-Based demo.</p>
    <p>Use the nav above to explore:</p>
    <ul>
      <li><Link to="/demo/about">About</Link> — static page</li>
      <li><Link to="/demo/users">Users</Link> — list with dynamic params</li>
      <li><Link to="/demo/dashboard">Dashboard</Link> — protected route (login required)</li>
    </ul>
  </div>
);

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo",
  component: HomePage,
});
