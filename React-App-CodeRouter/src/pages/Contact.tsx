// FILE: src/pages/Contact.tsx
// ROUTE: /contact — defined in router.tsx as contactRoute
// Demonstrates: useNavigate with to, search, params, replace

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export function ContactPage() {
  const navigate  = useNavigate();
  const [name,    setName]    = useState("");
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    await new Promise((r) => setTimeout(r, 600));
    navigate({ to: "/products", search: { category: "all", sort: "name" }, replace: true });
  };

  return (
    <div style={{ maxWidth: "440px" }}>
      <h2>📬 Contact</h2>
      <p style={{ fontSize: "13px", color: "#888" }}>
        On submit → <code>navigate({"{ to: '/products', search: {...}, replace: true }"})</code>
      </p>

      <div style={{ marginBottom: "16px", padding: "10px", background: "#f9f9f9", borderRadius: "6px" }}>
        <strong style={{ fontSize: "13px" }}>navigate() variants:</strong>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
          <button onClick={() => navigate({ to: "/" })} style={btn}>to /</button>
          <button onClick={() => navigate({ to: "/users/$userId", params: { userId: "2" } })} style={btn}>to /users/2</button>
          <button onClick={() => navigate({ to: "/products", search: { category: "tech", sort: "price" } })} style={btn}>to /products?category=tech</button>
          <button onClick={() => navigate({ to: "/", replace: true })} style={{ ...btn, background: "#e67e22" }}>replace: true</button>
        </div>
      </div>

      {sent ? (
        <p style={{ color: "#2ecc71" }}>✓ Sent! Redirecting...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={input} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" rows={3} style={{ ...input, resize: "vertical" }} />
          <button type="submit" disabled={!name || !message} style={{ padding: "9px", background: "#e67e22", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", opacity: (!name || !message) ? 0.5 : 1 }}>
            Send → navigate to /products
          </button>
        </form>
      )}
    </div>
  );
}

const btn: React.CSSProperties = { padding: "5px 9px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const input: React.CSSProperties = { padding: "8px", borderRadius: "4px", border: "1px solid #ccc", fontFamily: "sans-serif", fontSize: "14px" };
