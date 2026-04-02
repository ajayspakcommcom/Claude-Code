// TOPIC: Mock Service Worker (MSW)
//
// Why MSW over jest.fn() fetch mocking?
//
//   jest.fn() approach  →  mocks the fetch function itself
//                          → breaks if you switch from fetch to axios
//                          → you have to remember to mock every test
//                          → no realistic request/response lifecycle
//
//   MSW approach        →  intercepts at the NETWORK level (service worker / node interceptor)
//                          → works with fetch, axios, or any HTTP client
//                          → one server definition shared across tests
//                          → closest thing to a real API without running a server
//
// MSW v1 API (CJS-compatible — what we use with Jest + ts-jest):
//   rest.get(url, handler)    — intercept GET requests
//   rest.post(url, handler)   — intercept POST requests
//   setupServer(...handlers)  — create an interceptor server
//   server.listen()           — start before tests
//   server.resetHandlers()    — reset overrides after each test
//   server.close()            — shut down after all tests
//   server.use(handler)       — temporarily override a handler in one test

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";

// ════════════════════════════════════════════════════════════
// Mock API data
// ════════════════════════════════════════════════════════════

const MOCK_USERS = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com" },
  { id: 2, name: "Bob Smith",     email: "bob@example.com"   },
];

const MOCK_POST = { id: 101, title: "Hello World", body: "Content here" };

// ════════════════════════════════════════════════════════════
// MSW Server — define handlers once, reuse across all tests
// ════════════════════════════════════════════════════════════

const server = setupServer(
  // GET /api/users — returns list
  rest.get("/api/users", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(MOCK_USERS))
  ),

  // GET /api/users/:id — returns single user or 404
  rest.get("/api/users/:id", (req, res, ctx) => {
    const id = Number(req.params.id);
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) return res(ctx.status(404), ctx.json({ message: "Not found" }));
    return res(ctx.status(200), ctx.json(user));
  }),

  // POST /api/posts — echoes back with created ID
  rest.post("/api/posts", async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.status(201), ctx.json({ id: 101, ...body }));
  }),
);

// ════════════════════════════════════════════════════════════
// Lifecycle — run before/after all tests in this file
// ════════════════════════════════════════════════════════════

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers()); // undo per-test overrides
afterAll(() => server.close());

// ════════════════════════════════════════════════════════════
// Components under test
// ════════════════════════════════════════════════════════════

const UserList = () => {
  const [users, setUsers]   = React.useState<typeof MOCK_USERS>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]   = React.useState("");

  React.useEffect(() => {
    fetch("/api/users")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data) => { setUsers(data); setLoading(false); })
      .catch((e)   => { setError(e.message); setLoading(false); });
  }, []);

  if (loading)       return <p>Loading...</p>;
  if (error)         return <p role="alert">{error}</p>;
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>
          <strong>{u.name}</strong> — {u.email}
        </li>
      ))}
    </ul>
  );
};

const UserDetail = ({ userId }: { userId: number }) => {
  const [user, setUser]     = React.useState<(typeof MOCK_USERS)[0] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]   = React.useState("");

  React.useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => { if (!r.ok) throw new Error("User not found"); return r.json(); })
      .then((data) => { setUser(data); setLoading(false); })
      .catch((e)   => { setError(e.message); setLoading(false); });
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p role="alert">{error}</p>;
  return (
    <div>
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
    </div>
  );
};

const CreatePostForm = () => {
  const [title, setTitle]   = React.useState("");
  const [status, setStatus] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      setStatus(`Created post #${data.id}: ${data.title}`);
    } catch {
      setStatus("Failed to create post");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <button type="submit">Create</button>
      {status && <p role="status">{status}</p>}
    </form>
  );
};

// ════════════════════════════════════════════════════════════
// 1. Happy path — server returns data
// ════════════════════════════════════════════════════════════

describe("1 — MSW happy path", () => {
  it("renders user list from intercepted GET /api/users", async () => {
    render(<UserList />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // MSW intercepts the real fetch call — no global.fetch = jest.fn() needed
    expect(await screen.findByText(/Alice Johnson/)).toBeInTheDocument();
    expect(await screen.findByText(/Bob Smith/)).toBeInTheDocument();
  });

  it("renders a single user from GET /api/users/1", async () => {
    render(<UserDetail userId={1} />);
    expect(await screen.findByRole("heading", { name: "Alice Johnson" })).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("submits a POST and shows confirmation", async () => {
    const user = userEvent.setup();
    render(<CreatePostForm />);

    await user.type(screen.getByLabelText("Title"), "My New Post");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Created post #101: My New Post");
  });
});

// ════════════════════════════════════════════════════════════
// 2. Error states — override handler per test
// ════════════════════════════════════════════════════════════

describe("2 — MSW error states", () => {
  it("shows error when GET /api/users returns 500", async () => {
    // Override just for this test — resetHandlers() cleans it up after
    server.use(
      rest.get("/api/users", (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ message: "Internal Server Error" }))
      )
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows error when user is not found (404)", async () => {
    render(<UserDetail userId={999} />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("User not found");
    });
  });

  it("shows error when network is down", async () => {
    server.use(
      rest.get("/api/users", (_req, res) =>
        res.networkError("Network failure")
      )
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});

// ════════════════════════════════════════════════════════════
// 3. Request inspection — verify what was sent
// ════════════════════════════════════════════════════════════

describe("3 — MSW request inspection", () => {
  it("verifies the POST body contains the correct data", async () => {
    let capturedBody: any = null;

    server.use(
      rest.post("/api/posts", async (req, res, ctx) => {
        capturedBody = await req.json();
        return res(ctx.status(201), ctx.json({ id: 1, ...capturedBody }));
      })
    );

    const user = userEvent.setup();
    render(<CreatePostForm />);

    await user.type(screen.getByLabelText("Title"), "Enterprise Testing");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByRole("status");

    // Assert the exact payload that was sent
    expect(capturedBody).toEqual({ title: "Enterprise Testing" });
  });
});
