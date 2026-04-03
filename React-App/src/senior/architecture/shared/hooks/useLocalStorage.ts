// SHARED HOOK — useLocalStorage.ts
//
// Rule: shared/hooks/ holds hooks used by 2+ features.
// This hook is used by both auth (persist token) and cart (persist items).

import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const next = value instanceof Function ? value(stored) : value;
    setStored(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const remove = () => {
    setStored(initialValue);
    localStorage.removeItem(key);
  };

  return [stored, setValue, remove] as const;
}
