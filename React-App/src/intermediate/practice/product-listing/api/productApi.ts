// TOPIC: Product API — Mock database with server-side filter/search/sort/paginate
//
// Production pattern: ALL filtering, sorting, and pagination happens on the
// "server" (here: in this function). The component only sends query params.
// This mirrors a real REST endpoint: GET /products?search=x&category=Electronics&page=2

import type {
  Product,
  Category,
  Filters,
  SortOption,
  ProductsResponse,
} from "../types";

// ─── Mock product database (120 products) ────────────────────────────────────

const PRODUCTS: Product[] = [
  // Electronics (20)
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: ["Wireless Headphones Pro", "4K Smart TV 55\"", "Mechanical Keyboard RGB", "USB-C Hub 7-in-1",
      "Noise Cancelling Earbuds", "Portable SSD 1TB", "Webcam 4K HD", "Smart Watch Series X",
      "Gaming Mouse 16K DPI", "Monitor 27\" IPS", "Laptop Stand Aluminum", "Bluetooth Speaker Mini",
      "Wireless Charger 15W", "HDMI 2.1 Cable", "NVMe SSD 2TB", "Stream Deck Mini",
      "Ring Light 10\"", "External GPU Dock", "Router Wi-Fi 6E", "Smart Plug 4-Pack"][i],
    category: "Electronics" as Category,
    price: [89, 699, 149, 45, 199, 129, 179, 399, 79, 349, 59, 69, 39, 19, 249, 149, 59, 399, 199, 49][i],
    rating: [4.5, 4.2, 4.8, 4.3, 4.6, 4.7, 4.1, 4.4, 4.9, 4.3, 4.6, 4.2, 4.5, 4.0, 4.8, 4.7, 4.3, 4.1, 4.5, 4.4][i],
    reviewCount: [2840, 1205, 987, 3421, 1876, 743, 562, 4210, 891, 2103, 1547, 3890, 5621, 8934, 421, 1203, 2341, 187, 956, 4512][i],
    inStock: [true, true, false, true, true, true, false, true, true, false, true, true, true, true, false, true, true, false, true, true][i],
    emoji: ["🎧","📺","⌨️","🔌","🎵","💾","📷","⌚","🖱️","🖥️","💻","🔊","⚡","🔗","💿","🎮","💡","🖥️","📶","🔌"][i],
    description: "Top-rated electronics for productivity and entertainment.",
    tags: ["tech", "gadget", "electronics"],
    createdAt: new Date(Date.now() - i * 5 * 24 * 3600_000).toISOString(),
  })),

  // Clothing (20)
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 21,
    name: ["Classic White Tee", "Slim Fit Jeans", "Running Shorts", "Hoodie Zip-Up",
      "Wool Sweater", "Cargo Pants", "Polo Shirt", "Leather Belt",
      "Sports Socks 6-Pack", "Denim Jacket", "Yoga Leggings", "Rain Jacket",
      "Formal Blazer", "Chino Shorts", "Thermal Undershirt", "Athletic Tank",
      "Fleece Vest", "Oxford Shirt", "Track Pants", "Bomber Jacket"][i],
    category: "Clothing" as Category,
    price: [25, 79, 35, 65, 120, 89, 55, 45, 18, 149, 49, 139, 199, 45, 29, 32, 75, 69, 55, 179][i],
    rating: [4.2, 4.5, 4.3, 4.7, 4.6, 4.1, 4.4, 4.5, 4.8, 4.3, 4.9, 4.2, 4.4, 4.3, 4.1, 4.6, 4.5, 4.7, 4.2, 4.8][i],
    reviewCount: [5620, 3210, 1890, 4520, 892, 1234, 2341, 1876, 8921, 1023, 7654, 432, 561, 2109, 1543, 3421, 876, 1987, 2341, 654][i],
    inStock: [true, true, true, true, false, true, true, true, true, false, true, true, true, false, true, true, true, true, false, true][i],
    emoji: ["👕","👖","🩳","🧥","🧶","👖","👔","👔","🧦","🧥","🩱","🧥","🥼","🩳","👕","🎽","🧥","👔","👖","🧥"][i],
    description: "Quality clothing for every occasion.",
    tags: ["fashion", "apparel", "clothing"],
    createdAt: new Date(Date.now() - (i + 20) * 4 * 24 * 3600_000).toISOString(),
  })),

  // Books (20)
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 41,
    name: ["Clean Code", "The Pragmatic Programmer", "Design Patterns", "Atomic Habits",
      "Deep Work", "Zero to One", "The Lean Startup", "Thinking Fast and Slow",
      "The Phoenix Project", "Domain-Driven Design", "Refactoring", "You Don't Know JS",
      "The Hard Thing", "Good to Great", "Hooked", "Sprint",
      "The Mom Test", "Shape Up", "Continuous Delivery", "Site Reliability Engineering"][i],
    category: "Books" as Category,
    price: [35, 45, 55, 18, 22, 28, 24, 32, 29, 65, 48, 39, 27, 26, 23, 21, 19, 0, 52, 60][i],
    rating: [4.8, 4.7, 4.5, 4.9, 4.6, 4.4, 4.3, 4.7, 4.8, 4.5, 4.6, 4.7, 4.5, 4.6, 4.4, 4.5, 4.8, 4.9, 4.4, 4.6][i],
    reviewCount: [12540, 8932, 6210, 45230, 23410, 18920, 15430, 32100, 9870, 4320, 7650, 11230, 19870, 16540, 13210, 8970, 6540, 4320, 3210, 5670][i],
    inStock: [true, true, true, true, true, true, true, true, false, true, true, true, true, false, true, true, true, true, true, false][i],
    emoji: ["📗","📘","📙","📕","📗","📘","📙","📕","📗","📘","📙","📕","📗","📘","📙","📕","📗","🆓","📘","📙"][i],
    description: "Essential reading for professionals and lifelong learners.",
    tags: ["book", "learning", "education"],
    createdAt: new Date(Date.now() - (i + 40) * 7 * 24 * 3600_000).toISOString(),
  })),

  // Home & Garden (20)
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 61,
    name: ["Air Purifier HEPA", "Robot Vacuum", "Instant Pot 6Qt", "Stand Mixer",
      "Coffee Grinder", "Sous Vide Cooker", "Cast Iron Skillet", "Knife Set 8pc",
      "Bamboo Cutting Board", "French Press 1L", "Aroma Diffuser", "Succulent Set 3",
      "Planter Pot Ceramic", "Garden Hose 50ft", "Pruning Shears", "Compost Bin",
      "Solar Garden Lights", "Bird Feeder", "Wind Chimes", "Outdoor Thermometer"][i],
    category: "Home & Garden" as Category,
    price: [249, 399, 99, 349, 59, 149, 45, 129, 35, 39, 29, 45, 28, 35, 25, 55, 49, 32, 24, 19][i],
    rating: [4.6, 4.4, 4.8, 4.7, 4.5, 4.6, 4.9, 4.7, 4.8, 4.6, 4.3, 4.7, 4.5, 4.2, 4.6, 4.4, 4.5, 4.3, 4.4, 4.2][i],
    reviewCount: [3420, 8910, 15670, 7890, 4320, 2190, 9870, 5430, 8920, 6540, 4320, 2190, 3450, 1870, 2340, 1230, 3210, 1890, 2340, 1540][i],
    inStock: [true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, false, true, true, true, true][i],
    emoji: ["🌬️","🤖","🍲","🧁","☕","🍳","🍳","🔪","🪵","☕","🕯️","🪴","🪴","💧","✂️","♻️","☀️","🐦","🎐","🌡️"][i],
    description: "Everything you need for a comfortable home and beautiful garden.",
    tags: ["home", "kitchen", "garden"],
    createdAt: new Date(Date.now() - (i + 60) * 3 * 24 * 3600_000).toISOString(),
  })),

  // Sports (20)
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 81,
    name: ["Yoga Mat 6mm", "Resistance Bands Set", "Foam Roller", "Pull-Up Bar",
      "Adjustable Dumbbells", "Jump Rope Speed", "Kettlebell 20lb", "Ab Roller Pro",
      "Gym Gloves", "Water Bottle 32oz", "Protein Shaker", "Compression Shorts",
      "Running Belt", "Swim Goggles", "Tennis Racket", "Basketball Indoor",
      "Cycling Helmet", "Hiking Backpack 40L", "Trekking Poles", "Fitness Tracker"][i],
    category: "Sports" as Category,
    price: [35, 29, 25, 45, 399, 19, 55, 35, 22, 28, 18, 39, 19, 25, 89, 45, 79, 129, 55, 89][i],
    rating: [4.8, 4.7, 4.6, 4.5, 4.8, 4.6, 4.7, 4.5, 4.3, 4.9, 4.6, 4.7, 4.5, 4.4, 4.3, 4.6, 4.5, 4.7, 4.6, 4.4][i],
    reviewCount: [8920, 6540, 4320, 3210, 2190, 9870, 3450, 5670, 4320, 12340, 8920, 3450, 6780, 4320, 2190, 3450, 2190, 4320, 3210, 5670][i],
    inStock: [true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, false, true, true, true, true][i],
    emoji: ["🧘","💪","🛹","🏋️","🏋️","⏱️","🏋️","🎯","🧤","💧","🥤","🩲","🏃","🏊","🎾","🏀","🚴","🎒","🥾","⌚"][i],
    description: "Gear up and reach your fitness goals.",
    tags: ["fitness", "sport", "health"],
    createdAt: new Date(Date.now() - (i + 80) * 6 * 24 * 3600_000).toISOString(),
  })),

  // Toys (20)
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 101,
    name: ["LEGO City Set", "RC Drone Beginner", "Wooden Train Set", "Play-Doh 10-Pack",
      "Rubik's Cube 3x3", "Card Game Uno", "Jenga Classic", "Chess Set Magnetic",
      "Puzzle 1000pc", "Nerf Blaster", "Slime Kit", "Kinetic Sand",
      "Building Blocks 100pc", "Yo-Yo Professional", "Fidget Cube", "Origami Kit",
      "Microscope Kids", "Telescope Starter", "Science Kit Chemistry", "Robot Coding Kit"][i],
    category: "Toys" as Category,
    price: [79, 129, 55, 22, 12, 11, 18, 35, 25, 39, 19, 24, 28, 15, 9, 14, 59, 89, 45, 149][i],
    rating: [4.9, 4.5, 4.8, 4.7, 4.6, 4.8, 4.7, 4.9, 4.6, 4.4, 4.5, 4.7, 4.8, 4.3, 4.5, 4.6, 4.7, 4.5, 4.8, 4.6][i],
    reviewCount: [15670, 4320, 6540, 19870, 23410, 34560, 12340, 8920, 9870, 5670, 8920, 7650, 4320, 3210, 12340, 4320, 2190, 1870, 3450, 2190][i],
    inStock: [true, false, true, true, true, true, true, true, true, true, false, true, true, true, true, true, false, true, true, true][i],
    emoji: ["🧱","🚁","🚂","🎨","🧩","🃏","🪃","♟️","🧩","🔫","🪄","⏳","🧱","🪀","🎲","📄","🔬","🔭","🧪","🤖"][i],
    description: "Fun and educational toys for kids of all ages.",
    tags: ["toy", "kids", "play"],
    createdAt: new Date(Date.now() - (i + 100) * 2 * 24 * 3600_000).toISOString(),
  })),
];

// ─── Main fetch function ──────────────────────────────────────────────────────

const fakeDelay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export interface FetchProductsParams {
  filters:  Filters;
  sort:     SortOption;
  page:     number;
  pageSize: number;
}

export const fetchProducts = async ({
  filters,
  sort,
  page,
  pageSize,
}: FetchProductsParams): Promise<ProductsResponse> => {
  await fakeDelay();

  // ── 1. Filter ──────────────────────────────────────────────────────────────
  let results = PRODUCTS.filter((p) => {
    // Search — name, description, tags (case-insensitive)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category multi-select — empty array = all
    if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false;

    // Price range
    if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;

    // Minimum rating
    if (filters.minRating > 0 && p.rating < filters.minRating) return false;

    // In stock only
    if (filters.inStockOnly && !p.inStock) return false;

    return true;
  });

  // ── 2. Build facets (before pagination, after filtering) ──────────────────
  const categoryCounts = {} as Record<Category, number>;
  const allCategories: Category[] = ["Electronics","Clothing","Books","Home & Garden","Sports","Toys"];
  allCategories.forEach((c) => { categoryCounts[c] = 0; });
  results.forEach((p) => { categoryCounts[p.category]++; });

  const prices = results.map((p) => p.price);
  const priceRange = {
    min: prices.length ? Math.min(...prices) : 0,
    max: prices.length ? Math.max(...prices) : 1000,
  };

  // ── 3. Sort ────────────────────────────────────────────────────────────────
  results = [...results].sort((a, b) => {
    switch (sort) {
      case "price-asc":  return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "rating":     return b.rating - a.rating;
      case "newest":     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "name":       return a.name.localeCompare(b.name);
      default:           return b.reviewCount - a.reviewCount; // relevance = most reviewed
    }
  });

  // ── 4. Paginate ────────────────────────────────────────────────────────────
  const total      = results.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const start      = (safePage - 1) * pageSize;
  const products   = results.slice(start, start + pageSize);

  return {
    products,
    pagination: { page: safePage, pageSize, total, totalPages },
    facets: { categoryCounts, priceRange },
  };
};
