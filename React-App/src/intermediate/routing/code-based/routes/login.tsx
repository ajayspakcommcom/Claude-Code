// LOGIN ROUTE  →  /demo/login
// Used by the protected dashboard route to redirect here when not authenticated.
// After login, redirects back to the originally requested page.

import { createRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { rootRoute } from "./__root";
import { authStore } from "../auth";

// Search params schema — redirect is an optional query param
// e.g.  /demo/login?redirect=/demo/dashboard
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const search   = useSearch({ from: loginRoute.id });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock auth — any non-empty credentials work
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }
    authStore.login(username);
    // Redirect back to the originally requested page (or /demo/dashboard)
    navigate({ to: search.redirect ?? "/demo/dashboard" });
  };

  return (
    <div style={{ maxWidth: "320px" }}>
      <h3>🔐 Login</h3>
      <p style={{ fontSize: "13px", color: "#888" }}>
        Enter any username and password to simulate login.
      </p>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        {error && <p style={{ color: "red", margin: 0, fontSize: "13px" }}>{error}</p>}
        <button
          type="submit"
          style={{ padding: "8px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo/login",
  component: LoginPage,
  validateSearch: searchSchema,
});
