// TOPIC: Code Quality (Senior)
// LEVEL: Senior — Code Quality
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. ESLint + Prettier — static analysis + automatic formatting
//   2. Husky + lint-staged — enforce quality on every git commit
//   3. Code Reviews — patterns, refactoring, clean code for React
//
// ─── ESLINT ──────────────────────────────────────────────────────────────────
//
//   ESLint catches bugs and enforces style before you run the code.
//   Key rule categories for React + TypeScript:
//
//   @typescript-eslint/no-unused-vars     — catch dead code
//   @typescript-eslint/no-explicit-any    — keep types strict
//   react-hooks/rules-of-hooks            — hooks must be at top level
//   react-hooks/exhaustive-deps           — all deps in useEffect arrays
//   react/no-array-index-key              — prefer stable keys
//   react/jsx-no-target-blank             — require rel="noopener noreferrer"
//   eqeqeq                                — always === not ==
//   no-console                            — use a logger in production
//
// ─── PRETTIER ─────────────────────────────────────────────────────────────────
//
//   Prettier auto-formats code — no arguments about style.
//   Key settings (.prettierrc):
//     printWidth: 100       — line length before wrapping
//     singleQuote: false    — double quotes
//     semi: true            — always semicolons
//     trailingComma: "es5"  — trailing commas where valid in ES5
//     arrowParens: "avoid"  — x => x not (x) => x
//
//   eslint-config-prettier disables ESLint formatting rules that conflict.
//   eslint-plugin-prettier runs Prettier as an ESLint rule.
//
// ─── HUSKY + LINT-STAGED ─────────────────────────────────────────────────────
//
//   Husky installs git hooks — scripts that run at specific git events.
//   lint-staged runs linters only on git-staged files (fast!).
//
//   Flow on `git commit`:
//   1. Husky fires .husky/pre-commit
//   2. lint-staged reads its config from package.json
//   3. For each staged .ts/.tsx file: eslint --fix → prettier --write
//   4. Fixed files are re-staged automatically
//   5. Commit only succeeds if all checks pass
//
// ─── CODE REVIEWS — CLEAN REACT PATTERNS ─────────────────────────────────────
//
//   Single Responsibility Principle (SRP):
//     Each component/function does ONE thing.
//     Large "god components" → split into smaller focused pieces.
//
//   Don't Repeat Yourself (DRY):
//     Repeated UI → extract component.
//     Repeated logic → extract custom hook.
//
//   Separation of concerns:
//     Business logic in hooks, not JSX.
//     Presentational components receive data via props.
//
//   Naming conventions:
//     Components: PascalCase — UserProfile, not userProfile
//     Hooks: camelCase starting with "use" — useCart, useAuth
//     Event handlers: handle prefix — handleSubmit, handleClick
//     Boolean props: is/has/can — isLoading, hasError, canEdit
//
//   Magic numbers / strings:
//     const MAX_RETRIES = 3; — not the literal 3 everywhere
//     const ROLE = { ADMIN: "admin", USER: "user" } — not "admin" strings

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES & PATTERNS UNDER TEST
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Pure utility functions — extracted from components ─────────────────────

const formatCurrency = (amount: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

const truncate = (text: string, maxLen: number): string =>
  text.length <= maxLen ? text : `${text.slice(0, maxLen).trimEnd()}…`;

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const classNames = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(" ");

// ── 2. Constants — no magic numbers/strings scattered in code ─────────────────

const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

const ROLE = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

type Role = (typeof ROLE)[keyof typeof ROLE];

// ── 3. Permission helper — business logic outside JSX ─────────────────────────

const canEdit = (role: Role): boolean => role === ROLE.ADMIN || role === ROLE.EDITOR;
const canDelete = (role: Role): boolean => role === ROLE.ADMIN;
const canPublish = (role: Role, isOwner: boolean): boolean =>
  role === ROLE.ADMIN || (role === ROLE.EDITOR && isOwner);

// ── 4. Custom hook — extracts state logic from component ──────────────────────

interface UseCounterOptions {
  initial?: number;
  min?: number;
  max?: number;
  step?: number;
}

const useCounter = ({ initial = 0, min = -Infinity, max = Infinity, step = 1 }: UseCounterOptions = {}) => {
  const [count, setCount] = useState(initial);

  const increment = useCallback(
    () => setCount(c => Math.min(c + step, max)),
    [step, max]
  );
  const decrement = useCallback(
    () => setCount(c => Math.max(c - step, min)),
    [step, min]
  );
  const reset = useCallback(() => setCount(initial), [initial]);

  const canIncrement = count < max;
  const canDecrement = count > min;

  return { count, increment, decrement, reset, canIncrement, canDecrement };
};

// ── 5. usePagination — logic extracted, easily testable ───────────────────────

interface UsePaginationOptions {
  total: number;
  pageSize?: number;
  initialPage?: number;
}

const usePagination = ({ total, pageSize = 10, initialPage = 1 }: UsePaginationOptions) => {
  const [page, setPage] = useState(initialPage);
  const totalPages = Math.ceil(total / pageSize);

  const goTo = useCallback(
    (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages]
  );

  const nextPage = useCallback(() => goTo(page + 1), [goTo, page]);
  const prevPage = useCallback(() => goTo(page - 1), [goTo, page]);

  const offset = (page - 1) * pageSize;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  return { page, totalPages, goTo, nextPage, prevPage, offset, isFirstPage, isLastPage, pageNumbers };
};

// ── 6. useDebounce — extracted reusable hook ──────────────────────────────────

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

// ── 7. Component: SRP — does ONE thing ────────────────────────────────────────

// ❌ BAD PATTERN (not used in tests — shown in explainer):
// const GodComponent = () => { /* fetching + filtering + sorting + UI all in one */ }

// ✅ GOOD: Data fetching separated from presentation
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (id: number) => void;
  isInCart: boolean;
}> = ({ product, onAddToCart, isInCart }) => (
  <div data-testid={`product-${product.id}`}>
    <h3>{product.name}</h3>
    <p data-testid={`price-${product.id}`}>{formatCurrency(product.price)}</p>
    <button
      onClick={() => onAddToCart(product.id)}
      disabled={isInCart}
      aria-label={isInCart ? `${product.name} in cart` : `Add ${product.name} to cart`}
    >
      {isInCart ? "In cart" : "Add to cart"}
    </button>
  </div>
);

// ── 8. Component: DRY — extracted StatusBadge instead of repeating ────────────

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const labels: Record<Status, string> = {
    idle: "Idle",
    loading: "Loading…",
    success: "Success",
    error: "Error",
  };
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      aria-live="polite"
    >
      {labels[status]}
    </span>
  );
};

// ── 9. Component: naming conventions ──────────────────────────────────────────

interface UserAvatarProps {
  name: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, isOnline = false, size = "md" }) => {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = { sm: "32px", md: "40px", lg: "56px" }[size];

  return (
    <div
      data-testid="user-avatar"
      aria-label={`${name}${isOnline ? " (online)" : ""}`}
      style={{ width: sizeClass, height: sizeClass }}
    >
      <span data-testid="initials">{initials}</span>
      {isOnline && <span data-testid="online-indicator" aria-hidden="true" />}
    </div>
  );
};

// ── 10. Refactoring: event handler naming ─────────────────────────────────────

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, placeholder = "Search…" }) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div>
      <label htmlFor="search">Search</label>
      <input
        id="search"
        type="search"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Search"
      />
      {query && (
        <button onClick={handleClear} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PURE UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Pure utility functions", () => {
  describe("formatCurrency", () => {
    it("formats USD correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });

    it("supports other currencies", () => {
      expect(formatCurrency(42, "EUR")).toContain("42");
    });
  });

  describe("truncate", () => {
    it("leaves short strings unchanged", () => {
      expect(truncate("Hello", 10)).toBe("Hello");
      expect(truncate("Hello", 5)).toBe("Hello");
    });

    it("truncates long strings with ellipsis", () => {
      const result = truncate("Hello World", 5);
      expect(result).toHaveLength(6); // 5 chars + ellipsis
      expect(result).toContain("…");
    });
  });

  describe("slugify", () => {
    it("converts to lowercase with hyphens", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("React Hooks 101")).toBe("react-hooks-101");
    });

    it("strips special characters", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
      expect(slugify("foo & bar")).toBe("foo-bar");
    });

    it("trims leading/trailing hyphens", () => {
      expect(slugify("  hello  ")).toBe("hello");
    });
  });

  describe("classNames", () => {
    it("joins class strings", () => {
      expect(classNames("foo", "bar")).toBe("foo bar");
    });

    it("filters out falsy values", () => {
      expect(classNames("foo", false, null, undefined, "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const isDisabled = false;
      expect(classNames("btn", isActive && "btn-active", isDisabled && "btn-disabled")).toBe(
        "btn btn-active"
      );
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CONSTANTS — NO MAGIC STRINGS
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Constants & permission helpers", () => {
  it("STATUS object has all expected keys", () => {
    expect(STATUS.IDLE).toBe("idle");
    expect(STATUS.LOADING).toBe("loading");
    expect(STATUS.SUCCESS).toBe("success");
    expect(STATUS.ERROR).toBe("error");
  });

  it("canEdit — admin and editor can edit, viewer cannot", () => {
    expect(canEdit(ROLE.ADMIN)).toBe(true);
    expect(canEdit(ROLE.EDITOR)).toBe(true);
    expect(canEdit(ROLE.VIEWER)).toBe(false);
  });

  it("canDelete — only admin can delete", () => {
    expect(canDelete(ROLE.ADMIN)).toBe(true);
    expect(canDelete(ROLE.EDITOR)).toBe(false);
    expect(canDelete(ROLE.VIEWER)).toBe(false);
  });

  it("canPublish — admin always can; editor only if owner", () => {
    expect(canPublish(ROLE.ADMIN, false)).toBe(true);
    expect(canPublish(ROLE.EDITOR, true)).toBe(true);
    expect(canPublish(ROLE.EDITOR, false)).toBe(false);
    expect(canPublish(ROLE.VIEWER, true)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CUSTOM HOOKS — LOGIC EXTRACTED FROM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — useCounter custom hook", () => {
  // Test via a simple wrapper component
  const Counter: React.FC<UseCounterOptions> = props => {
    const { count, increment, decrement, reset, canIncrement, canDecrement } = useCounter(props);
    return (
      <div>
        <span data-testid="count">{count}</span>
        <button onClick={increment} disabled={!canIncrement}>+</button>
        <button onClick={decrement} disabled={!canDecrement}>−</button>
        <button onClick={reset}>Reset</button>
      </div>
    );
  };

  it("initializes with default value of 0", () => {
    render(<Counter />);
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("increments and decrements by step", async () => {
    const user = userEvent.setup();
    render(<Counter initial={5} step={2} />);
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getByTestId("count")).toHaveTextContent("7");
    await user.click(screen.getByRole("button", { name: "−" }));
    expect(screen.getByTestId("count")).toHaveTextContent("5");
  });

  it("respects min and max bounds", async () => {
    const user = userEvent.setup();
    render(<Counter initial={0} min={0} max={2} />);
    const dec = screen.getByRole("button", { name: "−" });
    const inc = screen.getByRole("button", { name: "+" });
    expect(dec).toBeDisabled();
    await user.click(inc);
    await user.click(inc);
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(inc).toBeDisabled();
  });

  it("resets to initial value", async () => {
    const user = userEvent.setup();
    render(<Counter initial={10} />);
    await user.click(screen.getByRole("button", { name: "+" }));
    await user.click(screen.getByRole("button", { name: "+" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByTestId("count")).toHaveTextContent("10");
  });
});

describe("3 — usePagination custom hook", () => {
  const Paginator: React.FC<UsePaginationOptions> = props => {
    const { page, totalPages, nextPage, prevPage, isFirstPage, isLastPage, offset } =
      usePagination(props);
    return (
      <div>
        <span data-testid="page">{page}</span>
        <span data-testid="total">{totalPages}</span>
        <span data-testid="offset">{offset}</span>
        <button onClick={prevPage} disabled={isFirstPage}>Prev</button>
        <button onClick={nextPage} disabled={isLastPage}>Next</button>
      </div>
    );
  };

  it("calculates total pages from total and pageSize", () => {
    render(<Paginator total={95} pageSize={10} />);
    expect(screen.getByTestId("total")).toHaveTextContent("10");
  });

  it("calculates correct offset for current page", () => {
    render(<Paginator total={100} pageSize={10} initialPage={3} />);
    expect(screen.getByTestId("offset")).toHaveTextContent("20");
  });

  it("disables prev on first page, next on last page", async () => {
    const user = userEvent.setup();
    render(<Paginator total={20} pageSize={10} />);
    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("navigates forward and backward", async () => {
    const user = userEvent.setup();
    render(<Paginator total={50} pageSize={10} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("page")).toHaveTextContent("3");
    await user.click(screen.getByRole("button", { name: "Prev" }));
    expect(screen.getByTestId("page")).toHaveTextContent("2");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SRP & DRY — FOCUSED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — Single Responsibility — ProductCard", () => {
  const product: Product = { id: 1, name: "Widget Pro", price: 29.99, category: "tools" };
  const noop = () => {};

  it("displays formatted price", () => {
    render(<ProductCard product={product} onAddToCart={noop} isInCart={false} />);
    expect(screen.getByTestId("price-1")).toHaveTextContent("$29.99");
  });

  it("calls onAddToCart with product id", async () => {
    const user = userEvent.setup();
    const handleAdd = jest.fn();
    render(<ProductCard product={product} onAddToCart={handleAdd} isInCart={false} />);
    await user.click(screen.getByRole("button", { name: /add widget pro/i }));
    expect(handleAdd).toHaveBeenCalledWith(1);
  });

  it("disables button and changes label when in cart", () => {
    render(<ProductCard product={product} onAddToCart={noop} isInCart={true} />);
    const btn = screen.getByRole("button", { name: /widget pro in cart/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("In cart");
  });
});

describe("4 — DRY — StatusBadge", () => {
  it.each([
    [STATUS.IDLE, "Idle"],
    [STATUS.LOADING, "Loading…"],
    [STATUS.SUCCESS, "Success"],
    [STATUS.ERROR, "Error"],
  ] as [Status, string][])(
    "shows correct label for status %s",
    (status, label) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByTestId("status-badge")).toHaveTextContent(label);
    }
  );

  it("sets data-status attribute for CSS targeting", () => {
    render(<StatusBadge status={STATUS.ERROR} />);
    expect(screen.getByTestId("status-badge")).toHaveAttribute("data-status", "error");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. NAMING CONVENTIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe("5 — Naming conventions — UserAvatar", () => {
  it("derives initials from name (PascalCase component, boolean isOnline prop)", () => {
    render(<UserAvatar name="Jane Doe" />);
    expect(screen.getByTestId("initials")).toHaveTextContent("JD");
  });

  it("shows online indicator when isOnline=true", () => {
    render(<UserAvatar name="Jane Doe" isOnline />);
    expect(screen.getByTestId("online-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("user-avatar")).toHaveAttribute(
      "aria-label",
      "Jane Doe (online)"
    );
  });

  it("hides online indicator by default (isOnline=false)", () => {
    render(<UserAvatar name="John Smith" />);
    expect(screen.queryByTestId("online-indicator")).not.toBeInTheDocument();
  });

  it("handles single-word names", () => {
    render(<UserAvatar name="Madonna" />);
    expect(screen.getByTestId("initials")).toHaveTextContent("M");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. HANDLER NAMING & DEBOUNCE PATTERN
// ═══════════════════════════════════════════════════════════════════════════════

describe("6 — SearchBox — handleChange, handleClear, useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("calls onSearch with debounced value after delay", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const handleSearch = jest.fn();
    render(<SearchBox onSearch={handleSearch} />);

    await user.type(screen.getByRole("searchbox"), "react");
    // debounced — "react" not fired yet (only the initial "" call happened)
    expect(handleSearch).not.toHaveBeenCalledWith("react");

    jest.advanceTimersByTime(300);
    await waitFor(() => expect(handleSearch).toHaveBeenCalledWith("react"));
  });

  it("shows clear button only when query is non-empty", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBox onSearch={() => {}} />);

    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    await user.type(screen.getByRole("searchbox"), "h");
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("handleClear resets query and hides clear button", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBox onSearch={() => {}} />);

    await user.type(screen.getByRole("searchbox"), "hello");
    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });
});
