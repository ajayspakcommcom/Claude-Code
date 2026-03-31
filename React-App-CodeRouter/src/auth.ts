let currentUser: string | null = null;

export const authStore = {
  login:      (username: string) => { currentUser = username; },
  logout:     ()                 => { currentUser = null; },
  isLoggedIn: ()                 => currentUser !== null,
  getUser:    ()                 => currentUser,
};
