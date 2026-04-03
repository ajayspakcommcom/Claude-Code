// Optimistic Updates — fakeOptimisticApi.ts
//
// "Chaos mode" artificially fails every request so you can watch
// the UI optimistically update, then roll back in real-time.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Chaos mode ────────────────────────────────────────────────────────────────

let chaosMode = false;
export const setChaosMode = (v: boolean) => { chaosMode = v; };
export const isChaosMode  = ()           => chaosMode;

const maybeThrow = async (delay: number) => {
  await sleep(delay);
  if (chaosMode) throw new Error("Server rejected the request (chaos mode on)");
};

// ── Post type ─────────────────────────────────────────────────────────────────

export interface Post {
  id:      number;
  author:  string;
  avatar:  string;
  title:   string;
  excerpt: string;
  likes:   number;
  liked:   boolean;
  tags:    string[];
  time:    string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const INITIAL_POSTS: Post[] = [
  { id: 1, author: "Alice",  avatar: "AM", title: "Why staleTime: Infinity is underrated",           excerpt: "Most apps never need background refetches. Set it once, cache forever.",              likes: 42,  liked: false, tags: ["react-query", "caching"], time: "2h ago" },
  { id: 2, author: "Bob",    avatar: "BC", title: "The 3-level token hierarchy",                     excerpt: "Global → Semantic → Theme. Change one token, rebrand the whole product.",           likes: 31,  liked: true,  tags: ["design-system", "tokens"], time: "4h ago" },
  { id: 3, author: "Carlos", avatar: "CR", title: "Stop putting API data in Redux",                  excerpt: "Redux is for client state. React Query is for server state. Use both correctly.",   likes: 87,  liked: false, tags: ["state", "redux"], time: "6h ago" },
  { id: 4, author: "Diana",  avatar: "DP", title: "forwardRef: the one pattern every dev skips",     excerpt: "Without forwardRef, your component library is incomplete.",                         likes: 24,  liked: false, tags: ["components", "refs"], time: "8h ago" },
  { id: 5, author: "Eve",    avatar: "ET", title: "Separation of Concerns in React",                 excerpt: "Types → Service → Hooks → Components. One reason to change per layer.",            likes: 56,  liked: false, tags: ["architecture", "soc"], time: "1d ago" },
];

const AVATAR_COLORS: Record<string, string> = {
  AM: "#3b82f6", BC: "#8b5cf6", CR: "#f59e0b", DP: "#10b981", ET: "#ec4899",
};
export const avatarBg = (av: string) => AVATAR_COLORS[av] ?? "#6b7280";

// ── API functions ─────────────────────────────────────────────────────────────

export const fetchPosts = async (): Promise<Post[]> => {
  await sleep(700);
  return [...INITIAL_POSTS];
};

export const toggleLike = async (id: number): Promise<void> => {
  await maybeThrow(750);
};

export const editPostTitle = async (id: number, title: string): Promise<void> => {
  await maybeThrow(700);
};

export const deletePost = async (id: number): Promise<void> => {
  await maybeThrow(600);
};
