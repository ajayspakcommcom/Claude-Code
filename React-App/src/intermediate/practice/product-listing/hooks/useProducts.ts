// TOPIC: useProducts — React Query data fetching
//
// Production patterns:
//   - queryKey includes ALL filter/sort/page state → changing any filter refetches
//   - placeholderData: keepPreviousData → old page stays visible while next page loads
//   - enabled: true always (no conditional fetch for listings)
//   - staleTime: 30s → browsing back to a page uses cache

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchProducts }              from "../api/productApi";
import type { Filters, SortOption, ProductsResponse } from "../types";

const PAGE_SIZE = 12;

export const useProducts = (
  filters: Filters,
  sort:    SortOption,
  page:    number,
) =>
  useQuery<ProductsResponse>({
    // Every unique combination of filters + sort + page has its own cache entry.
    // Changing ANY value triggers a fresh fetch (or serves from cache if still fresh).
    queryKey: ["products", { filters, sort, page }],

    queryFn: () => fetchProducts({ filters, sort, page, pageSize: PAGE_SIZE }),

    // Keep old data visible while the new page/filter results are loading.
    // Without this: grid goes blank on every filter change (jarring UX).
    placeholderData: keepPreviousData,

    staleTime: 30_000,   // cache valid for 30 s — browsing back is instant
  });
