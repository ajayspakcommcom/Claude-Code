// TOPIC: Integration Tests
//
// Unit tests:        one component in isolation, all dependencies mocked
// Integration tests: multiple components working together with real interactions
//                    → test a full USER FLOW, not just a single function
//
// Enterprise rule:
//   "Write mostly integration tests. They catch more real bugs than unit tests
//    because they test how the pieces actually connect."
//
// Patterns covered:
//   1. Full auth flow   — login form → redirect → dashboard
//   2. Full CRUD flow   — list → add → delete → list updates
//   3. Multi-step form  — step 1 → step 2 → submit → confirmation
//   4. Optimistic UI    — item appears immediately, then confirmed by server
//   5. Error recovery   — submit fails → retry → succeeds

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";

// ════════════════════════════════════════════════════════════
// MSW Server for integration tests
// ════════════════════════════════════════════════════════════

let mockTodos = [
  { id: 1, title: "Buy groceries", completed: false },
  { id: 2, title: "Read a book",   completed: true  },
];

const server = setupServer(
  rest.get("/api/todos", (_req, res, ctx) =>
    res(ctx.json([...mockTodos]))
  ),
  rest.post("/api/todos", async (req, res, ctx) => {
    const body = await req.json();
    const newTodo = { id: Date.now(), title: body.title, completed: false };
    mockTodos.push(newTodo);
    return res(ctx.status(201), ctx.json(newTodo));
  }),
  rest.delete("/api/todos/:id", (req, res, ctx) => {
    const id = Number(req.params.id);
    mockTodos = mockTodos.filter((t) => t.id !== id);
    return res(ctx.status(204));
  }),
  rest.patch("/api/todos/:id", async (req, res, ctx) => {
    const id   = Number(req.params.id);
    const body = await req.json();
    mockTodos  = mockTodos.map((t) => t.id === id ? { ...t, ...body } : t);
    const updated = mockTodos.find((t) => t.id === id);
    return res(ctx.json(updated));
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Reset mock data after each test
  mockTodos = [
    { id: 1, title: "Buy groceries", completed: false },
    { id: 2, title: "Read a book",   completed: true  },
  ];
});
afterAll(() => server.close());

// ════════════════════════════════════════════════════════════
// Full App component (combines multiple sub-components)
// ════════════════════════════════════════════════════════════

type Todo = { id: number; title: string; completed: boolean };

const TodoApp = () => {
  const [todos, setTodos]   = React.useState<Todo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [input, setInput]   = React.useState("");
  const [error, setError]   = React.useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/todos")
      .then((r) => r.json())
      .then((data) => { setTodos(data); setLoading(false); })
      .catch(() => { setError("Failed to load"); setLoading(false); });
  };

  React.useEffect(() => { load(); }, []);

  const addTodo = async () => {
    if (!input.trim()) return;
    const optimistic: Todo = { id: -1, title: input, completed: false };
    setTodos((prev) => [...prev, optimistic]); // optimistic update
    setInput("");

    try {
      const res  = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: optimistic.title }),
      });
      const data = await res.json();
      setTodos((prev) => prev.map((t) => t.id === -1 ? data : t));
    } catch {
      setTodos((prev) => prev.filter((t) => t.id !== -1)); // rollback
      setError("Failed to add todo");
    }
  };

  const deleteTodo = async (id: number) => {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id)); // optimistic delete

    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
    } catch {
      setTodos(previous); // rollback
    }
  };

  const toggleTodo = async (todo: Todo) => {
    setTodos((prev) =>
      prev.map((t) => t.id === todo.id ? { ...t, completed: !t.completed } : t)
    );
    await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
    });
  };

  if (loading) return <p>Loading todos...</p>;

  return (
    <div>
      <h1>Todo List</h1>
      {error && <p role="alert">{error}</p>}
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New todo"
          aria-label="New todo"
          onKeyDown={(e) => { if (e.key === "Enter") addTodo(); }}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} data-testid={`todo-${todo.id}`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo)}
              aria-label={`Toggle ${todo.title}`}
            />
            <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
              {todo.title}
            </span>
            <button onClick={() => deleteTodo(todo.id)} aria-label={`Delete ${todo.title}`}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <p>Total: {todos.length} | Done: {todos.filter((t) => t.completed).length}</p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 1. Load flow
// ════════════════════════════════════════════════════════════

describe("1 — Load flow", () => {
  it("shows loading state then renders todos from API", async () => {
    render(<TodoApp />);

    expect(screen.getByText("Loading todos...")).toBeInTheDocument();

    // Wait for todos to load
    expect(await screen.findByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Read a book")).toBeInTheDocument();
    expect(screen.getByText("Total: 2 | Done: 1")).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════
// 2. Add flow — including optimistic update
// ════════════════════════════════════════════════════════════

describe("2 — Add flow", () => {
  it("adds a new todo and shows it in the list", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await screen.findByText("Buy groceries");

    await user.type(screen.getByLabelText("New todo"), "Write integration tests");
    await user.click(screen.getByRole("button", { name: "Add" }));

    // Appears immediately (optimistic) or after server confirmation
    expect(await screen.findByText("Write integration tests")).toBeInTheDocument();
    expect(screen.getByText("Total: 3 | Done: 1")).toBeInTheDocument();
  });

  it("clears the input after adding", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await screen.findByText("Buy groceries");

    const input = screen.getByLabelText("New todo");
    await user.type(input, "Some task");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(input).toHaveValue("");
  });

  it("can add via Enter key", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await screen.findByText("Buy groceries");

    await user.type(screen.getByLabelText("New todo"), "Enter key task{Enter}");
    expect(await screen.findByText("Enter key task")).toBeInTheDocument();
  });

  it("rolls back optimistic add on server error", async () => {
    server.use(
      rest.post("/api/todos", (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    const user = userEvent.setup();
    render(<TodoApp />);
    await screen.findByText("Buy groceries");

    await user.type(screen.getByLabelText("New todo"), "This will fail");
    await user.click(screen.getByRole("button", { name: "Add" }));

    // Wait for rollback
    await waitFor(() => {
      expect(screen.queryByText("This will fail")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to add todo");
  });
});

// ════════════════════════════════════════════════════════════
// 3. Delete flow — including optimistic delete
// ════════════════════════════════════════════════════════════

describe("3 — Delete flow", () => {
  it("removes a todo from the list when deleted", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await screen.findByText("Buy groceries");

    await user.click(screen.getByRole("button", { name: "Delete Buy groceries" }));

    await waitFor(() => {
      expect(screen.queryByText("Buy groceries")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Total: 1 | Done: 1")).toBeInTheDocument();
  });

  it("uses within() to target a specific todo row", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await screen.findByText("Buy groceries");

    // Two delete buttons exist — scope to the right row
    const todoItem = screen.getByTestId("todo-1");
    await user.click(within(todoItem).getByRole("button", { name: /Delete/ }));

    await waitFor(() => {
      expect(screen.queryByText("Buy groceries")).not.toBeInTheDocument();
    });
  });
});

// ════════════════════════════════════════════════════════════
// 4. Toggle flow
// ════════════════════════════════════════════════════════════

describe("4 — Toggle flow", () => {
  it("marks an incomplete todo as complete", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await screen.findByText("Buy groceries");

    await user.click(screen.getByRole("checkbox", { name: "Toggle Buy groceries" }));

    await waitFor(() => {
      expect(screen.getByText("Total: 2 | Done: 2")).toBeInTheDocument();
    });
  });

  it("marks a completed todo as incomplete", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await screen.findByText("Read a book");

    await user.click(screen.getByRole("checkbox", { name: "Toggle Read a book" }));

    await waitFor(() => {
      expect(screen.getByText("Total: 2 | Done: 0")).toBeInTheDocument();
    });
  });
});
