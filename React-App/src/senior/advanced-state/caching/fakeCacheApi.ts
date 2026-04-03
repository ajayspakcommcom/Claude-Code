// Caching Strategies — fakeCacheApi.ts
//
// Each function tracks how many times it has been called.
// This makes it crystal clear in the demo when a real network
// request happens vs when React Query serves from cache.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Per-key fetch counter ─────────────────────────────────────────────────────
const counters: Record<string, number> = {};
const inc = (key: string) => (counters[key] = (counters[key] ?? 0) + 1);
export const getCounter = (key: string) => counters[key] ?? 0;
export const resetCounters = () => Object.keys(counters).forEach((k) => delete counters[k]);

// ── Post data ─────────────────────────────────────────────────────────────────

export interface Post {
  id:       number;
  title:    string;
  excerpt:  string;
  category: "tech" | "design" | "product";
  author:   string;
  date:     string;
  readTime: number; // minutes
}

const ALL_POSTS: Post[] = [
  { id: 1,  title: "Building a Design System from Scratch",   excerpt: "Tokens, primitives, and the 3-level hierarchy.",     category: "design",  author: "Alice",  date: "2026-03-01", readTime: 8  },
  { id: 2,  title: "React Query vs Redux: When to Use Each",  excerpt: "Server state doesn't belong in Redux.",              category: "tech",    author: "Bob",    date: "2026-03-05", readTime: 6  },
  { id: 3,  title: "Feature-Based Folder Structure",          excerpt: "Stop organising by type, start organising by feature.", category: "tech", author: "Alice",  date: "2026-03-08", readTime: 5  },
  { id: 4,  title: "Accessible Component Libraries",         excerpt: "ARIA, focus management, and keyboard nav.",           category: "design",  author: "Diana",  date: "2026-03-10", readTime: 7  },
  { id: 5,  title: "Optimistic Updates Done Right",           excerpt: "Update the UI instantly, roll back on failure.",      category: "tech",    author: "Carlos", date: "2026-03-12", readTime: 9  },
  { id: 6,  title: "Product Roadmap for Q2",                  excerpt: "What we're shipping and why.",                       category: "product", author: "Eve",    date: "2026-03-15", readTime: 4  },
  { id: 7,  title: "CSS-in-JS vs Tailwind in 2026",          excerpt: "Trade-offs for large teams.",                        category: "design",  author: "Bob",    date: "2026-03-18", readTime: 6  },
  { id: 8,  title: "Web Vitals: What Actually Matters",       excerpt: "LCP, CLS, INP — and how to fix them.",               category: "tech",    author: "Frank",  date: "2026-03-20", readTime: 10 },
];

// ── API functions ─────────────────────────────────────────────────────────────

// Generic "fetch" — returns a timestamped result so you can see when it ran
export const fetchTimestamped = async (key: string, delay = 800) => {
  inc(key);
  await sleep(delay);
  return {
    key,
    fetchCount:  counters[key],
    fetchedAt:   new Date().toLocaleTimeString(),
    fetchedAtMs: Date.now(),
  };
};

export const fetchPosts = async (category?: Post["category"]): Promise<Post[]> => {
  const key = category ? `posts-${category}` : "posts-all";
  inc(key);
  await sleep(800);
  return category ? ALL_POSTS.filter((p) => p.category === category) : ALL_POSTS;
};

export const fetchPostById = async (id: number): Promise<Post> => {
  inc(`post-${id}`);
  await sleep(500);
  const post = ALL_POSTS.find((p) => p.id === id);
  if (!post) throw new Error(`Post ${id} not found`);
  return post;
};

// Simulated mutation — "creates" a post (just returns a fake new one)
export const createPost = async (title: string): Promise<Post> => {
  await sleep(600);
  return {
    id:       ALL_POSTS.length + Math.floor(Math.random() * 100),
    title,
    excerpt:  "Just published.",
    category: "tech",
    author:   "You",
    date:     new Date().toISOString().slice(0, 10),
    readTime: 3,
  };
};
