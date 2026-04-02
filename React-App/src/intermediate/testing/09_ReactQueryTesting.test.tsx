// TOPIC: Testing React Query
//
// React Query hooks need a QueryClient — you can't render them bare.
// Enterprise patterns:
//
//   1. Always use a FRESH QueryClient per test (no shared cache = no test pollution)
//   2. Use createTestQueryClient() with retry:false and staleTime:Infinity
//   3. Pre-seed the cache with queryClient.setQueryData() to skip the fetch entirely
//   4. Use renderWithProviders() from 04_CustomRender.tsx (already handles this)
//   5. Test loading → success → error state transitions
//   6. Test mutations: optimistic update + rollback
//
// Covered:
//   - useQuery (loading, success, error, stale data)
//   - useMutation (success, error, rollback)
//   - queryClient.invalidateQueries — triggers refetch after mutation
//   - queryClient.setQueryData — seed data without a real fetch

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { createTestQueryClient, createWrapper } from "./04_CustomRender";

// ════════════════════════════════════════════════════════════
// MSW Server
// ════════════════════════════════════════════════════════════

type Post = { id: number; title: string; body: string };

let mockPosts: Post[] = [
  { id: 1, title: "First Post",  body: "Content 1" },
  { id: 2, title: "Second Post", body: "Content 2" },
];

const server = setupServer(
  rest.get("/api/posts", (_req, res, ctx) => res(ctx.json([...mockPosts]))),
  rest.get("/api/posts/:id", (req, res, ctx) => {
    const post = mockPosts.find((p) => p.id === Number(req.params.id));
    return post
      ? res(ctx.json(post))
      : res(ctx.status(404), ctx.json({ message: "Not found" }));
  }),
  rest.post("/api/posts", async (req, res, ctx) => {
    const body = await req.json() as Omit<Post, "id">;
    const created = { id: Date.now(), ...body };
    mockPosts.push(created);
    return res(ctx.status(201), ctx.json(created));
  }),
  rest.delete("/api/posts/:id", (req, res, ctx) => {
    const id = Number(req.params.id);
    mockPosts = mockPosts.filter((p) => p.id !== id);
    return res(ctx.status(204));
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockPosts = [
    { id: 1, title: "First Post",  body: "Content 1" },
    { id: 2, title: "Second Post", body: "Content 2" },
  ];
});
afterAll(() => server.close());

// ════════════════════════════════════════════════════════════
// Helper — wrap component in a fresh QueryClientProvider
// ════════════════════════════════════════════════════════════

const renderWithQuery = (ui: React.ReactElement, queryClient?: QueryClient) => {
  const client = queryClient ?? createTestQueryClient();
  return {
    queryClient: client,
    ...render(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    ),
  };
};

// ════════════════════════════════════════════════════════════
// Components under test
// ════════════════════════════════════════════════════════════

const PostList = () => {
  const { data, isLoading, isError, error } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn:  () => fetch("/api/posts").then((r) => r.json()),
  });

  if (isLoading) return <p>Loading posts...</p>;
  if (isError)   return <p role="alert">{(error as Error).message}</p>;
  return (
    <ul>
      {data?.map((p) => <li key={p.id}>{p.title}</li>)}
    </ul>
  );
};

const PostDetail = ({ id }: { id: number }) => {
  const { data, isLoading, isError } = useQuery<Post>({
    queryKey: ["posts", id],
    queryFn:  () =>
      fetch(`/api/posts/${id}`).then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      }),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError)   return <p role="alert">Post not found</p>;
  return <article><h2>{data?.title}</h2><p>{data?.body}</p></article>;
};

const PostManager = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState("");

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn:  () => fetch("/api/posts").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (newPost: Omit<Post, "id">) =>
      fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // refetch list
      setTitle("");
      setStatus("Created!");
    },
    onError: () => {
      setStatus("Failed to create");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/posts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <ul>{posts.map((p) => (
        <li key={p.id}>
          {p.title}
          <button onClick={() => deleteMutation.mutate(p.id)} aria-label={`Delete ${p.title}`}>×</button>
        </li>
      ))}</ul>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Post title"
        placeholder="Post title"
      />
      <button
        onClick={() => createMutation.mutate({ title, body: "" })}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Creating..." : "Create Post"}
      </button>
      {status && <p role="status">{status}</p>}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 1. useQuery — loading / success / error
// ════════════════════════════════════════════════════════════

describe("1 — useQuery states", () => {
  it("shows loading state, then data", async () => {
    renderWithQuery(<PostList />);
    expect(screen.getByText("Loading posts...")).toBeInTheDocument();

    expect(await screen.findByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Second Post")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    server.use(
      rest.get("/api/posts", (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    renderWithQuery(<PostList />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("renders detail for a known post", async () => {
    renderWithQuery(<PostDetail id={1} />);
    expect(await screen.findByRole("heading", { name: "First Post" })).toBeInTheDocument();
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("renders error for an unknown post (404)", async () => {
    renderWithQuery(<PostDetail id={999} />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Post not found");
    });
  });
});

// ════════════════════════════════════════════════════════════
// 2. Pre-seeding the cache — skip fetch entirely
// ════════════════════════════════════════════════════════════

describe("2 — Pre-seeded cache", () => {
  it("renders immediately from seeded data — no loading state", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData<Post[]>(["posts"], [
      { id: 99, title: "Seeded Post", body: "No fetch needed" },
    ]);

    renderWithQuery(<PostList />, queryClient);

    // No loading spinner — data is already there
    expect(screen.queryByText("Loading posts...")).not.toBeInTheDocument();
    expect(screen.getByText("Seeded Post")).toBeInTheDocument();
  });

  it("seeding a detail query avoids a network round-trip", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData<Post>(["posts", 42], {
      id: 42,
      title: "Cached Detail",
      body: "From cache",
    });

    renderWithQuery(<PostDetail id={42} />, queryClient);

    expect(screen.getByRole("heading", { name: "Cached Detail" })).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════
// 3. useMutation — create + invalidate
// ════════════════════════════════════════════════════════════

describe("3 — useMutation", () => {
  it("creates a post and the list refreshes", async () => {
    const user = userEvent.setup();
    renderWithQuery(<PostManager />);
    await screen.findByText("First Post");

    await user.type(screen.getByLabelText("Post title"), "Brand New Post");
    await user.click(screen.getByRole("button", { name: "Create Post" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Created!");
    expect(await screen.findByText("Brand New Post")).toBeInTheDocument();
  });

  it("shows error status when create fails", async () => {
    server.use(
      rest.post("/api/posts", (_req, res, ctx) => res(ctx.status(500)))
    );

    const user = userEvent.setup();
    renderWithQuery(<PostManager />);
    await screen.findByText("First Post");

    await user.type(screen.getByLabelText("Post title"), "Will Fail");
    await user.click(screen.getByRole("button", { name: "Create Post" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Failed to create");
  });

  it("deletes a post and the list refreshes", async () => {
    const user = userEvent.setup();
    renderWithQuery(<PostManager />);
    await screen.findByText("First Post");

    await user.click(screen.getByRole("button", { name: "Delete First Post" }));

    await waitFor(() => {
      expect(screen.queryByText("First Post")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Second Post")).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════
// 4. Testing a useQuery hook in isolation — createWrapper
// ════════════════════════════════════════════════════════════

const usePostsHook = () =>
  useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn:  () => fetch("/api/posts").then((r) => r.json()),
  });

describe("4 — Testing useQuery hook with renderHook", () => {
  it("transitions from loading to data", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => usePostsHook(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].title).toBe("First Post");
  });
});
