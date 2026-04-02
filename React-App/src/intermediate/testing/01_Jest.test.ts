// TOPIC: Jest — Core Concepts
//
// Jest is a JavaScript test runner. It finds files ending in .test.ts/.test.tsx
// and runs them. No browser needed — runs in Node with jsdom.
//
// Key concepts:
//   describe()   — group related tests
//   it() / test()— individual test case
//   expect()     — assertion — what you expect the value to be
//   Matchers     — .toBe(), .toEqual(), .toBeTruthy(), etc.
//   beforeEach() — run setup before each test in a describe block
//   afterEach()  — run cleanup after each test
//   jest.fn()    — create a mock function
//   jest.spyOn() — spy on an existing method
//
// Run: npm test

// ════════════════════════════════════════════════════════════
// 1. Basic matchers
// ════════════════════════════════════════════════════════════

describe("Basic Matchers", () => {
  it("toBe — strict equality (===), use for primitives", () => {
    expect(2 + 2).toBe(4);
    expect("hello").toBe("hello");
    expect(true).toBe(true);
  });

  it("toEqual — deep equality, use for objects and arrays", () => {
    // toBe would FAIL here — different object references
    // toEqual checks value equality recursively
    expect({ name: "Alice", age: 30 }).toEqual({ name: "Alice", age: 30 });
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it("not — negates any matcher", () => {
    expect(5).not.toBe(10);
    expect({ a: 1 }).not.toEqual({ a: 2 });
  });

  it("truthiness matchers", () => {
    expect(true).toBeTruthy();
    expect(1).toBeTruthy();
    expect("hello").toBeTruthy();

    expect(false).toBeFalsy();
    expect(0).toBeFalsy();
    expect("").toBeFalsy();
    expect(null).toBeFalsy();
    expect(undefined).toBeFalsy();
  });

  it("toBeNull / toBeUndefined / toBeDefined", () => {
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect("value").toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════
// 2. Number matchers
// ════════════════════════════════════════════════════════════

describe("Number Matchers", () => {
  it("toBeGreaterThan / toBeLessThan", () => {
    expect(10).toBeGreaterThan(5);
    expect(10).toBeGreaterThanOrEqual(10);
    expect(3).toBeLessThan(5);
    expect(3).toBeLessThanOrEqual(3);
  });

  it("toBeCloseTo — for floating point", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    // toBe(0.3) would FAIL — use toBeCloseTo instead
    expect(0.1 + 0.2).toBeCloseTo(0.3, 5); // 5 decimal places
  });
});

// ════════════════════════════════════════════════════════════
// 3. String matchers
// ════════════════════════════════════════════════════════════

describe("String Matchers", () => {
  it("toContain — substring check", () => {
    expect("Hello, World!").toContain("World");
  });

  it("toMatch — regex check", () => {
    expect("hello@example.com").toMatch(/\S+@\S+\.\S+/);
    expect("Error: something went wrong").toMatch(/^Error/);
  });

  it("toHaveLength", () => {
    expect("hello").toHaveLength(5);
    expect([1, 2, 3]).toHaveLength(3);
  });
});

// ════════════════════════════════════════════════════════════
// 4. Array matchers
// ════════════════════════════════════════════════════════════

describe("Array Matchers", () => {
  it("toContain — item in array", () => {
    expect(["apple", "banana", "cherry"]).toContain("banana");
  });

  it("toEqual — full array comparison", () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it("expect.arrayContaining — subset match", () => {
    // Array has at LEAST these items (order doesn't matter)
    expect(["a", "b", "c", "d"]).toEqual(expect.arrayContaining(["b", "d"]));
  });
});

// ════════════════════════════════════════════════════════════
// 5. beforeEach / afterEach — setup and teardown
// ════════════════════════════════════════════════════════════

describe("Setup and Teardown", () => {
  let counter = 0;

  // Runs before EACH test in this describe block
  beforeEach(() => {
    counter = 0; // reset state so tests don't affect each other
  });

  it("starts at 0", () => {
    expect(counter).toBe(0);
  });

  it("increments to 1", () => {
    counter++;
    expect(counter).toBe(1);
  });

  it("starts at 0 again (beforeEach reset it)", () => {
    expect(counter).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════
// 6. Mock functions — jest.fn()
// ════════════════════════════════════════════════════════════

describe("Mock Functions (jest.fn)", () => {
  it("tracks calls and arguments", () => {
    const mockFn = jest.fn();

    mockFn("hello");
    mockFn("world");

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith("hello");
    expect(mockFn).toHaveBeenLastCalledWith("world");
  });

  it("can return a value", () => {
    const mockAdd = jest.fn((a: number, b: number) => a + b);
    expect(mockAdd(2, 3)).toBe(5);
    expect(mockAdd).toHaveBeenCalledWith(2, 3);
  });

  it("mockReturnValue / mockResolvedValue", () => {
    const mockFn = jest.fn().mockReturnValue(42);
    expect(mockFn()).toBe(42);
    expect(mockFn()).toBe(42); // always returns 42

    const mockAsync = jest.fn().mockResolvedValue({ id: 1, name: "Alice" });
    return mockAsync().then((result: { id: number; name: string }) => {
      expect(result).toEqual({ id: 1, name: "Alice" });
    });
  });

  it("mockReturnValueOnce — return different values per call", () => {
    const mockFn = jest.fn()
      .mockReturnValueOnce("first")
      .mockReturnValueOnce("second")
      .mockReturnValue("default");

    expect(mockFn()).toBe("first");
    expect(mockFn()).toBe("second");
    expect(mockFn()).toBe("default");
    expect(mockFn()).toBe("default");
  });
});

// ════════════════════════════════════════════════════════════
// 7. Testing async code
// ════════════════════════════════════════════════════════════

// Simulated async functions
const fetchUser = async (id: number) => {
  if (id <= 0) throw new Error("Invalid ID");
  return { id, name: `User ${id}` };
};

describe("Async Tests", () => {
  it("async/await — success case", async () => {
    const user = await fetchUser(1);
    expect(user).toEqual({ id: 1, name: "User 1" });
  });

  it("async/await — error case with rejects", async () => {
    await expect(fetchUser(-1)).rejects.toThrow("Invalid ID");
  });

  it("Promise resolves", () => {
    // Return the promise — Jest waits for it
    return fetchUser(2).then((user) => {
      expect(user.name).toBe("User 2");
    });
  });
});

// ════════════════════════════════════════════════════════════
// 8. Testing pure functions (real-world example)
// ════════════════════════════════════════════════════════════

// Pure utility functions — easiest to test, no React needed
const formatPrice = (cents: number): string =>
  `$${(cents / 100).toFixed(2)}`;

const filterByCategory = (
  items: { name: string; category: string }[],
  category: string
) => items.filter((i) => i.category === category);

const calculateDiscount = (price: number, pct: number): number =>
  Math.round(price * (1 - pct / 100));

describe("Pure Utility Functions", () => {
  describe("formatPrice", () => {
    it("formats cents to dollar string", () => {
      expect(formatPrice(1000)).toBe("$10.00");
      expect(formatPrice(99)).toBe("$0.99");
      expect(formatPrice(0)).toBe("$0.00");
    });
  });

  describe("filterByCategory", () => {
    const products = [
      { name: "Apple",  category: "fruit" },
      { name: "Banana", category: "fruit" },
      { name: "Carrot", category: "veggie" },
    ];

    it("returns only matching category", () => {
      expect(filterByCategory(products, "fruit")).toHaveLength(2);
      expect(filterByCategory(products, "veggie")).toHaveLength(1);
    });

    it("returns empty array when no match", () => {
      expect(filterByCategory(products, "dairy")).toEqual([]);
    });
  });

  describe("calculateDiscount", () => {
    it("applies percentage discount correctly", () => {
      expect(calculateDiscount(100, 20)).toBe(80);  // 20% off
      expect(calculateDiscount(200, 50)).toBe(100); // 50% off
      expect(calculateDiscount(99, 0)).toBe(99);    // no discount
    });
  });
});
