// TOPIC: Compound Components
// LEVEL: Senior — Advanced Patterns #1
//
// ─── WHAT IS A COMPOUND COMPONENT? ───────────────────────────────────────────
//
//   A pattern where a parent component owns shared state, and a set of
//   child components communicate with it through React Context — not props.
//
//   The caller assembles the pieces however they want:
//
//     <Tabs>
//       <Tabs.List>
//         <Tabs.Tab id="a">Overview</Tabs.Tab>
//         <Tabs.Tab id="b">Details</Tabs.Tab>
//       </Tabs.List>
//       <Tabs.Panel id="a">Overview content</Tabs.Panel>
//       <Tabs.Panel id="b">Details content</Tabs.Panel>
//     </Tabs>
//
//   Compare that to a prop-driven API:
//
//     <Tabs
//       tabs={[{ id: "a", label: "Overview", content: <Overview /> }, ...]}
//     />
//
//   The prop-driven version is rigid — you can't rearrange, add wrappers,
//   or slot in extra elements between tabs. Compound components give the
//   caller full layout control.
//
// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
//
//   1. Create a Context to hold shared state (active tab, open accordion, etc.)
//   2. Parent component provides state via Context.Provider
//   3. Child components read from context — no props needed
//   4. Attach children to the parent with Object.assign:
//        Tabs.List = TabsList;  Tabs.Tab = TabsTab;  Tabs.Panel = TabsPanel;
//
// ─── WHEN TO USE ─────────────────────────────────────────────────────────────
//
//   USE compound components when:
//   - Caller needs layout control (reorder, wrap in grids, add dividers)
//   - Multiple sub-components share one piece of state
//   - Prop-drilling through 2+ levels just to pass "isOpen" or "activeTab"
//
//   SKIP it when:
//   - Simple one-off component — overkill
//   - Sub-components are never used independently
//
// ─── Object.assign TRICK ─────────────────────────────────────────────────────
//
//   export const Tabs = Object.assign(TabsRoot, {
//     List: TabsList,
//     Tab: TabsTab,
//     Panel: TabsPanel,
//   });
//
//   This lets callers write <Tabs.List> instead of importing 4 separate
//   named exports. Everything ships from one import.
//
// ─── ACCESSIBILITY ────────────────────────────────────────────────────────────
//
//   Tabs:       role="tablist", role="tab", role="tabpanel"
//               aria-selected, aria-controls, id linking tab↔panel
//   Accordion:  role="button", aria-expanded, aria-controls
//   Select:     role="listbox", role="option", aria-selected, aria-activedescendant

import React, {
  createContext,
  useContext,
  useState,
  useId,
  useRef,
  useEffect,
  ReactNode,
  KeyboardEvent,
} from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1 — TABS
// ═══════════════════════════════════════════════════════════════════════════════

interface TabsCtx {
  active: string;
  setActive: (id: string) => void;
  uid: string;
}

const TabsContext = createContext<TabsCtx | null>(null);

const useTabsCtx = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs sub-component used outside <Tabs>");
  return ctx;
};

// ── TabsRoot ──────────────────────────────────────────────────────────────────

interface TabsRootProps {
  defaultActive: string;
  children: ReactNode;
}

const TabsRoot: React.FC<TabsRootProps> = ({ defaultActive, children }) => {
  const [active, setActive] = useState(defaultActive);
  const uid = useId();
  return (
    <TabsContext.Provider value={{ active, setActive, uid }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
};

// ── TabsList ──────────────────────────────────────────────────────────────────

const TabsList: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div
    role="tablist"
    style={{
      display: "flex", gap: 4,
      borderBottom: "2px solid #e2e8f0",
      marginBottom: 16,
    }}
  >
    {children}
  </div>
);

// ── TabsTab ───────────────────────────────────────────────────────────────────

interface TabsTabProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

const TabsTab: React.FC<TabsTabProps> = ({ id, children, disabled = false }) => {
  const { active, setActive, uid } = useTabsCtx();
  const isActive = active === id;

  return (
    <button
      role="tab"
      id={`${uid}-tab-${id}`}
      aria-controls={`${uid}-panel-${id}`}
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && setActive(id)}
      style={{
        padding: "8px 18px",
        background: "none",
        border: "none",
        borderBottom: `3px solid ${isActive ? "#3b82f6" : "transparent"}`,
        marginBottom: -2,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: isActive ? 700 : 400,
        fontSize: 14,
        color: isActive ? "#3b82f6" : disabled ? "#cbd5e1" : "#64748b",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
};

// ── TabsPanel ─────────────────────────────────────────────────────────────────

interface TabsPanelProps {
  id: string;
  children: ReactNode;
}

const TabsPanel: React.FC<TabsPanelProps> = ({ id, children }) => {
  const { active, uid } = useTabsCtx();
  if (active !== id) return null;
  return (
    <div
      role="tabpanel"
      id={`${uid}-panel-${id}`}
      aria-labelledby={`${uid}-tab-${id}`}
    >
      {children}
    </div>
  );
};

// ── Assembled Tabs export ─────────────────────────────────────────────────────

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2 — ACCORDION
// ═══════════════════════════════════════════════════════════════════════════════

interface AccordionCtx {
  open: string | null;
  toggle: (id: string) => void;
  uid: string;
  multiple: boolean;
  openSet: Set<string>;
}

const AccordionContext = createContext<AccordionCtx | null>(null);

const useAccordionCtx = () => {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion sub-component used outside <Accordion>");
  return ctx;
};

// ── AccordionRoot ─────────────────────────────────────────────────────────────

interface AccordionRootProps {
  children: ReactNode;
  multiple?: boolean; // allow multiple items open at once
}

const AccordionRoot: React.FC<AccordionRootProps> = ({ children, multiple = false }) => {
  const [open, setOpen] = useState<string | null>(null);
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  const uid = useId();

  const toggle = (id: string) => {
    if (multiple) {
      setOpenSet(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    } else {
      setOpen(prev => (prev === id ? null : id));
    }
  };

  return (
    <AccordionContext.Provider value={{ open, toggle, uid, multiple, openSet }}>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// ── AccordionItem ─────────────────────────────────────────────────────────────

interface AccordionItemProps {
  id: string;
  label: ReactNode;
  children: ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ id, label, children }) => {
  const { open, toggle, uid, multiple, openSet } = useAccordionCtx();
  const isOpen = multiple ? openSet.has(id) : open === id;
  const contentId = `${uid}-content-${id}`;
  const triggerId = `${uid}-trigger-${id}`;

  return (
    <div style={{ borderBottom: "1px solid #e2e8f0" }}>
      <button
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => toggle(id)}
        style={{
          width: "100%", textAlign: "left",
          padding: "14px 18px",
          background: isOpen ? "#f8fafc" : "#fff",
          border: "none", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontWeight: 600, fontSize: 14, color: "#1e293b",
          transition: "background 0.15s",
        }}
      >
        {label}
        <span style={{
          fontSize: 12, color: "#94a3b8",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.25s",
          display: "inline-block",
        }}>▼</span>
      </button>
      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          style={{
            padding: "12px 18px 16px",
            fontSize: 13, color: "#475569", lineHeight: 1.7,
            borderTop: "1px solid #f1f5f9",
            background: "#fafafa",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3 — SELECT (Custom dropdown)
// ═══════════════════════════════════════════════════════════════════════════════

interface SelectCtx {
  value: string;
  label: string;
  onChange: (value: string, label: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  uid: string;
  activeId: string;
  setActiveId: (id: string) => void;
}

const SelectContext = createContext<SelectCtx | null>(null);

const useSelectCtx = () => {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select sub-component used outside <Select>");
  return ctx;
};

interface SelectRootProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  placeholder?: string;
}

const SelectRoot: React.FC<SelectRootProps> = ({ value, onChange, children, placeholder = "Select…" }) => {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(placeholder);
  const [activeId, setActiveId] = useState("");
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (v: string, l: string) => {
    onChange(v);
    setLabel(l);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, label, onChange: handleChange, open, setOpen, uid, activeId, setActiveId }}>
      <div ref={ref} style={{ position: "relative", display: "inline-block", minWidth: 200 }}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const { label, open, setOpen, uid, value } = useSelectCtx();
  return (
    <button
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={`${uid}-listbox`}
      onClick={() => setOpen(!open)}
      style={{
        width: "100%", padding: "9px 14px",
        border: `2px solid ${open ? "#3b82f6" : "#e2e8f0"}`,
        borderRadius: 8, background: "#fff",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", fontSize: 14,
        color: value ? "#1e293b" : "#94a3b8",
        fontWeight: value ? 500 : 400,
        transition: "border-color 0.15s",
      }}
    >
      {value ? label : (placeholder ?? label)}
      <span style={{
        fontSize: 11, color: "#94a3b8",
        transform: open ? "rotate(180deg)" : "rotate(0)",
        transition: "transform 0.2s",
        display: "inline-block",
      }}>▼</span>
    </button>
  );
};

const SelectList: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { open, uid, value } = useSelectCtx();
  if (!open) return null;
  return (
    <ul
      id={`${uid}-listbox`}
      role="listbox"
      aria-activedescendant={value ? `${uid}-opt-${value}` : undefined}
      style={{
        position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
        background: "#fff", border: "2px solid #3b82f6",
        borderRadius: 8, listStyle: "none",
        margin: 0, padding: "4px 0",
        zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        maxHeight: 220, overflowY: "auto",
      }}
    >
      {children}
    </ul>
  );
};

interface SelectOptionProps {
  value: string;
  children: ReactNode;
}

const SelectOption: React.FC<SelectOptionProps> = ({ value, children }) => {
  const ctx = useSelectCtx();
  const isSelected = ctx.value === value;
  const optId = `${ctx.uid}-opt-${value}`;

  return (
    <li
      id={optId}
      role="option"
      aria-selected={isSelected}
      onClick={() => ctx.onChange(value, String(children))}
      style={{
        padding: "9px 14px", cursor: "pointer", fontSize: 14,
        background: isSelected ? "#eff6ff" : "transparent",
        color: isSelected ? "#2563eb" : "#374151",
        fontWeight: isSelected ? 600 : 400,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLLIElement).style.background = "#f8fafc"; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLLIElement).style.background = "transparent"; }}
    >
      {children}
      {isSelected && <span style={{ fontSize: 12, color: "#2563eb" }}>✓</span>}
    </li>
  );
};

export const Select = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  List: SelectList,
  Option: SelectOption,
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DEMO PAGE
// ═══════════════════════════════════════════════════════════════════════════════

// ── Prop-driven vs Compound comparison ───────────────────────────────────────

const ComparisonPanel: React.FC = () => (
  <div style={{
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: 20,
  }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
      Prop-driven API vs Compound Components
    </div>
    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
      The same Tabs — two different APIs. Notice which one gives you layout control.
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#ef4444",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
        }}>Prop-driven (rigid)</div>
        <div style={{
          background: "#0f172a", borderRadius: 8, padding: 14,
          fontFamily: "monospace", fontSize: 11, color: "#fca5a5", lineHeight: 1.7,
        }}>
          {`<Tabs\n  tabs={[\n    { id: "a", label: "Overview",\n      content: <Overview /> },\n    { id: "b", label: "Settings",\n      content: <Settings /> },\n  ]}\n/>\n\n// Can't rearrange, can't add\n// a divider between tabs,\n// can't wrap in a grid.`}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#22c55e",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
        }}>Compound (flexible)</div>
        <div style={{
          background: "#0f172a", borderRadius: 8, padding: 14,
          fontFamily: "monospace", fontSize: 11, color: "#86efac", lineHeight: 1.7,
        }}>
          {`<Tabs defaultActive="a">\n  <Tabs.List>\n    <Tabs.Tab id="a">Overview</Tabs.Tab>\n    <div>← you control layout</div>\n    <Tabs.Tab id="b">Settings</Tabs.Tab>\n  </Tabs.List>\n\n  <Tabs.Panel id="a"><Overview /></Tabs.Panel>\n  <Tabs.Panel id="b"><Settings /></Tabs.Panel>\n</Tabs>`}
        </div>
      </div>
    </div>
  </div>
);

// ── How it works panel ────────────────────────────────────────────────────────

const HowItWorksPanel: React.FC = () => (
  <div style={{
    background: "#0f172a", borderRadius: 12, padding: 20,
    border: "1px solid #1e293b",
  }}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
      Pattern skeleton — how any compound component is built
    </div>
    <pre style={{
      margin: 0, fontSize: 11, lineHeight: 1.75,
      color: "#e2e8f0", fontFamily: "monospace", overflow: "auto",
    }}>{`// 1. Context for shared state
const TabsContext = createContext(null);

// 2. Root owns the state + provides context
const TabsRoot = ({ defaultActive, children }) => {
  const [active, setActive] = useState(defaultActive);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
};

// 3. Children read from context — no props needed
const TabsTab = ({ id, children }) => {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button
      aria-selected={active === id}
      onClick={() => setActive(id)}
    >
      {children}
    </button>
  );
};

const TabsPanel = ({ id, children }) => {
  const { active } = useContext(TabsContext);
  return active === id ? <div>{children}</div> : null;
};

// 4. Attach children to parent with Object.assign
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
});

// Usage — one import, full layout control
import { Tabs } from './Tabs';
<Tabs defaultActive="a">
  <Tabs.List>
    <Tabs.Tab id="a">One</Tabs.Tab>
    <Tabs.Tab id="b">Two</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="a">Content A</Tabs.Panel>
  <Tabs.Panel id="b">Content B</Tabs.Panel>
</Tabs>`}
    </pre>
  </div>
);

// ── Tabs live demo ────────────────────────────────────────────────────────────

const TabsDemo: React.FC = () => (
  <div style={{
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: 20,
  }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
      Tabs — live demo
    </div>
    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
      The badge between tabs is inserted by the caller — impossible with a prop-driven API.
    </div>
    <Tabs defaultActive="overview">
      <Tabs.List>
        <Tabs.Tab id="overview">Overview</Tabs.Tab>
        <Tabs.Tab id="details">Details</Tabs.Tab>
        {/* Caller controls layout — inserts custom element between tabs */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "0 8px", marginBottom: 2,
        }}>
          <span style={{
            fontSize: 10, background: "#fef3c7", color: "#92400e",
            padding: "1px 7px", borderRadius: 20, fontWeight: 700,
          }}>NEW</span>
        </div>
        <Tabs.Tab id="analytics">Analytics</Tabs.Tab>
        <Tabs.Tab id="disabled" disabled>Disabled</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel id="overview">
        <div style={{ padding: "8px 0", color: "#374151", fontSize: 13, lineHeight: 1.7 }}>
          <strong>Overview panel</strong> — this content is rendered when the Overview tab is active.
          The Tab and Panel communicate through Context, not props.
          <br /><br />
          The disabled tab above demonstrates that individual tabs can carry their own state
          without the parent needing to know which IDs are disabled.
        </div>
      </Tabs.Panel>
      <Tabs.Panel id="details">
        <div style={{ padding: "8px 0", color: "#374151", fontSize: 13, lineHeight: 1.7 }}>
          <strong>Details panel</strong> — only the active panel renders to the DOM.
          All other panels return null.
        </div>
      </Tabs.Panel>
      <Tabs.Panel id="analytics">
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
            <strong>Analytics panel</strong> — this tab has the NEW badge next to it.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["Page views", "12,450"], ["Unique users", "3,210"], ["Avg. session", "4m 32s"]].map(([label, val]) => (
              <div key={label} style={{
                flex: 1, padding: 12, background: "#f8fafc",
                borderRadius: 8, border: "1px solid #e2e8f0",
              }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </Tabs.Panel>
    </Tabs>
  </div>
);

// ── Accordion demo ────────────────────────────────────────────────────────────

const AccordionDemo: React.FC = () => {
  const [mode, setMode] = useState<"single" | "multiple">("single");

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Accordion — live demo
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
        Toggle between single-open and multi-open — the root controls the behaviour, items don't need to know.
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["single", "multiple"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 12,
              fontWeight: 600, cursor: "pointer", border: "2px solid",
              borderColor: mode === m ? "#3b82f6" : "#e2e8f0",
              background: mode === m ? "#eff6ff" : "#f8fafc",
              color: mode === m ? "#2563eb" : "#64748b",
            }}
          >
            {m === "single" ? "Single open" : "Multiple open"}
          </button>
        ))}
      </div>
      <Accordion key={mode} multiple={mode === "multiple"}>
        <Accordion.Item
          id="what"
          label="What is a compound component?"
        >
          A pattern where a parent owns shared state and exposes child components
          that communicate with it through Context. The caller assembles the pieces
          in any layout they want.
        </Accordion.Item>
        <Accordion.Item
          id="when"
          label="When should I use it?"
        >
          When callers need layout control, when multiple sub-components share one
          piece of state, or when prop-drilling would pass state through 2+ levels.
          For simple one-off components it's overkill.
        </Accordion.Item>
        <Accordion.Item
          id="vs"
          label="How is it different from prop-drilling?"
        >
          Prop-drilling passes state down through props at every level. Compound
          components use Context so any child can read shared state directly —
          no intermediate components involved.
        </Accordion.Item>
        <Accordion.Item
          id="key"
          label="What is Object.assign used for?"
        >
          It attaches child components to the parent as properties:
          Tabs.Tab = TabsTab. This lets callers write &lt;Tabs.Tab&gt; instead of
          importing 4 separate named exports, keeping the API clean.
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

// ── Select demo ───────────────────────────────────────────────────────────────

const SelectDemo: React.FC = () => {
  const [framework, setFramework] = useState("");
  const [language, setLanguage] = useState("");

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Custom Select — live demo
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Built with the compound pattern: the trigger, list, and options share open/value state through Context.
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Framework</div>
          <Select value={framework} onChange={setFramework} placeholder="Choose framework…">
            <Select.Trigger />
            <Select.List>
              <Select.Option value="react">React</Select.Option>
              <Select.Option value="vue">Vue</Select.Option>
              <Select.Option value="angular">Angular</Select.Option>
              <Select.Option value="svelte">Svelte</Select.Option>
              <Select.Option value="solid">SolidJS</Select.Option>
            </Select.List>
          </Select>
          {framework && (
            <div style={{ fontSize: 12, color: "#22c55e", marginTop: 6 }}>
              Selected: {framework}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Language</div>
          <Select value={language} onChange={setLanguage} placeholder="Choose language…">
            <Select.Trigger />
            <Select.List>
              <Select.Option value="ts">TypeScript</Select.Option>
              <Select.Option value="js">JavaScript</Select.Option>
              <Select.Option value="py">Python</Select.Option>
              <Select.Option value="go">Go</Select.Option>
            </Select.List>
          </Select>
          {language && (
            <div style={{ fontSize: 12, color: "#22c55e", marginTop: 6 }}>
              Selected: {language}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

const CompoundComponents: React.FC = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            background: "#7c3aed", color: "#fff", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Senior — Advanced Patterns #1</span>
          <span style={{
            background: "#f5f3ff", color: "#6d28d9", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            border: "1px solid #ddd6fe",
          }}>Context + Object.assign</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          Compound Components
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          Parent owns shared state via Context. Child components read from it directly —
          no prop-drilling. Callers get full layout control. Three live examples: Tabs, Accordion, Select.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        {(["concepts", "demo"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px", background: "none", border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 14,
              color: tab === t ? "#7c3aed" : "#64748b",
              borderBottom: `3px solid ${tab === t ? "#7c3aed" : "transparent"}`,
              marginBottom: -2, textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "concepts" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Key rules */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { icon: "📦", title: "Context for state", body: "Parent creates a Context and provides shared state (active tab, open item). Children consume it — no props passed." },
              { icon: "🧩", title: "Object.assign", body: "Attaches Tabs.Tab, Tabs.Panel etc. to the root export. Caller gets everything from one import, writes <Tabs.Tab> not <TabsTab>." },
              { icon: "🎨", title: "Caller controls layout", body: "Children can be reordered, wrapped, or mixed with other elements. The parent never sees the DOM — just renders {children}." },
            ].map(c => (
              <div key={c.title} style={{
                border: "1px solid #ede9fe", borderRadius: 10,
                padding: 16, background: "#faf5ff",
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{c.body}</div>
              </div>
            ))}
          </div>
          <ComparisonPanel />
          <HowItWorksPanel />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabsDemo />
          <AccordionDemo />
          <SelectDemo />
        </div>
      )}
    </div>
  );
};

export default CompoundComponents;
