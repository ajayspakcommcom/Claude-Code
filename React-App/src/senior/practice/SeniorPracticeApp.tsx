// Senior Practice App — "TeamDesk" Project Management Dashboard
// Combines: RBAC, feature-based architecture, compound components,
// custom hooks, accessibility, security patterns, code quality

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  lazy,
  Suspense,
} from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

const ROLE = { ADMIN: "admin", EDITOR: "editor", VIEWER: "viewer" } as const;
type Role = (typeof ROLE)[keyof typeof ROLE];

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
  priority: "low" | "medium" | "high";
  progress: number;
}

// ─── RBAC PERMISSION MATRIX ───────────────────────────────────────────────────

const PERMISSIONS = {
  projects: {
    create: [ROLE.ADMIN, ROLE.EDITOR],
    edit: [ROLE.ADMIN, ROLE.EDITOR],
    delete: [ROLE.ADMIN],
  },
  settings: { view: [ROLE.ADMIN] },
  reports: { view: [ROLE.ADMIN, ROLE.EDITOR] },
  team: { manage: [ROLE.ADMIN], invite: [ROLE.ADMIN, ROLE.EDITOR] },
} as const;

type Resource = keyof typeof PERMISSIONS;

const can = (role: Role, resource: Resource, action: string): boolean => {
  const allowed = (PERMISSIONS[resource] as Record<string, readonly string[]>)[action];
  return allowed?.includes(role) ?? false;
};

const canEditProject = (userRole: Role, userId: string, ownerId: string) =>
  userRole === ROLE.ADMIN || (userRole === ROLE.EDITOR && userId === ownerId);

// ─── SHARED STYLES ─────────────────────────────────────────────────────────────

const S = {
  card: (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, ...extra,
  }),
  btn: (variant: "primary" | "danger" | "ghost" = "primary"): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 8, fontWeight: 600, fontSize: 12,
    cursor: "pointer", border: "none",
    background: variant === "primary" ? "#3b82f6" : variant === "danger" ? "#ef4444" : "#f1f5f9",
    color: variant === "ghost" ? "#475569" : "#fff",
  }),
  badge: (color: string, bg: string): React.CSSProperties => ({
    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
    background: bg, color: color, textTransform: "uppercase" as const, letterSpacing: 0.5,
  }),
};

const statusColors: Record<string, { color: string; bg: string }> = {
  active: { color: "#16a34a", bg: "#f0fdf4" },
  paused: { color: "#d97706", bg: "#fffbeb" },
  completed: { color: "#6366f1", bg: "#f5f3ff" },
};

const priorityColors: Record<string, { color: string; bg: string }> = {
  high: { color: "#dc2626", bg: "#fef2f2" },
  medium: { color: "#d97706", bg: "#fffbeb" },
  low: { color: "#16a34a", bg: "#f0fdf4" },
};

const roleColors: Record<Role, { color: string; bg: string }> = {
  admin: { color: "#6366f1", bg: "#f5f3ff" },
  editor: { color: "#0891b2", bg: "#ecfeff" },
  viewer: { color: "#475569", bg: "#f1f5f9" },
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────

interface AuthCtx {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, login: () => {}, logout: () => {} });
const useAuth = () => useContext(AuthContext);

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const DEMO_USERS: User[] = [
  { id: "u1", name: "Alice Admin", email: "admin@team.com", role: ROLE.ADMIN, avatar: "AA" },
  { id: "u2", name: "Bob Editor", email: "editor@team.com", role: ROLE.EDITOR, avatar: "BE" },
  { id: "u3", name: "Carol Viewer", email: "viewer@team.com", role: ROLE.VIEWER, avatar: "CV" },
];

const INITIAL_PROJECTS: Project[] = [
  { id: "p1", name: "Alpha — Design System", status: "active", ownerId: "u1", priority: "high", progress: 72 },
  { id: "p2", name: "Beta — API Refactor", status: "paused", ownerId: "u2", priority: "medium", progress: 45 },
  { id: "p3", name: "Gamma — Mobile App", status: "active", ownerId: "u1", priority: "high", progress: 28 },
  { id: "p4", name: "Delta — Analytics", status: "completed", ownerId: "u2", priority: "low", progress: 100 },
];

const ACTIVITY = [
  { id: "a1", user: "Alice Admin", action: "created project", target: "Alpha — Design System", time: "2h ago" },
  { id: "a2", user: "Bob Editor", action: "paused", target: "Beta — API Refactor", time: "4h ago" },
  { id: "a3", user: "Carol Viewer", action: "viewed", target: "Gamma — Mobile App", time: "6h ago" },
  { id: "a4", user: "Alice Admin", action: "completed", target: "Delta — Analytics", time: "1d ago" },
];

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [selected, setSelected] = useState(DEMO_USERS[0]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)",
    }}>
      <div style={S.card({ maxWidth: 400, width: "100%", margin: "0 20px" })}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>📋</div>
          <h2 style={{ margin: 0, color: "#1e293b" }}>TeamDesk</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Project Management Dashboard
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Sign in as
          </div>
          {DEMO_USERS.map(u => (
            <button key={u.id} onClick={() => setSelected(u)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 8, marginBottom: 6,
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              border: "2px solid", textAlign: "left" as const,
              borderColor: selected.id === u.id ? roleColors[u.role].color : "#e2e8f0",
              background: selected.id === u.id ? roleColors[u.role].bg : "#f8fafc",
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                background: roleColors[u.role].color, color: "#fff", flexShrink: 0,
              }}>{u.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{u.email}</div>
              </div>
              <span style={S.badge(roleColors[u.role].color, roleColors[u.role].bg)}>
                {u.role}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onLogin(selected)}
          style={{ ...S.btn("primary"), width: "100%", padding: "10px", fontSize: 14 }}
        >
          Sign in as {selected.name}
        </button>

        <div style={{ marginTop: 12, padding: "10px", borderRadius: 8, background: "#f8fafc", fontSize: 11, color: "#64748b" }}>
          <strong>Try each role:</strong> Admin has full access · Editor can create &amp; edit own projects · Viewer is read-only
        </div>
      </div>
    </div>
  );
};

// ─── PROJECT CARD ─────────────────────────────────────────────────────────────

const ProjectCard: React.FC<{
  project: Project;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ project, onEdit, onDelete }) => {
  const { user } = useAuth();
  if (!user) return null;

  const statusC = statusColors[project.status];
  const priorityC = priorityColors[project.priority];
  const showEdit = canEditProject(user.role, user.id, project.ownerId);
  const showDelete = can(user.role, "projects", "delete");

  return (
    <div style={S.card({ marginBottom: 10 })}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4 }}>
            {project.name}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
            <span style={S.badge(statusC.color, statusC.bg)}>{project.status}</span>
            <span style={S.badge(priorityC.color, priorityC.bg)}>{project.priority}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {showEdit && (
            <button
              onClick={() => onEdit(project.id)}
              style={S.btn("ghost")}
              aria-label={`Edit ${project.name}`}
            >
              Edit
            </button>
          )}
          {showDelete && (
            <button
              onClick={() => onDelete(project.id)}
              style={S.btn("danger")}
              aria-label={`Delete ${project.name}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
        <span>Progress</span>
        <span>{project.progress}%</span>
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: project.progress === 100 ? "#22c55e" : "#3b82f6",
          width: `${project.progress}%`,
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
};

// ─── PROJECTS PANEL ───────────────────────────────────────────────────────────

const ProjectsPanel: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "completed">("all");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  if (!user) return null;

  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newProject: Project = {
      id: `p${Date.now()}`,
      name: newName.trim(),
      status: "active",
      ownerId: user.id,
      priority: "medium",
      progress: 0,
    };
    setProjects(prev => [...prev, newProject]);
    setNewName("");
    setShowForm(false);
  };

  const handleEdit = (id: string) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, status: "paused" } : p))
    );
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "active", "paused", "completed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              cursor: "pointer", border: "1px solid",
              borderColor: filter === f ? "#3b82f6" : "#e2e8f0",
              background: filter === f ? "#eff6ff" : "#f8fafc",
              color: filter === f ? "#1d4ed8" : "#64748b",
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {can(user.role, "projects", "create") && (
          <button onClick={() => setShowForm(s => !s)} style={S.btn("primary")}>
            + New Project
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ ...S.card({ marginBottom: 14, background: "#f8fafc" }), display: "flex", gap: 8 }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Project name…"
            autoFocus
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }}
          />
          <button type="submit" style={S.btn("primary")}>Create</button>
          <button type="button" onClick={() => setShowForm(false)} style={S.btn("ghost")}>Cancel</button>
        </form>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
          No projects found.
        </div>
      ) : (
        filtered.map(p => (
          <ProjectCard key={p.id} project={p} onEdit={handleEdit} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
};

// ─── ACTIVITY PANEL ───────────────────────────────────────────────────────────

const ActivityPanel: React.FC = () => (
  <div>
    {ACTIVITY.map(a => (
      <div key={a.id} style={{
        display: "flex", gap: 10, padding: "10px 0",
        borderBottom: "1px solid #f1f5f9", alignItems: "flex-start",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#475569", flexShrink: 0,
        }}>
          {a.user.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "#1e293b" }}>
            <strong>{a.user}</strong>{" "}
            <span style={{ color: "#64748b" }}>{a.action}</span>{" "}
            <strong>{a.target}</strong>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{a.time}</div>
        </div>
      </div>
    ))}
  </div>
);

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────

const SettingsPanel: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      {can(user?.role ?? ROLE.VIEWER, "settings", "view") ? (
        <>
          <div style={{ ...S.card({ background: "#f0fdf4", borderColor: "#86efac", marginBottom: 12 }) }}>
            <div style={{ fontWeight: 600, color: "#16a34a", marginBottom: 4 }}>✅ Admin Access Granted</div>
            <div style={{ fontSize: 12, color: "#374151" }}>
              You have full access to workspace settings, billing, and team management.
            </div>
          </div>
          {["Workspace", "Billing", "Integrations", "Security"].map(section => (
            <div key={section} style={{ ...S.card({ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }) }}>
              <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{section}</span>
              <button style={S.btn("ghost")}>Configure</button>
            </div>
          ))}
        </>
      ) : (
        <div style={S.card({ background: "#fef2f2", borderColor: "#fca5a5" })}>
          <div style={{ fontWeight: 600, color: "#dc2626" }}>🚫 Access Denied</div>
          <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
            Only administrators can access settings.
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MICRO-FRONTEND INFO PANEL ────────────────────────────────────────────────

const MicroFrontendPanel: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const simulateRemoteLoad = () => {
    setLoading(true);
    setTimeout(() => { setLoaded(true); setLoading(false); }, 1200);
  };

  const architectureCode = `// webpack.config.js — Host (shell) app
new ModuleFederationPlugin({
  name: "shell",
  remotes: {
    teamApp: "teamApp@https://team.company.com/remoteEntry.js",
    projectsApp: "projectsApp@https://projects.company.com/remoteEntry.js",
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
})

// Usage in shell — loads at runtime, not build time
const TeamModule = lazy(() => import("teamApp/TeamModule"));
const ProjectsBoard = lazy(() => import("projectsApp/Board"));`;

  const remoteCode = `// webpack.config.js — Remote (team) app
new ModuleFederationPlugin({
  name: "teamApp",
  filename: "remoteEntry.js",    // ← shell fetches this
  exposes: {
    "./TeamModule": "./src/features/team/TeamModule",
  },
  shared: { react: { singleton: true }, "react-dom": { singleton: true } },
})`;

  return (
    <div>
      <div style={{ ...S.card({ background: "#eff6ff", borderColor: "#93c5fd", marginBottom: 14 }) }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1d4ed8", marginBottom: 4 }}>
          Module Federation — Concept Demo
        </div>
        <div style={{ fontSize: 12, color: "#374151", marginBottom: 10 }}>
          In a real micro-frontend setup, each team owns a separate app that exposes components
          the shell loads at runtime — no rebuild of the shell required.
        </div>

        <div style={{ marginBottom: 10 }}>
          <button onClick={simulateRemoteLoad} disabled={loading || loaded} style={S.btn("primary")}>
            {loading ? "Loading remote…" : loaded ? "Remote loaded ✅" : "Simulate remote load"}
          </button>
        </div>

        {loading && (
          <div style={{ padding: "12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" }}>
            ⏳ Fetching <code>remoteEntry.js</code> from team-app…
          </div>
        )}

        {loaded && (
          <div style={{ padding: "12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac", fontSize: 12, color: "#166534" }}>
            ✅ <strong>TeamModule</strong> loaded from remote · Rendered in shell · React shared (singleton)
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
            Shell (host)
          </div>
          <div style={{
            background: "#0f172a", borderRadius: 8, padding: 12,
            fontFamily: "monospace", fontSize: 10, color: "#86efac",
            lineHeight: 1.7, whiteSpace: "pre", overflowX: "auto",
          }}>
            {architectureCode}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
            Remote (team-app)
          </div>
          <div style={{
            background: "#0f172a", borderRadius: 8, padding: 12,
            fontFamily: "monospace", fontSize: 10, color: "#fbbf24",
            lineHeight: 1.7, whiteSpace: "pre", overflowX: "auto",
          }}>
            {remoteCode}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {[
          { icon: "✅", label: "Independent deployments", desc: "Team app deploys without rebuilding shell" },
          { icon: "✅", label: "Shared dependencies", desc: "React loaded once, not per-remote" },
          { icon: "⚠️", label: "Increased complexity", desc: "Versioning, shared state, error boundaries" },
          { icon: "⚠️", label: "Network waterfall", desc: "Remote JS must load before first render" },
        ].map(t => (
          <div key={t.label} style={S.card({ padding: 12 })}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>
              {t.icon} {t.label}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

type Tab = "projects" | "activity" | "settings" | "micro-frontend";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("projects");

  if (!user) return null;

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "projects", label: "Projects", show: true },
    { id: "activity", label: "Activity", show: true },
    { id: "settings", label: "Settings", show: can(user.role, "settings", "view") },
    { id: "micro-frontend", label: "Micro-Frontend", show: true },
  ];

  const roleBadge = roleColors[user.role];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <header style={{
        background: "#1e293b", borderBottom: "1px solid #334155",
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>
          📋 TeamDesk
        </span>
        <nav aria-label="Main navigation" style={{ display: "flex", gap: 4, flex: 1 }}>
          {tabs.filter(t => t.show).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "6px 14px", borderRadius: 8, fontWeight: 600, fontSize: 12,
              cursor: "pointer", border: "none",
              background: tab === t.id ? "#334155" : "transparent",
              color: tab === t.id ? "#fff" : "#94a3b8",
            }}>
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{user.name}</span>
          <span style={S.badge(roleBadge.color, roleBadge.bg)}>{user.role}</span>
          <button onClick={logout} style={{ ...S.btn("ghost"), fontSize: 11, padding: "4px 10px", color: "#94a3b8" }}>
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <aside style={{ background: "#fff", borderRight: "1px solid #e2e8f0", padding: 16 }}>
          {/* User card */}
          <div style={{ ...S.card({ marginBottom: 16, background: "#f8fafc" }) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13,
                background: roleBadge.color, color: "#fff",
              }}>{user.avatar}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{user.name}</div>
                <span style={S.badge(roleBadge.color, roleBadge.bg)}>{user.role}</span>
              </div>
            </div>
          </div>

          {/* Permission summary */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
            Your permissions
          </div>
          {[
            { label: "Create projects", ok: can(user.role, "projects", "create") },
            { label: "Delete projects", ok: can(user.role, "projects", "delete") },
            { label: "Invite to team", ok: can(user.role, "team", "invite") },
            { label: "Manage team", ok: can(user.role, "team", "manage") },
            { label: "View reports", ok: can(user.role, "reports", "view") },
            { label: "Admin settings", ok: can(user.role, "settings", "view") },
          ].map(p => (
            <div key={p.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "5px 0", borderBottom: "1px solid #f1f5f9", fontSize: 11,
            }}>
              <span style={{ color: "#475569" }}>{p.label}</span>
              <span style={{ color: p.ok ? "#16a34a" : "#d1d5db", fontWeight: 700, fontSize: 13 }}>
                {p.ok ? "✓" : "—"}
              </span>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: 18, fontWeight: 700 }}>
            {tab === "projects" && "Projects"}
            {tab === "activity" && "Activity Log"}
            {tab === "settings" && "Settings"}
            {tab === "micro-frontend" && "Micro-Frontend Architecture"}
          </h2>

          {tab === "projects" && <ProjectsPanel />}
          {tab === "activity" && <ActivityPanel />}
          {tab === "settings" && <SettingsPanel />}
          {tab === "micro-frontend" && <MicroFrontendPanel />}
        </main>
      </div>
    </div>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export const TeamDeskApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((u: User) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {user ? <Dashboard /> : <LoginScreen onLogin={login} />}
    </AuthContext.Provider>
  );
};

export default TeamDeskApp;
