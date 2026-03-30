// CUSTOM HOOK: useClickOutside
//
// Detects a click (or touch) outside of a referenced element and calls a handler.
// Classic use cases: closing dropdowns, modals, popups when user clicks away.
//
// Usage:
//   const ref = useClickOutside(() => setOpen(false));
//   <div ref={ref}>...</div>

import { useEffect, useRef, useState } from "react";

// ─── The Hook ─────────────────────────────────────────────────────────────────
const useClickOutside = <T extends HTMLElement>(handler: () => void) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // If the click is inside the ref element, do nothing
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);

  return ref;
};

// ─── Demo 1: Dropdown ─────────────────────────────────────────────────────────
const DropdownExample = () => {
  const [open, setOpen] = useState(false);

  const dropdownRef = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Example 1 — Dropdown</h3>
      <div ref={dropdownRef} style={{ display: "inline-block", position: "relative" }}>
        <button onClick={() => setOpen((o) => !o)}>
          Menu {open ? "▲" : "▼"}
        </button>
        {open && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "4px 0",
              listStyle: "none",
              margin: 0,
              minWidth: "120px",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <li style={{ padding: "8px 12px", cursor: "pointer" }}>Profile</li>
            <li style={{ padding: "8px 12px", cursor: "pointer" }}>Settings</li>
            <li style={{ padding: "8px 12px", cursor: "pointer" }}>Logout</li>
          </ul>
        )}
      </div>
      <span style={{ marginLeft: "12px", fontSize: "13px", color: "#888" }}>
        Click outside the menu to close it.
      </span>
    </div>
  );
};

// ─── Demo 2: Modal / Dialog ───────────────────────────────────────────────────
const ModalExample = () => {
  const [open, setOpen] = useState(false);

  const modalRef = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Example 2 — Modal</h3>
      <button onClick={() => setOpen(true)}>Open Modal</button>

      {open && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            ref={modalRef}
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "280px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <h4>Modal Content</h4>
            <p>Click outside this box to close it.</p>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Demo 3: Tooltip ──────────────────────────────────────────────────────────
const TooltipExample = () => {
  const [show, setShow] = useState(false);

  const tooltipRef = useClickOutside<HTMLDivElement>(() => setShow(false));

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Example 3 — Popover / Tooltip</h3>
      <div ref={tooltipRef} style={{ display: "inline-block", position: "relative" }}>
        <button onClick={() => setShow((s) => !s)}>
          ℹ️ More Info
        </button>
        {show && (
          <div
            style={{
              position: "absolute",
              top: "110%",
              left: 0,
              background: "#333",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: "6px",
              width: "220px",
              fontSize: "13px",
              zIndex: 10,
            }}
          >
            This is a popover. Click anywhere outside to dismiss it.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseClickOutsideDemo = () => {
  return (
    <div>
      <h2>useClickOutside — Custom Hook</h2>
      <DropdownExample />
      <ModalExample />
      <TooltipExample />
    </div>
  );
};

export { useClickOutside };
export default UseClickOutsideDemo;
