// SHARED UI — Button.tsx
//
// Rule: shared/ui/ holds generic, unstyled-but-themed components.
// They have NO knowledge of any feature (auth, cart, products).
// They accept only primitive props — never domain objects.
//
// This is the foundation of a Design System.

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: "#3b82f6", color: "#fff",     border: "none" },
  secondary: { background: "#f1f5f9", color: "#374151",  border: "1px solid #e5e7eb" },
  danger:    { background: "#ef4444", color: "#fff",     border: "none" },
  ghost:     { background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb" },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 12px",  fontSize: 13 },
  md: { padding: "9px 18px",  fontSize: 14 },
  lg: { padding: "12px 24px", fontSize: 16 },
};

export const Button = ({
  variant  = "primary",
  size     = "md",
  loading  = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) => (
  <button
    disabled={disabled || loading}
    style={{
      ...VARIANT_STYLES[variant],
      ...SIZE_STYLES[size],
      borderRadius:  8,
      fontWeight:    600,
      cursor:        disabled || loading ? "not-allowed" : "pointer",
      opacity:       disabled || loading ? 0.55 : 1,
      width:         fullWidth ? "100%" : undefined,
      display:       "inline-flex",
      alignItems:    "center",
      justifyContent:"center",
      gap:           6,
      transition:    "opacity 0.15s",
      ...style,
    }}
    {...rest}
  >
    {loading && <span style={{ fontSize: 14 }}>⏳</span>}
    {children}
  </button>
);
