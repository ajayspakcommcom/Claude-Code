// AUTH FEATURE — index.ts (Barrel Export)
//
// THIS IS THE PUBLIC API of the auth feature.
//
// Rule: other features and the app root ONLY import from this file.
//       They never import from auth/useAuth.ts or auth/types.ts directly.
//
// Why this matters:
//   - Refactor internals freely without touching other features
//   - One place to see everything this feature exposes
//   - Encapsulation: implementation details stay hidden
//
// ✅ Correct:   import { useAuth } from "../auth"
// ❌ Incorrect: import { useAuth } from "../auth/useAuth"

export { useAuth }     from "./useAuth";
export { LoginForm }   from "./LoginForm";
export type { AuthUser, AuthState } from "./types";
