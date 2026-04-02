// TOPIC: Auth API — Mock Endpoints
//
// In a real app these functions call your backend via apiClient.
// Here we simulate network delay + business logic so the app is fully
// runnable without a server, but the calling code is IDENTICAL to production.
//
// Mock user database (in-memory — resets on page refresh)
// Credentials:
//   admin@example.com  / Admin123!   → role: admin
//   user@example.com   / User123!    → role: user
//   mod@example.com    / Mod123!     → role: moderator

import type {
  LoginCredentials,
  RegisterCredentials,
  TokenPair,
  User,
} from "../types";

// ─── Fake database ────────────────────────────────────────────────────────────

const fakeDelay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

interface StoredUser extends User {
  passwordHash: string; // in real app this is never sent to client
}

const DB: StoredUser[] = [
  {
    id:           "u1",
    email:        "admin@example.com",
    firstName:    "Alice",
    lastName:     "Admin",
    role:         "admin",
    avatarUrl:    null,
    createdAt:    "2024-01-01T00:00:00Z",
    passwordHash: "Admin123!",   // plaintext for demo — never do this in production
  },
  {
    id:           "u2",
    email:        "user@example.com",
    firstName:    "Bob",
    lastName:     "User",
    role:         "user",
    avatarUrl:    null,
    createdAt:    "2024-02-01T00:00:00Z",
    passwordHash: "User123!",
  },
  {
    id:           "u3",
    email:        "mod@example.com",
    firstName:    "Carol",
    lastName:     "Mod",
    role:         "moderator",
    avatarUrl:    null,
    createdAt:    "2024-03-01T00:00:00Z",
    passwordHash: "Mod123!",
  },
];

// Track active refresh tokens (real app stores these server-side)
const activeRefreshTokens = new Map<string, string>(); // refreshToken → userId

// ─── Token generation (simulated JWT) ─────────────────────────────────────────

const makeTokenPair = (userId: string): TokenPair => {
  const accessToken  = `access.${userId}.${Date.now()}`;
  const refreshToken = `refresh.${userId}.${Date.now()}`;
  activeRefreshTokens.set(refreshToken, userId);
  return { accessToken, refreshToken, expiresIn: 900 }; // 15 min
};

const getUserFromAccessToken = (token: string): StoredUser | undefined => {
  // Format: "access.<userId>.<timestamp>"
  const userId = token.split(".")[1];
  return DB.find((u) => u.id === userId);
};

// ─── Endpoints ────────────────────────────────────────────────────────────────

// POST /auth/login
export const login = async (
  credentials: LoginCredentials
): Promise<{ user: User; tokens: TokenPair }> => {
  await fakeDelay();

  const stored = DB.find(
    (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
  );

  if (!stored || stored.passwordHash !== credentials.password) {
    throw new Error("Invalid email or password");
  }

  const { passwordHash: _, ...user } = stored;
  return { user, tokens: makeTokenPair(stored.id) };
};

// POST /auth/register
export const register = async (
  credentials: RegisterCredentials
): Promise<{ user: User; tokens: TokenPair }> => {
  await fakeDelay(800);

  const emailExists = DB.some(
    (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
  );
  if (emailExists) {
    throw new Error("An account with this email already exists");
  }

  if (credentials.password !== credentials.confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const newUser: StoredUser = {
    id:           `u${DB.length + 1}`,
    email:        credentials.email.toLowerCase(),
    firstName:    credentials.firstName,
    lastName:     credentials.lastName,
    role:         "user",           // new registrations always start as "user"
    avatarUrl:    null,
    createdAt:    new Date().toISOString(),
    passwordHash: credentials.password,
  };

  DB.push(newUser);

  const { passwordHash: _, ...user } = newUser;
  return { user, tokens: makeTokenPair(newUser.id) };
};

// GET /auth/me  (validate + decode access token, return current user)
export const getMe = async (): Promise<User> => {
  await fakeDelay(400);

  // In real app: server decodes JWT and returns user from DB.
  // Here we decode our fake token format.
  const token = localStorage.getItem("auth_access_token");
  if (!token) throw new Error("No access token");

  const stored = getUserFromAccessToken(token);
  if (!stored) throw new Error("Session expired — please log in again");

  const { passwordHash: _, ...user } = stored;
  return user;
};

// POST /auth/refresh
export const refreshToken = async (
  refreshTkn: string
): Promise<TokenPair> => {
  await fakeDelay(300);

  const userId = activeRefreshTokens.get(refreshTkn);
  if (!userId) throw new Error("Invalid or expired refresh token");

  // Rotate: invalidate old refresh token, issue new pair
  activeRefreshTokens.delete(refreshTkn);
  return makeTokenPair(userId);
};

// POST /auth/logout
export const logout = async (): Promise<void> => {
  await fakeDelay(200);
  // In real app: server invalidates the refresh token in DB.
  // Here we just clear the in-memory map entry.
  const token = localStorage.getItem("auth_refresh_token");
  if (token) activeRefreshTokens.delete(token);
};

// GET /users/me  (update profile)
export const updateProfile = async (
  userId: string,
  payload: Partial<Pick<User, "firstName" | "lastName" | "avatarUrl">>
): Promise<User> => {
  await fakeDelay(500);

  const stored = DB.find((u) => u.id === userId);
  if (!stored) throw new Error("User not found");

  Object.assign(stored, payload);
  const { passwordHash: _, ...user } = stored;
  return user;
};

// POST /users/me/change-password
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await fakeDelay(600);

  const stored = DB.find((u) => u.id === userId);
  if (!stored) throw new Error("User not found");
  if (stored.passwordHash !== currentPassword) {
    throw new Error("Current password is incorrect");
  }

  stored.passwordHash = newPassword;
};
