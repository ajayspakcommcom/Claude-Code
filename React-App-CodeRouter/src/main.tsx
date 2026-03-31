import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

// CODE-BASED ROUTING: RouterProvider receives the router built in router.tsx.
// No routeTree.gen.ts — no plugin — no code generation.
// Everything is explicit TypeScript.

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
