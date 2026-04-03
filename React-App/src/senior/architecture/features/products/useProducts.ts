// PRODUCTS FEATURE — useProducts.ts
//
// Encapsulates product data + filtering logic.
// Uses shared/utils/formatters for price display.
// Does NOT know about auth or cart — those are separate features.

import { useState, useMemo } from "react";
import type { Product } from "./types";

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "Wireless Headphones", price: 89,  category: "Electronics", rating: 4.5, emoji: "🎧", inStock: true  },
  { id: 2, name: "Mechanical Keyboard", price: 149, category: "Electronics", rating: 4.8, emoji: "⌨️", inStock: true  },
  { id: 3, name: "Running Shoes",        price: 120, category: "Sports",      rating: 4.6, emoji: "👟", inStock: false },
  { id: 4, name: "Yoga Mat",             price: 35,  category: "Sports",      rating: 4.7, emoji: "🧘", inStock: true  },
  { id: 5, name: "Clean Code (Book)",    price: 35,  category: "Books",       rating: 4.9, emoji: "📗", inStock: true  },
  { id: 6, name: "Smart Watch",          price: 399, category: "Electronics", rating: 4.4, emoji: "⌚", inStock: true  },
];

export const useProducts = () => {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");

  const categories = ["All", ...new Set(MOCK_PRODUCTS.map((p) => p.category))];

  const filtered = useMemo(() =>
    MOCK_PRODUCTS.filter((p) => {
      const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || p.category === category;
      return matchSearch && matchCategory;
    }),
    [search, category]
  );

  return { products: filtered, search, setSearch, category, setCategory, categories };
};
