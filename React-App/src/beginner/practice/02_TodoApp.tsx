// PRACTICE: Todo App
//
// Concepts used:
//   • useState — todo list, input, filter
//   • useReducer — all todo actions in one place
//   • Events — add, toggle, delete, clear
//   • Lists & keys — rendering todo items
//   • Conditional rendering — empty state, filter tabs
//   • Basic forms — controlled input with Enter key support
//   • Props — TodoItem component

import { useReducer, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Todo {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
}

type Filter = "all" | "active" | "completed";

interface State {
  todos: Todo[];
  nextId: number;
}

type Action =
  | { type: "ADD";    text: string }
  | { type: "TOGGLE"; id: number }
  | { type: "DELETE"; id: number }
  | { type: "EDIT";   id: number; text: string }
  | { type: "CLEAR_COMPLETED" };

// ─── Reducer ──────────────────────────────────────────────────────────────────
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD":
      return {
        todos: [
          ...state.todos,
          {
            id: state.nextId,
            text: action.text,
            done: false,
            createdAt: new Date().toLocaleTimeString(),
          },
        ],
        nextId: state.nextId + 1,
      };
    case "TOGGLE":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t
        ),
      };
    case "DELETE":
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case "EDIT":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, text: action.text } : t
        ),
      };
    case "CLEAR_COMPLETED":
      return { ...state, todos: state.todos.filter((t) => !t.done) };
    default:
      return state;
  }
};

// ─── TodoItem Component ───────────────────────────────────────────────────────
interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
}

const TodoItem = ({ todo, onToggle, onDelete, onEdit }: TodoItemProps) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const saveEdit = () => {
    if (editText.trim()) onEdit(editText.trim());
    setEditing(false);
  };

  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderBottom: "1px solid #eee",
        background: todo.done ? "#f9f9f9" : "#fff",
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={todo.done}
        onChange={onToggle}
        style={{ width: "18px", height: "18px", cursor: "pointer" }}
      />

      {/* Text or edit input */}
      {editing ? (
        <input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
          style={{ flex: 1, padding: "4px", fontSize: "14px" }}
        />
      ) : (
        <span
          onDoubleClick={() => { setEditing(true); setEditText(todo.text); }}
          style={{
            flex: 1,
            textDecoration: todo.done ? "line-through" : "none",
            color: todo.done ? "#aaa" : "#333",
            cursor: "text",
            fontSize: "15px",
          }}
          title="Double-click to edit"
        >
          {todo.text}
        </span>
      )}

      {/* Time */}
      <span style={{ fontSize: "11px", color: "#bbb", whiteSpace: "nowrap" }}>
        {todo.createdAt}
      </span>

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{
          background: "none",
          border: "none",
          color: "#e74c3c",
          fontSize: "16px",
          cursor: "pointer",
          padding: "2px 6px",
        }}
      >
        ✕
      </button>
    </li>
  );
};

// ─── Main TodoApp ─────────────────────────────────────────────────────────────
const TodoApp = () => {
  const [state, dispatch] = useReducer(reducer, { todos: [], nextId: 1 });
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const add = () => {
    if (!input.trim()) return;
    dispatch({ type: "ADD", text: input.trim() });
    setInput("");
  };

  const filtered = state.todos.filter((t) => {
    if (filter === "active")    return !t.done;
    if (filter === "completed") return t.done;
    return true;
  });

  const doneCount    = state.todos.filter((t) => t.done).length;
  const activeCount  = state.todos.length - doneCount;

  const filterTabs: Filter[] = ["all", "active", "completed"];

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center" }}>Todo App</h2>

      {/* Input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="What needs to be done?"
          style={{ flex: 1, padding: "10px", fontSize: "15px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <button
          onClick={add}
          style={{
            padding: "10px 16px",
            background: "#4a90e2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Add
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        {filterTabs.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "5px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: filter === f ? "#4a90e2" : "#fff",
              color: filter === f ? "#fff" : "#333",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "13px", color: "#888", alignSelf: "center" }}>
          {activeCount} left
        </span>
      </div>

      {/* List */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, border: "1px solid #eee", borderRadius: "6px", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <li style={{ padding: "20px", textAlign: "center", color: "#aaa" }}>
            {state.todos.length === 0 ? "No todos yet. Add one above!" : "No items in this filter."}
          </li>
        ) : (
          filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => dispatch({ type: "TOGGLE", id: todo.id })}
              onDelete={() => dispatch({ type: "DELETE", id: todo.id })}
              onEdit={(text) => dispatch({ type: "EDIT", id: todo.id, text })}
            />
          ))
        )}
      </ul>

      {/* Footer */}
      {doneCount > 0 && (
        <div style={{ textAlign: "right", marginTop: "8px" }}>
          <button
            onClick={() => dispatch({ type: "CLEAR_COMPLETED" })}
            style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "13px" }}
          >
            Clear completed ({doneCount})
          </button>
        </div>
      )}

      {/* Tip */}
      <p style={{ fontSize: "12px", color: "#bbb", textAlign: "center", marginTop: "12px" }}>
        Double-click a todo to edit it
      </p>
    </div>
  );
};

export default TodoApp;
