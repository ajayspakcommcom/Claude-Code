// Visual explainer for Senior Testing topics.
// Renders in the app so concepts are visible alongside the live components.

import React, { useState } from "react";

const TOPICS = [
  {
    id: "integration",
    number: "#1",
    title: "Integration Tests",
    subtitle: "Multiple components, real user flows",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    file: "01_IntegrationTests.test.tsx",
    suites: 7,
    tests: 14,
    concepts: [
      { term: "findBy*", desc: "Async query — waits for element to appear (after fetch, state update)" },
      { term: "within(el)", desc: "Scope queries to a specific container — prevents ambiguous matches" },
      { term: "server.use()", desc: "Override a handler for ONE test only — resets after each test" },
      { term: "userEvent.setup()", desc: "Realistic interactions: types character by character, fires all browser events" },
      { term: "waitFor()", desc: "Poll until assertion passes — for side effects not tied to a DOM change" },
      { term: "queryBy*", desc: "Returns null instead of throwing — use to assert element is absent" },
    ],
    flows: [
      "Load flow — loading indicator → products render → loading gone",
      "Category filter — click filter → only matching products visible",
      "Add to cart — click Add → cart heading increments → subtotal correct",
      "Remove from cart — click Remove → item gone → total recalculates",
      "Discount code — valid code → total discounted; invalid → error alert",
      "Full checkout — add → discount → submit → confirmation screen",
      "Error + retry — 500 → error shown, cart preserved → fix → retry → success",
    ],
  },
  {
    id: "mocking",
    number: "#2",
    title: "Mocking APIs",
    subtitle: "MSW, jest.spyOn, stateful handlers",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    file: "02_MockingAPIs.test.tsx",
    suites: 6,
    tests: 12,
    concepts: [
      { term: "MSW setupServer()", desc: "Node-side request interceptor — components use real fetch(), MSW intercepts it" },
      { term: "rest.get/post()", desc: "Define handler per method + path. req, res, ctx pattern (MSW v1)" },
      { term: "ctx.delay(ms)", desc: "Simulate slow network — test loading/disabled states" },
      { term: "ctx.status(500)", desc: "Simulate server errors — test error UI and retry flows" },
      { term: "await req.json()", desc: "Inspect what the component actually sent in the request body" },
      { term: "jest.spyOn(fetch)", desc: "Verify fetch was called N times with correct arguments" },
    ],
    flows: [
      "Request body inspection — capture what component sends, assert structure",
      "Slow network — ctx.delay() → loading UI visible during fetch",
      "Error responses — 503/500 → correct error messages shown",
      "Stateful handler — fail first call, succeed second → retry pattern",
      "jest.spyOn — verify /api/products called exactly once on mount",
      "Edge cases — empty array, single item, no crash",
    ],
  },
  {
    id: "e2e",
    number: "#3",
    title: "E2E — Playwright",
    subtitle: "Real browser, full stack",
    color: "#059669",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    file: "e2e/shopping-cart.spec.ts",
    suites: 7,
    tests: 16,
    concepts: [
      { term: "page.getByRole()", desc: "Query by ARIA role — same API as Testing Library, works in real browser" },
      { term: "page.route()", desc: "Intercept requests in the browser — mock API without a backend" },
      { term: "await expect().toBeVisible()", desc: "Playwright auto-waits for element to be stable/visible before asserting" },
      { term: "locator.fill()", desc: "Clear input and type text — more reliable than .type() for E2E" },
      { term: ".within() equivalent", desc: "page.getByTestId('cart').getByRole('button') — chain locators to scope" },
      { term: "route.fulfill()", desc: "Return mocked response from page.route() — control status, body, headers" },
    ],
    flows: [
      "Page load — products render, loading indicator visible during slow fetch",
      "Category filter — click filter → correct products visible/hidden",
      "Add to cart — click → heading updates → subtotal correct",
      "Discount code — valid SAVE10 → total discounted; invalid → error",
      "Full checkout journey — critical path: add → discount → submit → confirmation",
      "Checkout disabled during submission — button disabled while in-flight",
      "Error + cart preserved — 500 → alert → cart items still there",
    ],
    commands: [
      { cmd: "npm run test:e2e", desc: "Run all E2E tests headlessly" },
      { cmd: "npm run test:e2e:ui", desc: "Open Playwright interactive UI" },
      { cmd: "npm run test:e2e:headed", desc: "Watch tests run in browser" },
    ],
  },
];

const PyramidPanel: React.FC = () => (
  <div style={{
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: 20,
  }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
      Testing Pyramid — Senior Perspective
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 16 }}>
      {[
        { label: "E2E (Playwright)", width: "35%", bg: "#059669", count: "few", speed: "slow, real browser" },
        { label: "Integration (Jest + MSW)", width: "65%", bg: "#3b82f6", count: "many", speed: "medium, jsdom" },
        { label: "Unit (pure logic, hooks)", width: "100%", bg: "#94a3b8", count: "some", speed: "fast, no DOM" },
      ].map(tier => (
        <div key={tier.label} style={{ width: tier.width, textAlign: "center" }}>
          <div style={{
            background: tier.bg, borderRadius: 6, padding: "10px 0",
            color: "#fff", fontWeight: 700, fontSize: 12,
          }}>
            {tier.label}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {tier.count} · {tier.speed}
          </div>
        </div>
      ))}
    </div>
    <div style={{
      padding: "10px 14px", background: "#eff6ff",
      borderRadius: 8, border: "1px solid #bfdbfe",
      fontSize: 12, color: "#1d4ed8",
    }}>
      <strong>"Write tests. Not too many. Mostly integration."</strong> — Kent C. Dodds
      <br />Integration tests give the best ROI: fast enough to run on every commit,
      specific enough to catch how components actually connect.
    </div>
  </div>
);

const TopicCard: React.FC<{ topic: typeof TOPICS[0] }> = ({ topic }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      border: `1px solid ${topic.border}`,
      borderRadius: 12, overflow: "hidden",
      background: topic.bg,
    }}>
      <div style={{
        padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            background: topic.color, color: "#fff",
            fontSize: 11, fontWeight: 700, padding: "2px 10px",
            borderRadius: 20,
          }}>{topic.number}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{topic.title}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{topic.subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              <span style={{ fontWeight: 700, color: topic.color }}>{topic.suites}</span> suites ·{" "}
              <span style={{ fontWeight: 700, color: topic.color }}>{topic.tests}</span> tests
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>{topic.file}</div>
          </div>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              padding: "5px 12px", borderRadius: 8,
              background: open ? topic.color : "#fff",
              color: open ? "#fff" : topic.color,
              border: `1px solid ${topic.color}`,
              cursor: "pointer", fontWeight: 600, fontSize: 12,
            }}
          >
            {open ? "▲ Hide" : "▼ Show"}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 20px 20px", background: "#fff", borderTop: `1px solid ${topic.border}` }}>
          {/* Concepts */}
          <div style={{ paddingTop: 16, marginBottom: 16 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: topic.color,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
            }}>Key APIs / concepts</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {topic.concepts.map(c => (
                <div key={c.term} style={{
                  padding: "8px 12px", background: topic.bg,
                  borderRadius: 6, border: `1px solid ${topic.border}`,
                }}>
                  <code style={{ fontSize: 11, fontWeight: 700, color: topic.color }}>{c.term}</code>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Test flows */}
          <div style={{ marginBottom: topic.id === "e2e" ? 16 : 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: topic.color,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
            }}>Test flows covered</div>
            {topic.flows.map((f, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, marginBottom: 5,
                fontSize: 12, color: "#475569",
              }}>
                <span style={{ color: topic.color, flexShrink: 0 }}>▸</span>
                {f}
              </div>
            ))}
          </div>

          {/* E2E commands */}
          {topic.id === "e2e" && topic.commands && (
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: topic.color,
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
              }}>Run commands</div>
              {topic.commands.map(c => (
                <div key={c.cmd} style={{
                  display: "flex", gap: 12, marginBottom: 6,
                  alignItems: "center",
                }}>
                  <code style={{
                    fontSize: 11, background: "#0f172a", color: "#86efac",
                    padding: "3px 10px", borderRadius: 6, flexShrink: 0,
                  }}>{c.cmd}</code>
                  <span style={{ fontSize: 12, color: "#475569" }}>{c.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TestingExplainer: React.FC = () => {
  const [tab, setTab] = useState<"overview" | "strategy">("overview");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            background: "#059669", color: "#fff", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Senior — Testing (Advanced)</span>
          <span style={{
            background: "#f0fdf4", color: "#065f46", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            border: "1px solid #bbf7d0",
          }}>Jest · MSW · Playwright</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          Testing (Advanced)
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          Three layers of the testing pyramid applied to a realistic shopping cart:
          integration tests (Jest + Testing Library), API mocking (MSW), and
          E2E tests (Playwright in a real browser).
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        {(["overview", "strategy"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", background: "none", border: "none",
            cursor: "pointer", fontWeight: 600, fontSize: 14,
            color: tab === t ? "#059669" : "#64748b",
            borderBottom: `3px solid ${tab === t ? "#059669" : "transparent"}`,
            marginBottom: -2, textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {tab === "overview" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {TOPICS.map(topic => <TopicCard key={topic.id} topic={topic} />)}

          <div style={{
            padding: "12px 16px", background: "#fafafa",
            border: "1px solid #e2e8f0", borderRadius: 10,
            fontSize: 12, color: "#64748b",
          }}>
            <strong>Test target:</strong> The <code>ShoppingCart</code> component is the subject of all three
            test files — the same component, tested at different levels of the pyramid.
            Files: <code>src/senior/testing/01_IntegrationTests.test.tsx</code>,{" "}
            <code>02_MockingAPIs.test.tsx</code>, <code>e2e/shopping-cart.spec.ts</code>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PyramidPanel />

          {/* Decision guide */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
              Which test type to write?
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Scenario", "Use", "Why"].map(h => (
                      <th key={h} style={{
                        padding: "8px 12px", textAlign: "left",
                        fontWeight: 700, color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Testing a reducer or util function", "Unit test", "Pure logic, no DOM needed"],
                    ["Testing a custom hook", "Unit test (renderHook)", "Isolated logic, fast"],
                    ["Testing a component with API calls", "Integration + MSW", "Realistic, catches wiring bugs"],
                    ["Testing multi-step user flow", "Integration test", "Sweet spot — ROI is highest"],
                    ["Verifying CSS / animations", "E2E (Playwright)", "jsdom doesn't render CSS"],
                    ["Critical checkout / signup path", "E2E (Playwright)", "Real browser, real fetch"],
                    ["Cross-browser compatibility", "E2E (Playwright)", "Chromium + Firefox + WebKit"],
                    ["Every edge case in a form", "Integration test", "E2E too slow for this"],
                  ].map(([scenario, use, why]) => (
                    <tr key={scenario} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px", color: "#475569" }}>{scenario}</td>
                      <td style={{
                        padding: "8px 12px", fontWeight: 700,
                        color: use.startsWith("Unit") ? "#64748b" : use.startsWith("Integration") ? "#3b82f6" : "#059669",
                      }}>{use}</td>
                      <td style={{ padding: "8px 12px", color: "#64748b" }}>{why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key patterns */}
          <div style={{
            background: "#0f172a", borderRadius: 12, padding: 20,
            border: "1px solid #1e293b",
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
              Patterns that appear in all three test files
            </div>
            <pre style={{
              margin: 0, fontSize: 11, lineHeight: 1.8,
              color: "#e2e8f0", fontFamily: "monospace", overflow: "auto",
            }}>{`// ── MSW server lifecycle (same in all test files) ──────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());  // ← prevents handler leakage
afterAll(() => server.close());

// ── Override for one test only ───────────────────────────────────────────────
server.use(
  rest.post('/api/checkout', (_req, res, ctx) => res(ctx.status(500)))
);
// resetHandlers() restores defaults after this test

// ── Assert element is absent ─────────────────────────────────────────────────
expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
// queryBy* returns null — getBy* throws if not found

// ── Scope to a container ─────────────────────────────────────────────────────
const cart = screen.getByRole('region', { name: 'Shopping cart' });
within(cart).getByText('React T-Shirt');  // avoids matches in product list

// ── Playwright: chain locators ───────────────────────────────────────────────
await page.getByTestId('cart-item-1')
  .getByRole('button', { name: 'Remove React T-Shirt' })
  .click();`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
