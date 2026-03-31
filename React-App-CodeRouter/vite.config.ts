// CODE-BASED ROUTING: No TanStackRouterVite plugin needed.
// File-based routing requires the plugin to watch src/routes/ and auto-generate routeTree.gen.ts.
// Code-based routing assembles the route tree manually in src/router.tsx — no plugin, no codegen.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
