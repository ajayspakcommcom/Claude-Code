// PRODUCTS FEATURE — index.ts (Barrel Export / Public API)
//
// ✅ Correct:   import { ProductCard, useProducts } from "../products"
// ❌ Incorrect: import { ProductCard } from "../products/ProductCard"

export { useProducts }  from "./useProducts";
export { ProductCard }  from "./ProductCard";
export type { Product } from "./types";
