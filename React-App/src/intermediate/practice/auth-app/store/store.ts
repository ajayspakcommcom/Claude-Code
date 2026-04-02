// TOPIC: Redux Store Configuration
//
// Production patterns:
//   - configureStore with typed RootState and AppDispatch
//   - Export typed hooks (useAppSelector / useAppDispatch) so every component
//     gets proper TypeScript inference without casting

import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  // Redux DevTools is enabled automatically in development
  // devTools: process.env.NODE_ENV !== "production",
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ─── Typed hooks ──────────────────────────────────────────────────────────────
//
// Use these instead of raw useDispatch / useSelector everywhere.
// They give correct types without manual casting on every callsite.

export const useAppDispatch: () => AppDispatch               = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
