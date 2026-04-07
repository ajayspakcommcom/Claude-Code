// TOPIC: Senior Practice
// LEVEL: Senior — Practice
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. Large-Scale App  — feature-based structure, separation of concerns,
//                         compound components, custom hooks, clean patterns
//   2. Role-Based Access — RBAC permission matrix, route guards, role-aware UI
//   3. Micro-Frontend    — Module Federation concept, shell + remote apps,
//                         dynamic loading, shared dependencies
//
// ─── LARGE-SCALE APP ARCHITECTURE ────────────────────────────────────────────
//
//   In a large React app, organise by FEATURE, not by file type.
//
//   ❌ Bad (type-based):                  ✅ Good (feature-based):
//   src/                                  src/features/
//   ├── components/                       ├── projects/
//   │   ├── Header.tsx                    │   ├── components/
//   │   ├── ProjectCard.tsx               │   │   └── ProjectCard.tsx
//   │   └── TeamMember.tsx                │   ├── hooks/
//   ├── hooks/                            │   │   └── useProjects.ts
//   │   ├── useProjects.ts                │   └── index.ts
//   │   └── useTeam.ts                    ├── team/
//   └── pages/                            │   ├── components/
//       ├── Dashboard.tsx                 │   │   └── TeamMember.tsx
//       └── Settings.tsx                  │   └── hooks/
//                                         │       └── useTeam.ts
//                                         └── shared/
//
//   Each feature owns its components, hooks, types, and tests.
//   Cross-cutting concerns live in shared/.
//
// ─── ROLE-BASED ACCESS CONTROL (RBAC) ────────────────────────────────────────
//
//   Three approaches:
//
//   1. Permission matrix (recommended):
//      const PERMISSIONS = {
//        projects: { create: ['admin','editor'], delete: ['admin'] }
//      }
//      const can = (role, resource, action) =>
//        PERMISSIONS[resource]?.[action]?.includes(role) ?? false;
//
//   2. Role checks inline (simple but not scalable):
//      {user.role === 'admin' && <DeleteButton />}
//
//   3. Policy functions (for complex rules):
//      const canDeleteProject = (user, project) =>
//        user.role === 'admin' || (user.role === 'editor' && project.ownerId === user.id)
//
//   Best practice: keep permissions as data, not scattered if statements.
//   This makes auditing ("who can delete?") trivial.
//
// ─── MICRO-FRONTEND ──────────────────────────────────────────────────────────
//
//   Micro-frontends split a large SPA into independently deployed pieces.
//   Each team owns, builds, and deploys their slice.
//
//   Key patterns:
//   - Module Federation (Webpack 5): host app dynamically loads remotes at runtime
//   - iFrame isolation: simplest, most isolated, limited communication
//   - Web Components: framework-agnostic, good for widgets
//   - Single-SPA: orchestrator for multiple SPA frameworks on one page
//
//   Module Federation concept:
//   ┌─────────────────── Shell App (host) ─────────────────────┐
//   │  import('remoteTeam/TeamModule')  ← loads at runtime     │
//   │  import('remoteProjects/Board')   ← separate bundle      │
//   │                                                           │
//   │  ┌── Remote: team-app ──┐  ┌── Remote: projects-app ──┐  │
//   │  │  exposes: TeamModule │  │  exposes: Board          │  │
//   │  │  shared: react       │  │  shared: react           │  │
//   │  └──────────────────────┘  └──────────────────────────┘  │
//   └───────────────────────────────────────────────────────────┘
//
//   Shared dependencies (react, react-dom) are loaded ONCE even across remotes.
//
//   Tradeoffs:
//   ✅ Independent deployments — team-app can deploy without touching shell
//   ✅ Technology diversity — remote could be Vue/Angular if needed
//   ✅ Smaller initial bundles — load remotes on demand
//   ❌ Increased complexity — versioning, shared state, error boundaries
//   ❌ Network waterfalls — remote must load before it renders
//   ❌ Testing across remotes is harder

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
  lazy,
  Suspense,
} from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC PERMISSION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

type Role = (typeof ROLE)[keyof typeof ROLE];

// Permission matrix — permissions as data, not scattered if statements
const PERMISSIONS = {
  projects: {
    view: [ROLE.ADMIN, ROLE.EDITOR, ROLE.VIEWER],
    create: [ROLE.ADMIN, ROLE.EDITOR],
    edit: [ROLE.ADMIN, ROLE.EDITOR],
    delete: [ROLE.ADMIN],
  },
  team: {
    view: [ROLE.ADMIN, ROLE.EDITOR, ROLE.VIEWER],
    manage: [ROLE.ADMIN],
    invite: [ROLE.ADMIN, ROLE.EDITOR],
  },
  settings: {
    view: [ROLE.ADMIN],
    edit: [ROLE.ADMIN],
  },
  reports: {
    view: [ROLE.ADMIN, ROLE.EDITOR],
    export: [ROLE.ADMIN],
  },
} as const;

type Resource = keyof typeof PERMISSIONS;
type Action<R extends Resource> = keyof (typeof PERMISSIONS)[R];

const can = <R extends Resource>(role: Role, resource: R, action: Action<R>): boolean => {
  const allowed = PERMISSIONS[resource][action] as readonly string[];
  return allowed.includes(role);
};

// Policy function for complex rules (owner-aware)
const canDeleteProject = (
  userRole: Role,
  userId: string,
  projectOwnerId: string
): boolean => {
  if (userRole === ROLE.ADMIN) return true;
  return false; // only admin can delete in this app
};

const canEditProject = (
  userRole: Role,
  userId: string,
  projectOwnerId: string
): boolean => {
  if (userRole === ROLE.ADMIN) return true;
  if (userRole === ROLE.EDITOR && userId === projectOwnerId) return true;
  return false;
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

interface Project {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  ownerId: string;
  members: string[];
  priority: "low" | "medium" | "high";
}

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  role: Role;
  joinedAt: string;
}

interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string;
}

const AuthContext = createContext<AuthCtx | null>(null);

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? "Login failed");
      }
      const d = await res.json();
      setUser(d.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Generic permission gate — renders children only if user has permission
const PermissionGate: React.FC<{
  resource: Resource;
  action: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ resource, action, fallback = null, children }) => {
  const { user } = useAuth();
  if (!user) return <>{fallback}</>;
  const allowed = (PERMISSIONS[resource] as Record<string, readonly string[]>)[action];
  if (!allowed?.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
};

// Route-level guard
const RequireRole: React.FC<{
  roles: Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ roles, children, fallback = <div data-testid="access-denied">Access denied</div> }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const addProject = useCallback(async (project: Omit<Project, "id">) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    const created = await res.json();
    setProjects(prev => [...prev, created]);
    return created;
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated = await res.json();
    setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    return updated;
  }, []);

  return { projects, loading, error, addProject, deleteProject, updateProject };
};

const useActivity = () => {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    fetch("/api/activity")
      .then(r => r.json())
      .then(setActivity)
      .catch(() => {});
  }, []);

  return activity;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const LoginForm: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Sign in" data-testid="login-form">
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  currentUser: User;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Project>) => void;
}> = ({ project, currentUser, onDelete, onEdit }) => {
  const canDel = canDeleteProject(currentUser.role, currentUser.id, project.ownerId);
  const canEdit = canEditProject(currentUser.role, currentUser.id, project.ownerId);

  return (
    <div data-testid={`project-${project.id}`}>
      <h3>{project.name}</h3>
      <span data-testid={`status-${project.id}`}>{project.status}</span>
      <span data-testid={`priority-${project.id}`}>{project.priority}</span>
      {canEdit && (
        <button
          onClick={() => onEdit(project.id, { status: "paused" })}
          aria-label={`Edit ${project.name}`}
        >
          Edit
        </button>
      )}
      {canDel && (
        <button
          onClick={() => onDelete(project.id)}
          aria-label={`Delete ${project.name}`}
        >
          Delete
        </button>
      )}
    </div>
  );
};

const ProjectsPanel: React.FC = () => {
  const { user } = useAuth();
  const { projects, loading, addProject, deleteProject, updateProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  if (!user) return null;
  if (loading) return <div data-testid="projects-loading">Loading…</div>;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({ name: newName, status: "active", ownerId: user.id, members: [user.id], priority: "medium" });
    setNewName("");
    setShowForm(false);
  };

  return (
    <section aria-label="Projects" data-testid="projects-panel">
      <h2>Projects</h2>
      {can(user.role, "projects", "create") && (
        <button onClick={() => setShowForm(s => !s)}>New project</button>
      )}
      {showForm && (
        <form onSubmit={handleCreate} aria-label="Create project">
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Project name"
          />
          <button type="submit">Create</button>
        </form>
      )}
      <div data-testid="project-list">
        {projects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            currentUser={user}
            onDelete={deleteProject}
            onEdit={updateProject}
          />
        ))}
      </div>
    </section>
  );
};

const SettingsPanel: React.FC = () => (
  <section data-testid="settings-panel">
    <h2>Settings</h2>
    <p>Admin-only configuration area.</p>
  </section>
);

const ActivityPanel: React.FC = () => {
  const entries = useActivity();
  return (
    <section data-testid="activity-panel" aria-label="Activity log">
      <h2>Activity</h2>
      <ul>
        {entries.map(e => (
          <li key={e.id} data-testid={`activity-${e.id}`}>
            {e.userName} {e.action} {e.target}
          </li>
        ))}
      </ul>
    </section>
  );
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"projects" | "activity" | "settings">("projects");

  if (!user) return null;

  return (
    <div data-testid="dashboard">
      <header>
        <span data-testid="user-name">{user.name}</span>
        <span data-testid="user-role">{user.role}</span>
        <nav aria-label="Main navigation">
          <button onClick={() => setTab("projects")} aria-pressed={tab === "projects"}>Projects</button>
          <button onClick={() => setTab("activity")} aria-pressed={tab === "activity"}>Activity</button>
          {can(user.role, "settings", "view") && (
            <button onClick={() => setTab("settings")} aria-pressed={tab === "settings"}>Settings</button>
          )}
        </nav>
        <button onClick={logout}>Sign out</button>
      </header>
      <main>
        {tab === "projects" && <ProjectsPanel />}
        {tab === "activity" && <ActivityPanel />}
        {tab === "settings" && (
          <RequireRole roles={[ROLE.ADMIN]}>
            <SettingsPanel />
          </RequireRole>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <RequireRole
      roles={[ROLE.ADMIN, ROLE.EDITOR, ROLE.VIEWER]}
      fallback={<LoginForm />}
    >
      <Dashboard />
    </RequireRole>
  </AuthProvider>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_USERS: Record<string, { user: User; password: string }> = {
  "admin@team.com": {
    password: "password",
    user: { id: "u1", name: "Alice Admin", email: "admin@team.com", role: ROLE.ADMIN, avatar: "AA" },
  },
  "editor@team.com": {
    password: "password",
    user: { id: "u2", name: "Bob Editor", email: "editor@team.com", role: ROLE.EDITOR, avatar: "BE" },
  },
  "viewer@team.com": {
    password: "password",
    user: { id: "u3", name: "Carol Viewer", email: "viewer@team.com", role: ROLE.VIEWER, avatar: "CV" },
  },
};

const MOCK_PROJECTS: Project[] = [
  { id: "p1", name: "Alpha", status: "active", ownerId: "u1", members: ["u1", "u2"], priority: "high" },
  { id: "p2", name: "Beta", status: "paused", ownerId: "u2", members: ["u2", "u3"], priority: "medium" },
  { id: "p3", name: "Gamma", status: "completed", ownerId: "u3", members: ["u1", "u3"], priority: "low" },
];

const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: "a1", userId: "u1", userName: "Alice Admin", action: "created", target: "Alpha", timestamp: "2026-04-07T10:00:00Z" },
  { id: "a2", userId: "u2", userName: "Bob Editor", action: "edited", target: "Beta", timestamp: "2026-04-07T11:00:00Z" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MSW SERVER
// ═══════════════════════════════════════════════════════════════════════════════

let projects = [...MOCK_PROJECTS];

const server = setupServer(
  rest.post("/api/auth/login", async (req, res, ctx) => {
    const { email, password } = await req.json();
    const record = MOCK_USERS[email];
    if (!record || record.password !== password)
      return res(ctx.status(401), ctx.json({ message: "Invalid credentials" }));
    return res(ctx.status(200), ctx.json({ user: record.user }));
  }),

  rest.get("/api/projects", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(projects))
  ),

  rest.post("/api/projects", async (req, res, ctx) => {
    const body = await req.json();
    const created = { ...body, id: `p${Date.now()}` };
    projects = [...projects, created];
    return res(ctx.status(201), ctx.json(created));
  }),

  rest.delete("/api/projects/:id", (req, res, ctx) => {
    const { id } = req.params;
    projects = projects.filter(p => p.id !== id);
    return res(ctx.status(204));
  }),

  rest.patch("/api/projects/:id", async (req, res, ctx) => {
    const { id } = req.params;
    const updates = await req.json();
    const project = projects.find(p => p.id === id);
    if (!project) return res(ctx.status(404));
    const updated = { ...project, ...updates };
    projects = projects.map(p => (p.id === id ? updated : p));
    return res(ctx.status(200), ctx.json(updated));
  }),

  rest.get("/api/activity", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(MOCK_ACTIVITY))
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
beforeEach(() => { projects = [...MOCK_PROJECTS]; });
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── LOGIN HELPERS ────────────────────────────────────────────────────────────

const loginAs = async (user: UserEvent, email: string) => {
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), "password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByTestId("dashboard");
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. RBAC PERMISSION MATRIX
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — RBAC permission matrix", () => {
  describe("projects resource", () => {
    it("all roles can view projects", () => {
      expect(can(ROLE.ADMIN, "projects", "view")).toBe(true);
      expect(can(ROLE.EDITOR, "projects", "view")).toBe(true);
      expect(can(ROLE.VIEWER, "projects", "view")).toBe(true);
    });

    it("admin and editor can create, viewer cannot", () => {
      expect(can(ROLE.ADMIN, "projects", "create")).toBe(true);
      expect(can(ROLE.EDITOR, "projects", "create")).toBe(true);
      expect(can(ROLE.VIEWER, "projects", "create")).toBe(false);
    });

    it("only admin can delete", () => {
      expect(can(ROLE.ADMIN, "projects", "delete")).toBe(true);
      expect(can(ROLE.EDITOR, "projects", "delete")).toBe(false);
      expect(can(ROLE.VIEWER, "projects", "delete")).toBe(false);
    });
  });

  describe("settings resource", () => {
    it("only admin can view and edit settings", () => {
      expect(can(ROLE.ADMIN, "settings", "view")).toBe(true);
      expect(can(ROLE.ADMIN, "settings", "edit")).toBe(true);
      expect(can(ROLE.EDITOR, "settings", "view")).toBe(false);
      expect(can(ROLE.VIEWER, "settings", "view")).toBe(false);
    });
  });

  describe("reports resource", () => {
    it("admin and editor can view reports, only admin can export", () => {
      expect(can(ROLE.ADMIN, "reports", "view")).toBe(true);
      expect(can(ROLE.EDITOR, "reports", "view")).toBe(true);
      expect(can(ROLE.VIEWER, "reports", "view")).toBe(false);
      expect(can(ROLE.ADMIN, "reports", "export")).toBe(true);
      expect(can(ROLE.EDITOR, "reports", "export")).toBe(false);
    });
  });

  describe("policy functions (owner-aware)", () => {
    it("canDeleteProject — only admin regardless of ownership", () => {
      expect(canDeleteProject(ROLE.ADMIN, "u1", "u2")).toBe(true);
      expect(canDeleteProject(ROLE.EDITOR, "u2", "u2")).toBe(false); // even if owner
      expect(canDeleteProject(ROLE.VIEWER, "u3", "u3")).toBe(false);
    });

    it("canEditProject — admin always, editor only if owner", () => {
      expect(canEditProject(ROLE.ADMIN, "u1", "u2")).toBe(true);
      expect(canEditProject(ROLE.EDITOR, "u2", "u2")).toBe(true);  // editor + owner
      expect(canEditProject(ROLE.EDITOR, "u2", "u1")).toBe(false); // editor, not owner
      expect(canEditProject(ROLE.VIEWER, "u3", "u3")).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. AUTH FLOW
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Auth flow", () => {
  it("shows login form when unauthenticated", () => {
    render(<App />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });

  it("admin logs in and sees dashboard with their name and role", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Alice Admin");
    expect(screen.getByTestId("user-role")).toHaveTextContent("admin");
  });

  it("editor logs in with editor role", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "editor@team.com");
    expect(screen.getByTestId("user-role")).toHaveTextContent("editor");
  });

  it("viewer logs in with viewer role", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "viewer@team.com");
    expect(screen.getByTestId("user-role")).toHaveTextContent("viewer");
  });

  it("invalid credentials shows error", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("Email"), "wrong@test.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });

  it("logout returns to login form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(screen.getByTestId("login-form")).toBeInTheDocument());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ROLE-BASED UI — ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Role-based UI — Admin", () => {
  it("admin sees Settings nav tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("admin sees New project button", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    await screen.findByTestId("projects-panel");
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
  });

  it("admin sees Delete button on all projects", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    await screen.findByTestId("project-p1");
    expect(screen.getByRole("button", { name: /delete alpha/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete beta/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete gamma/i })).toBeInTheDocument();
  });

  it("admin can access settings panel", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. ROLE-BASED UI — EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — Role-based UI — Editor", () => {
  it("editor does NOT see Settings nav tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "editor@team.com");
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("editor sees New project button (can create)", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "editor@team.com");
    await screen.findByTestId("projects-panel");
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
  });

  it("editor sees Edit on their own project (Beta, ownerId=u2) but not Delete", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "editor@team.com");
    await screen.findByTestId("project-p2"); // Beta — owned by editor (u2)
    const betaCard = screen.getByTestId("project-p2");
    expect(within(betaCard).getByRole("button", { name: /edit beta/i })).toBeInTheDocument();
    expect(within(betaCard).queryByRole("button", { name: /delete beta/i })).not.toBeInTheDocument();
  });

  it("editor does NOT see Edit on projects they don't own (Alpha, ownerId=u1)", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "editor@team.com");
    await screen.findByTestId("project-p1"); // Alpha — owned by admin (u1)
    const alphaCard = screen.getByTestId("project-p1");
    expect(within(alphaCard).queryByRole("button", { name: /edit alpha/i })).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ROLE-BASED UI — VIEWER
// ═══════════════════════════════════════════════════════════════════════════════

describe("5 — Role-based UI — Viewer", () => {
  it("viewer sees projects but no Edit or Delete buttons", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "viewer@team.com");
    await screen.findByTestId("project-p1");
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("viewer does not see New project button", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "viewer@team.com");
    await screen.findByTestId("projects-panel");
    expect(screen.queryByRole("button", { name: "New project" })).not.toBeInTheDocument();
  });

  it("viewer does not see Settings tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "viewer@team.com");
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. PROJECT CRUD FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

describe("6 — Project CRUD flows", () => {
  it("admin creates a new project", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    await screen.findByTestId("projects-panel");

    await user.click(screen.getByRole("button", { name: "New project" }));
    await user.type(screen.getByLabelText("Project name"), "Delta");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.getByText("Delta")).toBeInTheDocument();
    });
  });

  it("admin deletes a project", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    await screen.findByTestId("project-p1");

    await user.click(screen.getByRole("button", { name: /delete alpha/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("project-p1")).not.toBeInTheDocument();
    });
  });

  it("editor edits their own project status", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "editor@team.com");
    await screen.findByTestId("project-p2");

    await user.click(screen.getByRole("button", { name: /edit beta/i }));

    await waitFor(() => {
      expect(screen.getByTestId("status-p2")).toHaveTextContent("paused");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════════════════════

describe("7 — Activity feed (all roles)", () => {
  it("activity tab shows log entries", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "viewer@team.com");
    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(await screen.findByTestId("activity-a1")).toHaveTextContent("Alice Admin created Alpha");
    expect(screen.getByTestId("activity-a2")).toHaveTextContent("Bob Editor edited Beta");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. ROUTE GUARD (RequireRole)
// ═══════════════════════════════════════════════════════════════════════════════

describe("8 — RequireRole guard", () => {
  it("renders fallback for unauthorized role", () => {
    render(
      <AuthProvider>
        <RequireRole roles={[ROLE.ADMIN]}>
          <div data-testid="secret">Admin content</div>
        </RequireRole>
      </AuthProvider>
    );
    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
    expect(screen.queryByTestId("secret")).not.toBeInTheDocument();
  });

  it("renders children for authorized role", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loginAs(user, "admin@team.com");
    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. MICRO-FRONTEND CONCEPT — dynamic module simulation
// ═══════════════════════════════════════════════════════════════════════════════

describe("9 — Micro-frontend dynamic loading concept", () => {
  // Simulate Module Federation: a remote module loaded at runtime
  const createRemoteModule = (componentName: string, content: string) => ({
    [componentName]: () => <div data-testid={`remote-${componentName.toLowerCase()}`}>{content}</div>,
  });

  it("shell app can dynamically load a remote component via lazy + Suspense", async () => {
    // Simulate: import('remoteTeam/TeamModule') resolved as a React module
    const fakeRemote = createRemoteModule("TeamModule", "Team Remote Component");
    const LazyTeam = lazy(() => Promise.resolve({ default: fakeRemote.TeamModule }));

    render(
      <Suspense fallback={<div data-testid="loading-remote">Loading remote…</div>}>
        <LazyTeam />
      </Suspense>
    );

    // Shows loading state while remote loads
    expect(screen.getByTestId("loading-remote")).toBeInTheDocument();

    // Remote resolves and renders
    expect(await screen.findByTestId("remote-teammodule")).toHaveTextContent(
      "Team Remote Component"
    );
  });

  it("multiple remotes can be loaded independently (parallel)", async () => {
    const teamRemote = createRemoteModule("TeamModule", "Team");
    const projectsRemote = createRemoteModule("ProjectsModule", "Projects");

    const LazyTeam = lazy(() => Promise.resolve({ default: teamRemote.TeamModule }));
    const LazyProjects = lazy(() => Promise.resolve({ default: projectsRemote.ProjectsModule }));

    render(
      <Suspense fallback={<div>Loading…</div>}>
        <LazyTeam />
        <LazyProjects />
      </Suspense>
    );

    expect(await screen.findByTestId("remote-teammodule")).toBeInTheDocument();
    expect(await screen.findByTestId("remote-projectsmodule")).toBeInTheDocument();
  });

  it("shell handles remote load failure with error boundary", async () => {
    // Simulate a failed remote import
    const FailingRemote = lazy(() => Promise.reject(new Error("Remote load failed")));

    class Boundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      state = { hasError: false };
      static getDerivedStateFromError() { return { hasError: true }; }
      render() {
        if (this.state.hasError)
          return <div data-testid="remote-error">Remote unavailable</div>;
        return this.props.children;
      }
    }

    render(
      <Boundary>
        <Suspense fallback={<div>Loading…</div>}>
          <FailingRemote />
        </Suspense>
      </Boundary>
    );

    expect(await screen.findByTestId("remote-error")).toHaveTextContent("Remote unavailable");
  });
});
