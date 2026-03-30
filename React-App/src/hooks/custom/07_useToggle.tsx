// CUSTOM HOOK: useToggle
//
// A simple boolean on/off shorthand. Avoids writing
// `setState(prev => !prev)` everywhere.
//
// Returns: [value, toggle, setTrue, setFalse]

import { useState, useCallback } from "react";

// ─── The Hook ─────────────────────────────────────────────────────────────────
const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle   = useCallback(() => setValue((v) => !v), []);
  const setTrue  = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse] as const;
};

// ─── Demo ─────────────────────────────────────────────────────────────────────
const UseToggleDemo = () => {
  const [isOn, toggle, turnOn, turnOff] = useToggle(false);
  const [menuOpen, toggleMenu] = useToggle(false);
  const [darkMode, toggleDark] = useToggle(false);
  const [isVisible, toggleVisible] = useToggle(true);

  return (
    <div>
      <h2>useToggle — Custom Hook</h2>

      {/* Basic toggle */}
      <div style={{ marginBottom: "14px" }}>
        <h3>Basic Toggle</h3>
        <p>State: <strong>{isOn ? "ON" : "OFF"}</strong></p>
        <button onClick={toggle}>Toggle</button>
        <button onClick={turnOn}  style={{ marginLeft: "8px" }}>Turn On</button>
        <button onClick={turnOff} style={{ marginLeft: "8px" }}>Turn Off</button>
      </div>

      {/* Menu open/close */}
      <div style={{ marginBottom: "14px" }}>
        <h3>Menu Open/Close</h3>
        <button onClick={toggleMenu}>{menuOpen ? "Close Menu" : "Open Menu"}</button>
        {menuOpen && (
          <div style={{ marginTop: "6px", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}>
            Menu content here…
          </div>
        )}
      </div>

      {/* Dark mode */}
      <div
        style={{
          marginBottom: "14px",
          padding: "12px",
          background: darkMode ? "#222" : "#f5f5f5",
          color: darkMode ? "#fff" : "#000",
          borderRadius: "6px",
          transition: "background 0.3s",
        }}
      >
        <h3>Dark Mode</h3>
        <p>Dark mode is <strong>{darkMode ? "ON" : "OFF"}</strong></p>
        <button onClick={toggleDark}>
          {darkMode ? "Switch to Light" : "Switch to Dark"}
        </button>
      </div>

      {/* Show / hide */}
      <div style={{ marginBottom: "14px" }}>
        <h3>Show / Hide</h3>
        <button onClick={toggleVisible}>
          {isVisible ? "Hide" : "Show"} Content
        </button>
        {isVisible && (
          <p style={{ color: "green", marginTop: "6px" }}>
            I am visible! Click the button to hide me.
          </p>
        )}
      </div>
    </div>
  );
};

export { useToggle };
export default UseToggleDemo;
