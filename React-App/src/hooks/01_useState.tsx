// TOPIC: useState
//
// useState is a Hook that lets you add state to a functional component.
//
// Syntax:
//   const [value, setValue] = useState(initialValue);
//
// Rules:
//   • Only call Hooks at the TOP LEVEL of a component (not inside loops/ifs)
//   • Calling the setter triggers a RE-RENDER with the new value
//   • State updates are ASYNCHRONOUS — don't read the new value right after setting it
//   • For objects/arrays, always create a NEW copy — never mutate state directly

import { useState } from "react";

// ─── Example 1: Simple number state ──────────────────────────────────────────
const CounterExample = () => {
  const [count, setCount] = useState(0); // initial value = 0

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Number State</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)} style={{ marginLeft: "8px" }}>-1</button>
      <button onClick={() => setCount(0)} style={{ marginLeft: "8px" }}>Reset</button>
    </div>
  );
};

// ─── Example 2: Functional update (safe when new state depends on old state) ─
const SafeCounterExample = () => {
  const [count, setCount] = useState(0);

  // Using (prev) => prev + 1 is safer than count + 1
  // because React may batch multiple updates together
  const increment = () => setCount((prev) => prev + 1);
  const decrement = () => setCount((prev) => prev - 1);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Functional Update (safe pattern)</h3>
      <p>Count: {count}</p>
      <button onClick={increment}>+1 (safe)</button>
      <button onClick={decrement} style={{ marginLeft: "8px" }}>-1 (safe)</button>
    </div>
  );
};

// ─── Example 3: String state ──────────────────────────────────────────────────
const ToggleThemeExample = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggle = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <div
      style={{
        marginBottom: "16px",
        background: theme === "dark" ? "#333" : "#eee",
        color: theme === "dark" ? "#fff" : "#000",
        padding: "10px",
      }}
    >
      <h3>Example 3 — String State (theme toggle)</h3>
      <p>Current theme: {theme}</p>
      <button onClick={toggle}>Toggle Theme</button>
    </div>
  );
};

// ─── Example 4: Object state (must spread to update) ─────────────────────────
interface User {
  name: string;
  age: number;
}

const ObjectStateExample = () => {
  const [user, setUser] = useState<User>({ name: "Alice", age: 25 });

  const birthday = () => {
    // CORRECT: spread existing state, then override the field you want to change
    setUser((prev) => ({ ...prev, age: prev.age + 1 }));
  };

  const rename = () => {
    setUser((prev) => ({ ...prev, name: "Bob" }));
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 4 — Object State (always spread!)</h3>
      <p>Name: {user.name} | Age: {user.age}</p>
      <button onClick={birthday}>Birthday +1</button>
      <button onClick={rename} style={{ marginLeft: "8px" }}>Rename to Bob</button>
    </div>
  );
};

// ─── Example 5: Array state ───────────────────────────────────────────────────
const ArrayStateExample = () => {
  const [items, setItems] = useState<string[]>(["Apple", "Banana"]);
  const [input, setInput] = useState("");

  const addItem = () => {
    if (!input.trim()) return;
    setItems((prev) => [...prev, input.trim()]); // spread + new item
    setInput("");
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index)); // filter out by index
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 5 — Array State</h3>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add item"
      />
      <button onClick={addItem} style={{ marginLeft: "8px" }}>Add</button>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            {item}{" "}
            <button onClick={() => removeItem(i)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseStateDemo = () => {
  return (
    <div>
      <h2>useState Hook</h2>
      <CounterExample />
      <SafeCounterExample />
      <ToggleThemeExample />
      <ObjectStateExample />
      <ArrayStateExample />
    </div>
  );
};

export default UseStateDemo;
