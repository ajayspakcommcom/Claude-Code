// FILE: src/routes/index.tsx
// ROUTE: /   (home page)
//
// index.tsx inside a folder (or at the root) always matches the
// exact folder path with no trailing segment.

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <div>
      <h2>🏠 Home — File-Based Routing</h2>
      <p>
        This project uses <strong>TanStack Router file-based routing</strong>.
        The Vite plugin watches <code>src/routes/</code> and auto-generates
        <code>routeTree.gen.ts</code> — you never write the route tree manually.
      </p>

      <h3>File → Route mapping:</h3>
      <table style={{ borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "6px 12px", background: "#f5f5f5" }}>File</th>
            <th style={{ textAlign: "left", padding: "6px 12px", background: "#f5f5f5" }}>URL</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["src/routes/__root.tsx",         "/ (layout wrapper)"],
            ["src/routes/index.tsx",           "/"],
            ["src/routes/about.tsx",           "/about"],
            ["src/routes/users/index.tsx",     "/users"],
            ["src/routes/users/$userId.tsx",   "/users/:userId"],
            ["src/routes/_auth.tsx",           "(pathless layout)"],
            ["src/routes/_auth/dashboard.tsx", "/dashboard (protected)"],
            ["src/routes/login.tsx",           "/login"],
          ].map(([file, url]) => (
            <tr key={file}>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #eee", fontFamily: "monospace", color: "#4a90e2" }}>{file}</td>
              <td style={{ padding: "6px 12px", borderBottom: "1px solid #eee" }}>{url}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <Link to="/users"><button>View Users →</button></Link>
        <Link to="/dashboard"><button>Go to Dashboard →</button></Link>
      </div>
    </div>
  ),
});
