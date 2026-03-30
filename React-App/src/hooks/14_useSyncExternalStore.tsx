// TOPIC: useSyncExternalStore
//
// useSyncExternalStore subscribes a component to an EXTERNAL store
// (anything outside React state — browser APIs, custom stores, third-party libs).
//
// Syntax:
//   const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);
//
//   subscribe(callback) — called by React to subscribe; must return an unsubscribe fn
//   getSnapshot()       — returns the current value from the store
//   getServerSnapshot() — (optional) returns value during SSR
//
// Why not just useEffect + useState?
//   useEffect has a timing gap — the component could read a stale value between
//   render and the effect running. useSyncExternalStore eliminates this gap.
//
// When to use:
//   ✅ Subscribing to browser APIs (window size, online status, media queries)
//   ✅ Building state management libraries (Redux uses this internally)
//   ✅ Any mutable external store that React doesn't manage

import { useSyncExternalStore } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Online / Offline status
// ════════════════════════════════════════════════════════════

// subscribe: React calls this to add/remove listeners
const subscribeOnline = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

// getSnapshot: must return the same value if nothing changed (referential stability)
const getOnlineSnapshot = () => navigator.onLine;

const OnlineStatusExample = () => {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Online/Offline Status</h3>
      <p>
        Network:{" "}
        <strong style={{ color: isOnline ? "green" : "red" }}>
          {isOnline ? "Online" : "Offline"}
        </strong>
      </p>
      <p style={{ fontSize: "13px", color: "#888" }}>
        Try toggling your network in DevTools → Network tab to see it update.
      </p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Window inner width
// ════════════════════════════════════════════════════════════

const subscribeResize = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

const getWidthSnapshot = () => window.innerWidth;

const WindowWidthExample = () => {
  const width = useSyncExternalStore(subscribeResize, getWidthSnapshot);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Window Width (resize the window)</h3>
      <p>Window width: <strong>{width}px</strong></p>
      <p style={{ fontSize: "13px", color: "#888" }}>
        {width < 768 ? "Mobile view" : width < 1024 ? "Tablet view" : "Desktop view"}
      </p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 3: Custom external store (mini Redux-like store)
// ════════════════════════════════════════════════════════════

// A simple external store outside React
const createStore = <T,>(initialState: T) => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState };
      listeners.forEach((l) => l()); // notify all subscribers
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

// Create a store outside React (survives re-renders)
const cartStore = createStore({ itemCount: 0, total: 0 });

const CartDisplay = () => {
  // Subscribe to the external store
  const cart = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getState
  );

  return (
    <div>
      <p>Items: <strong>{cart.itemCount}</strong> | Total: <strong>${cart.total}</strong></p>
    </div>
  );
};

const CartControls = () => {
  const addItem = () => {
    const current = cartStore.getState();
    cartStore.setState({
      itemCount: current.itemCount + 1,
      total: current.total + 9.99,
    });
  };

  const reset = () => cartStore.setState({ itemCount: 0, total: 0 });

  return (
    <div>
      <button onClick={addItem}>Add Item ($9.99)</button>
      <button onClick={reset} style={{ marginLeft: "8px" }}>Reset</button>
    </div>
  );
};

const ExternalStoreExample = () => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Custom External Store</h3>
      <CartDisplay />
      <CartControls />
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseSyncExternalStoreDemo = () => {
  return (
    <div>
      <h2>useSyncExternalStore Hook</h2>
      <OnlineStatusExample />
      <WindowWidthExample />
      <ExternalStoreExample />
    </div>
  );
};

export default UseSyncExternalStoreDemo;
