// CART FEATURE — index.ts (Barrel Export / Public API)
//
// ✅ Correct:   import { useCart, CartSummary } from "../cart"
// ❌ Incorrect: import { useCart } from "../cart/useCart"

export { useCart }      from "./useCart";
export { CartSummary }  from "./CartSummary";
export type { CartItem, CartState } from "./types";
