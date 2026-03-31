// FILE: src/routes/about.tsx
// ROUTE: /about

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: () => (
    <div>
      <h2>ℹ️ About</h2>
      <p>
        In file-based routing, creating this file at <code>src/routes/about.tsx</code>
        automatically registers the <code>/about</code> route.
      </p>
      <p>No manual route registration. No router config changes. Just create the file.</p>
    </div>
  ),
});
