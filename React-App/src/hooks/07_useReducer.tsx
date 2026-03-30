// TOPIC: useReducer
//
// useReducer is an alternative to useState for managing COMPLEX state logic.
// Inspired by Redux — state changes happen through a pure "reducer" function.
//
// Syntax:
//   const [state, dispatch] = useReducer(reducerFn, initialState);
//
// Reducer function:
//   (state, action) => newState
//   • Always returns a NEW state object (never mutate)
//   • action usually has { type, payload }
//
// When to prefer useReducer over useState:
//   ✅ State has multiple sub-values that change together
//   ✅ Next state depends on the previous state
//   ✅ Complex update logic (multiple action types)
//   ✅ Easier to test (pure function)

import { useReducer, useState } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Counter (simplest useReducer)
// ════════════════════════════════════════════════════════════

type CounterAction =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET" }
  | { type: "SET"; payload: number };

const counterReducer = (state: number, action: CounterAction): number => {
  switch (action.type) {
    case "INCREMENT": return state + 1;
    case "DECREMENT": return state - 1;
    case "RESET":     return 0;
    case "SET":       return action.payload;
    default:          return state;
  }
};

const CounterExample = () => {
  const [count, dispatch] = useReducer(counterReducer, 0);

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Counter</h3>
      <p>Count: {count}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+1</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })} style={{ marginLeft: "8px" }}>-1</button>
      <button onClick={() => dispatch({ type: "RESET" })} style={{ marginLeft: "8px" }}>Reset</button>
      <button onClick={() => dispatch({ type: "SET", payload: 100 })} style={{ marginLeft: "8px" }}>Set 100</button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Todo List (complex state)
// ════════════════════════════════════════════════════════════

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface TodoState {
  todos: Todo[];
  nextId: number;
}

type TodoAction =
  | { type: "ADD"; payload: string }
  | { type: "TOGGLE"; payload: number }
  | { type: "DELETE"; payload: number };

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case "ADD":
      return {
        todos: [...state.todos, { id: state.nextId, text: action.payload, done: false }],
        nextId: state.nextId + 1,
      };
    case "TOGGLE":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload ? { ...t, done: !t.done } : t
        ),
      };
    case "DELETE":
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
      };
    default:
      return state;
  }
};

const TodoExample = () => {
  const [state, dispatch] = useReducer(todoReducer, { todos: [], nextId: 1 });
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    dispatch({ type: "ADD", payload: input.trim() });
    setInput("");
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Todo List</h3>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="New todo"
        onKeyDown={(e) => e.key === "Enter" && add()}
      />
      <button onClick={add} style={{ marginLeft: "8px" }}>Add</button>
      <ul>
        {state.todos.map((todo) => (
          <li key={todo.id} style={{ textDecoration: todo.done ? "line-through" : "none" }}>
            <span
              onClick={() => dispatch({ type: "TOGGLE", payload: todo.id })}
              style={{ cursor: "pointer", marginRight: "8px" }}
            >
              {todo.text}
            </span>
            <button onClick={() => dispatch({ type: "DELETE", payload: todo.id })}>Delete</button>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: "13px", color: "#888" }}>
        {state.todos.filter((t) => t.done).length} / {state.todos.length} done
      </p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 3: Form state with useReducer
// ════════════════════════════════════════════════════════════

interface FormState {
  username: string;
  email: string;
  error: string;
  submitted: boolean;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof Pick<FormState, "username" | "email">; value: string }
  | { type: "SUBMIT" }
  | { type: "RESET" };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value, error: "" };
    case "SUBMIT":
      if (!state.username || !state.email)
        return { ...state, error: "All fields are required." };
      return { ...state, submitted: true, error: "" };
    case "RESET":
      return { username: "", email: "", error: "", submitted: false };
    default:
      return state;
  }
};

const FormExample = () => {
  const [state, dispatch] = useReducer(formReducer, {
    username: "", email: "", error: "", submitted: false,
  });

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 3 — Form State</h3>
      {state.submitted ? (
        <div>
          <p style={{ color: "green" }}>Submitted! Username: {state.username}, Email: {state.email}</p>
          <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); dispatch({ type: "SUBMIT" }); }}>
          <div>
            <input
              placeholder="Username"
              value={state.username}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "username", value: e.target.value })}
            />
          </div>
          <div style={{ marginTop: "6px" }}>
            <input
              placeholder="Email"
              value={state.email}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "email", value: e.target.value })}
            />
          </div>
          {state.error && <p style={{ color: "red" }}>{state.error}</p>}
          <button type="submit" style={{ marginTop: "8px" }}>Submit</button>
        </form>
      )}
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseReducerDemo = () => {
  return (
    <div>
      <h2>useReducer Hook</h2>
      <CounterExample />
      <TodoExample />
      <FormExample />
    </div>
  );
};

export default UseReducerDemo;
