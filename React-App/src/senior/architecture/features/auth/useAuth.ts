// AUTH FEATURE — useAuth.ts
//
// Feature hook: encapsulates auth state + actions.
// Uses shared/hooks/useLocalStorage to persist session.
// Components outside this feature never import this directly — they use
// the barrel export: import { useAuth } from "../auth"

import { useState, useCallback } from "react";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import type { AuthUser, AuthState } from "./types";

// Simulated credentials
const MOCK_USERS: Array<AuthUser & { password: string }> = [
  { id: "1", name: "Alice Admin", email: "admin@example.com", role: "admin", password: "admin123" },
  { id: "2", name: "Bob User",    email: "user@example.com",  role: "user",  password: "user123"  },
];

export const useAuth = () => {
  const [persistedUser, setPersistedUser, clearUser] = useLocalStorage<AuthUser | null>(
    "arch_demo_user", null
  );
  const [state, setState] = useState<AuthState>({
    user:      persistedUser,
    isLoading: false,
    error:     null,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    await new Promise((r) => setTimeout(r, 600));

    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!found) {
      setState((s) => ({ ...s, isLoading: false, error: "Invalid credentials" }));
      return false;
    }
    const { password: _, ...user } = found;
    setPersistedUser(user);
    setState({ user, isLoading: false, error: null });
    return true;
  }, [setPersistedUser]);

  const logout = useCallback(() => {
    clearUser();
    setState({ user: null, isLoading: false, error: null });
  }, [clearUser]);

  return { ...state, login, logout, isAdmin: state.user?.role === "admin" };
};
