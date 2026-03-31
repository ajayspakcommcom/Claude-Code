// FILE: src/router.tsx
//
// CODE-BASED ROUTING — the entire route tree is assembled here manually.
//
// CONTRAST WITH FILE-BASED ROUTING (React-App-FileRouter):
//   File-based:  create a file → route exists automatically (plugin does the wiring)
//   Code-based:  create a route object → manually add it to the tree → router sees it
//
// KEY APIs:
//   createRootRoute()    — the top-level layout route
//   createRoute()        — a single route (path + component + loader + …)
//   route.addChildren()  — nest child routes under a parent
//   createRouter()       — combine the tree + config into the final router

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  redirect,
} from "@tanstack/react-router";
import { z } from "zod";
import { authStore } from "./auth";

// ─── Pages (imported from src/pages/) ────────────────────────────────────────
import { HomePage }       from "./pages/Home";
import { AboutPage }      from "./pages/About";
import { UsersPage }      from "./pages/Users";
import { UserDetailPage } from "./pages/UserDetail";
import { ProductsPage }   from "./pages/Products";
import { ContactPage }    from "./pages/Contact";
import { LoginPage }      from "./pages/Login";
import { DashboardPage }  from "./pages/Dashboard";

// ─── Mock data ────────────────────────────────────────────────────────────────
const USERS = [
  { id: "1", name: "Alice Johnson", role: "Admin",     email: "alice@example.com", joined: "Jan 2022" },
  { id: "2", name: "Bob Smith",     role: "Developer", email: "bob@example.com",   joined: "Mar 2022" },
  { id: "3", name: "Carol White",   role: "Designer",  email: "carol@example.com", joined: "Jun 2023" },
  { id: "4", name: "Dave Brown",    role: "Manager",   email: "dave@example.com",  joined: "Sep 2023" },
];

const ALL_PRODUCTS = [
  { id: "1", name: "Mechanical Keyboard", category: "tech",      price: 129 },
  { id: "2", name: "Ergonomic Chair",      category: "furniture", price: 399 },
  { id: "3", name: "USB-C Hub",            category: "tech",      price: 49  },
  { id: "4", name: "Standing Desk",        category: "furniture", price: 599 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Root route (layout that wraps every page)
// ═══════════════════════════════════════════════════════════════════════════════
// In file-based routing this would be __root.tsx — created automatically.
// In code-based routing you create it explicitly with createRootRoute().

const rootRoute = createRootRoute({
  component: () => (
    <div style={{ fontFamily: "sans-serif", maxWidth: "860px", margin: "0 auto", padding: "20px" }}>
      <nav style={{ display: "flex", gap: "4px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { to: "/",          label: "Home",      exact: true  },
          { to: "/about",     label: "About",     exact: false },
          { to: "/users",     label: "Users",     exact: false },
          { to: "/products",  label: "Products",  exact: false },
          { to: "/contact",   label: "Contact",   exact: false },
          { to: "/dashboard", label: "Dashboard", exact: false },
          { to: "/login",     label: "Login",     exact: false },
        ].map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            style={{ padding: "6px 14px", background: "#eee", borderRadius: "4px", textDecoration: "none", color: "#333", fontSize: "14px" }}
            activeProps={{ style: { padding: "6px 14px", background: "#e67e22", borderRadius: "4px", textDecoration: "none", color: "#fff", fontSize: "14px", fontWeight: "bold" } }}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  ),
  notFoundComponent: () => (
    <div style={{ textAlign: "center", color: "#e74c3c" }}>
      <h2>404 — Not Found</h2>
      <Link to="/">Go Home</Link>
    </div>
  ),
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Define each route with createRoute()
// ═══════════════════════════════════════════════════════════════════════════════
// Every route MUST declare getParentRoute — this is how the type system knows
// which params and context are available. Without it, TypeScript can't infer them.

// / — Home
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

// /about
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

// /login — with search param: ?redirect=
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: LoginPage,
});

// /dashboard — protected via beforeLoad
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  // CONCEPT: beforeLoad in code-based routing — identical API to file-based
  beforeLoad: ({ location }) => {
    if (!authStore.isLoggedIn()) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: DashboardPage,
});

// /users — with loader + pendingComponent + staleTime
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  staleTime: 10_000,
  pendingComponent: () => <p style={{ color: "#888" }}>⟳ Loading users...</p>,
  loader: async () => {
    await new Promise((r) => setTimeout(r, 1000));
    return USERS;
  },
  component: UsersPage,
});

// /users/$userId — dynamic segment, nested under usersRoute
// CONCEPT: Dynamic params in code-based routing.
// Instead of naming the file $userId.tsx, you write path: "$userId".
// TypeScript still infers params.userId — fully typed via getParentRoute.
const userDetailRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "$userId",
  pendingComponent: () => <p style={{ color: "#888" }}>⟳ Loading user...</p>,
  loader: async ({ params }) => {
    await new Promise((r) => setTimeout(r, 600));
    const user = USERS.find((u) => u.id === params.userId);
    if (!user) throw new Error(`User "${params.userId}" not found`);
    return user;
  },
  errorComponent: ({ error }) => (
    <div style={{ color: "#e74c3c", padding: "10px", background: "#fff5f5", borderRadius: "6px" }}>
      <strong>Error:</strong> {(error as Error).message}
    </div>
  ),
  component: UserDetailPage,
});

// /products — with typed search params (Zod) + loaderDeps
const productsSearchSchema = z.object({
  category: z.enum(["all", "tech", "furniture"]).optional().default("all"),
  sort:     z.enum(["name", "price"]).optional().default("name"),
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  validateSearch: productsSearchSchema,
  loaderDeps: ({ search }) => ({ category: search.category, sort: search.sort }),
  staleTime: 15_000,
  pendingComponent: () => <p style={{ color: "#888" }}>⟳ Filtering products...</p>,
  loader: async ({ deps }) => {
    await new Promise((r) => setTimeout(r, 700));
    let products = deps.category === "all"
      ? ALL_PRODUCTS
      : ALL_PRODUCTS.filter((p) => p.category === deps.category);
    products = [...products].sort((a, b) =>
      deps.sort === "price" ? a.price - b.price : a.name.localeCompare(b.name)
    );
    return products;
  },
  component: ProductsPage,
});

// /contact — useNavigate demo
const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Assemble the route tree manually
// ═══════════════════════════════════════════════════════════════════════════════
// addChildren() nests routes. The ORDER matters for matching (more specific first).
// In file-based routing the plugin does this step automatically from the file tree.
// Here YOU control exactly how routes nest.

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  loginRoute,
  dashboardRoute,
  // usersRoute owns its children — userDetail is nested under /users
  usersRoute.addChildren([userDetailRoute]),
  productsRoute,
  contactRoute,
]);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Create the router
// ═══════════════════════════════════════════════════════════════════════════════

export const router = createRouter({
  routeTree,
  defaultPendingMs:    500,
  defaultPendingMinMs: 300,
  scrollRestoration:   true,
});

// TypeScript module augmentation — same as file-based routing
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
