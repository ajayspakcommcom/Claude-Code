// FILE: src/routes/lazy-demo.tsx
// ROUTE: /lazy-demo
//
// CONCEPT: Lazy routes — code splitting with lazyRouteComponent
//
// lazyRouteComponent(() => import('../components/HeavyPage'))
// → The HeavyPage component is NOT bundled into main.js
// → It's split into a separate chunk by Vite at build time
// → Downloaded only when the user first visits /lazy-demo
//
// Benefits:
//   - Smaller initial bundle → faster first page load
//   - Users who never visit /lazy-demo never download that code
//   - Browser caches the chunk — subsequent visits are instant
//
// TanStack Router handles the loading state for you:
//   - Shows pendingComponent while the chunk + loader run
//   - Renders the component once both are ready

import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/lazy-demo")({
  // CONCEPT: lazyRouteComponent
  // Wraps a dynamic import. TanStack Router:
  //   1. Initiates the import() when this route is matched
  //   2. Shows pendingComponent while the chunk loads
  //   3. Renders the default export of HeavyPage once loaded
  component: lazyRouteComponent(() => import("../components/HeavyPage")),

  // pendingComponent shows while the JS chunk is being downloaded
  pendingComponent: () => (
    <div style={{ color: "#888" }}>
      ⟳ Downloading component chunk...
      <p style={{ fontSize: "13px", margin: "4px 0 0" }}>
        Open DevTools → Network tab to watch the chunk arrive.
      </p>
    </div>
  ),
});
