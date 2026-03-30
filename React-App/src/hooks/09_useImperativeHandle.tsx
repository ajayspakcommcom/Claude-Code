// TOPIC: useImperativeHandle
//
// useImperativeHandle customizes what a parent component gets when it uses
// a ref on a child component.
//
// Normally, a ref on a DOM element gives you the raw DOM node.
// useImperativeHandle lets you EXPOSE only specific methods instead.
//
// Must be used together with forwardRef.
//
// Syntax:
//   useImperativeHandle(ref, () => ({ method1, method2 }), [deps]);
//
// When to use:
//   ✅ Building reusable input/modal components that need imperative control
//      (focus, open, close, reset, scroll) from the parent
//   ❌ Avoid overusing — prefer props/state for most communication

import { useRef, useImperativeHandle, forwardRef, useState } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Custom Input — expose focus() and clear()
// ════════════════════════════════════════════════════════════

// Define the methods we want to expose to the parent
interface FancyInputHandle {
  focus: () => void;
  clear: () => void;
}

// forwardRef passes the parent's ref into this child component
const FancyInput = forwardRef<FancyInputHandle, { placeholder?: string }>(
  ({ placeholder }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState("");

    // Tell React what to expose when the parent uses ref on this component
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => setValue(""),
    }));

    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{ padding: "4px", width: "220px" }}
      />
    );
  }
);

const FancyInputExample = () => {
  // Parent gets the { focus, clear } handle — NOT the raw DOM node
  const fancyRef = useRef<FancyInputHandle>(null);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Custom Input (focus & clear)</h3>
      <FancyInput ref={fancyRef} placeholder="Type something…" />
      <button onClick={() => fancyRef.current?.focus()} style={{ marginLeft: "8px" }}>Focus</button>
      <button onClick={() => fancyRef.current?.clear()} style={{ marginLeft: "8px" }}>Clear</button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Modal — expose open() and close()
// ════════════════════════════════════════════════════════════

interface ModalHandle {
  open: () => void;
  close: () => void;
}

const Modal = forwardRef<ModalHandle>((_, ref) => {
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.4)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 100,
      }}
    >
      <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", minWidth: "240px" }}>
        <h4>Modal is open!</h4>
        <p>Parent called modal.open() imperatively.</p>
        <button onClick={() => setVisible(false)}>Close</button>
      </div>
    </div>
  );
});

const ModalExample = () => {
  const modalRef = useRef<ModalHandle>(null);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Modal (open & close imperatively)</h3>
      <button onClick={() => modalRef.current?.open()}>Open Modal</button>
      <Modal ref={modalRef} />
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseImperativeHandleDemo = () => {
  return (
    <div>
      <h2>useImperativeHandle Hook</h2>
      <FancyInputExample />
      <ModalExample />
    </div>
  );
};

export default UseImperativeHandleDemo;
