// TOPIC: Custom Render Utility — Enterprise Pattern
//
// Problem: Every test that needs Redux, React Query, or Router has to manually
// wrap the component in multiple providers. That's noisy and error-prone.
//
// Solution: One renderWithProviders() function that wraps everything.
// This is how every production React app sets up its test utilities.
//
// What this file exports:
//   renderWithProviders()  — render any component with all providers pre-wired
//   createTestStore()      — a real Redux store seeded with custom state
//   createTestQueryClient()— a QueryClient configured for tests (no retries, no caching)
//   wrapper()              — a React component that provides all contexts (for renderHook)

import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ─── 1. Test-safe QueryClient ────────────────────────────────────────────────
//
// Default QueryClient retries failed requests 3x — terrible for tests.
// Default staleTime is 0 — causes unnecessary refetches.
// This factory produces a clean client for each test.

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,        // don't retry on failure — tests should fail fast
        staleTime: Infinity, // don't refetch during test — use whatever was fetched
        gcTime: Infinity,    // don't garbage collect — keep data for assertions
      },
      mutations: {
        retry: false,
      },
    },
  });

// ─── 2. Test Redux store ─────────────────────────────────────────────────────
//
// createTestStore() accepts a slice map and optional preloadedState.
// You only import the slices relevant to the component under test.

export const createTestStore = (
  reducers: Record<string, any>,
  preloadedState?: Record<string, any>
) =>
  configureStore({
    reducer: reducers,
    preloadedState,
  });

// ─── 3. All-in-one Provider wrapper ─────────────────────────────────────────
//
// Wraps children with Redux Provider + QueryClientProvider.
// Add more providers here as your app grows (e.g., ThemeProvider, RouterContext).

interface AllProvidersProps {
  children: React.ReactNode;
  store: ReturnType<typeof createTestStore>;
  queryClient: QueryClient;
}

export const AllProviders = ({ children, store, queryClient }: AllProvidersProps) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </Provider>
);

// ─── 4. renderWithProviders ──────────────────────────────────────────────────
//
// Drop-in replacement for RTL's render().
// Pass reducers and optional preloadedState — you get a fully wired component.
//
// Usage:
//   const { store, queryClient } = renderWithProviders(<MyComponent />, {
//     reducers: { counter: counterReducer },
//     preloadedState: { counter: { value: 5 } },
//   });

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  reducers?: Record<string, any>;
  preloadedState?: Record<string, any>;
  store?: ReturnType<typeof createTestStore>;
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    reducers = {},
    preloadedState = {},
    store = createTestStore(reducers, preloadedState),
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders store={store} queryClient={queryClient}>
      {children}
    </AllProviders>
  );

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// ─── 5. createWrapper — for use with renderHook ───────────────────────────────
//
// renderHook() also needs a wrapper for providers.
// Usage:
//   const wrapper = createWrapper({ reducers: { cart: cartReducer } });
//   const { result } = renderHook(() => useCartTotal(), { wrapper });

export const createWrapper = (options: RenderWithProvidersOptions = {}) => {
  const store = options.store ?? createTestStore(options.reducers ?? {}, options.preloadedState);
  const queryClient = options.queryClient ?? createTestQueryClient();

  return ({ children }: { children: React.ReactNode }) => (
    <AllProviders store={store} queryClient={queryClient}>
      {children}
    </AllProviders>
  );
};
