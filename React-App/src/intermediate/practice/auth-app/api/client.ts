// TOPIC: Axios Client — Request + Response Interceptors
//
// Production patterns demonstrated:
//
//   Request interceptor  — automatically attach the Bearer token to every
//                          outgoing request so components never handle auth headers
//
//   Response interceptor — detect 401 (token expired), transparently:
//                           1. Pause the failed request
//                           2. Call /auth/refresh to get a new access token
//                           3. Retry the original request with the new token
//                           4. If refresh also fails → force logout
//
//   Queue during refresh — if multiple requests fire simultaneously and all
//                          get a 401, only ONE refresh call is made. The others
//                          wait in a queue and resolve once the token is ready.
//
// This pattern is called "silent token refresh" or "transparent token rotation".

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  getPersistedAccessToken,
  getPersistedRefreshToken,
  persistTokens,
  clearPersistedTokens,
  tokenRefreshed,
  forceLogout,
} from "../store/authSlice";

// We import the store lazily (inside interceptors) to avoid circular imports.
// The store imports authSlice, authSlice imports this file — lazy import breaks the cycle.
let _store: import("../store/store").AppDispatch | null = null;

export const injectStore = (dispatch: import("../store/store").AppDispatch) => {
  _store = dispatch;
};

// ─── Axios instance ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: "/api",        // All requests go to /api/* — proxied by dev server in prod
  timeout: 10_000,        // 10 s timeout — fail fast, don't hang forever
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor — attach Bearer token ────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getPersistedAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Token refresh queue ──────────────────────────────────────────────────────
//
// When multiple API calls get a 401 simultaneously, we:
//   - Track a single isRefreshing flag
//   - Push all queued resolvers into failedQueue
//   - After refresh succeeds, drain the queue with the new token

let isRefreshing = false;

interface QueueItem {
  resolve: (token: string) => void;
  reject:  (err: unknown) => void;
}

const failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((item) => {
    if (error) item.reject(error);
    else       item.resolve(token!);
  });
  failedQueue.length = 0;
};

// ─── Response interceptor — 401 → silent refresh → retry ────────────────────

apiClient.interceptors.response.use(
  // Pass through all successful responses unchanged
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only handle 401 (Unauthorized) and don't retry twice
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in flight, wait in the queue
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers!.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    // Mark this request as already retried (prevents infinite loops)
    originalRequest._retry = true;
    isRefreshing            = true;

    const refreshToken = getPersistedRefreshToken();
    if (!refreshToken) {
      // No refresh token — hard logout
      if (_store) _store(forceLogout());
      return Promise.reject(error);
    }

    try {
      // Call refresh endpoint directly (not through apiClient — avoids interceptor loop)
      const { data } = await axios.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        "/api/auth/refresh",
        { refreshToken }
      );

      const newTokenPair = {
        accessToken:  data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn:    data.expiresIn,
      };

      // Persist and update Redux
      persistTokens(newTokenPair);
      if (_store) _store(tokenRefreshed(data.accessToken));

      // Drain the queue with the new token
      processQueue(null, data.accessToken);

      // Retry the original request
      originalRequest.headers!.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);

    } catch (refreshError) {
      // Refresh failed — force logout and reject all queued requests
      processQueue(refreshError, null);
      clearPersistedTokens();
      if (_store) _store(forceLogout());
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);
