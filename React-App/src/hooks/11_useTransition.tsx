// TOPIC: useTransition
//
// useTransition lets you mark a state update as NON-URGENT (a "transition").
// React will keep the UI responsive to urgent updates (typing, clicking)
// while processing the slow non-urgent update in the background.
//
// Syntax:
//   const [isPending, startTransition] = useTransition();
//
//   startTransition(() => {
//     setSlowState(newValue); // this update is non-urgent
//   });
//
// isPending — true while the transition is still processing (show a spinner)
//
// When to use:
//   ✅ Filtering/sorting large lists while keeping the input responsive
//   ✅ Tab switching where one tab is slow to render
//   ✅ Any "search as you type" experience with heavy rendering
//
// When NOT to use:
//   ❌ Urgent updates like the input value itself (keep those outside startTransition)

import { useState, useTransition, memo } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Filter large list — input stays responsive
// ════════════════════════════════════════════════════════════

// Simulate a large list (10,000 items)
const ALL_ITEMS = Array.from({ length: 10_000 }, (_, i) => `Item ${i + 1}`);

// Slow component — each row does artificial work to simulate heavy rendering
const SlowItem = memo(({ text }: { text: string }) => {
  // Artificial slowdown
  let i = 0;
  while (i < 10_000) i++;
  return <li>{text}</li>;
});

const FilterListExample = () => {
  const [query, setQuery] = useState("");         // urgent — always up to date
  const [filtered, setFiltered] = useState(ALL_ITEMS); // slow — wrapped in transition
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value); // urgent: update the input immediately

    startTransition(() => {
      // non-urgent: filter the huge list without blocking the input
      setFiltered(
        ALL_ITEMS.filter((item) => item.toLowerCase().includes(value.toLowerCase()))
      );
    });
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 1 — Filter 10,000 Items (input stays responsive)</h3>
      <input
        value={query}
        onChange={handleChange}
        placeholder="Type to filter…"
      />
      {isPending && <span style={{ marginLeft: "8px", color: "#888" }}>Updating list…</span>}
      <p>{filtered.length} results</p>
      <ul style={{ maxHeight: "150px", overflowY: "auto", fontSize: "13px" }}>
        {filtered.slice(0, 50).map((item) => (
          <SlowItem key={item} text={item} />
        ))}
        {filtered.length > 50 && <li style={{ color: "#888" }}>…and {filtered.length - 50} more</li>}
      </ul>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Slow tab switching
// ════════════════════════════════════════════════════════════

const tabs = ["Home", "Posts", "Settings"];

// Simulate a slow tab panel
const SlowTabPanel = ({ tab }: { tab: string }) => {
  // Artificial slow render
  let i = 0;
  while (i < 50_000_000) i++;

  return (
    <div style={{ padding: "12px", border: "1px solid #ccc", marginTop: "8px" }}>
      <strong>{tab}</strong> — content loaded (simulated slow render)
    </div>
  );
};

const TabExample = () => {
  const [activeTab, setActiveTab] = useState("Home");
  const [pendingTab, setPendingTab] = useState("Home");
  const [isPending, startTransition] = useTransition();

  const switchTab = (tab: string) => {
    setPendingTab(tab); // update the selected tab button immediately
    startTransition(() => {
      setActiveTab(tab); // load the slow panel as a transition
    });
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <h3>Example 2 — Slow Tab Switching (tab button responds instantly)</h3>
      <div style={{ display: "flex", gap: "8px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            style={{
              fontWeight: pendingTab === tab ? "bold" : "normal",
              opacity: isPending && pendingTab === tab ? 0.6 : 1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {isPending ? (
        <p style={{ color: "#888" }}>Loading {pendingTab}…</p>
      ) : (
        <SlowTabPanel tab={activeTab} />
      )}
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const UseTransitionDemo = () => {
  return (
    <div>
      <h2>useTransition Hook</h2>
      <FilterListExample />
      <TabExample />
    </div>
  );
};

export default UseTransitionDemo;
