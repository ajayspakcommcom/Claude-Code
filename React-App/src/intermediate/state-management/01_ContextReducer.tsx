// TOPIC: Context + useReducer — Global Store Pattern
//
// We already saw Context + useReducer basics in 05_ContextAPI.tsx.
// Here we build the PRODUCTION PATTERN — a self-contained global store module:
//
//   Types        → CartItem, CartState, CartAction (discriminated union)
//   Reducer      → pure function: (state, action) → newState
//   Contexts     → TWO contexts: one for state, one for dispatch (performance)
//   Provider     → wraps the app, holds the reducer
//   Custom hooks → useCart() and useCartDispatch() — typed, null-safe
//   Consumers    → any component anywhere can read or update state
//
// WHY TWO CONTEXTS (state + dispatch)?
//   If you put state+dispatch in ONE context, EVERY consumer re-renders on
//   every state change — even components that only dispatch actions.
//   Splitting them means dispatch-only components never re-render unnecessarily.
//
// WHEN TO USE this pattern (vs Zustand / Redux):
//   ✅ Small-medium apps with 1-3 shared state slices
//   ✅ No external dependencies needed
//   ✅ Team already knows React — no new library to learn
//   ❌ Many slices → boilerplate gets heavy → use Zustand
//   ❌ Large team / complex async → use Redux Toolkit

import { createContext, useContext, useReducer, memo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CartItem {
  id:       number;
  name:     string;
  price:    number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

// Discriminated union — TypeScript narrows the action type in each switch case
type CartAction =
  | { type: "ADD_ITEM";         item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM";      id: number }
  | { type: "INCREMENT";        id: number }
  | { type: "DECREMENT";        id: number }
  | { type: "CLEAR" };

// ─────────────────────────────────────────────────────────────────────────────
// 2. REDUCER — pure function, no side effects, fully testable
// ─────────────────────────────────────────────────────────────────────────────

const initialState: CartState = { items: [] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        // Already in cart — increment quantity instead of duplicating
        return {
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }

    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.id !== action.id) };

    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };

    case "DECREMENT":
      return {
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, quantity: Math.max(1, i.quantity - 1) }
            : i
        ),
      };

    case "CLEAR":
      return initialState;

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONTEXTS — split into state + dispatch for performance
// ─────────────────────────────────────────────────────────────────────────────

// null as default — we throw if used outside the Provider (null-safety pattern)
const CartStateCtx    = createContext<CartState | null>(null);
const CartDispatchCtx = createContext<React.Dispatch<CartAction> | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// 4. PROVIDER — wraps the subtree, holds the single source of truth
// ─────────────────────────────────────────────────────────────────────────────

function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartStateCtx.Provider value={state}>
      <CartDispatchCtx.Provider value={dispatch}>
        {children}
      </CartDispatchCtx.Provider>
    </CartStateCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CUSTOM HOOKS — typed, null-safe, the only way consumers touch state
// ─────────────────────────────────────────────────────────────────────────────

// Hook for reading state + derived values
function useCart() {
  const ctx = useContext(CartStateCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");

  const totalItems = ctx.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = ctx.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return { ...ctx, totalItems, totalPrice };
}

// Separate hook for dispatch — components that only dispatch won't re-render on state change
function useCartDispatch() {
  const ctx = useContext(CartDispatchCtx);
  if (!ctx) throw new Error("useCartDispatch must be used inside <CartProvider>");
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CONSUMER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { id: 1, name: "Mechanical Keyboard", price: 129 },
  { id: 2, name: "USB-C Hub",            price: 49  },
  { id: 3, name: "Monitor Light Bar",    price: 39  },
  { id: 4, name: "Ergonomic Mouse",      price: 79  },
];

// Only reads dispatch — does NOT re-render when cart state changes
const ProductList = memo(() => {
  const dispatch = useCartDispatch();

  return (
    <div style={{ flex: 1 }}>
      <h4 style={{ margin: "0 0 10px" }}>Products</h4>
      {PRODUCTS.map((p) => (
        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: "14px" }}>{p.name}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#888", fontSize: "13px" }}>${p.price}</span>
            <button
              onClick={() => dispatch({ type: "ADD_ITEM", item: p })}
              style={{ padding: "3px 10px", background: "#4a90e2", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
            >
              + Add
            </button>
          </div>
        </div>
      ))}
      <p style={{ fontSize: "11px", color: "#aaa", marginTop: "6px" }}>
        memo() + separate dispatch context → this component never re-renders when cart changes
      </p>
    </div>
  );
});

// Reads cart state — re-renders when items change
const CartSummary = memo(() => {
  const { items, totalItems, totalPrice } = useCart();
  const dispatch = useCartDispatch();

  return (
    <div style={{ flex: 1, borderLeft: "1px solid #eee", paddingLeft: "20px" }}>
      <h4 style={{ margin: "0 0 10px" }}>
        🛒 Cart
        {totalItems > 0 && (
          <span style={{ marginLeft: "8px", background: "#e74c3c", color: "#fff", borderRadius: "50%", padding: "1px 7px", fontSize: "12px" }}>
            {totalItems}
          </span>
        )}
      </h4>

      {items.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: "13px" }}>Empty — add something!</p>
      ) : (
        <>
          {items.map((item) => (
            <div key={item.id} style={{ marginBottom: "8px", padding: "8px", background: "#f9f9f9", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span>{item.name}</span>
                <span style={{ color: "#888" }}>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <button onClick={() => dispatch({ type: "DECREMENT", id: item.id })} style={qtyBtn}>−</button>
                <span style={{ fontSize: "13px", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                <button onClick={() => dispatch({ type: "INCREMENT", id: item.id })} style={qtyBtn}>+</button>
                <button onClick={() => dispatch({ type: "REMOVE_ITEM", id: item.id })} style={{ ...qtyBtn, marginLeft: "4px", color: "#e74c3c" }}>✕</button>
              </div>
            </div>
          ))}

          <div style={{ borderTop: "1px solid #eee", paddingTop: "8px", marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={() => dispatch({ type: "CLEAR" })}
              style={{ marginTop: "8px", width: "100%", padding: "6px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
            >
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
});

const qtyBtn: React.CSSProperties = {
  width: "22px", height: "22px", border: "1px solid #ddd", background: "#fff",
  borderRadius: "3px", cursor: "pointer", fontSize: "13px", lineHeight: 1,
  display: "flex", alignItems: "center", justifyContent: "center",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

const ContextReducerDemo = () => (
  <div>
    <h2>Context + useReducer — Global Store Pattern</h2>
    <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
      A self-contained store: <strong>Types → Reducer → Contexts → Provider → Custom Hooks → Consumers</strong>.
      No library needed. State and dispatch in separate contexts so dispatch-only components never re-render.
    </p>

    <CartProvider>
      <div style={{ display: "flex", gap: "24px" }}>
        <ProductList />
        <CartSummary />
      </div>
    </CartProvider>

    <div style={{ marginTop: "20px", padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
      <strong>Pattern summary:</strong>
      <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.8" }}>
        <li><code>cartReducer</code> — pure function, (state, action) → newState, zero side effects</li>
        <li><code>CartStateCtx</code> + <code>CartDispatchCtx</code> — split contexts for perf</li>
        <li><code>CartProvider</code> — single <code>useReducer</code> call, provides both contexts</li>
        <li><code>useCart()</code> — reads state + computes derived values (totalItems, totalPrice)</li>
        <li><code>useCartDispatch()</code> — dispatch only, components using this never re-render on state change</li>
        <li><code>ProductList</code> wrapped in <code>memo()</code> — only re-renders if its own props change</li>
      </ul>
    </div>
  </div>
);

export default ContextReducerDemo;
