// CODE-BASED TANSTACK ROUTER DEMO
//
// This is a self-contained mini-app embedded inside the main page.
// RouterProvider renders the router with a MemoryHistory so it doesn't
// conflict with the browser URL (since the outer app has no router).
//
// Concepts demonstrated:
//   ✅ createRoute + createRootRoute
//   ✅ Route tree assembly (createRouter)
//   ✅ Layouts with <Outlet />
//   ✅ Navigation with <Link> (type-safe paths)
//   ✅ Nested routes (/users + /users/$userId)
//   ✅ Route loader (fetch data before render)
//   ✅ Dynamic params ($userId) — fully typed
//   ✅ Search params with zod validation
//   ✅ Protected route with beforeLoad guard + redirect
//   ✅ 404 notFoundComponent

import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { router } from "./router";

// Use MemoryHistory so the demo router doesn't take over the browser URL
const memoryHistory = createMemoryHistory({ initialEntries: ["/demo"] });
const demoRouter = { ...router, history: memoryHistory };

const CodeBasedRouterDemo = () => (
  <div>
    <h2>TanStack Router — Code-Based</h2>
    <p style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
      A fully working mini-app using code-based routing. All paths, params, and
      search params are 100% TypeScript type-safe.
    </p>

    {/* The RouterProvider renders the entire router — nav + pages */}
    <RouterProvider router={router} />
  </div>
);

export default CodeBasedRouterDemo;
