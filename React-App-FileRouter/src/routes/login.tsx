// FILE: src/routes/login.tsx
// ROUTE: /login

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authStore } from "../auth";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: () => {
    const navigate  = useNavigate();
    const { redirect } = Route.useSearch();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError]       = useState("");

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim() || !password.trim()) {
        setError("Please enter username and password.");
        return;
      }
      authStore.login(username);
      navigate({ to: redirect ?? "/dashboard" });
    };

    return (
      <div style={{ maxWidth: "320px" }}>
        <h2>🔐 Login</h2>
        <p style={{ fontSize: "13px", color: "#888" }}>Any username + password works.</p>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
          {error && <p style={{ color: "red", margin: 0, fontSize: "13px" }}>{error}</p>}
          <button type="submit"
            style={{ padding: "8px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Login
          </button>
        </form>
      </div>
    );
  },
});
