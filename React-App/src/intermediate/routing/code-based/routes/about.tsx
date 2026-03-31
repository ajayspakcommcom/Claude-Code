// ABOUT ROUTE  →  /demo/about
// Simple static route — demonstrates basic createRoute usage.

import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./__root";

const AboutPage = () => (
  <div>
    <h3>ℹ️ About Page</h3>
    <p>This is a static route — no params, no loaders, no guards.</p>
    <p>
      In TanStack Router every route is created with <code>createRoute()</code> and
      connected to its parent via <code>getParentRoute</code>.
    </p>
    <p>This creates a type-safe route tree — TypeScript knows every valid path.</p>
    <Link to="/demo">← Back to Home</Link>
  </div>
);

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo/about",
  component: AboutPage,
});
