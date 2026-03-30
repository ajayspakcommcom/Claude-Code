// TOPIC: useRef
//
// useRef returns a mutable object: { current: value }
// TWO main use cases:
//   1. Access a DOM element directly (focus, scroll, measure)
//   2. Persist a value across renders WITHOUT triggering a re-render
//
// Key difference from useState:
//   • Changing ref.current does NOT cause a re-render
//   • The value survives re-renders (unlike a plain variable)

import { useRef, useState, useEffect } from "react";

// ─── Example 1: Access a DOM element (focus input) ───────────────────────────
const FocusInputExample = () => {
  // inputRef.current will point to the <input> DOM node after mount
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus(); // directly call DOM method
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — DOM Access (focus input)</h3>
      <input ref={inputRef} placeholder="Click the button to focus me" style={{ marginRight: "8px" }} />
      <button onClick={focusInput}>Focus Input</button>
    </div>
  );
};

// ─── Example 2: Store previous state value ───────────────────────────────────
const PreviousValueExample = () => {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef<number>(0);

  useEffect(() => {
    // After every render, save current count into the ref
    prevCountRef.current = count;
  });

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Persist Value Without Re-render (previous value)</h3>
      <p>Current: {count} | Previous: {prevCountRef.current}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
};

// ─── Example 3: Interval ID stored in ref (not state) ────────────────────────
const IntervalRefExample = () => {
  const [seconds, setSeconds] = useState(0);
  // Store the interval ID in a ref — we don't need to re-render when it changes
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = () => {
    stop();
    setSeconds(0);
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Interval ID in Ref</h3>
      <p>Seconds: {seconds}</p>
      <button onClick={start}>Start</button>
      <button onClick={stop} style={{ marginLeft: "8px" }}>Stop</button>
      <button onClick={reset} style={{ marginLeft: "8px" }}>Reset</button>
    </div>
  );
};

// ─── Example 4: Scroll to element ────────────────────────────────────────────
const ScrollToExample = () => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 4 — Scroll to DOM Element</h3>
      <button onClick={scrollToBottom}>Scroll to Bottom Marker</button>
      <div style={{ height: "100px", overflow: "auto", border: "1px solid #ccc", marginTop: "8px", padding: "8px" }}>
        <p>Line 1</p><p>Line 2</p><p>Line 3</p><p>Line 4</p><p>Line 5</p>
        <div ref={bottomRef} style={{ color: "red" }}>⬆ Bottom marker</div>
      </div>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseRefDemo = () => {
  return (
    <div>
      <h2>useRef Hook</h2>
      <FocusInputExample />
      <PreviousValueExample />
      <IntervalRefExample />
      <ScrollToExample />
    </div>
  );
};

export default UseRefDemo;
