// Visual explainer for Senior — Code Quality
// Covers ESLint + Prettier, Husky + lint-staged, Code Reviews

import React, { useState } from "react";

// ─── SHARED STYLES ─────────────────────────────────────────────────────────────

const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 20,
  ...extra,
});

const codeBlock = (color = "#86efac"): React.CSSProperties => ({
  background: "#0f172a",
  borderRadius: 8,
  padding: 14,
  fontFamily: "monospace",
  fontSize: 11,
  color,
  lineHeight: 1.75,
  whiteSpace: "pre",
  overflowX: "auto",
});

const pill = (active: boolean, activeColor = "#3b82f6"): React.CSSProperties => ({
  padding: "6px 16px",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
  border: "2px solid",
  borderColor: active ? activeColor : "#e2e8f0",
  background: active ? activeColor + "22" : "#f8fafc",
  color: active ? activeColor : "#64748b",
});

const sectionLabel = (color = "#475569"): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 700,
  color,
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  marginBottom: 8,
});

// ─── DEMO 1 — ESLint rules explorer ───────────────────────────────────────────

const eslintRules = [
  {
    rule: "react-hooks/rules-of-hooks",
    severity: "error",
    category: "React Hooks",
    bad: `// ❌ Hook called conditionally
const Component = ({ isLoggedIn }) => {
  if (isLoggedIn) {
    const [data, setData] = useState(null); // ESLint error!
  }
};`,
    good: `// ✅ Hook always at top level
const Component = ({ isLoggedIn }) => {
  const [data, setData] = useState(null); // always called

  if (!isLoggedIn) return null;
  return <div>{data}</div>;
};`,
    why: "React relies on call order to match state to hooks. Conditional calls break this.",
  },
  {
    rule: "react-hooks/exhaustive-deps",
    severity: "warn",
    category: "React Hooks",
    bad: `// ❌ userId missing from deps — stale closure
const UserCard = ({ userId }) => {
  useEffect(() => {
    fetchUser(userId); // uses userId
  }, []); // ESLint warns: missing userId
};`,
    good: `// ✅ All deps declared
const UserCard = ({ userId }) => {
  useEffect(() => {
    fetchUser(userId);
  }, [userId]); // re-runs when userId changes
};`,
    why: "Missing deps cause stale closures — the effect reads old values after re-renders.",
  },
  {
    rule: "react/no-array-index-key",
    severity: "warn",
    category: "React",
    bad: `// ❌ Index as key — breaks reconciliation on reorder
{items.map((item, index) => (
  <ListItem key={index} {...item} />
  // if items reorder, React reuses wrong DOM nodes
))}`,
    good: `// ✅ Stable unique id as key
{items.map(item => (
  <ListItem key={item.id} {...item} />
  // React correctly tracks each item
))}`,
    why: "Index keys cause wrong animations, lost input focus, and state bugs when list reorders.",
  },
  {
    rule: "@typescript-eslint/no-explicit-any",
    severity: "warn",
    category: "TypeScript",
    bad: `// ❌ any kills TypeScript's value
const processData = (data: any) => {
  return data.nonExistentProp; // no error caught!
};`,
    good: `// ✅ Use specific types or generics
const processData = <T extends { id: string }>(data: T): string => {
  return data.id; // TypeScript validates this
};`,
    why: "any opts out of type checking — you lose autocomplete and catch fewer bugs.",
  },
  {
    rule: "eqeqeq",
    severity: "error",
    category: "General",
    bad: `// ❌ Loose equality — surprising coercion
0 == false   // true (!)
"" == false  // true (!)
null == undefined  // true (!)`,
    good: `// ✅ Strict equality — no coercion
0 === false   // false (correct)
"" === false  // false (correct)
null === undefined  // false (correct)`,
    why: "== coerces types in unintuitive ways. === is always predictable.",
  },
  {
    rule: "no-console",
    severity: "warn",
    category: "General",
    bad: `// ❌ console.log left in production
const submitOrder = async (order) => {
  console.log("submitting", order); // leaks data in prod
  await api.post("/orders", order);
};`,
    good: `// ✅ Use a structured logger
import { logger } from "@/utils/logger";

const submitOrder = async (order) => {
  logger.info("submitting order", { orderId: order.id });
  await api.post("/orders", order);
};`,
    why: "console.log leaks sensitive data in production and pollutes user's console.",
  },
];

const EslintRulesDemo: React.FC = () => {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState<"bad" | "good">("bad");
  const rule = eslintRules[selected];

  const severityColor = rule.severity === "error" ? "#dc2626" : "#d97706";
  const severityBg = rule.severity === "error" ? "#fef2f2" : "#fffbeb";

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        ESLint Rules — Interactive Explorer
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Click a rule to see bad vs good code, and why the rule exists.
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {eslintRules.map((r, i) => (
          <button key={r.rule} onClick={() => { setSelected(i); setView("bad"); }} style={{
            ...pill(selected === i, severityColor),
            fontSize: 11,
          }}>
            {r.rule.split("/").pop()}
          </button>
        ))}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
        padding: "8px 12px", borderRadius: 8, background: severityBg,
        border: `1px solid ${severityColor}44`,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
          background: severityColor, color: "#fff",
          textTransform: "uppercase" as const,
        }}>{rule.severity}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: severityColor, fontFamily: "monospace" }}>
          {rule.rule}
        </span>
        <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>{rule.category}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setView("bad")} style={pill(view === "bad", "#dc2626")}>❌ Bad code</button>
        <button onClick={() => setView("good")} style={pill(view === "good", "#16a34a")}>✅ Good code</button>
      </div>

      <div style={codeBlock(view === "bad" ? "#fca5a5" : "#86efac")}>
        {view === "bad" ? rule.bad : rule.good}
      </div>

      <div style={{
        marginTop: 10, padding: "8px 12px", borderRadius: 8,
        background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 12, color: "#0369a1",
      }}>
        <strong>Why:</strong> {rule.why}
      </div>
    </div>
  );
};

// ─── DEMO 2 — Prettier settings ────────────────────────────────────────────────

const PrettierDemo: React.FC = () => {
  const settings = [
    {
      key: "printWidth: 80 vs 100",
      desc: "Max characters per line before wrapping",
      narrow: `// printWidth: 80
const result = someFunction(
  firstArgument,
  secondArgument,
  thirdArgument
);`,
      wide: `// printWidth: 100
const result = someFunction(firstArgument, secondArgument, thirdArgument);`,
    },
    {
      key: "trailingComma: es5",
      desc: "Trailing commas in objects and arrays",
      narrow: `// trailingComma: "none"
const obj = {
  a: 1,
  b: 2,
  c: 3
};`,
      wide: `// trailingComma: "es5"
const obj = {
  a: 1,
  b: 2,
  c: 3,  // ← trailing comma — cleaner git diffs
};`,
    },
    {
      key: "arrowParens: avoid",
      desc: "Parens around single arrow function args",
      narrow: `// arrowParens: "always"
const double = (x) => x * 2;
const greet = (name) => \`Hello, \${name}!\`;`,
      wide: `// arrowParens: "avoid"
const double = x => x * 2;
const greet = name => \`Hello, \${name}!\`;`,
    },
  ];

  const [selected, setSelected] = useState(0);
  const s = settings[selected];

  const prettierRc = `{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true
}`;

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Prettier — Automatic Code Formatting
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        One opinionated formatter — no debates about style. Formats on save or pre-commit.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <div style={sectionLabel()}>Settings explorer</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {settings.map((s, i) => (
              <button key={s.key} onClick={() => setSelected(i)} style={{
                ...pill(selected === i),
                textAlign: "left" as const,
                fontSize: 11,
              }}>
                {s.key}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>{s.desc}</div>
        </div>
        <div>
          <div style={sectionLabel("#64748b")}>Before</div>
          <div style={{ ...codeBlock("#fca5a5"), marginBottom: 8 }}>{s.narrow}</div>
          <div style={sectionLabel("#16a34a")}>After</div>
          <div style={codeBlock("#86efac")}>{s.wide}</div>
        </div>
      </div>

      <div>
        <div style={sectionLabel()}>Our .prettierrc</div>
        <div style={codeBlock()}>{prettierRc}</div>
      </div>
    </div>
  );
};

// ─── DEMO 3 — Husky + lint-staged pipeline ────────────────────────────────────

const HuskyDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      cmd: "git add src/Button.tsx",
      icon: "📁",
      label: "Stage files",
      detail: "You stage only changed files. lint-staged will only lint these.",
    },
    {
      cmd: "git commit -m 'fix: button state'",
      icon: "🔨",
      label: "git commit",
      detail: "Husky intercepts the commit and fires .husky/pre-commit before anything is saved.",
    },
    {
      cmd: "npx lint-staged",
      icon: "🔍",
      label: "lint-staged runs",
      detail: "Reads lint-staged config from package.json. Applies rules only to staged .ts/.tsx files.",
    },
    {
      cmd: "eslint --fix src/Button.tsx",
      icon: "🛠",
      label: "ESLint auto-fixes",
      detail: "Fixes what it can automatically (import order, quotes, semicolons). Errors block the commit.",
    },
    {
      cmd: "prettier --write src/Button.tsx",
      icon: "✨",
      label: "Prettier formats",
      detail: "Formats the file to match .prettierrc. Re-stages the file with fixes applied.",
    },
    {
      cmd: "✅ Commit succeeds",
      icon: "✅",
      label: "Commit saved",
      detail: "Only if all checks passed. The committed code is guaranteed lint-clean and formatted.",
    },
  ];

  const packageJsonConfig = `// package.json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \\"src/**/*.{ts,tsx,css}\\""
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{css,json}": [
      "prettier --write"
    ]
  }
}`;

  const huskyHook = `# .husky/pre-commit
#!/bin/sh
npx lint-staged`;

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Husky + lint-staged — Pre-commit Pipeline
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Every commit is automatically linted and formatted — bad code cannot be committed.
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 16, overflowX: "auto" }}>
        {steps.map((s, i) => (
          <div
            key={i}
            onClick={() => setActiveStep(activeStep === i ? null : i)}
            style={{
              flex: "0 0 auto",
              minWidth: 90,
              padding: "10px 8px",
              textAlign: "center",
              cursor: "pointer",
              background: activeStep === i ? "#eff6ff" : "#f8fafc",
              border: "1px solid",
              borderColor: activeStep === i ? "#3b82f6" : "#e2e8f0",
              borderRadius: i === 0 ? "8px 0 0 8px" : i === steps.length - 1 ? "0 8px 8px 0" : 0,
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: "#475569", lineHeight: 1.3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {activeStep !== null && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: 8, fontSize: 12,
          background: "#eff6ff", border: "1px solid #93c5fd", color: "#1e40af",
        }}>
          <div style={{ fontFamily: "monospace", fontWeight: 700, marginBottom: 4 }}>
            {steps[activeStep].cmd}
          </div>
          {steps[activeStep].detail}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={sectionLabel()}>package.json config</div>
          <div style={codeBlock()}>{packageJsonConfig}</div>
        </div>
        <div>
          <div style={sectionLabel()}>pre-commit hook</div>
          <div style={{ ...codeBlock(), marginBottom: 10 }}>{huskyHook}</div>
          <div style={{
            padding: "10px 12px", borderRadius: 8, fontSize: 11,
            background: "#f0fdf4", border: "1px solid #86efac", color: "#166534",
          }}>
            <strong>Setup:</strong><br />
            <span style={{ fontFamily: "monospace" }}>npm install --save-dev husky lint-staged</span><br />
            <span style={{ fontFamily: "monospace" }}>npx husky init</span><br />
            <span style={{ fontFamily: "monospace" }}>echo "npx lint-staged" {">"} .husky/pre-commit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DEMO 4 — Code review patterns ────────────────────────────────────────────

const CodeReviewDemo: React.FC = () => {
  const patterns = [
    {
      title: "Single Responsibility",
      icon: "🎯",
      color: "#6366f1",
      bad: `// ❌ God component — fetching + filtering + sorting + UI
const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("asc");

  useEffect(() => { fetch("/api/products").then(...) }, []);

  const filtered = products.filter(p => p.name.includes(filter));
  const sorted = filtered.sort((a, b) => ...);

  return (
    <div>
      <input onChange={e => setFilter(e.target.value)} />
      <select onChange={e => setSort(e.target.value)}>...</select>
      {sorted.map(p => <div key={p.id}>...</div>)}
    </div>
  );
};`,
      good: `// ✅ Split: hook for data, components for UI
const useProducts = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => { fetch("/api/products").then(...) }, []);
  return products;
};

const ProductFilters = ({ filter, sort, onChange }) => (
  // just the filter UI
);

const ProductList = ({ products }) => (
  // just the list UI
);

const ProductPage = () => {
  const products = useProducts();          // data
  const { filtered, filter, sort, set } = useProductFilter(products); // logic
  return (
    <>
      <ProductFilters filter={filter} sort={sort} onChange={set} />
      <ProductList products={filtered} />
    </>
  );
};`,
    },
    {
      title: "DRY — Extract + Reuse",
      icon: "♻️",
      color: "#0891b2",
      bad: `// ❌ Same loading/error UI repeated in 5 components
const UserPage = () => {
  if (loading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  return <UserProfile user={data} />;
};

const ProductPage = () => {
  if (loading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  return <ProductList products={data} />;
};`,
      good: `// ✅ Extracted once, used everywhere
const AsyncView = ({ loading, error, children }) => {
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;
  return <>{children}</>;
};

const UserPage = () => (
  <AsyncView loading={loading} error={error}>
    <UserProfile user={data} />
  </AsyncView>
);`,
    },
    {
      title: "Naming Conventions",
      icon: "📝",
      color: "#16a34a",
      bad: `// ❌ Poor naming — unclear intent
const fn = (x) => x * 2;
const Comp = ({ d, f, s }) => <div onClick={f}>{d}</div>;

const [v, sv] = useState(false);
if (v) { ... }

const data2 = users.filter(u => u.a === "admin");`,
      good: `// ✅ Clear, self-documenting names
const double = (value) => value * 2;
const UserCard = ({ data, onEdit, isSelected }) => (
  <div onClick={onEdit}>{data.name}</div>
);

const [isModalOpen, setIsModalOpen] = useState(false);
if (isModalOpen) { ... }

const adminUsers = users.filter(u => u.role === ROLE.ADMIN);`,
    },
    {
      title: "No Magic Numbers",
      icon: "🔢",
      color: "#d97706",
      bad: `// ❌ Magic numbers — what do these mean?
if (retries > 3) throw new Error("failed");
if (text.length > 280) return "Too long";
const delay = 5 * 60 * 1000; // what is this?
const discount = price * 0.15;`,
      good: `// ✅ Named constants — self-documenting
const MAX_RETRIES = 3;
const MAX_TWEET_LENGTH = 280;
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const SENIOR_DISCOUNT_RATE = 0.15;

if (retries > MAX_RETRIES) throw new Error("failed");
if (text.length > MAX_TWEET_LENGTH) return "Too long";
const delay = SESSION_TIMEOUT_MS;
const discount = price * SENIOR_DISCOUNT_RATE;`,
    },
  ];

  const [selected, setSelected] = useState(0);
  const [view, setView] = useState<"bad" | "good">("bad");
  const p = patterns[selected];

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Code Review Patterns
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Common feedback in React code reviews — and how to address it.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {patterns.map((pat, i) => (
          <button key={pat.title} onClick={() => { setSelected(i); setView("bad"); }} style={{
            ...pill(selected === i, pat.color),
          }}>
            {pat.icon} {pat.title}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => setView("bad")} style={pill(view === "bad", "#dc2626")}>❌ Before</button>
        <button onClick={() => setView("good")} style={pill(view === "good", "#16a34a")}>✅ After</button>
      </div>

      <div style={codeBlock(view === "bad" ? "#fca5a5" : "#86efac")}>
        {view === "bad" ? p.bad : p.good}
      </div>
    </div>
  );
};

// ─── REFERENCE — Checklist ─────────────────────────────────────────────────────

const ChecklistPanel: React.FC = () => {
  const sections = [
    {
      title: "ESLint Setup",
      color: "#6366f1",
      bg: "#f5f3ff",
      items: [
        "eslint.config.js (flat config, ESLint v9+)",
        "@typescript-eslint/parser + plugin",
        "eslint-plugin-react + eslint-plugin-react-hooks",
        "eslint-plugin-jsx-a11y for accessibility",
        "eslint-config-prettier disables formatting conflicts",
        "eslint-plugin-prettier runs Prettier as a rule",
      ],
    },
    {
      title: "Prettier Setup",
      color: "#0891b2",
      bg: "#ecfeff",
      items: [
        ".prettierrc — printWidth, singleQuote, semi, trailingComma",
        ".prettierignore — exclude node_modules, build, dist",
        "Format on save in VSCode (editor.formatOnSave: true)",
        "Format check in CI: prettier --check",
        "eslint-config-prettier — always add last in extends",
      ],
    },
    {
      title: "Husky + lint-staged",
      color: "#16a34a",
      bg: "#f0fdf4",
      items: [
        "npm install --save-dev husky lint-staged",
        "npx husky init — creates .husky/",
        "pre-commit hook: npx lint-staged",
        "package.json: lint-staged config per glob",
        "prepare script: husky — auto-installs on npm install",
        "Blocks commit if ESLint errors exist",
      ],
    },
    {
      title: "Code Review Checklist",
      color: "#d97706",
      bg: "#fffbeb",
      items: [
        "Does each component do ONE thing? (SRP)",
        "Is logic in custom hooks, not JSX?",
        "Are there duplicated patterns to extract?",
        "Are all names clear without comments?",
        "Are magic numbers replaced with constants?",
        "Do event handlers start with 'handle'?",
        "Do boolean props start with 'is'/'has'/'can'?",
        "Are all useEffect deps complete?",
      ],
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
      {sections.map(s => (
        <div key={s.title} style={{ ...card(), background: s.bg, borderColor: s.color + "33" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: s.color, marginBottom: 10 }}>
            {s.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {s.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 11 }}>
                <span style={{ color: s.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ color: "#374151" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── ROOT EXPLAINER ───────────────────────────────────────────────────────────

export const CodeQualityExplainer: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", color: "#0f172a", fontSize: 22 }}>
          Senior — Code Quality
        </h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          ESLint + Prettier · Husky + lint-staged · Code Review Patterns
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <EslintRulesDemo />
        <PrettierDemo />
        <HuskyDemo />
        <CodeReviewDemo />

        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 10 }}>
            Setup Checklist
          </div>
          <ChecklistPanel />
        </div>
      </div>
    </div>
  );
};

export default CodeQualityExplainer;
