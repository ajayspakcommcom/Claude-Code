// TOPIC: useLayoutEffect
//
// useLayoutEffect works exactly like useEffect BUT fires SYNCHRONOUSLY
// after React updates the DOM and BEFORE the browser paints to the screen.
//
// Timeline:
//   React renders → updates DOM → useLayoutEffect fires → browser paints → useEffect fires
//
// When to use useLayoutEffect:
//   ✅ Reading/modifying DOM measurements (width, height, scroll position)
//      that must happen before the user sees the screen (prevents flicker)
//   ✅ Synchronizing animations or tooltips that depend on DOM size
//
// When to use useEffect (default choice):
//   ✅ API calls, subscriptions, timers — anything that doesn't need DOM measurements
//
// ⚠️ useLayoutEffect blocks the browser paint — keep it fast!

import { useState, useEffect, useLayoutEffect, useRef } from "react";

// ─── Example 1: Measuring DOM size before paint (no flicker) ──────────────────
const MeasureExample = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // useLayoutEffect reads the DOM size BEFORE the user sees anything
  // Using useEffect here would cause a visible flicker (renders wrong size first)
  useLayoutEffect(() => {
    if (boxRef.current) {
      setWidth(boxRef.current.getBoundingClientRect().width);
    }
  }, []);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Measure DOM Before Paint</h3>
      <div
        ref={boxRef}
        style={{ background: "#e0e0ff", padding: "10px", borderRadius: "4px" }}
      >
        This box is {width}px wide (measured with useLayoutEffect before paint)
      </div>
    </div>
  );
};

// ─── Example 2: Tooltip position (reposition before user sees it) ─────────────
const TooltipExample = () => {
  const [show, setShow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipLeft, setTooltipLeft] = useState(0);

  useLayoutEffect(() => {
    if (show && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      // If tooltip overflows right edge, shift it left
      if (rect.right > window.innerWidth) {
        setTooltipLeft(window.innerWidth - rect.right - 8);
      } else {
        setTooltipLeft(0);
      }
    }
  }, [show]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Tooltip Repositioned Before Paint</h3>
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          Hover me
        </button>
        {show && (
          <div
            ref={tooltipRef}
            style={{
              position: "absolute",
              top: "110%",
              left: tooltipLeft,
              background: "#333",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            Tooltip — repositioned to stay in viewport
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Example 3: useLayoutEffect vs useEffect timing ──────────────────────────
const TimingComparisonExample = () => {
  const [log, setLog] = useState<string[]>([]);

  useLayoutEffect(() => {
    setLog((prev) => [...prev, "useLayoutEffect fired (before paint)"]);
  }, []);

  useEffect(() => {
    setLog((prev) => [...prev, "useEffect fired (after paint)"]);
  }, []);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Firing Order: useLayoutEffect vs useEffect</h3>
      <ol>
        {log.map((entry, i) => <li key={i}>{entry}</li>)}
      </ol>
      <p style={{ fontSize: "13px", color: "#888" }}>
        useLayoutEffect always fires before useEffect
      </p>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseLayoutEffectDemo = () => {
  return (
    <div>
      <h2>useLayoutEffect Hook</h2>
      <MeasureExample />
      <TooltipExample />
      <TimingComparisonExample />
    </div>
  );
};

export default UseLayoutEffectDemo;
