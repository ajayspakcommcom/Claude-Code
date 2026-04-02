// TOPIC: Auth Slice — JWT Token Management + Persistence
//
// Production patterns demonstrated:
//
//   1. Token persistence  — save/load tokens from localStorage so the user
//                            stays logged in across page refreshes
//
//   2. Async thunks       — login, register, refresh, logout each go through
//                            createAsyncThunk for pending/fulfilled/rejected
//
//   3. rejectWithValue    — extract server error messages so the UI can
//                            display "Wrong password" instead of "Rejected"
//
//   4. extraReducers      — handle async thunk lifecycle in the slice
//
//   5. Selector functions — co-locate selectors with the slice they read

import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import type {
  AuthState,
  User,
  LoginCredentials,
  RegisterCredentials,
  TokenPair,
} from "../types";
import * as authApi from "../api/authApi";

// ─── Token persistence helpers ────────────────────────────────────────────────
//
// Production note: For maximum security, access tokens should be stored in
// memory (Redux) and refresh tokens in httpOnly cookies (server-set).
// For this demo we use localStorage so the pattern is visible without a
// real server that sets cookies.

const TOKEN_KEY   = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

export const persistTokens = (pair: TokenPair) => {
  localStorage.setItem(TOKEN_KEY,   pair.accessToken);
  localStorage.setItem(REFRESH_KEY, pair.refreshToken);
};

export const clearPersistedTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const getPersistedAccessToken  = () => localStorage.getItem(TOKEN_KEY);
export const getPersistedRefreshToken = () => localStorage.getItem(REFRESH_KEY);

// ─── Initial state ────────────────────────────────────────────────────────────
//
// On startup, check if a token is already saved. If yes, start as "loading"
// so the app immediately tries to verify the token with the server (/me).
// If no token, start as "unauthenticated" and show the login page.

const savedToken = getPersistedAccessToken();

const initialState: AuthState = {
  user:        null,
  accessToken: savedToken,              // hydrate from storage on boot
  status:      savedToken ? "loading" : "unauthenticated",
  error:       null,
};

// ─── Async thunks ─────────────────────────────────────────────────────────────

// Login — POST /auth/login
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await authApi.login(credentials);
    } catch (err: any) {
      // rejectWithValue passes a typed payload to rejected handler
      return rejectWithValue(err.message ?? "Login failed");
    }
  }
);

// Register — POST /auth/register
export const registerThunk = createAsyncThunk(
  "auth/register",
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      return await authApi.register(credentials);
    } catch (err: any) {
      return rejectWithValue(err.message ?? "Registration failed");
    }
  }
);

// Restore session — GET /auth/me  (called on app load if token exists)
export const restoreSessionThunk = createAsyncThunk(
  "auth/restoreSession",
  async (_: void, { rejectWithValue }) => {
    try {
      return await authApi.getMe();
    } catch (err: any) {
      clearPersistedTokens();
      return rejectWithValue(err.message ?? "Session expired");
    }
  }
);

// Refresh access token — POST /auth/refresh
export const refreshTokenThunk = createAsyncThunk(
  "auth/refreshToken",
  async (_: void, { rejectWithValue }) => {
    const refreshToken = getPersistedRefreshToken();
    if (!refreshToken) return rejectWithValue("No refresh token");
    try {
      return await authApi.refreshToken(refreshToken);
    } catch (err: any) {
      clearPersistedTokens();
      return rejectWithValue(err.message ?? "Token refresh failed");
    }
  }
);

// Logout — POST /auth/logout  (also clears local state regardless of response)
export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } finally {
    clearPersistedTokens();
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    // Called by the Axios interceptor when it receives a fresh token
    // after a transparent 401 → refresh → retry cycle
    tokenRefreshed(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    // Hard-reset — used when refresh fails and we need to force logout
    forceLogout(state) {
      state.user        = null;
      state.accessToken = null;
      state.status      = "unauthenticated";
      state.error       = null;
      clearPersistedTokens();
    },
    clearError(state) {
      state.error = null;
    },
    // Optimistically update user fields after a successful profile edit
    updateUserLocally(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },

  extraReducers(builder) {
    // ── Login ────────────────────────────────────────────────────────────────
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error  = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        const { user, tokens } = action.payload;
        state.status      = "authenticated";
        state.user        = user;
        state.accessToken = tokens.accessToken;
        persistTokens(tokens);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error  = action.payload as string;
      });

    // ── Register ─────────────────────────────────────────────────────────────
    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error  = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        const { user, tokens } = action.payload;
        state.status      = "authenticated";
        state.user        = user;
        state.accessToken = tokens.accessToken;
        persistTokens(tokens);
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error  = action.payload as string;
      });

    // ── Restore session ───────────────────────────────────────────────────────
    builder
      .addCase(restoreSessionThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user   = action.payload;
      })
      .addCase(restoreSessionThunk.rejected, (state, action) => {
        state.status      = "unauthenticated";
        state.accessToken = null;
        state.error       = action.payload as string;
      });

    // ── Refresh token ─────────────────────────────────────────────────────────
    builder
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        persistTokens(action.payload);
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.status      = "unauthenticated";
        state.user        = null;
        state.accessToken = null;
      });

    // ── Logout ────────────────────────────────────────────────────────────────
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.status      = "unauthenticated";
      state.user        = null;
      state.accessToken = null;
      state.error       = null;
    });
  },
});

export const { tokenRefreshed, forceLogout, clearError, updateUserLocally } =
  authSlice.actions;

export default authSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
//
// Co-locate selectors with the slice — components import from one place.

export type RootState = { auth: AuthState };

export const selectUser        = (s: RootState) => s.auth.user;
export const selectAccessToken = (s: RootState) => s.auth.accessToken;
export const selectAuthStatus  = (s: RootState) => s.auth.status;
export const selectAuthError   = (s: RootState) => s.auth.error;
export const selectIsAuth      = (s: RootState) => s.auth.status === "authenticated";
export const selectIsLoading   = (s: RootState) => s.auth.status === "loading";
export const selectUserRole    = (s: RootState) => s.auth.user?.role ?? null;
