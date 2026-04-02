// TOPIC: Accessibility Testing with jest-axe
//
// jest-axe runs the axe-core accessibility engine against your rendered components.
// It catches violations that affect screen reader users, keyboard users, and people
// with visual disabilities — automatically, without manual ARIA audits.
//
// What axe checks (subset):
//   - Images must have alt text
//   - Form inputs must have labels
//   - Buttons must have accessible names
//   - Color contrast ratios (only in browser — not jsdom)
//   - Heading hierarchy (h1 → h2 → h3, no skipping)
//   - ARIA roles must be used correctly
//   - Interactive elements must be focusable
//   - Landmark regions (main, nav, header, footer)
//
// Rule: Run toHaveNoViolations() on EVERY component you ship to production.
//       This catches the low-hanging a11y fruit for free.
//
// Setup:
//   import { axe, toHaveNoViolations } from "jest-axe";
//   expect.extend(toHaveNoViolations);

import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// ════════════════════════════════════════════════════════════
// Components — accessible versions
// ════════════════════════════════════════════════════════════

// Good: proper label, role, semantics
const AccessibleForm = () => (
  <form aria-label="Contact form">
    <div>
      <label htmlFor="name">Full Name</label>
      <input id="name" type="text" autoComplete="name" />
    </div>
    <div>
      <label htmlFor="email">Email Address</label>
      <input id="email" type="email" autoComplete="email" />
    </div>
    <div>
      <label htmlFor="message">Message</label>
      <textarea id="message" rows={4} />
    </div>
    <button type="submit">Send Message</button>
  </form>
);

// Good: semantic list, proper headings
const ArticleCard = ({ title, excerpt, author }: {
  title: string;
  excerpt: string;
  author: string;
}) => (
  <article>
    <h2>{title}</h2>
    <p>{excerpt}</p>
    <footer>
      <p>By <strong>{author}</strong></p>
    </footer>
  </article>
);

// Good: accessible navigation with landmark
const NavBar = () => (
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
);

// Good: icon button with aria-label
const IconButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button type="button" aria-label={label} onClick={onClick}>
    {/* SVG icon — no visible text, so aria-label is required */}
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16">
      <path d="M8 0L16 8L8 16L0 8Z" />
    </svg>
  </button>
);

// Good: accessible modal / dialog
const Modal = ({ title, children, onClose }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">{title}</h2>
    <div>{children}</div>
    <button type="button" onClick={onClose}>Close</button>
  </div>
);

// Good: accessible data table
const DataTable = ({ rows }: { rows: { name: string; role: string; status: string }[] }) => (
  <table>
    <caption>Team Members</caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Role</th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i}>
          <td>{row.name}</td>
          <td>{row.role}</td>
          <td>{row.status}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Good: accessible alert / notification
const AlertBanner = ({ message, type }: { message: string; type: "success" | "error" | "info" }) => (
  <div
    role="alert"
    aria-live="polite"
    style={{ padding: "8px 16px", background: type === "error" ? "#fee" : "#efe" }}
  >
    {message}
  </div>
);

// Good: accessible toggle (checkbox styled as switch)
const Toggle = ({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <label>
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={onChange}
      aria-checked={checked}
    />
    {label}
  </label>
);

// Bad examples — intentionally inaccessible, tested below to SHOW violations
const InaccessibleForm = () => (
  <form>
    {/* No labels — input has no accessible name */}
    <input type="text" placeholder="Name" />
    <input type="email" placeholder="Email" />
    {/* button with no text or aria-label */}
    <button>
      <span aria-hidden="true">→</span>
    </button>
  </form>
);

const InaccessibleImage = () => (
  // Missing alt attribute
  // eslint-disable-next-line jsx-a11y/alt-text
  <img src="photo.jpg" />
);

// ════════════════════════════════════════════════════════════
// 1. Accessible components — expect no violations
// ════════════════════════════════════════════════════════════

describe("1 — Accessible components (no violations expected)", () => {
  it("accessible form has no a11y violations", async () => {
    const { container } = render(<AccessibleForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("article card has no a11y violations", async () => {
    const { container } = render(
      <ArticleCard
        title="Testing Best Practices"
        excerpt="Enterprise testing is critical for quality."
        author="Alice Johnson"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("navigation has no a11y violations", async () => {
    const { container } = render(<NavBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("icon button with aria-label has no violations", async () => {
    const { container } = render(<IconButton label="Submit form" onClick={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("modal dialog has no a11y violations", async () => {
    const { container } = render(
      <Modal title="Confirm Action" onClose={() => {}}>
        <p>Are you sure you want to delete this item?</p>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("data table with caption and scope has no violations", async () => {
    const { container } = render(
      <DataTable rows={[
        { name: "Alice", role: "Engineer", status: "Active"   },
        { name: "Bob",   role: "Designer", status: "On Leave" },
      ]} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("alert banner has no a11y violations", async () => {
    const { container } = render(<AlertBanner message="Changes saved." type="success" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("toggle switch has no a11y violations", async () => {
    const { container } = render(<Toggle label="Enable notifications" checked={false} onChange={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ════════════════════════════════════════════════════════════
// 2. Inaccessible components — violations are expected
//    These tests DOCUMENT what bad patterns look like.
//    In production you would FIX these, not assert violations.
// ════════════════════════════════════════════════════════════

describe("2 — Inaccessible components (violations detected)", () => {
  it("form without labels has violations", async () => {
    const { container } = render(<InaccessibleForm />);
    const results = await axe(container);
    // We EXPECT violations — this test documents the failure mode
    expect(results.violations.length).toBeGreaterThan(0);
    // Log which rules were violated (useful in CI output)
    const ruleIds = results.violations.map((v) => v.id);
    // button has no accessible name (aria-hidden content only)
    expect(ruleIds).toEqual(expect.arrayContaining(["button-name"]));
  });

  it("image without alt has violations", async () => {
    const { container } = render(<InaccessibleImage />);
    const results = await axe(container);
    expect(results.violations.length).toBeGreaterThan(0);
    expect(results.violations.map((v) => v.id)).toContain("image-alt");
  });
});

// ════════════════════════════════════════════════════════════
// 3. axe with specific rule configuration
//    You can disable rules or limit scope per test.
// ════════════════════════════════════════════════════════════

describe("3 — axe configuration options", () => {
  it("runs axe on a specific sub-element only", async () => {
    const { container } = render(
      <div>
        <header>
          <nav aria-label="Site nav">
            <a href="/">Home</a>
          </nav>
        </header>
        <main>
          <AccessibleForm />
        </main>
      </div>
    );

    // Only test the main element's a11y — not the whole page
    const main = container.querySelector("main")!;
    const results = await axe(main);
    expect(results).toHaveNoViolations();
  });
});
