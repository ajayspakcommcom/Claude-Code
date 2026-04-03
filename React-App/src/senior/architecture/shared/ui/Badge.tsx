// SHARED UI — Badge.tsx
//
// Generic badge — used by products (rating), cart (count), auth (role).
// No feature-specific knowledge. Just color + label.

import React from "react";

export type BadgeColor = "blue" | "green" | "red" | "yellow" | "gray" | "purple";

interface BadgeProps {
  color?:    BadgeColor;
  children:  React.ReactNode;
  dot?:      boolean;  // show a colored dot instead of background
}

const COLOR_MAP: Record<BadgeColor, { bg: string; text: string }> = {
  blue:   { bg: "#eff6ff", text: "#1d4ed8" },
  green:  { bg: "#dcfce7", text: "#166534" },
  red:    { bg: "#fef2f2", text: "#dc2626" },
  yellow: { bg: "#fef9c3", text: "#854d0e" },
  gray:   { bg: "#f1f5f9", text: "#475569" },
  purple: { bg: "#f5f3ff", text: "#6d28d9" },
};

export const Badge = ({ color = "blue", children, dot }: BadgeProps) => {
  const { bg, text } = COLOR_MAP[color];
  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      gap:          5,
      padding:      dot ? "2px 8px" : "3px 10px",
      background:   bg,
      color:        text,
      borderRadius: 20,
      fontSize:     12,
      fontWeight:   700,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: text, flexShrink: 0 }} />}
      {children}
    </span>
  );
};
