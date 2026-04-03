// AUTH FEATURE — LoginForm.tsx
//
// Uses: shared/ui/Button (generic), shared/utils (none needed here)
// Does NOT import from products/ or cart/ — features are isolated.

import React, { useState } from "react";
import { Button } from "../../shared/ui/Button";

interface Props {
  onLogin: (email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const LoginForm = ({ onLogin, isLoading, error }: Props) => {
  const [email,    setEmail]    = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <h3 style={s.title}>Sign in</h3>
      <p style={s.hint}>Try: admin@example.com / admin123 or user@example.com / user123</p>

      {error && <div style={s.error}>{error}</div>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={s.input}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={s.input}
        required
      />
      <Button type="submit" loading={isLoading} fullWidth>
        Sign in
      </Button>
    </form>
  );
};

const s: Record<string, React.CSSProperties> = {
  form:  { display: "flex", flexDirection: "column", gap: 12 },
  title: { fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#111827" },
  hint:  { fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 },
  error: { background: "#fef2f2", color: "#dc2626", padding: "8px 12px", borderRadius: 8, fontSize: 13 },
  input: { padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none" },
};
