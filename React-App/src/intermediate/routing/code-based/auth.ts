// Simple in-memory auth store — simulates login state for the demo.
// In a real app this would be a Context, Zustand store, or similar.

let currentUser: string | null = null;

export const authStore = {
  login:      (username: string) => { currentUser = username; },
  logout:     ()                 => { currentUser = null; },
  isLoggedIn: ()                 => currentUser !== null,
  getUser:    ()                 => currentUser,
};
