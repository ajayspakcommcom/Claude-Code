// FILE: src/routes/contact.tsx
// ROUTE: /contact
//
// CONCEPT: useNavigate — programmatic navigation
//
// useNavigate returns a `navigate` function that lets you move to any route
// from anywhere in the component tree — no <Link> needed.
//
// Use cases:
//   - Navigate after form submit / API call
//   - Conditional redirect based on business logic
//   - Navigate with search params or dynamic params
//   - Replace history entry instead of pushing (no back button)

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  // CONCEPT: useNavigate
  // Returns a stable `navigate` function. Call it imperatively at any time.
  const navigate = useNavigate();

  const [name,    setName]    = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    // Simulate sending a form (API call)
    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 800));

    // navigate({ to, search, params, replace, resetScroll })
    //
    //   to:          the route path to navigate to
    //   search:      typed search params to pass along
    //   params:      typed dynamic params (for routes like /users/$userId)
    //   replace:     true = replace history entry (no "back" to /contact)
    //   resetScroll: false = keep scroll position (default: true)

    navigate({
      to:      "/products",
      search:  { category: "all", sort: "name" },
      replace: true,  // user can't go "back" to the contact form after submit
    });
  };

  return (
    <div style={{ maxWidth: "480px" }}>
      <h2>📬 Contact</h2>
      <p style={{ fontSize: "13px", color: "#888" }}>
        On submit: <code>navigate({"{ to: '/products', search: {...}, replace: true }"}) </code>
      </p>

      {/* useNavigate examples — buttons for each navigate variant */}
      <div style={{ marginBottom: "20px", padding: "12px", background: "#f9f9f9", borderRadius: "6px" }}>
        <strong style={{ fontSize: "13px" }}>navigate() variants:</strong>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
          <button
            onClick={() => navigate({ to: "/" })}
            style={btnStyle}
          >
            navigate to /
          </button>
          <button
            onClick={() => navigate({ to: "/users/$userId", params: { userId: "2" } })}
            style={btnStyle}
          >
            navigate /users/2 (with params)
          </button>
          <button
            onClick={() => navigate({ to: "/products", search: { category: "tech", sort: "price" } })}
            style={btnStyle}
          >
            navigate /products?category=tech&sort=price
          </button>
          <button
            onClick={() => navigate({ to: "/products", replace: true })}
            style={{ ...btnStyle, background: "#e67e22" }}
          >
            navigate (replace — no back)
          </button>
        </div>
      </div>

      {submitted ? (
        <p style={{ color: "#2ecc71" }}>✓ Sending... redirecting to products.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={inputStyle}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message"
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <button
            type="submit"
            disabled={!name.trim() || !message.trim()}
            style={{ padding: "10px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", opacity: (!name.trim() || !message.trim()) ? 0.5 : 1 }}
          >
            Send → navigate to /products (replace)
          </button>
        </form>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "6px 10px", background: "#4a90e2", color: "#fff",
  border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px",
};

const inputStyle: React.CSSProperties = {
  padding: "8px", borderRadius: "4px", border: "1px solid #ccc",
  fontFamily: "sans-serif", fontSize: "14px",
};
