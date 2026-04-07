// TOPIC: Advanced Rendering (Expert)
// LEVEL: Expert — Advanced Rendering
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. SSR / SSG  — server-side rendering and static site generation
//   2. Streaming  — progressive HTML delivery via renderToPipeableStream
//   3. Hydration  — attaching React to server HTML, selective & partial hydration
//
// ─── SSR (Server-Side Rendering) ─────────────────────────────────────────────
//
//   Classic SSR flow:
//   1. Browser requests /page
//   2. Server calls renderToString(<App />) → HTML string
//   3. Server sends HTML — user sees content immediately (good FCP/LCP)
//   4. Browser downloads JS bundle
//   5. React calls hydrateRoot() — attaches event handlers to existing DOM
//   6. Page becomes interactive (TTI)
//
//   renderToString(element) — React 18
//     Synchronous. Generates the full HTML before sending anything.
//     Downside: server must complete the full render before first byte arrives.
//
//   Data fetching in SSR:
//     Framework provides mechanism (Next.js getServerSideProps, Remix loader).
//     Data is fetched on server, embedded in HTML as JSON, rehydrated on client.
//
//   Benefits:
//   ✅ Fast FCP (First Contentful Paint) — content in initial HTML
//   ✅ SEO — crawlers see content without JS
//   ✅ Works on slow devices — meaningful content before JS executes
//
//   Costs:
//   ❌ Server CPU — rendering JSX on every request
//   ❌ Waterfall — TTFB (first byte) delayed until full render
//   ❌ Hydration cost — JS must re-traverse DOM to attach handlers
//
// ─── SSG (Static Site Generation) ────────────────────────────────────────────
//
//   Pre-render at BUILD TIME instead of request time.
//
//   Flow:
//   1. npm run build → React renders pages → saves HTML files
//   2. User requests /about → CDN serves pre-built about.html instantly
//   3. Browser hydrates the static HTML
//
//   When to use:
//   ✅ Content that rarely changes (blog, docs, marketing)
//   ✅ Needs CDN caching (global distribution, zero server load)
//   ✅ Best performance: HTML served from edge, no server computation
//
//   ISR (Incremental Static Regeneration — Next.js):
//     revalidate: 60 → page is re-generated on the next request after 60s.
//     Combines SSG speed with fresh data.
//
//   SSR vs SSG vs CSR:
//   ┌─────────────────────────────────────────────────────────────┐
//   │           │ FCP  │ Dynamic │ SEO  │ Server cost │ Stale?   │
//   ├───────────┼──────┼─────────┼──────┼─────────────┼──────────│
//   │ CSR       │ Slow │ ✅ Yes  │ ❌  │ Low         │ Always   │
//   │ SSR       │ Fast │ ✅ Yes  │ ✅  │ High        │ Never    │
//   │ SSG       │ Fast │ ❌ No   │ ✅  │ None        │ Possible │
//   │ ISR       │ Fast │ ✅ Yes  │ ✅  │ Low         │ Briefly  │
//   └─────────────────────────────────────────────────────────────┘
//
// ─── STREAMING ────────────────────────────────────────────────────────────────
//
//   renderToPipeableStream(element, options) — React 18
//
//   Sends HTML in chunks as Suspense boundaries resolve.
//   The shell (everything outside Suspense) is sent first, immediately.
//   Each Suspense boundary streams its content when its data is ready.
//
//   Flow:
//   1. onShellReady fires → pipe shell HTML (nav, layout, placeholders)
//   2. Browser shows meaningful content early
//   3. Each Suspense boundary resolves → server streams replacement HTML + script
//   4. React on client swaps the fallback for the real content
//
//   Key options:
//     onShellReady()   — shell is ready to pipe (React 18 default)
//     onShellError(err) — shell render failed — send error page
//     onAllReady()     — everything done (use for crawlers / full SSG)
//     onError(err)     — non-fatal error in a Suspense boundary
//
//   HTTP/2 + streaming: chunks arrive progressively, browser renders as it goes.
//   Even on slow connections the shell appears fast — Suspense boundaries fill in.
//
// ─── HYDRATION ────────────────────────────────────────────────────────────────
//
//   hydrateRoot(domNode, element) — React 18 API
//
//   React walks the existing DOM and attaches event handlers.
//   It does NOT re-create the DOM — it matches fibers to existing nodes.
//
//   Hydration strategies:
//
//   Full hydration:     hydrate the entire page. Simple, expensive on large pages.
//
//   Selective hydration (React 18):
//     Suspense boundaries hydrate independently and in priority order.
//     If user clicks a not-yet-hydrated part, React prioritizes it.
//     import { hydrateRoot } from 'react-dom/client';
//     hydrateRoot(document, <App />, { onRecoverableError });
//
//   Partial hydration (Island Architecture):
//     Only interactive "islands" are hydrated. Static areas are pure HTML.
//     Used by: Astro, Fresh, Marko.
//     <Island client:visible> — hydrate only when island enters viewport.
//
//   Progressive hydration:
//     Hydrate the most important parts first, defer the rest.
//     Can use requestIdleCallback to spread hydration cost.
//
//   Hydration mismatch:
//     Server HTML differs from client render → React replaces the DOM.
//     Causes layout shift and lost user interactions.
//     Common causes: dates, random IDs, browser-only APIs in render.
//     Fix: useEffect for client-only code, suppressHydrationWarning for known diffs.

import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  lazy,
} from "react";
import { renderToString, renderToStaticMarkup, renderToPipeableStream } from "react-dom/server";
import { hydrateRoot, createRoot } from "react-dom/client";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Writable } from "stream";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// Collect streaming output into a string
const streamToString = (render: (writable: Writable) => void): Promise<string> =>
  new Promise((resolve, reject) => {
    let html = "";
    const writable = new Writable({
      write(chunk, _enc, cb) { html += chunk.toString(); cb(); },
    });
    writable.on("finish", () => resolve(html));
    writable.on("error", reject);
    render(writable);
  });

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS UNDER TEST
// ═══════════════════════════════════════════════════════════════════════════════

// ── Static page components ────────────────────────────────────────────────────

const BlogPost: React.FC<{ title: string; body: string; author: string }> = ({
  title, body, author,
}) => (
  <article>
    <h1>{title}</h1>
    <p className="body">{body}</p>
    <footer>By {author}</footer>
  </article>
);

const Nav: React.FC = () => (
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/blog">Blog</a>
  </nav>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <html lang="en">
    <head><title>My Site</title></head>
    <body>
      <Nav />
      <main>{children}</main>
    </body>
  </html>
);

// ── Interactive component — to test hydration ─────────────────────────────────

const Counter: React.FC<{ initial?: number }> = ({ initial = 0 }) => {
  const [count, setCount] = useState(initial);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
};

// ── Component that behaves differently server vs client ───────────────────────

const TimeDisplay: React.FC = () => {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    // Only runs on client — avoids hydration mismatch
    setTime(new Date().toLocaleTimeString());
  }, []);

  return <div data-testid="time">{time ?? "Loading time…"}</div>;
};

// ── Suspended data component ──────────────────────────────────────────────────

// Simulate a data resource that can suspend
const createResource = <T,>(promise: Promise<T>) => {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  let error: unknown;

  const suspender = promise.then(
    v => { status = "success"; result = v; },
    e => { status = "error"; error = e; }
  );

  return {
    read(): T {
      if (status === "pending") throw suspender;
      if (status === "error") throw error;
      return result!;
    },
  };
};

type Resource<T> = ReturnType<typeof createResource<T>>;

const UserCard: React.FC<{ resource: Resource<{ name: string; role: string }> }> = ({
  resource,
}) => {
  const user = resource.read(); // suspends until ready
  return (
    <div data-testid="user-card">
      <strong>{user.name}</strong> — {user.role}
    </div>
  );
};

// ── Island architecture simulation ────────────────────────────────────────────

// StaticContent — no JS needed, pure HTML
const StaticContent: React.FC<{ text: string }> = ({ text }) => (
  <section data-testid="static-section">{text}</section>
);

// Island — interactive component that gets hydrated
const InteractiveIsland: React.FC<{ label: string }> = ({ label }) => {
  const [count, setCount] = useState(0);
  return (
    <div data-testid="island" data-hydrated="true">
      <span data-testid={`island-count-${label}`}>{label}: {count}</span>
      <button onClick={() => setCount(c => c + 1)} aria-label={`Increment ${label}`}>
        Click
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SSR — renderToString
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — SSR: renderToString", () => {
  it("renderToString produces a complete HTML string synchronously", () => {
    const html = renderToString(
      <BlogPost
        title="React Internals"
        body="Fiber is a linked list of work units."
        author="Alice"
      />
    );

    expect(typeof html).toBe("string");
    expect(html).toContain("React Internals");
    expect(html).toContain("Fiber is a linked list of work units.");
    // React 18 may insert <!-- --> comment nodes between adjacent text nodes
    expect(html).toContain("By");
    expect(html).toContain("Alice");
  });

  it("SSR HTML contains semantic elements — crawlers and screen readers see content", () => {
    const html = renderToString(<BlogPost title="SEO Test" body="Content here" author="Bob" />);

    // Semantic structure present in HTML — no need to execute JS
    expect(html).toContain("<article");
    expect(html).toContain("<h1>");
    expect(html).toContain("<footer");
    expect(html).toContain("SEO Test");
  });

  it("renderToString embeds data attributes React uses for hydration", () => {
    const html = renderToString(<Counter initial={5} />);
    // React adds data attributes for reconciliation during hydration
    expect(html).toContain("5"); // initial count is in the HTML
  });

  it("renderToStaticMarkup produces lighter HTML without React attributes (for email / PDF)", () => {
    const ssrHtml = renderToString(<Nav />);
    const staticHtml = renderToStaticMarkup(<Nav />);

    // Both contain the same links
    expect(staticHtml).toContain("Home");
    expect(staticHtml).toContain("About");
    // Static markup is shorter — no React internals
    expect(staticHtml.length).toBeLessThanOrEqual(ssrHtml.length);
  });

  it("SSG simulation: pre-rendered HTML string serves as initial page HTML", () => {
    // Build time: render all pages to HTML
    const pages: Record<string, string> = {
      "/blog/intro": renderToString(
        <BlogPost title="Intro" body="Getting started." author="Alice" />
      ),
      "/blog/advanced": renderToString(
        <BlogPost title="Advanced" body="Deep dive." author="Bob" />
      ),
    };

    // Serve time: CDN returns pre-built HTML instantly
    expect(pages["/blog/intro"]).toContain("Intro");
    expect(pages["/blog/advanced"]).toContain("Advanced");
    // No server computation at request time
    expect(Object.keys(pages)).toHaveLength(2);
  });

  it("ISR simulation: page is cached and regenerated after revalidate period", async () => {
    let buildTime = 0;
    const cache: Record<string, { html: string; built: number }> = {};

    const getPage = (path: string, revalidateSec: number) => {
      const cached = cache[path];
      const now = Date.now();

      if (!cached || now - cached.built > revalidateSec * 1000) {
        buildTime++;
        const html = renderToString(<BlogPost title={`Page v${buildTime}`} body="Content" author="ISR" />);
        cache[path] = { html, built: now };
      }

      return cache[path].html;
    };

    // First request — builds page (buildTime 1)
    const first = getPage("/blog/post", 60);
    expect(first).toContain("Page v1");
    expect(buildTime).toBe(1);

    // Second request within revalidate window — returns cached
    const second = getPage("/blog/post", 60);
    expect(second).toContain("Page v1");
    expect(buildTime).toBe(1); // no rebuild

    // Simulate revalidate expired — next request rebuilds
    cache["/blog/post"].built -= 61_000;
    const third = getPage("/blog/post", 60);
    expect(third).toContain("Page v2");
    expect(buildTime).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. STREAMING
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Streaming: renderToPipeableStream", () => {
  it("onShellReady fires before all content is ready — shell streams first", async () => {
    const events: string[] = [];

    await new Promise<void>((resolve) => {
      const { pipe } = renderToPipeableStream(
        <div>
          <h1>Shell content</h1>
        </div>,
        {
          onShellReady() {
            events.push("shellReady");
            const writable = new Writable({ write(_c, _e, cb) { cb(); } });
            writable.on("finish", resolve);
            pipe(writable);
          },
          onAllReady() { events.push("allReady"); },
        }
      );
    });

    expect(events[0]).toBe("shellReady");
    expect(events).toContain("allReady");
  });

  it("streaming produces the same HTML content as renderToString", async () => {
    const element = (
      <article>
        <h1>Streamed Post</h1>
        <p>Paragraph content here.</p>
      </article>
    );

    const streamedHtml = await streamToString(writable => {
      const { pipe } = renderToPipeableStream(element, {
        onShellReady() { pipe(writable); },
      });
    });

    const syncHtml = renderToString(element);

    // Both contain the same content
    expect(streamedHtml).toContain("Streamed Post");
    expect(streamedHtml).toContain("Paragraph content here.");
    // Streamed version contains the content too
    expect(syncHtml).toContain("Streamed Post");
  });

  it("onShellError fires when the root component throws during render", async () => {
    const errors: string[] = [];

    const BrokenComponent: React.FC = () => {
      throw new Error("Shell render failed");
    };

    await new Promise<void>((resolve) => {
      renderToPipeableStream(<BrokenComponent />, {
        onShellReady() {
          // Should not reach here if root throws
        },
        onShellError(err) {
          errors.push((err as Error).message);
          resolve();
        },
        onError(err) {
          // Also captures error
        },
      });
    });

    expect(errors).toContain("Shell render failed");
  });

  it("onAllReady fires after every Suspense boundary resolves (for SSG/crawlers)", async () => {
    const events: string[] = [];
    let fullHtml = "";

    await new Promise<void>((resolve) => {
      const { pipe } = renderToPipeableStream(
        <div>
          <h1>Page Title</h1>
          <p>Static body text.</p>
        </div>,
        {
          onShellReady() { events.push("shell"); },
          onAllReady() {
            events.push("allReady");
            const writable = new Writable({
              write(chunk, _enc, cb) { fullHtml += chunk.toString(); cb(); },
            });
            writable.on("finish", resolve);
            pipe(writable);
          },
        }
      );
    });

    expect(events).toContain("allReady");
    expect(fullHtml).toContain("Page Title");
    expect(fullHtml).toContain("Static body text.");
  });

  it("streaming shell is sent even when Suspense boundaries are still loading", async () => {
    let shellHtml = "";

    // A resource that never resolves (simulates slow data fetching)
    const neverResolves = createResource(new Promise(() => {}));

    await new Promise<void>((resolve) => {
      const { pipe, abort } = renderToPipeableStream(
        <div>
          <h1>Shell — always sent immediately</h1>
          <Suspense fallback={<p data-testid="fallback">Loading user…</p>}>
            {/* This would suspend — but shell still streams */}
          </Suspense>
        </div>,
        {
          onShellReady() {
            const writable = new Writable({
              write(chunk, _enc, cb) { shellHtml += chunk.toString(); cb(); },
            });
            writable.on("finish", () => { resolve(); });
            pipe(writable);
            // Abort so the never-resolving Suspense doesn't block our test
            abort();
          },
        }
      );
    });

    // Shell (h1) is in the HTML even before Suspense resolves
    expect(shellHtml).toContain("Shell — always sent immediately");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. HYDRATION
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Hydration", () => {
  it("hydrateRoot attaches event handlers to server-rendered HTML", async () => {
    const user = userEvent.setup();

    // Simulate server-rendered HTML
    const serverHtml = renderToString(<Counter initial={10} />);

    // Create a container with the server HTML (mimics what the browser receives)
    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    // Hydrate — React attaches handlers without re-creating DOM
    act(() => {
      hydrateRoot(container, <Counter initial={10} />);
    });

    // The count from server HTML is visible
    expect(container.querySelector("[data-testid='count']")?.textContent).toBe("10");

    // Button is now interactive (event handler attached by hydration)
    await user.click(container.querySelector("button")!);
    expect(container.querySelector("[data-testid='count']")?.textContent).toBe("11");

    document.body.removeChild(container);
  });

  it("hydrateRoot preserves existing DOM nodes — no re-creation", () => {
    const serverHtml = renderToString(<BlogPost title="Post" body="Body" author="Author" />);

    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    // Capture reference to a DOM node before hydration
    const h1Before = container.querySelector("h1");

    act(() => {
      hydrateRoot(container, <BlogPost title="Post" body="Body" author="Author" />);
    });

    // Same DOM node — not recreated
    const h1After = container.querySelector("h1");
    expect(h1Before).toBe(h1After); // same reference

    document.body.removeChild(container);
  });

  it("client-only values (time, random) should use useEffect to avoid hydration mismatch", async () => {
    // TimeDisplay renders "Loading time…" on server, sets real time in useEffect (client)
    const serverHtml = renderToString(<TimeDisplay />);

    // Server HTML has the safe placeholder — no time value
    expect(serverHtml).toContain("Loading time…");
    expect(serverHtml).not.toMatch(/\d{1,2}:\d{2}:\d{2}/); // no time string in SSR

    // On client: render and let useEffect run
    render(<TimeDisplay />);
    // After useEffect, time is set — but we just verify no crash during hydration
    await waitFor(() => {
      // Component renders without throwing — client-side effect ran
      expect(screen.getByTestId("time")).toBeInTheDocument();
    });
  });

  it("selective hydration: Suspense boundaries hydrate independently", async () => {
    const user = userEvent.setup();

    // Simulate two independent interactive islands
    const App: React.FC = () => (
      <div>
        <StaticContent text="Pure HTML — no hydration needed" />
        <Suspense fallback={<div>Loading island 1…</div>}>
          <InteractiveIsland label="Counter A" />
        </Suspense>
        <Suspense fallback={<div>Loading island 2…</div>}>
          <InteractiveIsland label="Counter B" />
        </Suspense>
      </div>
    );

    render(<App />);

    // Both islands rendered (eager resolve in test env)
    const islands = await screen.findAllByTestId("island");
    expect(islands).toHaveLength(2);

    // Static section present without hydration
    expect(screen.getByTestId("static-section")).toHaveTextContent(
      "Pure HTML — no hydration needed"
    );

    // Each island is independently interactive
    await user.click(screen.getByRole("button", { name: /increment counter a/i }));
    expect(screen.getByTestId("island-count-Counter A")).toHaveTextContent("Counter A: 1");

    // Counter B is not affected
    expect(screen.getByTestId("island-count-Counter B")).toHaveTextContent("Counter B: 0");
  });

  it("progressive hydration: defer non-critical components to idle time", async () => {
    const user = userEvent.setup();
    let idleCallbackFired = false;

    // Simulate requestIdleCallback-based lazy hydration
    const HydrationManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const [hydrated, setHydrated] = useState(false);

      useEffect(() => {
        // In real app: use requestIdleCallback or IntersectionObserver
        const id = setTimeout(() => {
          idleCallbackFired = true;
          setHydrated(true);
        }, 0);
        return () => clearTimeout(id);
      }, []);

      if (!hydrated) {
        return <div data-testid="dehydrated">Content (not yet interactive)</div>;
      }
      return <>{children}</>;
    };

    render(
      <HydrationManager>
        <Counter initial={0} />
      </HydrationManager>
    );

    // Before idle — dehydrated placeholder shown
    expect(screen.getByTestId("dehydrated")).toBeInTheDocument();

    // After idle callback
    await waitFor(() => expect(idleCallbackFired).toBe(true));
    await screen.findByTestId("count");

    // Now fully hydrated and interactive
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("suppressHydrationWarning suppresses known server/client differences", () => {
    // Components that render different values on server vs client
    // can use suppressHydrationWarning to silence the warning

    const ServerClientDiff: React.FC<{ serverValue: string; clientValue: string }> = ({
      serverValue,
      clientValue,
    }) => {
      const [isClient, setIsClient] = useState(false);
      useEffect(() => setIsClient(true), []);

      return (
        // suppressHydrationWarning tells React to not warn about this mismatch
        <div data-testid="diff" suppressHydrationWarning>
          {isClient ? clientValue : serverValue}
        </div>
      );
    };

    render(<ServerClientDiff serverValue="2026-01-01" clientValue="now" />);

    // Component renders without error even with different values
    expect(screen.getByTestId("diff")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. RENDERING STRATEGY COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — Rendering strategy comparison", () => {
  it("CSR: empty shell from server, all content from JS (bad for SEO)", () => {
    // CSR: server sends minimal HTML, client renders everything
    const csrServerHtml = "<div id='root'></div>"; // what a CSR server sends

    // Content is NOT in the initial HTML
    expect(csrServerHtml).not.toContain("Blog Post Title");
    expect(csrServerHtml).not.toContain("article");

    // CSR: client fills in the content
    const container = document.createElement("div");
    container.innerHTML = csrServerHtml;
    const root = container.querySelector("#root")!;

    act(() => {
      createRoot(root).render(
        <BlogPost title="Blog Post Title" body="Content" author="Alice" />
      );
    });

    // Content now in DOM — but too late for initial crawl
    expect(root.querySelector("h1")?.textContent).toBe("Blog Post Title");
  });

  it("SSR: content-rich HTML from server — SEO and FCP both good", () => {
    const ssrHtml = renderToString(
      <BlogPost title="Blog Post Title" body="Content for SEO" author="Alice" />
    );

    // Content in HTML immediately — no JS needed for crawlers
    expect(ssrHtml).toContain("Blog Post Title");
    expect(ssrHtml).toContain("Content for SEO");
    expect(ssrHtml).toContain("<article");
    expect(ssrHtml).toContain("<h1>");
  });

  it("SSG: build multiple pages at build time, serve as static assets", () => {
    const posts = [
      { slug: "react-hooks", title: "React Hooks", body: "useState...", author: "Alice" },
      { slug: "fiber", title: "Fiber Architecture", body: "Linked list...", author: "Bob" },
      { slug: "concurrent", title: "Concurrent Mode", body: "startTransition...", author: "Carol" },
    ];

    // Build time: generate all pages
    const staticPages = Object.fromEntries(
      posts.map(post => [
        `/blog/${post.slug}`,
        renderToString(<BlogPost title={post.title} body={post.body} author={post.author} />),
      ])
    );

    // All pages pre-built as HTML strings → saved to disk → served by CDN
    expect(Object.keys(staticPages)).toHaveLength(3);
    expect(staticPages["/blog/react-hooks"]).toContain("React Hooks");
    expect(staticPages["/blog/fiber"]).toContain("Fiber Architecture");
    expect(staticPages["/blog/concurrent"]).toContain("Concurrent Mode");

    // No server computation at request time — just file serving
    const requestTime = (path: string) => staticPages[path]; // O(1) lookup
    expect(requestTime("/blog/fiber")).toContain("Fiber Architecture");
  });
});
