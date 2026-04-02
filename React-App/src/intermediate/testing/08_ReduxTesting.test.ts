// TOPIC: Testing Redux — Slices, Selectors, Async Thunks
//
// Enterprise rule: Test Redux logic in 3 layers:
//
//   Layer 1 — Reducer / slice (pure functions — easiest to test)
//     → call reducer(state, action) and assert new state
//
//   Layer 2 — Selectors (pure functions — memoized with createSelector)
//     → call selector(mockState) and assert return value
//
//   Layer 3 — Async thunks (createAsyncThunk)
//     → dispatch thunk against a real store, assert state transitions
//
// No React needed here — pure logic tests are the fastest and most reliable.

import { configureStore } from "@reduxjs/toolkit";
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";

// ════════════════════════════════════════════════════════════
// Slice definitions (in a real app these live in separate files)
// ════════════════════════════════════════════════════════════

// --- Cart slice ---

type CartItem = { id: number; name: string; price: number; qty: number };
type CartState = { items: CartItem[]; discount: number };

const cartInitialState: CartState = { items: [], discount: 0 };

const cartSlice = createSlice({
  name: "cart",
  initialState: cartInitialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        existing.qty += action.payload.qty;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    updateQty(state, action: PayloadAction<{ id: number; qty: number }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) item.qty = action.payload.qty;
    },
    clearCart(state) {
      state.items = [];
      state.discount = 0;
    },
    applyDiscount(state, action: PayloadAction<number>) {
      state.discount = Math.min(action.payload, 100); // cap at 100%
    },
  },
});

// --- Auth slice with async thunk ---

type AuthState = {
  user: { id: number; name: string } | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const authInitialState: AuthState = {
  user:   null,
  token:  null,
  status: "idle",
  error:  null,
};

// Simulated API call
const fakeAuthApi = async (credentials: { email: string; password: string }) => {
  if (credentials.password === "wrong") throw new Error("Invalid credentials");
  return { user: { id: 1, name: "Alice" }, token: "token-abc-123" };
};

const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }) => {
    return fakeAuthApi(credentials);
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    logout(state) {
      state.user  = null;
      state.token = null;
      state.status = "idle";
      state.error  = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error  = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user   = action.payload.user;
        state.token  = action.payload.token;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error  = action.error.message ?? "Unknown error";
      });
  },
});

// --- Selectors ---

type RootState = {
  cart: CartState;
  auth: AuthState;
};

const selectCartItems    = (s: RootState) => s.cart.items;
const selectDiscount     = (s: RootState) => s.cart.discount;

const selectCartSubtotal = createSelector(selectCartItems, (items) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0)
);

const selectCartTotal = createSelector(
  selectCartSubtotal,
  selectDiscount,
  (subtotal, discount) => Math.round(subtotal * (1 - discount / 100))
);

const selectCartCount = createSelector(selectCartItems, (items) =>
  items.reduce((sum, i) => sum + i.qty, 0)
);

const selectIsLoggedIn = (s: RootState) => s.auth.token !== null;

// ════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════

const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    // RTK v2: cast needed because createSlice produces Reducer<S> but
    // configureStore expects Reducer<S, UnknownAction, S | undefined>
    reducer: { cart: cartSlice.reducer, auth: authSlice.reducer } as any,
    preloadedState,
  });

const APPLE:  CartItem = { id: 1, name: "Apple",  price: 100, qty: 1 };
const BANANA: CartItem = { id: 2, name: "Banana", price: 50,  qty: 2 };

// ════════════════════════════════════════════════════════════
// 1. Reducer (pure function) tests
// ════════════════════════════════════════════════════════════

describe("1 — Cart reducer", () => {
  const { addItem, removeItem, updateQty, clearCart, applyDiscount } = cartSlice.actions;
  const reducer = cartSlice.reducer;

  it("starts with empty cart", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({ items: [], discount: 0 });
  });

  it("addItem — adds a new item", () => {
    const state = reducer(cartInitialState, addItem(APPLE));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(APPLE);
  });

  it("addItem — increments qty if item already exists", () => {
    const withApple = reducer(cartInitialState, addItem(APPLE));
    const state     = reducer(withApple, addItem({ ...APPLE, qty: 3 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(4); // 1 + 3
  });

  it("removeItem — removes by id", () => {
    const withBoth = [APPLE, BANANA].reduce(
      (s, item) => reducer(s, addItem(item)),
      cartInitialState
    );
    const state = reducer(withBoth, removeItem(1)); // remove Apple
    expect(state.items).toHaveLength(1);
    expect(state.items[0].name).toBe("Banana");
  });

  it("updateQty — changes quantity", () => {
    const withApple = reducer(cartInitialState, addItem(APPLE));
    const state     = reducer(withApple, updateQty({ id: 1, qty: 5 }));
    expect(state.items[0].qty).toBe(5);
  });

  it("clearCart — empties items and resets discount", () => {
    const full = reducer(
      { items: [APPLE, BANANA], discount: 10 },
      clearCart()
    );
    expect(full).toEqual({ items: [], discount: 0 });
  });

  it("applyDiscount — caps at 100%", () => {
    expect(reducer(cartInitialState, applyDiscount(150)).discount).toBe(100);
    expect(reducer(cartInitialState, applyDiscount(20)).discount).toBe(20);
  });
});

// ════════════════════════════════════════════════════════════
// 2. Selector tests
// ════════════════════════════════════════════════════════════

describe("2 — Cart selectors", () => {
  const stateWith = (items: CartItem[], discount = 0): RootState => ({
    cart: { items, discount },
    auth: authInitialState,
  });

  it("selectCartSubtotal — sums price × qty", () => {
    // Apple: 100×1 = 100, Banana: 50×2 = 100 → 200
    expect(selectCartSubtotal(stateWith([APPLE, BANANA]))).toBe(200);
  });

  it("selectCartTotal — applies discount", () => {
    // 200 subtotal, 25% off → 150
    expect(selectCartTotal(stateWith([APPLE, BANANA], 25))).toBe(150);
  });

  it("selectCartTotal — 0% discount returns subtotal", () => {
    expect(selectCartTotal(stateWith([APPLE]))).toBe(100);
  });

  it("selectCartCount — sums all quantities", () => {
    expect(selectCartCount(stateWith([APPLE, BANANA]))).toBe(3); // 1 + 2
  });

  it("selectIsLoggedIn — false when no token", () => {
    expect(selectIsLoggedIn(stateWith([]))).toBe(false);
  });

  it("selectIsLoggedIn — true when token present", () => {
    const state: RootState = {
      cart: cartInitialState,
      auth: { ...authInitialState, token: "abc" },
    };
    expect(selectIsLoggedIn(state)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// 3. Async thunk tests
// ════════════════════════════════════════════════════════════

describe("3 — Auth async thunk", () => {
  it("pending → sets status to loading", async () => {
    const store = makeStore();

    // Don't await — capture mid-flight state
    const promise = store.dispatch(loginThunk({ email: "a@b.com", password: "correct" }));

    expect(store.getState().auth.status).toBe("loading");

    await promise;
  });

  it("fulfilled → sets user + token", async () => {
    const store = makeStore();
    await store.dispatch(loginThunk({ email: "a@b.com", password: "correct" }));

    const { auth } = store.getState();
    expect(auth.status).toBe("succeeded");
    expect(auth.user).toEqual({ id: 1, name: "Alice" });
    expect(auth.token).toBe("token-abc-123");
    expect(auth.error).toBeNull();
  });

  it("rejected → sets error and status to failed", async () => {
    const store = makeStore();
    await store.dispatch(loginThunk({ email: "a@b.com", password: "wrong" }));

    const { auth } = store.getState();
    expect(auth.status).toBe("failed");
    expect(auth.error).toBe("Invalid credentials");
    expect(auth.user).toBeNull();
  });

  it("logout → clears user and token", async () => {
    const store = makeStore({
      auth: { user: { id: 1, name: "Alice" }, token: "abc", status: "succeeded", error: null },
    });

    store.dispatch(authSlice.actions.logout());

    const { auth } = store.getState();
    expect(auth.user).toBeNull();
    expect(auth.token).toBeNull();
    expect(auth.status).toBe("idle");
  });
});
