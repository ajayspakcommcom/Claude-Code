// TOPIC: FilterPanel — Category multi-select, price range, rating, in-stock
//
// Production patterns:
//   - Category checkboxes: toggle item in/out of array (multi-select)
//   - Price range: two inputs (min/max) with validation (min ≤ max)
//   - Star rating filter: visual star buttons (≥ 1★, ≥ 2★, ≥ 3★, ≥ 4★)
//   - In-stock toggle: simple checkbox
//   - facets: show count per category from API (only matching results)

import React from "react";
import type { Filters, Category } from "../types";

const ALL_CATEGORIES: Category[] = [
  "Electronics", "Clothing", "Books", "Home & Garden", "Sports", "Toys",
];

const CATEGORY_ICONS: Record<Category, string> = {
  Electronics:    "⚡",
  Clothing:       "👕",
  Books:          "📚",
  "Home & Garden":"🏡",
  Sports:         "🏃",
  Toys:           "🧸",
};

interface Props {
  filters:        Filters;
  onFilterChange: (update: Partial<Filters>) => void;
  categoryCounts: Record<Category, number>;
  dark:           boolean;
}

export const FilterPanel = ({ filters, onFilterChange, categoryCounts, dark }: Props) => {
  const bg      = dark ? "#1e293b" : "#fff";
  const border  = dark ? "#334155" : "#e5e7eb";
  const text    = dark ? "#f1f5f9" : "#111827";
  const subText = dark ? "#94a3b8" : "#6b7280";
  const inputBg = dark ? "#0f172a" : "#f9fafb";

  // Toggle a category in/out of the categories array
  const toggleCategory = (cat: Category) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ categories: next });
  };

  return (
    <aside style={{
      width:        260,
      flexShrink:   0,
      background:   bg,
      border:       `1px solid ${border}`,
      borderRadius: 12,
      padding:      24,
      height:       "fit-content",
      position:     "sticky",
      top:          80,
    }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: text, margin: "0 0 20px" }}>
        Filters
      </h2>

      {/* ── Categories ──────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={{ ...s.sectionTitle, color: subText }}>Category</h3>
        <div style={s.checkList}>
          {ALL_CATEGORIES.map((cat) => {
            const checked = filters.categories.includes(cat);
            const count   = categoryCounts[cat] ?? 0;
            return (
              <label key={cat} style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(cat)}
                  style={s.checkbox}
                />
                <span style={{ color: text, flex: 1 }}>
                  {CATEGORY_ICONS[cat]} {cat}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: count > 0 ? "#3b82f6" : subText,
                  background: dark ? "#0f172a" : "#f1f5f9",
                  padding: "1px 6px", borderRadius: 10,
                }}>
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <div style={{ ...s.divider, background: border }} />

      {/* ── Price range ──────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={{ ...s.sectionTitle, color: subText }}>Price Range</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={s.priceField}>
            <span style={{ ...s.pricePrefix, color: subText }}>$</span>
            <input
              type="number"
              min={0}
              max={filters.maxPrice}
              value={filters.minPrice}
              onChange={(e) => {
                const v = Math.max(0, Math.min(Number(e.target.value), filters.maxPrice));
                onFilterChange({ minPrice: v });
              }}
              style={{ ...s.priceInput, background: inputBg, color: text, border: `1px solid ${border}` }}
              aria-label="Minimum price"
            />
          </div>
          <span style={{ color: subText }}>–</span>
          <div style={s.priceField}>
            <span style={{ ...s.pricePrefix, color: subText }}>$</span>
            <input
              type="number"
              min={filters.minPrice}
              max={10000}
              value={filters.maxPrice}
              onChange={(e) => {
                const v = Math.max(filters.minPrice, Number(e.target.value));
                onFilterChange({ maxPrice: v });
              }}
              style={{ ...s.priceInput, background: inputBg, color: text, border: `1px solid ${border}` }}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </section>

      <div style={{ ...s.divider, background: border }} />

      {/* ── Minimum rating ───────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={{ ...s.sectionTitle, color: subText }}>Minimum Rating</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2, 3, 4].map((stars) => (
            <button
              key={stars}
              onClick={() => onFilterChange({ minRating: stars === filters.minRating ? 0 : stars })}
              style={{
                ...s.starBtn,
                background: filters.minRating === stars && stars > 0
                  ? "#fef3c7"
                  : dark ? "#0f172a" : "#f9fafb",
                border: `1px solid ${filters.minRating === stars && stars > 0 ? "#f59e0b" : border}`,
                color: stars === 0 ? subText : "#f59e0b",
              }}
              aria-label={stars === 0 ? "Any rating" : `${stars} stars and up`}
            >
              {stars === 0 ? "Any" : `${"★".repeat(stars)}+`}
            </button>
          ))}
        </div>
      </section>

      <div style={{ ...s.divider, background: border }} />

      {/* ── In stock only ─────────────────────────────────────────────────── */}
      <section style={s.section}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
            style={s.checkbox}
          />
          <span style={{ color: text, fontWeight: 500 }}>In stock only</span>
          <span style={{ ...s.stockBadge, background: dark ? "#0f172a" : "#dcfce7", color: "#166534" }}>
            ✓ Available
          </span>
        </label>
      </section>
    </aside>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  section:      { marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 12px" },
  checkList:    { display: "flex", flexDirection: "column", gap: 8 },
  checkLabel:   { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 },
  checkbox:     { width: 16, height: 16, cursor: "pointer", accentColor: "#3b82f6" },
  divider:      { height: 1, margin: "16px 0" },
  priceField:   { position: "relative", flex: 1 },
  pricePrefix:  { position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13 },
  priceInput:   { width: "100%", padding: "8px 8px 8px 20px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  starBtn:      { padding: "5px 8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0 },
  stockBadge:   { fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 },
};
