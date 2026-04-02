// TOPIC: Custom Render — Usage in Tests
//
// This file shows HOW to use renderWithProviders in real tests.
// The utility lives in 04_CustomRender.tsx.
//
// Patterns covered:
//   1. Rendering with preloaded Redux state
//   2. Interacting with the store after render
//   3. Rendering with React Query + pre-seeded cache
//   4. Testing custom hooks that need Redux (createWrapper)

import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  renderWithProviders,
  createTestQueryClient,
  createTestStore,
  createWrapper,
} from "./04_CustomRender";

// ════════════════════════════════════════════════════════════
// Setup — slice + components used across tests
// ════════════════════════════════════════════════════════════

// Minimal counter slice for testing
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
    set:       (state, action: PayloadAction<number>) => { state.value = action.payload; },
  },
});

type CounterState = { counter: { value: number } };

// Component that reads from Redux
const CounterDisplay = () => {
  const value    = useSelector((s: CounterState) => s.counter.value);
  const dispatch = useDispatch();
  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>+</button>
      <button onClick={() => dispatch(counterSlice.actions.decrement())}>-</button>
    </div>
  );
};

// Component that reads from React Query cache
const UserProfile = ({ userId }: { userId: number }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetch(`/api/users/${userId}`).then((r) => r.json()),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError)   return <p role="alert">Error loading user</p>;
  return <h2>{(data as { name: string }).name}</h2>;
};

// Hook that uses Redux
const useCounterHook = () => {
  const value    = useSelector((s: CounterState) => s.counter.value);
  const dispatch = useDispatch();
  return {
    value,
    increment: () => dispatch(counterSlice.actions.increment()),
    set: (n: number) => dispatch(counterSlice.actions.set(n)),
  };
};

const reducers = { counter: counterSlice.reducer };

// ════════════════════════════════════════════════════════════
// 1. Rendering with preloaded Redux state
// ════════════════════════════════════════════════════════════

describe("1 — renderWithProviders: preloaded Redux state", () => {
  it("renders with default initial state", () => {
    renderWithProviders(<CounterDisplay />, { reducers });
    expect(screen.getByText("Count: 0")).toBeInTheDocument();
  });

  it("seeds the store with custom initial state", () => {
    renderWithProviders(<CounterDisplay />, {
      reducers,
      preloadedState: { counter: { value: 42 } },
    });
    expect(screen.getByText("Count: 42")).toBeInTheDocument();
  });

  it("dispatches actions and the UI updates", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CounterDisplay />, {
      reducers,
      preloadedState: { counter: { value: 10 } },
    });

    await user.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getByText("Count: 11")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "-" }));
    await user.click(screen.getByRole("button", { name: "-" }));
    expect(screen.getByText("Count: 9")).toBeInTheDocument();
  });

  it("exposes the store so you can dispatch in tests directly", () => {
    const { store } = renderWithProviders(<CounterDisplay />, {
      reducers,
      preloadedState: { counter: { value: 5 } },
    });

    // Dispatch directly without clicking buttons
    act(() => { store.dispatch(counterSlice.actions.set(99)); });
    expect(screen.getByText("Count: 99")).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════
// 2. Rendering with React Query — pre-seed the cache
// ════════════════════════════════════════════════════════════

describe("2 — renderWithProviders: React Query pre-seeded cache", () => {
  it("renders data from pre-seeded cache — no fetch needed", async () => {
    const queryClient = createTestQueryClient();

    // Seed the cache before rendering — no fetch will be made
    queryClient.setQueryData(["user", 1], { id: 1, name: "Alice Johnson" });

    renderWithProviders(<UserProfile userId={1} />, { queryClient });

    // No loading state — data is already in cache
    expect(await screen.findByRole("heading", { name: "Alice Johnson" })).toBeInTheDocument();
  });

  it("shows error state when query fails", async () => {
    // Override fetch to fail
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    renderWithProviders(<UserProfile userId={2} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    jest.restoreAllMocks();
  });
});

// ════════════════════════════════════════════════════════════
// 3. Testing custom hooks that need Redux — createWrapper
// ════════════════════════════════════════════════════════════

describe("3 — createWrapper: testing Redux hooks in isolation", () => {
  it("reads initial state from Redux", () => {
    const wrapper = createWrapper({
      reducers,
      preloadedState: { counter: { value: 7 } },
    });

    const { result } = renderHook(() => useCounterHook(), { wrapper });
    expect(result.current.value).toBe(7);
  });

  it("dispatches and reads updated state", () => {
    const wrapper = createWrapper({ reducers });
    const { result } = renderHook(() => useCounterHook(), { wrapper });

    act(() => result.current.increment());
    act(() => result.current.increment());
    expect(result.current.value).toBe(2);
  });

  it("set() replaces value directly", () => {
    const wrapper = createWrapper({ reducers });
    const { result } = renderHook(() => useCounterHook(), { wrapper });

    act(() => result.current.set(100));
    expect(result.current.value).toBe(100);
  });
});
