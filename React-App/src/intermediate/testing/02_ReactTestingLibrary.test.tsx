// TOPIC: React Testing Library (RTL)
//
// RTL tests components from the USER's perspective — not implementation details.
// Philosophy: "The more your tests resemble the way your software is used, the more confidence they give you."
//
// Key concepts:
//   render()          — renders component into jsdom
//   screen            — query the rendered output
//   Queries           — getBy*, findBy*, queryBy* (see table below)
//   userEvent         — simulate real user interactions (type, click, etc.)
//   waitFor()         — wait for async UI updates
//   within()          — scope queries to a specific element
//
// Query priority (use in this order — matches how users find elements):
//   1. getByRole          — a11y role (button, textbox, heading…)
//   2. getByLabelText     — form label
//   3. getByPlaceholderText
//   4. getByText          — visible text
//   5. getByDisplayValue  — current form value
//   6. getByAltText       — img alt
//   7. getByTitle         — title attribute
//   8. getByTestId        — last resort: data-testid attribute
//
// getBy*   — throws if not found (good for elements that must exist)
// queryBy* — returns null if not found (good for asserting absence)
// findBy*  — returns Promise, waits for element to appear (async)

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ════════════════════════════════════════════════════════════
// Components under test (defined inline for clarity)
// ════════════════════════════════════════════════════════════

// Simple greeting
const Greeting = ({ name }: { name: string }) => (
  <div>
    <h1>Hello, {name}!</h1>
    <p>Welcome back.</p>
  </div>
);

// Counter with button interactions
const Counter = () => {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <button onClick={() => setCount((c) => c - 1)}>Decrement</button>
      <button onClick={() => setCount(0)} disabled={count === 0}>Reset</button>
    </div>
  );
};

// Controlled input
const SearchBox = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const [value, setValue] = React.useState("");
  return (
    <div>
      <label htmlFor="search">Search</label>
      <input
        id="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type to search…"
      />
      <button onClick={() => onSearch(value)}>Go</button>
      {value.length > 0 && <p>Searching for: {value}</p>}
    </div>
  );
};

// Async component — fetches data
const UserCard = ({ userId }: { userId: number }) => {
  const [user, setUser]     = React.useState<{ name: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]   = React.useState("");

  React.useEffect(() => {
    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
      .then((r) => r.json())
      .then((data) => { setUser(data); setLoading(false); })
      .catch(() => { setError("Failed to load"); setLoading(false); });
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p role="alert">{error}</p>;
  return <div><h2>{user?.name}</h2></div>;
};

// List rendering
const TodoList = ({ todos }: { todos: { id: number; text: string; done: boolean }[] }) => (
  <ul>
    {todos.map((todo) => (
      <li key={todo.id} style={{ textDecoration: todo.done ? "line-through" : "none" }}>
        {todo.text}
      </li>
    ))}
  </ul>
);

// Form
const LoginForm = ({ onSubmit }: { onSubmit: (u: string, p: string) => void }) => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError]       = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("All fields required"); return; }
    onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
};

// ════════════════════════════════════════════════════════════
// 1. render() + screen queries
// ════════════════════════════════════════════════════════════

describe("render + screen queries", () => {
  it("renders text content", () => {
    render(<Greeting name="Alice" />);

    // getByRole — preferred: queries by ARIA role
    expect(screen.getByRole("heading", { name: /hello, alice/i })).toBeInTheDocument();

    // getByText — finds by visible text
    expect(screen.getByText("Welcome back.")).toBeInTheDocument();
  });

  it("queryByText returns null when element absent (use for absence assertions)", () => {
    render(<Greeting name="Bob" />);
    // queryBy* returns null — doesn't throw — use for "should NOT be there"
    expect(screen.queryByText("Hello, Alice!")).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════
// 2. userEvent — simulating real user interactions
// ════════════════════════════════════════════════════════════

describe("userEvent interactions", () => {
  it("increments and decrements counter on click", async () => {
    const user = userEvent.setup();
    render(<Counter />);

    expect(screen.getByText("Count: 0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByText("Count: 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByText("Count: 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Decrement" }));
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
  });

  it("Reset button is disabled at 0 and enabled after increment", async () => {
    const user = userEvent.setup();
    render(<Counter />);

    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("Count: 0")).toBeInTheDocument();
  });

  it("types into input and shows live feedback", async () => {
    const user = userEvent.setup();
    const mockSearch = jest.fn();
    render(<SearchBox onSearch={mockSearch} />);

    const input = screen.getByLabelText("Search");
    await user.type(input, "react");

    // Live feedback appears as user types
    expect(screen.getByText("Searching for: react")).toBeInTheDocument();
  });

  it("calls onSearch callback with input value when Go is clicked", async () => {
    const user = userEvent.setup();
    const mockSearch = jest.fn();
    render(<SearchBox onSearch={mockSearch} />);

    await user.type(screen.getByLabelText("Search"), "tanstack");
    await user.click(screen.getByRole("button", { name: "Go" }));

    expect(mockSearch).toHaveBeenCalledWith("tanstack");
    expect(mockSearch).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════
// 3. Testing forms
// ════════════════════════════════════════════════════════════

describe("Form testing", () => {
  it("shows validation error when submitted empty", async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByRole("alert")).toHaveTextContent("All fields required");
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with username and password when valid", async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(mockSubmit).toHaveBeenCalledWith("alice", "secret123");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════
// 4. Testing lists
// ════════════════════════════════════════════════════════════

describe("List rendering", () => {
  const todos = [
    { id: 1, text: "Learn React", done: true  },
    { id: 2, text: "Write tests", done: false },
    { id: 3, text: "Ship it",     done: false },
  ];

  it("renders all todo items", () => {
    render(<TodoList todos={todos} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("renders correct text for each item", () => {
    render(<TodoList todos={todos} />);
    expect(screen.getByText("Learn React")).toBeInTheDocument();
    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByText("Ship it")).toBeInTheDocument();
  });

  it("shows empty list when todos is empty", () => {
    render(<TodoList todos={[]} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════
// 5. Testing async components (waitFor + findBy)
// ════════════════════════════════════════════════════════════

describe("Async component testing", () => {
  beforeEach(() => {
    // Mock global fetch — don't make real HTTP calls in tests
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows loading state initially", () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ name: "Alice Johnson" }),
    });

    render(<UserCard userId={1} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows user name after fetch resolves", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ name: "Alice Johnson" }),
    });

    render(<UserCard userId={1} />);

    // findBy* = async version of getBy* — waits up to 1000ms
    const heading = await screen.findByRole("heading", { name: "Alice Johnson" });
    expect(heading).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<UserCard userId={1} />);

    // waitFor — keeps retrying the assertion until it passes or times out
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Failed to load");
    });
  });
});

// ════════════════════════════════════════════════════════════
// 6. within() — scoped queries
// ════════════════════════════════════════════════════════════

describe("within() — scoped queries", () => {
  it("queries within a specific element to avoid ambiguity", () => {
    render(
      <div>
        <section data-testid="card-1">
          <h3>Card One</h3>
          <button>Delete</button>
        </section>
        <section data-testid="card-2">
          <h3>Card Two</h3>
          <button>Delete</button>
        </section>
      </div>
    );

    // Two "Delete" buttons exist — getByRole("button", { name: "Delete" }) would throw
    // within() scopes the query to just one card
    const card1 = screen.getByTestId("card-1");
    const card2 = screen.getByTestId("card-2");

    expect(within(card1).getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(within(card2).getByRole("heading", { name: "Card Two" })).toBeInTheDocument();
  });
});
