// TOPIC: Product Listing App — Root Component
//
// Wires together: URL state ↔ React Query ↔ FilterPanel ↔ ProductGrid ↔ Pagination
//
// Data flow:
//   1. useUrlState()  → reads/writes filters+sort+page from URL query string
//   2. useProducts()  → React Query fetch, queryKey = [filters, sort, page]
//   3. FilterPanel    → calls setFilters() → URL updates → React Query refetches
//   4. SearchBar      → debounced 300ms → setFilters({ search }) → same chain
//   5. Pagination     → calls setPage() → URL updates → React Query refetches
//
// The URL IS the source of truth. Redux is not needed here because all
// state is either in the URL (filters) or server state (React Query).

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useUrlState }   from "./hooks/useUrlState";
import { useProducts }   from "./hooks/useProducts";
import { SearchBar }     from "./components/SearchBar";
import { FilterPanel }   from "./components/FilterPanel";
import { ActiveFilters } from "./components/ActiveFilters";
import { SortDropdown, ProductGrid } from "./components/SortDropdown";
import { Pagination }    from "./components/Pagination";

import type { Category } from "./types";

// ─── React Query client ───────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

// ─── Inner app ────────────────────────────────────────────────────────────────

const AppContent = () => {
  const [dark,         setDark]         = useState(false);
  const [filterOpen,   setFilterOpen]   = useState(true);

  const {
    filters, sort, page,
    setFilters, setSort, setPage, clearFilters,
    activeFilterCount,
  } = useUrlState();

  const { data, isLoading, isFetching } = useProducts(filters, sort, page);

  const products    = data?.products    ?? [];
  const pagination  = data?.pagination  ?? { page: 1, pageSize: 12, total: 0, totalPages: 0 };
  const facets      = data?.facets      ?? { categoryCounts: {} as Record<Category, number>, priceRange: { min: 0, max: 1000 } };

  const bg      = dark ? "#0f172a" : "#f1f5f9";
  const navBg   = dark ? "#1e293b" : "#fff";
  const bdr     = dark ? "#334155" : "#e5e7eb";
  const text    = dark ? "#f1f5f9" : "#111827";
  const sub     = dark ? "#94a3b8" : "#6b7280";

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        background: navBg, borderBottom: `1px solid ${bdr}`,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🛍️</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: text }}>ProductStore</span>
        </div>

        <SearchBar
          value={filters.search}
          onChange={(q) => setFilters({ search: q })}
          dark={dark}
        />

        <button
          onClick={() => setDark((d) => !d)}
          style={{ background: dark ? "#334155" : "#f1f5f9", border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 18 }}
          aria-label="Toggle dark mode"
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>

        {/* Toolbar row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          {/* Filter toggle button */}
          <button
            onClick={() => setFilterOpen((o) => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px",
              background: dark ? "#1e293b" : "#fff",
              border: `1px solid ${bdr}`,
              borderRadius: 10, cursor: "pointer",
              fontSize: 14, fontWeight: 600, color: text,
            }}
          >
            ⚙️ Filters
            {activeFilterCount > 0 && (
              <span style={{ background: "#3b82f6", color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          <SortDropdown
            value={sort}
            onChange={setSort}
            total={pagination.total}
            dark={dark}
          />
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div style={{ marginBottom: 16 }}>
            <ActiveFilters
              filters={filters}
              onRemove={setFilters}
              onClearAll={clearFilters}
              dark={dark}
            />
          </div>
        )}

        {/* Content area: sidebar + grid */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* Filter sidebar */}
          {filterOpen && (
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              categoryCounts={facets.categoryCounts}
              dark={dark}
            />
          )}

          {/* Products + pagination */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Fetching indicator (subtle — old data stays visible via placeholderData) */}
            {isFetching && !isLoading && (
              <div style={{ fontSize: 12, color: sub, marginBottom: 12, textAlign: "right" }}>
                ↻ Updating results…
              </div>
            )}

            <ProductGrid
              products={products}
              isLoading={isLoading}
              isFetching={isFetching}
              dark={dark}
            />

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onChange={setPage}
              dark={dark}
            />
          </div>
        </div>

        {/* Concepts legend */}
        <div style={{
          marginTop:    40,
          padding:      "20px 24px",
          background:   dark ? "#1e293b" : "#fff",
          border:       `1px solid ${bdr}`,
          borderRadius: 12,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text, margin: "0 0 12px" }}>
            📚 Concepts in This App
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 24px" }}>
            {[
              "Debounced search — 300ms delay, single API call",
              "URL state sync — filters live in query string",
              "Shareable links — paste URL → exact same results",
              "Browser back/forward — popstate listener restores state",
              "React Query placeholderData — no blank flash on page/filter change",
              "queryKey includes all filters — any change triggers refetch",
              "Server-side filtering — search + category + price + rating + stock",
              "Server-side sorting — relevance, price, rating, newest, name",
              "Server-side pagination — slice after filter + sort",
              "Facets / counts — category counts from filtered results",
              "Active filter chips — each chip removes its specific filter",
              "Ellipsis pagination — smart page range with … for large sets",
              "Skeleton grid — 12 bone cards during initial load",
              "Fade on refetch — opacity 0.6 while background fetch runs",
              "Multi-select categories — toggles in/out of array",
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: sub, display: "flex", gap: 8 }}>
                <span style={{ color: "#3b82f6", flexShrink: 0 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// ─── Root export ──────────────────────────────────────────────────────────────

const ProductListingApp = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default ProductListingApp;
