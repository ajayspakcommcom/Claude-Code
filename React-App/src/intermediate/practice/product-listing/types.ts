// TOPIC: Product Listing — Type Definitions

// ─── Product ──────────────────────────────────────────────────────────────────

export type Category =
  | "Electronics"
  | "Clothing"
  | "Books"
  | "Home & Garden"
  | "Sports"
  | "Toys";

export interface Product {
  id:          number;
  name:        string;
  category:    Category;
  price:       number;
  rating:      number;   // 1.0 – 5.0
  reviewCount: number;
  inStock:     boolean;
  emoji:       string;   // visual stand-in for product image
  description: string;
  tags:        string[];
  createdAt:   string;   // ISO — used for "newest" sort
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface Filters {
  search:      string;
  categories:  Category[];   // [] = all categories
  minPrice:    number;
  maxPrice:    number;
  minRating:   number;       // 0 = any rating
  inStockOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  search:      "",
  categories:  [],
  minPrice:    0,
  maxPrice:    1000,
  minRating:   0,
  inStockOnly: false,
};

// ─── Sort ─────────────────────────────────────────────────────────────────────

export type SortOption =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest"
  | "name";

export const SORT_LABELS: Record<SortOption, string> = {
  relevance:  "Relevance",
  "price-asc":  "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating:     "Highest Rated",
  newest:     "Newest First",
  name:       "Name (A–Z)",
};

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
}

// ─── API response ─────────────────────────────────────────────────────────────

export interface ProductsResponse {
  products:   Product[];
  pagination: PaginationMeta;
  facets: {
    categoryCounts: Record<Category, number>;  // how many results per category
    priceRange: { min: number; max: number };
  };
}

// ─── URL state (everything that lives in the query string) ────────────────────

export interface UrlState {
  filters: Filters;
  sort:    SortOption;
  page:    number;
}
