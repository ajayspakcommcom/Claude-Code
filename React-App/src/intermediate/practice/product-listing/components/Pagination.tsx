// TOPIC: Pagination — Page numbers with ellipsis, prev/next, keyboard accessible
//
// Production patterns:
//   - Ellipsis algorithm: always show first, last, current ±1, and "…" between gaps
//   - Scroll to top on page change (smooth scroll)
//   - Disabled states: prev on page 1, next on last page
//   - aria-label + aria-current for accessibility

import React, { useMemo } from "react";

interface Props {
  page:       number;
  totalPages: number;
  total:      number;
  pageSize:   number;
  onChange:   (page: number) => void;
  dark:       boolean;
}

// ─── Ellipsis page range algorithm ───────────────────────────────────────────
// Returns array of page numbers and "…" strings
// Example for page=5, total=12: [1, "…", 4, 5, 6, "…", 12]

const buildPageRange = (current: number, total: number): (number | "…")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [];
  const add = (n: number | "…") => {
    if (pages[pages.length - 1] !== n) pages.push(n);
  };

  add(1);
  if (current > 3) add("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) add(i);
  if (current < total - 2) add("…");
  add(total);

  return pages;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Pagination = ({ page, totalPages, total, pageSize, onChange, dark }: Props) => {
  const pages   = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);
  const isFirst = page === 1;
  const isLast  = page === totalPages;

  // Range of items shown (e.g. "Showing 13–24 of 87")
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const handleChange = (p: number) => {
    onChange(p);
    // Smooth scroll to top so the user sees the new results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bg      = dark ? "#1e293b" : "#fff";
  const bdr     = dark ? "#334155" : "#e5e7eb";
  const text    = dark ? "#f1f5f9" : "#111827";
  const sub     = dark ? "#94a3b8" : "#6b7280";

  const btnBase: React.CSSProperties = {
    minWidth:     36,
    height:       36,
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    borderRadius: 8,
    border:       `1px solid ${bdr}`,
    background:   bg,
    cursor:       "pointer",
    fontSize:     14,
    fontWeight:   500,
    color:        text,
    transition:   "all 0.15s",
    padding:      "0 10px",
  };

  const activeBtn: React.CSSProperties = {
    ...btnBase,
    background:   "#3b82f6",
    borderColor:  "#3b82f6",
    color:        "#fff",
    fontWeight:   700,
  };

  const disabledBtn: React.CSSProperties = {
    ...btnBase,
    opacity:  0.4,
    cursor:   "not-allowed",
  };

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 32 }}>
      {/* Showing X–Y of Z */}
      <p style={{ fontSize: 14, color: sub, margin: 0 }}>
        Showing <strong style={{ color: text }}>{from}–{to}</strong> of{" "}
        <strong style={{ color: text }}>{total.toLocaleString()}</strong> products
      </p>

      {/* Page buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

        {/* Previous */}
        <button
          onClick={() => !isFirst && handleChange(page - 1)}
          disabled={isFirst}
          aria-label="Previous page"
          style={isFirst ? disabledBtn : btnBase}
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} style={{ ...btnBase, border: "none", background: "none", color: sub, cursor: "default" }}>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => p !== page && handleChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              style={p === page ? activeBtn : btnBase}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => !isLast && handleChange(page + 1)}
          disabled={isLast}
          aria-label="Next page"
          style={isLast ? disabledBtn : btnBase}
        >
          Next →
        </button>
      </div>
    </nav>
  );
};
