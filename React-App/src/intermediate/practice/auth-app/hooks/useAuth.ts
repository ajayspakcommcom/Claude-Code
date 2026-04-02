// TOPIC: useAuth — Convenience Hook
//
// Production pattern: wrap all auth-related Redux access in one hook.
// Components import from ONE place and never touch dispatch/selector directly.
//
// Benefits:
//   - Components are decoupled from Redux — swap to Zustand later with no component changes
//   - Single import: const { user, login, logout, isAdmin } = useAuth()
//   - All actions are pre-bound — no useDispatch() spread across components
//   - Role helper (isAdmin, isModerator) avoids repeated string comparisons in JSX

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  selectUser,
  selectAuthStatus,
  selectAuthError,
  selectIsAuth,
  selectIsLoading,
  selectUserRole,
  clearError,
} from "../store/authSlice";
import {
  loginThunk,
  registerThunk,
  logoutThunk,
  restoreSessionThunk,
  updateUserLocally,
} from "../store/authSlice";
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
  Role,
} from "../types";

export const useAuth = () => {
  const dispatch = useAppDispatch();

  // ── State ──────────────────────────────────────────────────────────────────
  const user    = useAppSelector(selectUser);
  const status  = useAppSelector(selectAuthStatus);
  const error   = useAppSelector(selectAuthError);
  const isAuth  = useAppSelector(selectIsAuth);
  const isLoading = useAppSelector(selectIsLoading);
  const role    = useAppSelector(selectUserRole);

  // ── Role helpers ───────────────────────────────────────────────────────────
  const hasRole  = useCallback((r: Role) => role === r, [role]);
  const isAdmin  = role === "admin";
  const isMod    = role === "moderator";

  // ── Actions ────────────────────────────────────────────────────────────────
  const login = useCallback(
    (credentials: LoginCredentials) => dispatch(loginThunk(credentials)),
    [dispatch]
  );

  const register = useCallback(
    (credentials: RegisterCredentials) => dispatch(registerThunk(credentials)),
    [dispatch]
  );

  const logout = useCallback(
    () => dispatch(logoutThunk()),
    [dispatch]
  );

  const restoreSession = useCallback(
    () => dispatch(restoreSessionThunk()),
    [dispatch]
  );

  const patchUser = useCallback(
    (patch: Partial<User>) => dispatch(updateUserLocally(patch)),
    [dispatch]
  );

  const dismissError = useCallback(
    () => dispatch(clearError()),
    [dispatch]
  );

  return {
    // State
    user,
    status,
    error,
    isAuth,
    isLoading,
    role,

    // Role helpers
    isAdmin,
    isMod,
    hasRole,

    // Actions
    login,
    register,
    logout,
    restoreSession,
    patchUser,
    dismissError,

    // Derived
    fullName: user ? `${user.firstName} ${user.lastName}` : "",
    initials: user
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : "",
  };
};
