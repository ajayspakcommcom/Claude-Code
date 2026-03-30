// PRACTICE: Counter App
//
// Concepts used:
//   • useState — count value
//   • Events — onClick handlers
//   • Conditional rendering — color changes based on value
//   • Props — reusable CounterButton component

import { useState } from "react";

// ─── Reusable Button Component ────────────────────────────────────────────────
interface CounterButtonProps {
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

const CounterButton = ({ label, onClick, color = "#4a90e2", disabled = false }: CounterButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? "#ccc" : color,
      color: "#fff",
      border: "none",
      padding: "8px 18px",
      borderRadius: "6px",
      fontSize: "18px",
      cursor: disabled ? "not-allowed" : "pointer",
      margin: "0 6px",
    }}
  >
    {label}
  </button>
);

// ─── Counter App ──────────────────────────────────────────────────────────────
const Counter = () => {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  const increment = () => setCount((c) => c + step);
  const decrement = () => setCount((c) => c - step);
  const reset     = () => setCount(0);

  // Colour changes based on count value
  const getColor = () => {
    if (count > 0) return "green";
    if (count < 0) return "red";
    return "#333";
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Counter App</h2>

      {/* Count display */}
      <div
        style={{
          fontSize: "72px",
          fontWeight: "bold",
          color: getColor(),
          margin: "20px 0",
          transition: "color 0.3s",
        }}
      >
        {count}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: "20px" }}>
        <CounterButton label="−" onClick={decrement} color="#e74c3c" />
        <CounterButton label="Reset" onClick={reset} color="#888" disabled={count === 0} />
        <CounterButton label="+" onClick={increment} color="#2ecc71" />
      </div>

      {/* Step selector */}
      <div style={{ marginTop: "16px" }}>
        <label style={{ marginRight: "10px" }}>Step:</label>
        {[1, 5, 10, 25].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            style={{
              margin: "0 4px",
              padding: "4px 10px",
              borderRadius: "4px",
              border: "2px solid #4a90e2",
              background: step === s ? "#4a90e2" : "#fff",
              color: step === s ? "#fff" : "#4a90e2",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div
        style={{
          marginTop: "24px",
          padding: "12px",
          background: "#f5f5f5",
          borderRadius: "8px",
          display: "inline-block",
          minWidth: "200px",
        }}
      >
        <p style={{ margin: "4px 0" }}>Step: <strong>{step}</strong></p>
        <p style={{ margin: "4px 0" }}>
          Status:{" "}
          <strong style={{ color: getColor() }}>
            {count > 0 ? "Positive" : count < 0 ? "Negative" : "Zero"}
          </strong>
        </p>
      </div>
    </div>
  );
};

export default Counter;
