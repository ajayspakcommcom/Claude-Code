// CUSTOM HOOK: useWindowSize
//
// Tracks the browser window's width and height in real time.
// Updates on every resize event and cleans up the listener on unmount.
//
// Returns: { width, height }

import { useState, useEffect } from "react";

interface WindowSize {
  width: number;
  height: number;
}

// ─── The Hook ─────────────────────────────────────────────────────────────────
const useWindowSize = (): WindowSize => {
  const [size, setSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
};

// ─── Demo ─────────────────────────────────────────────────────────────────────
const UseWindowSizeDemo = () => {
  const { width, height } = useWindowSize();

  const getBreakpoint = () => {
    if (width < 480) return { label: "XS — Mobile", color: "#e74c3c" };
    if (width < 768) return { label: "SM — Large Mobile", color: "#e67e22" };
    if (width < 1024) return { label: "MD — Tablet", color: "#f1c40f" };
    if (width < 1280) return { label: "LG — Desktop", color: "#2ecc71" };
    return { label: "XL — Large Desktop", color: "#3498db" };
  };

  const { label, color } = getBreakpoint();

  return (
    <div>
      <h2>useWindowSize — Custom Hook</h2>
      <p style={{ fontSize: "13px", color: "#888" }}>
        Resize the browser window to see the values update.
      </p>

      <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
        <div style={{ textAlign: "center", padding: "12px 20px", background: "#f0f0f0", borderRadius: "8px" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{width}</div>
          <div style={{ fontSize: "12px", color: "#888" }}>Width (px)</div>
        </div>
        <div style={{ textAlign: "center", padding: "12px 20px", background: "#f0f0f0", borderRadius: "8px" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{height}</div>
          <div style={{ fontSize: "12px", color: "#888" }}>Height (px)</div>
        </div>
      </div>

      <div
        style={{
          display: "inline-block",
          padding: "6px 14px",
          borderRadius: "20px",
          background: color,
          color: "#fff",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        {label}
      </div>

      {/* Visual bar showing relative width */}
      <div style={{ marginTop: "16px" }}>
        <p style={{ fontSize: "13px", marginBottom: "4px" }}>
          Width relative to 1440px max:
        </p>
        <div style={{ background: "#eee", borderRadius: "4px", height: "12px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min((width / 1440) * 100, 100)}%`,
              height: "100%",
              background: color,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export { useWindowSize };
export default UseWindowSizeDemo;
