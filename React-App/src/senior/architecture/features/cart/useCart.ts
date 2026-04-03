// CART FEATURE — useCart.ts
//
// Uses shared/hooks/useLocalStorage to persist cart across page refreshes.
// Does NOT import from auth/ or products/ — pure cart logic only.

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import type { CartItem } from "./types";

export const useCart = () => {
  const [items, setItems] = useLocalStorage<CartItem[]>("arch_demo_cart", []);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, [setItems]);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [setItems]);

  const updateQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) { removeItem(id); return; }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  }, [setItems, removeItem]);

  const clearCart = useCallback(() => setItems([]), [setItems]);

  const { total, count } = useMemo(() => ({
    total: items.reduce((s, i) => s + i.price * i.quantity, 0),
    count: items.reduce((s, i) => s + i.quantity, 0),
  }), [items]);

  const isInCart = useCallback((id: number) => items.some((i) => i.id === id), [items]);

  return { items, total, count, addItem, removeItem, updateQty, clearCart, isInCart };
};
