// TOPIC: Auth App — Type Definitions
//
// Production rule: Define ALL shared types in one place.
// This prevents type drift between API responses, Redux state, and components.

// ─── Roles ────────────────────────────────────────────────────────────────────

// Role-Based Access Control (RBAC) — each user has exactly one role.
// In a real app this often comes from the JWT payload (decoded on the server).
export type Role = "user" | "admin" | "moderator";

// ─── User ─────────────────────────────────────────────────────────────────────

// The shape returned by the server after a successful login or /me request.
// NOTE: Never store the password hash here — only non-sensitive fields.
export interface User {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
  role:      Role;
  avatarUrl: string | null;
  createdAt: string; // ISO 8601
}

// ─── Auth tokens ──────────────────────────────────────────────────────────────

// Production pattern: short-lived access token (15 min) + long-lived refresh token (7 days).
// The access token travels in every API request header.
// The refresh token is stored in an httpOnly cookie (server sets it) — never in JS.
// For this demo we simulate with localStorage.
export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number; // seconds until accessToken expires
}

// ─── API shapes ───────────────────────────────────────────────────────────────

// Uniform server response envelope — all endpoints return this shape.
export interface ApiResponse<T> {
  data:    T;
  message: string;
  success: boolean;
}

// Login request body
export interface LoginCredentials {
  email:      string;
  password:   string;
  rememberMe: boolean;
}

// Register request body
export interface RegisterCredentials {
  firstName:       string;
  lastName:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
}

// Update profile body (partial — only changed fields)
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?:  string;
  avatarUrl?: string | null;
}

// Change password body
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword:     string;
}

// ─── Redux auth state ─────────────────────────────────────────────────────────

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "failed";

export interface AuthState {
  user:        User | null;
  accessToken: string | null;
  status:      AuthStatus;
  error:       string | null;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

// Simple page enum used by state-based router (no router library needed for demo)
export type Page =
  | "login"
  | "register"
  | "dashboard"
  | "profile"
  | "admin"
  | "forgot-password";
