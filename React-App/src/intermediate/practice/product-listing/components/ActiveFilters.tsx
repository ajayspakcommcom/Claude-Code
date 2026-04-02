// TOPIC: ActiveFilters — filter badge chips + clear all
//
// Production pattern: show users exactly what filters are active.
// Each chip removes that specific filter when clicked.
// "Clear all" resets everything. Count badge on the filter button in the header.

import React from "react";
import type { Filters, Category } from "../types";
import { DEFAULT_FILTERS } from "../types";

interface Props {
  filters:    Filters;
  onRemove:   (update: Partial<Filters>) => void;
  onClearAll: () => void;
  dark:       boolean;
}

interface Chip {
  label: string;
  onRemove: () => void;
}

export const ActiveFilters = ({ filters, onRemove, onClearAll, dark }: Props) => {
  const chips: Chip[] = [];

  if (filters.search)
    chips.push({ label: `"${filters.search}"`, onRemove: () => onRemove({ search: "" }) });

  filters.categories.forEach((cat) =>
    chips.push({
      label:    cat,
      onRemove: () => onRemove({ categories: filters.categories.filter((c) => c !== cat) }),
    })
  );

  if (filters.minPrice > 0)
    chips.push({ label: `Min $${filters.minPrice}`, onRemove: () => onRemove({ minPrice: DEFAULT_FILTERS.minPrice }) });

  if (filters.maxPrice < 1000)
    chips.push({ label: `Max $${filters.maxPrice}`, onRemove: () => onRemove({ maxPrice: DEFAULT_FILTERS.maxPrice }) });

  if (filters.minRating > 0)
    chips.push({ label: `≥ ${"★".repeat(filters.minRating)}`, onRemove: () => onRemove({ minRating: 0 }) });

  if (filters.inStockOnly)
    chips.push({ label: "In stock", onRemove: () => onRemove({ inStockOnly: false }) });

  if (chips.length === 0) return null;

  const chipBg    = dark ? "#1e293b" : "#eff6ff";
  const chipColor = dark ? "#60a5fa" : "#1d4ed8";
  const chipBdr   = dark ? "#334155" : "#bfdbfe";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 13, color: dark ? "#64748b" : "#6b7280", fontWeight: 500 }}>
        Active filters:
      </span>

      {chips.map((chip, i) => (
        <span key={i} style={{
          display:      "inline-flex",
          alignItems:   "center",
          gap:          6,
          padding:      "4px 10px 4px 12px",
          background:   chipBg,
          color:        chipColor,
          border:       `1px solid ${chipBdr}`,
          borderRadius: 20,
          fontSize:     13,
          fontWeight:   500,
        }}>
          {chip.label}
          <button
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label} filter`}
            style={{
              background: "none", border: "none",
              cursor: "pointer", padding: 0,
              color: chipColor, fontSize: 14, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </span>
      ))}

      {/* Clear all */}
      <button
        onClick={onClearAll}
        style={{
          background: "none",
          border:     `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
          borderRadius: 20,
          padding:    "4px 12px",
          fontSize:   13,
          fontWeight: 600,
          color:      dark ? "#94a3b8" : "#6b7280",
          cursor:     "pointer",
        }}
      >
        Clear all
      </button>
    </div>
  );
};
