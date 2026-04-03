// CART FEATURE — CartSummary.tsx
//
// Uses: shared/ui/Button, shared/ui/Badge, shared/utils/formatters
// Does NOT import from products/ or auth/.

import React from "react";
import { Button }         from "../../shared/ui/Button";
import { Badge }          from "../../shared/ui/Badge";
import { formatCurrency } from "../../shared/utils/formatters";
import type { CartItem }  from "./types";

interface Props {
  items:      CartItem[];
  total:      number;
  onRemove:   (id: number) => void;
  onUpdateQty:(id: number, qty: number) => void;
  onClear:    () => void;
}

export const CartSummary = ({ items, total, onRemove, onUpdateQty, onClear }: Props) => {
  if (items.length === 0) {
    return (
      <div style={s.empty}>
        <span style={{ fontSize: 40 }}>🛒</span>
        <p style={{ color: "#6b7280", marginTop: 8 }}>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.title}>Cart</span>
        <Badge color="blue">{items.reduce((s, i) => s + i.quantity, 0)} items</Badge>
      </div>

      <div style={s.list}>
        {items.map((item) => (
          <div key={item.id} style={s.row}>
            <span style={s.rowEmoji}>{item.emoji}</span>
            <div style={s.rowBody}>
              <span style={s.rowName}>{item.name}</span>
              <span style={s.rowPrice}>{formatCurrency(item.price)} × {item.quantity}</span>
            </div>
            <div style={s.rowActions}>
              <button style={s.qtyBtn} onClick={() => onUpdateQty(item.id, item.quantity - 1)}>−</button>
              <span style={s.qty}>{item.quantity}</span>
              <button style={s.qtyBtn} onClick={() => onUpdateQty(item.id, item.quantity + 1)}>+</button>
              <button style={s.removeBtn} onClick={() => onRemove(item.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div style={s.footer}>
        <div style={s.totalRow}>
          <span style={s.totalLabel}>Total</span>
          <span style={s.totalValue}>{formatCurrency(total)}</span>
        </div>
        <Button fullWidth style={{ marginTop: 12 }}>Checkout</Button>
        <Button variant="ghost" fullWidth size="sm" style={{ marginTop: 6 }} onClick={onClear}>
          Clear cart
        </Button>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  wrap:       { display: "flex", flexDirection: "column", gap: 0 },
  empty:      { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title:      { fontSize: 16, fontWeight: 700, color: "#111827" },
  list:       { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  row:        { display: "flex", alignItems: "center", gap: 12 },
  rowEmoji:   { fontSize: 26, width: 40, textAlign: "center" },
  rowBody:    { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  rowName:    { fontSize: 14, fontWeight: 600, color: "#111827" },
  rowPrice:   { fontSize: 12, color: "#6b7280" },
  rowActions: { display: "flex", alignItems: "center", gap: 4 },
  qtyBtn:     { width: 24, height: 24, border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  qty:        { width: 24, textAlign: "center", fontSize: 14, fontWeight: 600 },
  removeBtn:  { marginLeft: 4, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14 },
  footer:     { borderTop: "1px solid #e5e7eb", paddingTop: 16 },
  totalRow:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 15, fontWeight: 600, color: "#374151" },
  totalValue: { fontSize: 22, fontWeight: 800, color: "#111827" },
};
