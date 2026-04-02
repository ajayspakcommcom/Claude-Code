// TOPIC: SortDropdown + ProductCard + ProductGrid

import React from "react";
import type { SortOption, Product } from "../types";
import { SORT_LABELS } from "../types";

// ─── SortDropdown ─────────────────────────────────────────────────────────────

interface SortProps {
  value:    SortOption;
  onChange: (s: SortOption) => void;
  total:    number;
  dark:     boolean;
}

export const SortDropdown = ({ value, onChange, total, dark }: SortProps) => {
  const bg    = dark ? "#1e293b" : "#fff";
  const bdr   = dark ? "#334155" : "#d1d5db";
  const color = dark ? "#f1f5f9" : "#111827";
  const sub   = dark ? "#94a3b8" : "#6b7280";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 14, color: sub }}>
        <strong style={{ color }}>{total.toLocaleString()}</strong> products
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label htmlFor="sort-select" style={{ fontSize: 13, color: sub }}>Sort:</label>
        <select
          id="sort-select"
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          style={{
            padding:      "8px 32px 8px 12px",
            background:   bg,
            border:       `1.5px solid ${bdr}`,
            borderRadius: 8,
            fontSize:     14,
            color,
            cursor:       "pointer",
            outline:      "none",
            appearance:   "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
            <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ─── ProductCard ──────────────────────────────────────────────────────────────

interface CardProps {
  product: Product;
  dark:    boolean;
}

const StarRating = ({ rating }: { rating: number }) => {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span aria-label={`Rating: ${rating} out of 5`}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(empty)}
    </span>
  );
};

export const ProductCard = ({ product, dark }: CardProps) => {
  const bg     = dark ? "#1e293b" : "#fff";
  const bdr    = dark ? "#334155" : "#e5e7eb";
  const text   = dark ? "#f1f5f9" : "#111827";
  const sub    = dark ? "#94a3b8" : "#6b7280";
  const tagBg  = dark ? "#0f172a" : "#f1f5f9";

  return (
    <article style={{
      background:   bg,
      border:       `1px solid ${bdr}`,
      borderRadius: 12,
      overflow:     "hidden",
      display:      "flex",
      flexDirection:"column",
      transition:   "box-shadow 0.2s, transform 0.2s",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = "none";
      (e.currentTarget as HTMLElement).style.transform = "none";
    }}
    >
      {/* Emoji image area */}
      <div style={{
        height:         140,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       64,
        background:     dark ? "#0f172a" : "#f8fafc",
        position:       "relative",
      }}>
        {product.emoji}
        {/* Out of stock overlay */}
        {!product.inStock && (
          <div style={{
            position:   "absolute", inset: 0,
            background: "rgba(0,0,0,0.45)",
            display:    "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, background: "#ef4444", padding: "4px 12px", borderRadius: 20 }}>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Category */}
        <span style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {product.category}
        </span>

        {/* Name */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: text, margin: 0, lineHeight: 1.3 }}>
          {product.name}
        </h3>

        {/* Rating */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#f59e0b", fontSize: 13 }}>
            <StarRating rating={product.rating} />
          </span>
          <span style={{ fontSize: 12, color: sub }}>
            {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {product.tags.slice(0, 2).map((tag) => (
            <span key={tag} style={{ fontSize: 11, padding: "2px 8px", background: tagBg, color: sub, borderRadius: 20 }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Price + Add button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: text }}>
            ${product.price === 0 ? "Free" : product.price.toLocaleString()}
          </span>
          <button
            disabled={!product.inStock}
            style={{
              padding:      "8px 16px",
              background:   product.inStock ? "#3b82f6" : "#e5e7eb",
              color:        product.inStock ? "#fff" : "#9ca3af",
              border:       "none",
              borderRadius: 8,
              fontSize:     13,
              fontWeight:   600,
              cursor:       product.inStock ? "pointer" : "not-allowed",
              transition:   "background 0.15s",
            }}
          >
            {product.inStock ? "Add to cart" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
};

// ─── ProductGrid ──────────────────────────────────────────────────────────────

interface GridProps {
  products:  Product[];
  isLoading: boolean;
  isFetching: boolean;  // true even with placeholderData — subtle fade instead of skeleton
  dark:      boolean;
}

const CardSkeleton = ({ dark }: { dark: boolean }) => (
  <div style={{
    background:   dark ? "#1e293b" : "#fff",
    border:       `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
    borderRadius: 12,
    overflow:     "hidden",
  }}>
    <div style={{ height: 140, background: dark ? "#334155" : "#f1f5f9" }} />
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      {[60, 90, 40].map((w, i) => (
        <div key={i} style={{ height: 14, width: `${w}%`, background: dark ? "#334155" : "#e5e7eb", borderRadius: 4 }} />
      ))}
    </div>
  </div>
);

const EmptyState = ({ dark }: { dark: boolean }) => (
  <div style={{
    gridColumn:     "1 / -1",
    textAlign:      "center",
    padding:        "80px 24px",
    color:          dark ? "#64748b" : "#9ca3af",
  }}>
    <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
    <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>No products found</h3>
    <p style={{ margin: 0 }}>Try adjusting your search or filters.</p>
  </div>
);

export const ProductGrid = ({ products, isLoading, isFetching, dark }: GridProps) => (
  <div style={{
    display:             "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap:                 20,
    opacity:             isFetching && !isLoading ? 0.6 : 1,
    transition:          "opacity 0.2s",
  }}>
    {isLoading
      ? Array.from({ length: 12 }, (_, i) => <CardSkeleton key={i} dark={dark} />)
      : products.length === 0
        ? <EmptyState dark={dark} />
        : products.map((p) => <ProductCard key={p.id} product={p} dark={dark} />)
    }
  </div>
);
