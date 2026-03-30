// TOPIC: useContext
//
// useContext lets any component READ a value from a React Context
// without passing it through every level as props (avoids "prop drilling").
//
// Three steps:
//   1. createContext()     — create the context with a default value
//   2. <Context.Provider>  — wrap the tree and supply the value
//   3. useContext(Context)  — consume the value anywhere inside the tree
//
// When the Provider's value changes, ALL consumers re-render.

import { createContext, useContext, useState } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Theme Context (simple value)
// ════════════════════════════════════════════════════════════

// Step 1: Create context (default value used if no Provider is above)
const ThemeContext = createContext<"light" | "dark">("light");

// Step 3: Deep child consumes context — no props needed
const ThemedBox = () => {
  const theme = useContext(ThemeContext);
  return (
    <div
      style={{
        background: theme === "dark" ? "#333" : "#f5f5f5",
        color: theme === "dark" ? "#fff" : "#000",
        padding: "10px",
        borderRadius: "6px",
        marginTop: "8px",
      }}
    >
      I am a deep child. Theme from context: <strong>{theme}</strong>
    </div>
  );
};

const ThemeExample = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Theme Context</h3>
      {/* Step 2: Provide the value */}
      <ThemeContext.Provider value={theme}>
        <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
          Toggle Theme
        </button>
        <ThemedBox />
      </ThemeContext.Provider>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Auth Context (object value with setter)
// ════════════════════════════════════════════════════════════

interface AuthContextType {
  user: string | null;
  login: (name: string) => void;
  logout: () => void;
}

// Default value is just a placeholder — Provider always overrides it
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

// Custom hook — clean way to consume context (best practice)
const useAuth = () => useContext(AuthContext);

// Deep child — uses auth without any prop drilling
const Profile = () => {
  const { user, logout } = useAuth();
  if (!user) return <p>Not logged in.</p>;
  return (
    <div>
      <p>Welcome, <strong>{user}</strong>!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const LoginForm = () => {
  const { login } = useAuth();
  const [name, setName] = useState("");

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={() => login(name)} style={{ marginLeft: "8px" }}>Login</button>
    </div>
  );
};

// Provider component — wraps the subtree that needs auth access
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);

  const login = (name: string) => setUser(name);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthExample = () => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Auth Context (object + custom hook pattern)</h3>
      <AuthProvider>
        <LoginForm />
        <Profile />
      </AuthProvider>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 3: Prop drilling problem → Context solution
// ════════════════════════════════════════════════════════════

const LanguageContext = createContext("English");

// Grandchild needs the language but Parent and Child don't use it
const Grandchild = () => {
  const lang = useContext(LanguageContext);
  return <p>Language (from context, skipped 2 levels): <strong>{lang}</strong></p>;
};

const Child = () => <Grandchild />;    // doesn't need lang, doesn't pass it
const Parent = () => <Child />;        // doesn't need lang, doesn't pass it

const PropDrillingExample = () => {
  const [lang, setLang] = useState("English");

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Avoiding Prop Drilling</h3>
      <LanguageContext.Provider value={lang}>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
        </select>
        <Parent />
      </LanguageContext.Provider>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseContextDemo = () => {
  return (
    <div>
      <h2>useContext Hook</h2>
      <ThemeExample />
      <AuthExample />
      <PropDrillingExample />
    </div>
  );
};

export default UseContextDemo;
