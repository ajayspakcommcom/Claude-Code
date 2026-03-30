// TOPIC: useId
//
// useId generates a unique, stable ID that is consistent between
// server and client renders (important for SSR / hydration).
//
// Syntax:
//   const id = useId();  // returns something like ":r0:", ":r1:", etc.
//
// When to use:
//   ✅ Linking <label> to <input> via htmlFor / id
//   ✅ ARIA attributes (aria-describedby, aria-labelledby, aria-controls)
//   ✅ When you need unique IDs for multiple instances of the same component
//
// When NOT to use:
//   ❌ As a key in lists — use data IDs for that
//   ❌ For IDs you generate yourself (database IDs, UUIDs)

import { useId } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Label + Input accessibility linking
// ════════════════════════════════════════════════════════════

// Problem without useId: if you hardcode id="username", rendering this
// component twice on the same page gives duplicate IDs — invalid HTML.
const LabeledInput = ({ label, type = "text" }: { label: string; type?: string }) => {
  const id = useId(); // unique per component instance

  return (
    <div style={{ marginBottom: "8px" }}>
      {/* htmlFor links the label to the input by ID */}
      <label htmlFor={id} style={{ marginRight: "8px" }}>{label}</label>
      <input id={id} type={type} />
    </div>
  );
};

const LabelInputExample = () => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Label + Input (click label to focus input)</h3>
      {/* Each instance gets its own unique ID — no conflicts */}
      <LabeledInput label="Username" />
      <LabeledInput label="Email" type="email" />
      <LabeledInput label="Password" type="password" />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: ARIA attributes
// ════════════════════════════════════════════════════════════

const AccessibleInput = ({ label, hint }: { label: string; hint: string }) => {
  const inputId = useId();
  const hintId = useId(); // separate ID for the hint element

  return (
    <div style={{ marginBottom: "12px" }}>
      <label htmlFor={inputId}>{label}</label>
      <br />
      <input
        id={inputId}
        aria-describedby={hintId} // screen reader reads the hint after the label
        style={{ width: "200px" }}
      />
      <p id={hintId} style={{ fontSize: "12px", color: "#666", margin: "2px 0 0" }}>
        {hint}
      </p>
    </div>
  );
};

const AriaExample = () => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — ARIA Attributes with useId</h3>
      <AccessibleInput label="Phone number" hint="Format: +1 (555) 000-0000" />
      <AccessibleInput label="Date of birth" hint="Format: MM/DD/YYYY" />
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 3: Multiple IDs from one useId call (prefix trick)
// ════════════════════════════════════════════════════════════

const CheckboxGroup = () => {
  const baseId = useId();
  // Append suffixes to create multiple related IDs from one call
  const appleId = `${baseId}-apple`;
  const bananaId = `${baseId}-banana`;
  const cherryId = `${baseId}-cherry`;

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Multiple IDs from One useId (prefix pattern)</h3>
      <div>
        <input type="checkbox" id={appleId} />
        <label htmlFor={appleId} style={{ marginLeft: "6px" }}>Apple</label>
      </div>
      <div>
        <input type="checkbox" id={bananaId} />
        <label htmlFor={bananaId} style={{ marginLeft: "6px" }}>Banana</label>
      </div>
      <div>
        <input type="checkbox" id={cherryId} />
        <label htmlFor={cherryId} style={{ marginLeft: "6px" }}>Cherry</label>
      </div>
      <p style={{ fontSize: "12px", color: "#888" }}>Base ID: {baseId}</p>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseIdDemo = () => {
  return (
    <div>
      <h2>useId Hook</h2>
      <LabelInputExample />
      <AriaExample />
      <CheckboxGroup />
    </div>
  );
};

export default UseIdDemo;
