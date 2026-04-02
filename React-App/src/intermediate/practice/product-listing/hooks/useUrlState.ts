// TOPIC: URL State Sync — all filters, sort, and page live in the URL
//
// Production pattern: store UI state in the URL query string.
// Benefits:
//   ✓ Shareable links — paste URL → exact same results
//   ✓ Browser back/forward — filters restore correctly
//   ✓ Bookmark — user bookmarks a specific filtered view
//   ✓ No localStorage — state is in the URL, not hidden storage
//
// This is the same concept as useSearchParams() in React Router /
// TanStack Router's useSearch(). Here we implement it manually using
// the Web API (URLSearchParams + window.history.replaceState) so it
// works without a router library.
//
// Pattern:
//   read  → parse window.location.search into UrlState
//   write → serialize UrlState into query string, call replaceState

import { useState, useCallback, useEffect } from "react";
import type { UrlState, Filters, SortOption, Category } from "../types";
import { DEFAULT_FILTERS } from "../types";

// ─── Serializer: UrlState → query string ──────────────────────────────────────

const serialize = (state: UrlState): string => {
  const params = new URLSearchParams();

  if (state.filters.search)      params.set("q",         state.filters.search);
  if (state.filters.categories.length > 0)
                                  params.set("cat",       state.filters.categories.join(","));
  if (state.filters.minPrice > 0) params.set("minPrice",  String(state.filters.minPrice));
  if (state.filters.maxPrice < 1000) params.set("maxPrice", String(state.filters.maxPrice));
  if (state.filters.minRating > 0) params.set("rating",   String(state.filters.minRating));
  if (state.filters.inStockOnly)  params.set("inStock",   "1");
  if (state.sort !== "relevance") params.set("sort",      state.sort);
  if (state.page > 1)             params.set("page",      String(state.page));

  return params.toString();
};

// ─── Deserializer: query string → UrlState ────────────────────────────────────

const deserialize = (): UrlState => {
  const params = new URLSearchParams(window.location.search);

  const categories = params.get("cat")
    ? (params.get("cat")!.split(",") as Category[])
    : [];

  const filters: Filters = {
    search:      params.get("q")        ?? DEFAULT_FILTERS.search,
    categories,
    minPrice:    Number(params.get("minPrice") ?? DEFAULT_FILTERS.minPrice),
    maxPrice:    Number(params.get("maxPrice") ?? DEFAULT_FILTERS.maxPrice),
    minRating:   Number(params.get("rating")   ?? DEFAULT_FILTERS.minRating),
    inStockOnly: params.get("inStock") === "1",
  };

  return {
    filters,
    sort: (params.get("sort") as SortOption) ?? "relevance",
    page: Number(params.get("page") ?? 1),
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useUrlState = () => {
  const [state, setState] = useState<UrlState>(deserialize);

  // Push new state to URL without triggering a page reload
  const pushState = useCallback((next: UrlState) => {
    const qs = serialize(next);
    const url = qs ? `?${qs}` : window.location.pathname;
    // replaceState: doesn't add to browser history (avoids spamming history on every keystroke)
    // Use pushState instead if you want back-button to restore each individual filter change
    window.history.replaceState(null, "", url);
    setState(next);
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const onPop = () => setState(deserialize());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── Updaters ────────────────────────────────────────────────────────────────

  const setFilters = useCallback((update: Partial<Filters> | ((prev: Filters) => Filters)) => {
    setState((prev) => {
      const nextFilters = typeof update === "function"
        ? update(prev.filters)
        : { ...prev.filters, ...update };
      const next: UrlState = { ...prev, filters: nextFilters, page: 1 }; // reset to page 1 on filter change
      const qs = serialize(next);
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
      return next;
    });
  }, []);

  const setSort = useCallback((sort: SortOption) => {
    setState((prev) => {
      const next: UrlState = { ...prev, sort, page: 1 };
      const qs = serialize(next);
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
      return next;
    });
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => {
      const next: UrlState = { ...prev, page };
      // pushState for page changes — user expects back button to go to previous page
      const qs = serialize(next);
      window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    const next: UrlState = { filters: DEFAULT_FILTERS, sort: "relevance", page: 1 };
    window.history.replaceState(null, "", window.location.pathname);
    setState(next);
  }, []);

  // Count active filters (for badge display)
  const activeFilterCount = [
    state.filters.search              ? 1 : 0,
    state.filters.categories.length,
    state.filters.minPrice > 0        ? 1 : 0,
    state.filters.maxPrice < 1000     ? 1 : 0,
    state.filters.minRating > 0       ? 1 : 0,
    state.filters.inStockOnly         ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return {
    ...state,           // filters, sort, page
    setFilters,
    setSort,
    setPage,
    clearFilters,
    activeFilterCount,
  };
};
