// FILE: src/routes/_auth.tsx
// ROUTE: (pathless layout — no URL segment)
//
// _ prefix = pathless layout route.
// It wraps child routes (/dashboard, /profile…) WITHOUT adding to the URL.
// All children under _auth/ share this route's beforeLoad guard.
//
// This is the recommended way to protect groups of routes in TanStack Router.

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authStore } from "../auth";

export const Route = createFileRoute("/_auth")({
  // beforeLoad runs for this route AND all its children
  beforeLoad: ({ location }) => {
    if (!authStore.isLoggedIn()) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => (
    // Just render children — no visual wrapper needed
    <Outlet />
  ),
});
