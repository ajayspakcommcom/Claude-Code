// ROUTER CONFIG
// createRouter assembles all routes into a route tree.
// The routeTree is fully type-safe — TypeScript infers every valid path,
// every param name, and every search param shape from this tree.

import { createRouter } from "@tanstack/react-router";
import { rootRoute }        from "./routes/__root";
import { indexRoute }       from "./routes/index";
import { aboutRoute }       from "./routes/about";
import { usersRoute, userDetailRoute, usersIndexRoute } from "./routes/users";
import { dashboardRoute }   from "./routes/dashboard";
import { loginRoute }       from "./routes/login";

// Build the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  usersRoute.addChildren([  // nested routes under /demo/users
    usersIndexRoute,
    userDetailRoute,
  ]),
  dashboardRoute,
  loginRoute,
]);

// Create the router instance
export const router = createRouter({
  routeTree,
  defaultPreload: "intent", // preload routes on hover for instant navigation
});

// TypeScript module augmentation — makes useRouter, Link etc. fully typed
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
