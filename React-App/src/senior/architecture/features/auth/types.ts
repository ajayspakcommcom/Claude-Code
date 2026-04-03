// AUTH FEATURE — types.ts
//
// Rule: every feature owns its types. No other feature imports from here
// directly — they go through the barrel (index.ts).

export interface AuthUser {
  id:    string;
  name:  string;
  email: string;
  role:  "admin" | "user";
}

export interface AuthState {
  user:      AuthUser | null;
  isLoading: boolean;
  error:     string | null;
}
