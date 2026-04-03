// TOPIC: Feature-Based Folder Structure
// LEVEL: Senior — Architecture
//
// ─── WHY THIS MATTERS ─────────────────────────────────────────────────────────
//
// Type-based structure (what beginners do — breaks at scale):
//
//   src/
//   ├── components/         ← ALL components dumped here (300+ files)
//   │   ├── LoginForm.tsx
//   │   ├── ProductCard.tsx
//   │   └── CartSummary.tsx
//   ├── hooks/              ← ALL hooks dumped here
//   │   ├── useAuth.ts
//   │   ├── useProducts.ts
//   │   └── useCart.ts
//   ├── types/              ← ALL types dumped here
//   └── utils/              ← ALL utils dumped here
//
//   Problems:
//   ❌ To work on "auth" you touch 4 different folders
//   ❌ No clear boundaries — any component can import from anywhere
//   ❌ Deleting a feature = hunting across all folders for related files
//   ❌ New team member has no idea what belongs together
//
// Feature-based structure (what senior engineers do):
//
//   src/
//   ├── features/
//   │   ├── auth/           ← EVERYTHING auth in one place
//   │   │   ├── index.ts    ← Public API (barrel export) ← the key!
//   │   │   ├── types.ts
//   │   │   ├── useAuth.ts
//   │   │   ├── LoginForm.tsx
//   │   │   └── auth.test.ts
//   │   ├── products/       ← EVERYTHING products in one place
//   │   │   ├── index.ts
//   │   │   ├── types.ts
//   │   │   ├── useProducts.ts
//   │   │   └── ProductCard.tsx
//   │   └── cart/           ← EVERYTHING cart in one place
//   │       ├── index.ts
//   │       ├── types.ts
//   │       ├── useCart.ts
//   │       └── CartSummary.tsx
//   └── shared/             ← Used by 2+ features
//       ├── ui/             ← Generic components (Button, Badge, Input)
//       ├── hooks/          ← Generic hooks (useLocalStorage, useDebounce)
//       └── utils/          ← Pure functions (formatters, validators)
//
//   Benefits:
//   ✅ Delete a feature = delete one folder
//   ✅ Clear import boundary via index.ts barrel
//   ✅ New dev opens "products/" and sees everything related
//   ✅ Features can be moved to a separate package/micro-frontend easily
//
// ─── THE 3 GOLDEN RULES ───────────────────────────────────────────────────────
//
//   1. BARREL IMPORTS — always import a feature through its index.ts
//      ✅ import { useAuth } from "../auth"
//      ❌ import { useAuth } from "../auth/useAuth"
//
//   2. FEATURE ISOLATION — features don't import from other features' internals
//      ✅ import { Product } from "../products"   (through barrel)
//      ❌ import { Product } from "../products/types"
//
//   3. SHARED = USED BY 2+ FEATURES — if only one feature uses it, it stays inside
//      ✅ shared/ui/Button.tsx (used by auth, products, cart)
//      ❌ shared/ui/LoginButton.tsx (only used by auth → should be in auth/)

import React, { useState } from "react";

// ── Feature imports — always through the barrel (index.ts) ─────────────────
import { useAuth,    LoginForm }  from "./features/auth";
import { useProducts, ProductCard } from "./features/products";
import { useCart,    CartSummary } from "./features/cart";
import { Badge } from "./shared/ui/Badge";

// ─── App root — wires features together ──────────────────────────────────────
//
// The APP ROOT is the only place where features connect.
// It passes callbacks between them (onAddToCart) without creating
// direct imports between features.

const FeatureBasedStructureDemo = () => {
  const auth     = useAuth();
  const products = useProducts();
  const cart     = useCart();
  const [activeTab, setActiveTab] = useState<"structure" | "demo">("structure");

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.h2}>Feature-Based Folder Structure</h2>
        <p style={s.subtitle}>Senior Architecture — how to organise large codebases</p>
        <div style={s.tabs}>
          {(["structure", "demo"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
            >
              {tab === "structure" ? "📁 Structure" : "🛍️ Live Demo"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "structure" ? (
        <StructureView />
      ) : (
        <DemoView auth={auth} products={products} cart={cart} />
      )}
    </div>
  );
};

// ─── Structure view — shows the folder tree with annotations ─────────────────

const StructureView = () => (
  <div style={s.structureWrap}>

    {/* Comparison */}
    <div style={s.compareGrid}>
      <div style={s.compareCard}>
        <div style={{ ...s.compareTitle, color: "#dc2626" }}>❌ Type-Based (breaks at scale)</div>
        <pre style={{ ...s.tree, color: "#374151" }}>{TYPE_BASED_TREE}</pre>
        <ul style={s.badList}>
          <li>To work on auth: edit 4 different folders</li>
          <li>No clear feature boundaries</li>
          <li>Deleting a feature = hunting everywhere</li>
          <li>300+ files in /components at 50 features</li>
        </ul>
      </div>
      <div style={{ ...s.compareCard, borderColor: "#22c55e" }}>
        <div style={{ ...s.compareTitle, color: "#166534" }}>✅ Feature-Based (scales to 100+ features)</div>
        <pre style={{ ...s.tree, color: "#374151" }}>{FEATURE_BASED_TREE}</pre>
        <ul style={s.goodList}>
          <li>Delete a feature = delete one folder</li>
          <li>Each feature is a self-contained unit</li>
          <li>Barrel index.ts = clear public API</li>
          <li>Ready to extract to a micro-frontend</li>
        </ul>
      </div>
    </div>

    {/* Rules */}
    <div style={s.rulesGrid}>
      {RULES.map((rule, i) => (
        <div key={i} style={s.ruleCard}>
          <span style={s.ruleIcon}>{rule.icon}</span>
          <div>
            <div style={s.ruleTitle}>{rule.title}</div>
            <div style={s.ruleBody}>{rule.body}</div>
            <div style={s.ruleCode}>{rule.code}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Demo view — fully working mini e-commerce app ───────────────────────────

const DemoView = ({ auth, products, cart }: {
  auth:     ReturnType<typeof useAuth>;
  products: ReturnType<typeof useProducts>;
  cart:     ReturnType<typeof useCart>;
}) => (
  <div style={s.demo}>

    {/* Auth panel */}
    <div style={s.panel}>
      <div style={s.panelHeader}>
        <span style={s.panelTitle}>🔐 auth feature</span>
        {auth.user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge color={auth.isAdmin ? "yellow" : "blue"}>{auth.user.role}</Badge>
            <button style={s.signOutBtn} onClick={auth.logout}>Sign out</button>
          </div>
        )}
      </div>
      {auth.user ? (
        <div style={s.userCard}>
          <span style={{ fontSize: 36 }}>👤</span>
          <div>
            <div style={{ fontWeight: 700 }}>{auth.user.name}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{auth.user.email}</div>
          </div>
        </div>
      ) : (
        <LoginForm onLogin={auth.login} isLoading={auth.isLoading} error={auth.error} />
      )}
    </div>

    {/* Products panel */}
    <div style={{ ...s.panel, flex: 2 }}>
      <div style={s.panelHeader}>
        <span style={s.panelTitle}>📦 products feature</span>
        <Badge color="gray">{products.products.length} items</Badge>
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Search…"
          value={products.search}
          onChange={(e) => products.setSearch(e.target.value)}
          style={s.searchInput}
        />
        <select
          value={products.category}
          onChange={(e) => products.setCategory(e.target.value)}
          style={s.select}
        >
          {products.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div style={s.productGrid}>
        {products.products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAddToCart={(product) => cart.addItem({ id: product.id, name: product.name, price: product.price, emoji: product.emoji })}
            isInCart={cart.isInCart(p.id)}
          />
        ))}
        {products.products.length === 0 && (
          <p style={{ color: "#6b7280", padding: "16px 0" }}>No products match your search.</p>
        )}
      </div>
    </div>

    {/* Cart panel */}
    <div style={s.panel}>
      <div style={s.panelHeader}>
        <span style={s.panelTitle}>🛒 cart feature</span>
        {cart.count > 0 && <Badge color="blue">{cart.count}</Badge>}
      </div>
      <CartSummary
        items={cart.items}
        total={cart.total}
        onRemove={cart.removeItem}
        onUpdateQty={cart.updateQty}
        onClear={cart.clearCart}
      />
    </div>
  </div>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const TYPE_BASED_TREE = `src/
├── components/
│   ├── LoginForm.tsx    ← auth
│   ├── ProductCard.tsx  ← products
│   └── CartSummary.tsx  ← cart
├── hooks/
│   ├── useAuth.ts
│   ├── useProducts.ts
│   └── useCart.ts
├── types/
│   ├── auth.ts
│   ├── product.ts
│   └── cart.ts
└── utils/
    └── formatters.ts`;

const FEATURE_BASED_TREE = `src/
├── features/
│   ├── auth/
│   │   ├── index.ts      ← barrel (public API)
│   │   ├── types.ts
│   │   ├── useAuth.ts
│   │   └── LoginForm.tsx
│   ├── products/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── useProducts.ts
│   │   └── ProductCard.tsx
│   └── cart/
│       ├── index.ts
│       ├── types.ts
│       ├── useCart.ts
│       └── CartSummary.tsx
└── shared/              ← used by 2+ features
    ├── ui/  Button, Badge
    ├── hooks/ useLocalStorage
    └── utils/ formatters`;

const RULES = [
  {
    icon: "📦",
    title: "Barrel Exports (index.ts)",
    body: "Each feature exposes a public API via index.ts. Consumers only import from this file, never from internal files.",
    code: `// ✅ correct\nimport { useAuth } from "../auth"\n// ❌ wrong\nimport { useAuth } from "../auth/useAuth"`,
  },
  {
    icon: "🔒",
    title: "Feature Isolation",
    body: "Features don't import from each other's internals. The app root wires them together by passing callbacks as props.",
    code: `// auth/ never imports from cart/\n// cart/ never imports from products/\n// App root connects them via props`,
  },
  {
    icon: "🤝",
    title: "Shared = Used by 2+ Features",
    body: "Only put code in shared/ if at least 2 features use it. If only one feature uses it, keep it inside that feature.",
    code: `// shared/ui/Button.tsx    ← 3 features use it\n// auth/LoginButton.tsx    ← only auth uses it`,
  },
  {
    icon: "📍",
    title: "Co-location",
    body: "Tests, types, hooks, and components for a feature all live in the same folder. No hunting across directories.",
    code: `// auth/\n//  ├── LoginForm.tsx\n//  ├── LoginForm.test.tsx  ← next to it!\n//  └── types.ts           ← next to it!`,
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:         { fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 1300, margin: "0 auto" },
  header:       { marginBottom: 28 },
  h2:           { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 6px" },
  subtitle:     { color: "#6b7280", margin: "0 0 20px" },
  tabs:         { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" },
  tab:          { padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: "#6b7280" },
  tabActive:    { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  structureWrap:{ display: "flex", flexDirection: "column", gap: 24 },
  compareGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  compareCard:  { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 24 },
  compareTitle: { fontSize: 14, fontWeight: 700, marginBottom: 16 },
  tree:         { fontSize: 12, lineHeight: 1.8, background: "#f8fafc", padding: 16, borderRadius: 8, overflow: "auto", margin: "0 0 16px" },
  badList:      { margin: 0, padding: "0 0 0 18px", color: "#dc2626", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 },
  goodList:     { margin: 0, padding: "0 0 0 18px", color: "#166534", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 },
  rulesGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  ruleCard:     { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, display: "flex", gap: 16 },
  ruleIcon:     { fontSize: 28, flexShrink: 0 },
  ruleTitle:    { fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 },
  ruleBody:     { fontSize: 13, color: "#6b7280", marginBottom: 10, lineHeight: 1.6 },
  ruleCode:     { fontSize: 11, background: "#f8fafc", padding: "10px 12px", borderRadius: 8, fontFamily: "monospace", whiteSpace: "pre", color: "#374151", lineHeight: 1.7 },
  demo:         { display: "flex", gap: 20, alignItems: "flex-start" },
  panel:        { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, flex: 1, minWidth: 0 },
  panelHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  panelTitle:   { fontSize: 13, fontWeight: 700, color: "#6b7280", fontFamily: "monospace", background: "#f1f5f9", padding: "4px 10px", borderRadius: 6 },
  userCard:     { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#f8fafc", borderRadius: 10 },
  signOutBtn:   { background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 13, color: "#6b7280" },
  searchInput:  { flex: 1, padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" },
  select:       { padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff" },
  productGrid:  { display: "flex", flexDirection: "column", gap: 12 },
};

export default FeatureBasedStructureDemo;
