// TOPIC: Mocking & Testing Patterns
//
// Covers the most important real-world testing patterns:
//   1. Mocking API calls (fetch / axios)
//   2. Mocking modules (jest.mock)
//   3. Testing custom hooks (renderHook)
//   4. Testing with Context (wrap with Provider)
//   5. Testing with Redux store
//   6. Snapshot testing

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";

// ════════════════════════════════════════════════════════════
// 1. Mocking fetch API
// ════════════════════════════════════════════════════════════

const PostList = () => {
  const [posts, setPosts]   = React.useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts?_limit=3")
      .then((r) => r.json())
      .then((data) => { setPosts(data); setLoading(false); });
  }, []);

  if (loading) return <p>Loading posts...</p>;
  return (
    <ul>
      {posts.map((p) => <li key={p.id}>{p.title}</li>)}
    </ul>
  );
};

describe("1 — Mocking fetch", () => {
  const MOCK_POSTS = [
    { id: 1, title: "First Post"  },
    { id: 2, title: "Second Post" },
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(MOCK_POSTS),
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it("renders posts after fetch", async () => {
    render(<PostList />);
    expect(screen.getByText("Loading posts...")).toBeInTheDocument();

    // findBy* waits for the element to appear
    expect(await screen.findByText("First Post")).toBeInTheDocument();
    expect(await screen.findByText("Second Post")).toBeInTheDocument();
  });

  it("calls fetch with the correct URL", async () => {
    render(<PostList />);
    await screen.findByText("First Post");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts?_limit=3"
    );
  });
});

// ════════════════════════════════════════════════════════════
// 2. Mocking modules — jest.mock()
// ════════════════════════════════════════════════════════════

// Utility module to mock
const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

describe("2 — Mocking with jest.fn()", () => {
  it("mocks a function to control its output in tests", () => {
    // Replace the real implementation with a mock
    const mockFormat = jest.fn().mockReturnValue("January 1, 2025");

    const result = mockFormat(new Date("2025-01-01"));

    expect(result).toBe("January 1, 2025");
    expect(mockFormat).toHaveBeenCalledTimes(1);
  });

  it("spies on an object method without replacing it", () => {
    const obj = { greet: (name: string) => `Hello, ${name}!` };
    const spy = jest.spyOn(obj, "greet");

    const result = obj.greet("Alice");

    expect(result).toBe("Hello, Alice!"); // real implementation still runs
    expect(spy).toHaveBeenCalledWith("Alice");

    spy.mockRestore(); // restore original after test
  });
});

// ════════════════════════════════════════════════════════════
// 3. Testing custom hooks — renderHook
// ════════════════════════════════════════════════════════════

// A simple counter hook
const useCounter = (initial = 0) => {
  const [count, setCount] = React.useState(initial);
  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);
  const reset     = () => setCount(initial);
  return { count, increment, decrement, reset };
};

// A hook with async behaviour
const useAsync = <T,>(asyncFn: () => Promise<T>) => {
  const [data, setData]     = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]   = React.useState<string>("");

  const execute = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await asyncFn();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { data, loading, error, execute };
};

describe("3 — Testing custom hooks (renderHook)", () => {
  it("initialises with default value", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("increments and decrements", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => result.current.increment());
    expect(result.current.count).toBe(6);

    act(() => result.current.decrement());
    expect(result.current.count).toBe(5);
  });

  it("resets to initial value", () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => result.current.increment());
    act(() => result.current.increment());
    expect(result.current.count).toBe(12);

    act(() => result.current.reset());
    expect(result.current.count).toBe(10);
  });

  it("async hook — sets data on success", async () => {
    const mockFn = jest.fn().mockResolvedValue({ id: 1, name: "Alice" });
    const { result } = renderHook(() => useAsync(mockFn));

    expect(result.current.loading).toBe(false);

    await act(async () => { await result.current.execute(); });

    expect(result.current.data).toEqual({ id: 1, name: "Alice" });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("async hook — sets error on failure", async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAsync(mockFn));

    await act(async () => { await result.current.execute(); });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Network error");
  });
});

// ════════════════════════════════════════════════════════════
// 4. Testing components with Context
// ════════════════════════════════════════════════════════════

const ThemeContext = React.createContext<{ theme: string }>({ theme: "light" });

const ThemedButton = () => {
  const { theme } = React.useContext(ThemeContext);
  return (
    <button style={{ background: theme === "dark" ? "#333" : "#fff" }}>
      Theme: {theme}
    </button>
  );
};

// Helper — wraps component in Provider with custom value
const renderWithTheme = (theme: string) =>
  render(
    <ThemeContext.Provider value={{ theme }}>
      <ThemedButton />
    </ThemeContext.Provider>
  );

describe("4 — Testing with Context", () => {
  it("renders with light theme by default", () => {
    render(<ThemeContext.Provider value={{ theme: "light" }}><ThemedButton /></ThemeContext.Provider>);
    expect(screen.getByRole("button")).toHaveTextContent("Theme: light");
  });

  it("renders with dark theme when provided", () => {
    renderWithTheme("dark");
    expect(screen.getByRole("button")).toHaveTextContent("Theme: dark");
  });
});

// ════════════════════════════════════════════════════════════
// 5. Snapshot testing
// ════════════════════════════════════════════════════════════

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span style={{ background: color, padding: "2px 8px", borderRadius: "12px" }}>
    {label}
  </span>
);

describe("5 — Snapshot testing", () => {
  it("matches snapshot — fails if UI changes unexpectedly", () => {
    const { asFragment } = render(<Badge label="Admin" color="#4a90e2" />);
    // First run: creates __snapshots__/03_MockingAndPatterns.test.tsx.snap
    // Later runs: compares against saved snapshot — fails if output changed
    expect(asFragment()).toMatchSnapshot();
  });

  it("inline snapshot — snapshot saved in this file", () => {
    const { asFragment } = render(<Badge label="Guest" color="#888" />);
    // toMatchInlineSnapshot stores the expected HTML right here in the test
    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <span
          style="background: rgb(136, 136, 136); padding: 2px 8px; border-radius: 12px;"
        >
          Guest
        </span>
      </DocumentFragment>
    `);
  });
});

// ════════════════════════════════════════════════════════════
// 6. Testing keyboard interactions
// ════════════════════════════════════════════════════════════

const TagInput = ({ onAdd }: { onAdd: (tag: string) => void }) => {
  const [value, setValue] = React.useState("");
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && value.trim()) {
          onAdd(value.trim());
          setValue("");
        }
      }}
      placeholder="Add tag (press Enter)"
    />
  );
};

describe("6 — Keyboard interactions", () => {
  it("calls onAdd when Enter is pressed with a value", async () => {
    const user = userEvent.setup();
    const mockAdd = jest.fn();
    render(<TagInput onAdd={mockAdd} />);

    const input = screen.getByPlaceholderText("Add tag (press Enter)");
    await user.type(input, "react");
    await user.keyboard("{Enter}");

    expect(mockAdd).toHaveBeenCalledWith("react");
  });

  it("does not call onAdd on Enter when input is empty", async () => {
    const user = userEvent.setup();
    const mockAdd = jest.fn();
    render(<TagInput onAdd={mockAdd} />);

    await user.keyboard("{Enter}");
    expect(mockAdd).not.toHaveBeenCalled();
  });
});
