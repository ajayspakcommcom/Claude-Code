// PRODUCTS FEATURE — ProductCard.tsx
//
// Uses: shared/ui/Button, shared/ui/Badge, shared/utils/formatters
// Accepts onAddToCart as a prop — does NOT import from cart/ directly
// (that would create a circular/tight coupling between features).
// The parent (app root) wires the two features together.

import React from "react";
import { Button } from "../../shared/ui/Button";
import { Badge }  from "../../shared/ui/Badge";
import { formatCurrency } from "../../shared/utils/formatters";
import type { Product } from "./types";

interface Props {
  product:      Product;
  onAddToCart:  (product: Product) => void;
  isInCart:     boolean;
}

export const ProductCard = ({ product, onAddToCart, isInCart }: Props) => (
  <div style={s.card}>
    <div style={s.emoji}>{product.emoji}</div>
    <div style={s.body}>
      <div style={s.topRow}>
        <span style={s.name}>{product.name}</span>
        <Badge color="gray">{product.category}</Badge>
      </div>
      <div style={s.ratingRow}>
        <span style={{ color: "#f59e0b" }}>{"★".repeat(Math.round(product.rating))}</span>
        <span style={s.ratingText}>{product.rating}</span>
        {!product.inStock && <Badge color="red">Out of stock</Badge>}
      </div>
      <div style={s.footer}>
        <span style={s.price}>{formatCurrency(product.price)}</span>
        <Button
          size="sm"
          variant={isInCart ? "secondary" : "primary"}
          disabled={!product.inStock}
          onClick={() => onAddToCart(product)}
        >
          {isInCart ? "✓ In cart" : "Add to cart"}
        </Button>
      </div>
    </div>
  </div>
);

const s: Record<string, React.CSSProperties> = {
  card:      { display: "flex", gap: 14, padding: "16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 },
  emoji:     { fontSize: 40, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 10, flexShrink: 0 },
  body:      { flex: 1, display: "flex", flexDirection: "column", gap: 8 },
  topRow:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  name:      { fontSize: 15, fontWeight: 700, color: "#111827" },
  ratingRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  ratingText:{ color: "#6b7280" },
  footer:    { display: "flex", justifyContent: "space-between", alignItems: "center" },
  price:     { fontSize: 20, fontWeight: 800, color: "#111827" },
};
