// TOPIC: SearchBar — Debounced input
//
// Production pattern: debounce prevents an API call on every keystroke.
// The user types "headphones" (10 chars) → only ONE fetch fires after
// they stop typing for 300ms, not 10 fetches.
//
// Implementation:
//   - localValue: immediate (shown in the input)
//   - useEffect + setTimeout: fires setSearch() 300ms after localValue stops changing
//   - clearTimeout on cleanup: cancels the pending timer if user types again
//   - Controlled sync: if filters.search changes externally (e.g. "clear all"),
//     reset localValue to match

import React, { useState, useEffect } from "react";

const DEBOUNCE_MS = 300;

interface Props {
  value:    string;
  onChange: (q: string) => void;
  dark:     boolean;
}

export const SearchBar = ({ value, onChange, dark }: Props) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync external clears (e.g. "Clear all filters" resets value to "")
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce: fire onChange 300ms after the user stops typing
  useEffect(() => {
    const id = setTimeout(() => {
      if (localValue !== value) onChange(localValue);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id); // cancel previous timer on each keystroke
  }, [localValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const inputBg   = dark ? "#1e293b" : "#fff";
  const border    = dark ? "#334155" : "#d1d5db";
  const textColor = dark ? "#f1f5f9" : "#111827";
  const iconColor = dark ? "#64748b" : "#9ca3af";

  return (
    <div style={{ position: "relative", flex: 1, maxWidth: 480 }}>
      {/* Search icon */}
      <span style={{
        position: "absolute", left: 14, top: "50%",
        transform: "translateY(-50%)", fontSize: 16, color: iconColor,
        pointerEvents: "none",
      }}>
        🔍
      </span>

      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Search products, categories, tags…"
        aria-label="Search products"
        style={{
          width:        "100%",
          padding:      "11px 40px 11px 42px",
          background:   inputBg,
          border:       `1.5px solid ${border}`,
          borderRadius: 10,
          fontSize:     15,
          color:        textColor,
          outline:      "none",
          boxSizing:    "border-box",
          transition:   "border-color 0.15s",
        }}
        onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; }}
        onBlur={(e)  => { e.target.style.borderColor = border;    }}
      />

      {/* Clear button */}
      {localValue && (
        <button
          onClick={() => { setLocalValue(""); onChange(""); }}
          aria-label="Clear search"
          style={{
            position:   "absolute", right: 12, top: "50%",
            transform:  "translateY(-50%)",
            background: "none", border: "none",
            cursor:     "pointer", fontSize: 16, color: iconColor,
            padding:    0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
