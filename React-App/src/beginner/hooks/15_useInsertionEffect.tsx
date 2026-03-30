// TOPIC: useInsertionEffect
//
// useInsertionEffect fires BEFORE React makes any DOM mutations.
// It exists specifically for CSS-in-JS libraries to inject <style> tags
// into the DOM before components read layout (preventing style flicker).
//
// Firing order:
//   useInsertionEffect → DOM mutations → useLayoutEffect → browser paint → useEffect
//
// ⚠️ You CANNOT read or update refs inside useInsertionEffect
//    (the DOM has not been mutated yet when it fires).
//
// When to use:
//   ✅ Building CSS-in-JS libraries (styled-components, emotion use this)
//   ✅ Injecting critical <style> tags before layout reads
//
// When NOT to use:
//   ❌ Application code — this is a library-level hook
//   ❌ Fetching data, subscriptions, or DOM measurements
//
// In practice:
//   You will almost never write useInsertionEffect in app code.
//   It is shown here for completeness and understanding.

import { useInsertionEffect, useLayoutEffect, useEffect, useState } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Firing order demonstration
// ════════════════════════════════════════════════════════════

const FiringOrderExample = () => {
  const [log, setLog] = useState<string[]>([]);

  // Fires 1st — before DOM mutations
  useInsertionEffect(() => {
    setLog((prev) => [...prev, "1. useInsertionEffect (before DOM mutations)"]);
  }, []);

  // Fires 2nd — after DOM mutations, before paint
  useLayoutEffect(() => {
    setLog((prev) => [...prev, "2. useLayoutEffect (after DOM mutations, before paint)"]);
  }, []);

  // Fires 3rd — after paint
  useEffect(() => {
    setLog((prev) => [...prev, "3. useEffect (after paint)"]);
  }, []);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Hook Firing Order</h3>
      <ol>
        {log.map((entry, i) => <li key={i}>{entry}</li>)}
      </ol>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Simulated CSS-in-JS style injection
// ════════════════════════════════════════════════════════════

// A simplified version of what styled-components/emotion do internally
const injectedStyles = new Set<string>();

const injectStyle = (css: string, id: string) => {
  if (injectedStyles.has(id)) return; // already injected
  const style = document.createElement("style");
  style.setAttribute("data-css-id", id);
  style.textContent = css;
  document.head.appendChild(style);
  injectedStyles.add(id);
};

// Hook that mimics a CSS-in-JS library's internal hook
const useCSSInJS = (css: string, id: string) => {
  useInsertionEffect(() => {
    // Inject the style BEFORE any DOM mutations — no flicker
    injectStyle(css, id);
  }, [css, id]);
};

const StyledButton = ({ children }: { children: React.ReactNode }) => {
  // Inject styles before the component renders to the DOM
  useCSSInJS(
    `.css-btn {
      background: #4a90e2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .css-btn:hover { background: #357abd; }`,
    "css-btn"
  );

  return <button className="css-btn">{children}</button>;
};

const StyleInjectionExample = () => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Simulated CSS-in-JS Style Injection</h3>
      <p style={{ fontSize: "13px", color: "#888" }}>
        The style for this button was injected via useInsertionEffect before DOM paint.
        Check the &lt;head&gt; in DevTools for a &lt;style data-css-id="css-btn"&gt; tag.
      </p>
      <StyledButton>Styled via useInsertionEffect</StyledButton>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseInsertionEffectDemo = () => {
  return (
    <div>
      <h2>useInsertionEffect Hook</h2>
      <div style={{ background: "#fff3cd", padding: "10px", borderRadius: "4px", marginBottom: "16px", fontSize: "13px" }}>
        ⚠️ This is a library-author hook. In application code, use useEffect or useLayoutEffect instead.
      </div>
      <FiringOrderExample />
      <StyleInjectionExample />
    </div>
  );
};

export default UseInsertionEffectDemo;
