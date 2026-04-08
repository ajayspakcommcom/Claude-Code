// TOPIC: Leadership (Expert)
// LEVEL: Expert — Leadership
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. Mentoring        — code reviews, pairing, growth frameworks
//   2. Tech decisions   — ADRs, decision matrices, trade-off analysis
//   3. RFCs & docs      — RFC structure, API documentation, runbooks
//
// ─── MENTORING ────────────────────────────────────────────────────────────────
//
//   Engineering levels (simplified):
//     L1 Junior     — learns with guidance, works on defined tasks
//     L2 Mid        — works independently, owns features end-to-end
//     L3 Senior     — sets technical direction, unblocks others
//     L4 Staff      — cross-team impact, defines standards
//
//   Effective code review principles:
//   - Be specific: "extract this into a custom hook" not "this is messy"
//   - Explain why: the reason teaches, not just the what
//   - Distinguish blocking vs non-blocking: "nit:" prefix for style opinions
//   - Praise good work: positive reinforcement accelerates growth
//   - Ask questions: "What happens if X?" teaches analysis, not just answers
//
//   Mentoring anti-patterns:
//   - Doing it for them: unblocks today but stunts growth
//   - Vague feedback: "make it cleaner" teaches nothing
//   - Only reviewing negatives: demoralises, doesn't reinforce good patterns
//   - Overwhelming: 40 comments on a PR is not a review, it's a rewrite
//
//   Growth framework (simplified SMART goals for ICs):
//     S — Specific:    "own the auth module refactor end to end"
//     M — Measurable:  "reviewed by L3, shipped to production, zero P0 bugs in 30 days"
//     A — Achievable:  scoped to a 6-week sprint
//     R — Relevant:    aligns with team OKR (reduce auth latency)
//     T — Time-bound:  Q2 deadline
//
//   Pair programming patterns:
//     Driver/Navigator:  one types, one thinks ahead — switch every 25 min
//     Ping-pong:         A writes test, B makes it pass, A refactors — repeat
//     Strong style:      navigator's idea flows through driver's hands only
//
// ─── TECH DECISIONS ───────────────────────────────────────────────────────────
//
//   Architecture Decision Records (ADRs):
//   Lightweight documents capturing WHY a decision was made.
//   Stored in the repo (docs/decisions/). Immutable once accepted.
//
//   ADR template:
//     # ADR-001: Use React Query for server state
//     ## Status: Accepted
//     ## Context: We need server-state management with caching...
//     ## Decision: We will use React Query (TanStack Query)
//     ## Consequences: + Automatic caching, - New dep, learning curve
//
//   Decision matrix:
//   Score options against weighted criteria to make trade-offs explicit.
//     Criteria         Weight  Option A  Option B  Option C
//     Performance        30%     4         3         5
//     Dev Experience     25%     5         4         3
//     Bundle Size        20%     4         5         2
//     Community          15%     5         4         3
//     Learning Curve     10%     3         4         5
//     Weighted Score             4.2       3.9       3.6
//
//   Tech debt triage (effort vs impact matrix):
//     High impact + Low effort  → do now (quick wins)
//     High impact + High effort → plan for next quarter
//     Low impact + Low effort   → batch and do in slow periods
//     Low impact + High effort  → probably never (not worth it)
//
//   Decision quality checklist:
//   ✅ Considered at least 3 alternatives
//   ✅ Assessed reversibility (easy to undo vs lock-in)
//   ✅ Consulted affected teams
//   ✅ Documented trade-offs, not just the winner
//   ✅ Set a review date (re-evaluate in 6 months)
//
// ─── RFCs & DOCUMENTATION ─────────────────────────────────────────────────────
//
//   RFC (Request for Comments):
//   A structured proposal inviting team feedback before building.
//   Used for significant changes that affect multiple teams.
//
//   RFC lifecycle:
//     Draft → Review (1–2 weeks) → Accepted / Rejected / Revised → Implemented
//
//   RFC sections:
//     Summary          — one paragraph, what and why
//     Motivation       — problem being solved, why now
//     Detailed design  — how it works, API surface, examples
//     Drawbacks        — honest assessment of downsides
//     Alternatives     — what else was considered
//     Unresolved questions — still open, needs team input
//
//   Documentation types:
//     Tutorial   — learning-oriented, step-by-step walkthrough for beginners
//     How-to     — problem-oriented, "how do I do X?" (assumes knowledge)
//     Reference  — information-oriented, API docs, complete and accurate
//     Explanation — understanding-oriented, concepts, design decisions, "why"
//     (Divio documentation system / Diátaxis)
//
//   API documentation (JSDoc / TSDoc):
//     @param, @returns, @throws, @example
//     Generate HTML docs with TypeDoc or Storybook
//
//   Runbook:
//     Operational guide for on-call engineers.
//     Sections: symptoms, causes, diagnostic steps, remediation, escalation
//
//   Good documentation principles:
//   - Written for the reader, not the author
//   - Code examples for every non-trivial API
//   - Kept close to code (collocated, not a wiki) to stay up-to-date
//   - Versioned alongside the code it describes

import React, { useState, useMemo } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MENTORING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Engineering level model ───────────────────────────────────────────────────

type Level = "L1" | "L2" | "L3" | "L4";

interface EngineerProfile {
  name: string;
  level: Level;
  strengths: string[];
  growthAreas: string[];
}

interface SmartGoal {
  specific: string;
  measurable: string;
  achievable: boolean;     // scoped within a quarter
  relevant: string;        // maps to OKR
  timeBound: string;       // deadline
}

const validateSmartGoal = (goal: SmartGoal): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (goal.specific.length < 10) issues.push("Specific: too vague (describe the concrete outcome)");
  if (goal.measurable.length < 10) issues.push("Measurable: add a clear success metric");
  if (!goal.achievable) issues.push("Achievable: goal is not scoped to a single quarter");
  if (goal.relevant.length < 5) issues.push("Relevant: link to a team OKR or initiative");
  if (!goal.timeBound.match(/Q[1-4]|week|month|sprint/i))
    issues.push("Time-bound: add a specific deadline (e.g. Q2, Sprint 8)");

  return { valid: issues.length === 0, issues };
};

// ── Code review classifier ────────────────────────────────────────────────────

type ReviewCommentType =
  | "blocking"        // must be resolved before merge
  | "non-blocking"    // style/nit, author decides
  | "question"        // clarification, not a change request
  | "praise";         // positive reinforcement

interface ReviewComment {
  text: string;
  type: ReviewCommentType;
  hasReason: boolean;   // explains WHY, not just WHAT
  isSpecific: boolean;  // actionable, not vague
}

const classifyReviewComment = (text: string): ReviewCommentType => {
  const lower = text.toLowerCase();
  if (lower.startsWith("nit:") || lower.startsWith("optional:")) return "non-blocking";
  if (lower.startsWith("?") || lower.includes("what if") || lower.includes("why does")) return "question";
  if (lower.includes("great") || lower.includes("nice") || lower.includes("love this")) return "praise";
  return "blocking";
};

const scoreReviewComment = (comment: ReviewComment): { score: number; feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  if (comment.isSpecific) { score += 3; }
  else { feedback.push("Be more specific — what exactly should change?"); }

  if (comment.hasReason) { score += 3; }
  else { feedback.push("Explain why this change improves the code"); }

  if (comment.type === "praise") { score += 2; feedback.push("Good — positive reinforcement matters"); }
  if (comment.type === "question") { score += 1; }

  return { score, feedback };
};

// ── Pair programming session model ────────────────────────────────────────────

type PairingPattern = "driver-navigator" | "ping-pong" | "strong-style";

interface PairingSession {
  pattern: PairingPattern;
  durationMinutes: number;
  switchIntervalMinutes: number;
}

const getPairingSwitchCount = (session: PairingSession): number => {
  return Math.floor(session.durationMinutes / session.switchIntervalMinutes);
};

const isPairingSessionBalanced = (session: PairingSession): boolean => {
  const switches = getPairingSwitchCount(session);
  return switches >= 2; // at least 2 switches for both engineers to drive
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TECH DECISION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── ADR model ─────────────────────────────────────────────────────────────────

type ADRStatus = "proposed" | "accepted" | "rejected" | "deprecated" | "superseded";

interface ADR {
  id: string;
  title: string;
  status: ADRStatus;
  context: string;
  decision: string;
  consequences: { positive: string[]; negative: string[] };
  supersededBy?: string;
}

const isADRActionable = (adr: ADR): boolean =>
  adr.status === "proposed" || adr.status === "accepted";

const validateADR = (adr: ADR): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  if (!adr.id.match(/^ADR-\d{3}$/)) missing.push("ID must follow ADR-NNN format");
  if (adr.context.length < 20) missing.push("Context: describe the problem in detail");
  if (adr.decision.length < 10) missing.push("Decision: state what was decided");
  if (adr.consequences.positive.length === 0) missing.push("Consequences: list at least one positive");
  if (adr.consequences.negative.length === 0) missing.push("Consequences: list at least one negative (be honest)");
  return { valid: missing.length === 0, missing };
};

// ── Decision matrix ────────────────────────────────────────────────────────────

interface DecisionCriteria {
  name: string;
  weight: number; // 0–1, all weights must sum to 1
}

interface DecisionOption {
  name: string;
  scores: number[]; // score per criterion, 1–5
}

const computeWeightedScores = (
  criteria: DecisionCriteria[],
  options: DecisionOption[]
): { name: string; score: number }[] => {
  return options.map(option => ({
    name: option.name,
    score: option.scores.reduce(
      (sum, score, i) => sum + score * (criteria[i]?.weight ?? 0),
      0
    ),
  }));
};

const pickBestOption = (
  criteria: DecisionCriteria[],
  options: DecisionOption[]
): string => {
  const scored = computeWeightedScores(criteria, options);
  return scored.reduce((best, curr) => (curr.score > best.score ? curr : best)).name;
};

// ── Tech debt triage ──────────────────────────────────────────────────────────

type ImpactLevel = "high" | "low";
type EffortLevel = "high" | "low";

interface TechDebtItem {
  description: string;
  impact: ImpactLevel;
  effort: EffortLevel;
}

type DebtPriority = "do-now" | "plan" | "batch" | "skip";

const triageDebt = (item: TechDebtItem): DebtPriority => {
  if (item.impact === "high" && item.effort === "low") return "do-now";
  if (item.impact === "high" && item.effort === "high") return "plan";
  if (item.impact === "low" && item.effort === "low") return "batch";
  return "skip"; // low impact + high effort
};

// ── Decision checklist ────────────────────────────────────────────────────────

interface TechDecision {
  alternativesConsidered: number;
  reversible: boolean;
  affectedTeamsConsulted: boolean;
  tradeOffsDocumented: boolean;
  reviewDateSet: boolean;
}

const scoreTechDecision = (decision: TechDecision): { score: number; maxScore: number; grade: string } => {
  let score = 0;
  if (decision.alternativesConsidered >= 3) score++;
  if (decision.reversible) score++;
  if (decision.affectedTeamsConsulted) score++;
  if (decision.tradeOffsDocumented) score++;
  if (decision.reviewDateSet) score++;

  const grade = score >= 5 ? "A" : score >= 4 ? "B" : score >= 3 ? "C" : "D";
  return { score, maxScore: 5, grade };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RFC & DOCUMENTATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── RFC model ──────────────────────────────────────────────────────────────────

type RFCStatus = "draft" | "review" | "accepted" | "rejected" | "revised";

interface RFC {
  id: string;
  title: string;
  status: RFCStatus;
  summary: string;
  motivation: string;
  design: string;
  drawbacks: string[];
  alternatives: string[];
  unresolvedQuestions: string[];
}

const validateRFC = (rfc: RFC): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  if (rfc.summary.length < 20) missing.push("Summary must be at least 1 clear paragraph");
  if (rfc.motivation.length < 20) missing.push("Motivation: describe the problem and why now");
  if (rfc.design.length < 20) missing.push("Detailed design: describe how it works");
  if (rfc.drawbacks.length === 0) missing.push("Drawbacks: list at least one downside (honesty builds trust)");
  if (rfc.alternatives.length < 2) missing.push("Alternatives: consider at least 2 other approaches");
  return { valid: missing.length === 0, missing };
};

const getRFCNextStep = (status: RFCStatus): string => {
  const steps: Record<RFCStatus, string> = {
    draft: "Share with team for review (open PR or send link)",
    review: "Address feedback, update document, call for final comment",
    accepted: "Begin implementation, link RFC in PR description",
    rejected: "Document why rejected, consider revised approach",
    revised: "Re-open review period with changelog summary",
  };
  return steps[status];
};

// ── Documentation type classifier ────────────────────────────────────────────

type DocType = "tutorial" | "how-to" | "reference" | "explanation";

interface DocPiece {
  title: string;
  content: string;
  hasCodeExample: boolean;
  audience: "beginner" | "practitioner" | "all";
}

const classifyDocType = (doc: Partial<DocPiece> & { purpose: string }): DocType => {
  const p = doc.purpose.toLowerCase();
  if (p.includes("learn") || p.includes("getting started") || p.includes("tutorial")) return "tutorial";
  if (p.includes("how to") || p.includes("steps") || p.includes("guide")) return "how-to";
  if (p.includes("api") || p.includes("reference") || p.includes("all props") || p.includes("complete")) return "reference";
  return "explanation";
};

// ── JSDoc/TSDoc quality checker ───────────────────────────────────────────────

interface FunctionDoc {
  name: string;
  description: string;
  params: { name: string; description: string }[];
  returns: string;
  example?: string;
  throws?: string;
}

const scoreFunctionDoc = (doc: FunctionDoc, paramCount: number): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 0;

  if (doc.description.length >= 10) score++;
  else issues.push("Add a meaningful description");

  if (doc.params.length === paramCount) score++;
  else issues.push(`Document all ${paramCount} parameters (only ${doc.params.length} documented)`);

  const allParamsHaveDesc = doc.params.every(p => p.description.length >= 5);
  if (allParamsHaveDesc) score++;
  else issues.push("Add descriptions to all parameters");

  if (doc.returns.length >= 5) score++;
  else issues.push("Document what the function returns");

  if (doc.example) score++;
  else issues.push("Add a code example — readers learn from examples");

  return { score, issues };
};

// ── Runbook quality checker ───────────────────────────────────────────────────

interface Runbook {
  title: string;
  symptom: string;
  possibleCauses: string[];
  diagnosticSteps: string[];
  remediation: string[];
  escalationPath: string;
  lastTestedDate?: string;
}

const validateRunbook = (runbook: Runbook): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  if (runbook.symptom.length < 10) issues.push("Symptom: describe what the on-call engineer observes");
  if (runbook.possibleCauses.length === 0) issues.push("Possible causes: list at least one");
  if (runbook.diagnosticSteps.length < 2) issues.push("Diagnostic steps: need at least 2 concrete steps");
  if (runbook.remediation.length === 0) issues.push("Remediation: provide at least one fix/mitigation");
  if (!runbook.escalationPath) issues.push("Escalation path: who to call if steps don't resolve it?");
  if (!runbook.lastTestedDate) issues.push("Add lastTestedDate — runbooks rot; test them quarterly");
  return { valid: issues.length === 0, issues };
};

// ── React components for explainer ────────────────────────────────────────────

const ReviewFeedback: React.FC<{
  comments: ReviewComment[];
}> = ({ comments }) => (
  <ul data-testid="review-feedback">
    {comments.map((c, i) => (
      <li key={i} data-testid={`comment-${i}`} data-type={c.type}>
        <span data-testid={`comment-score-${i}`}>
          {scoreReviewComment(c).score}
        </span>
        {c.text}
      </li>
    ))}
  </ul>
);

const ADRViewer: React.FC<{ adr: ADR }> = ({ adr }) => {
  const validation = validateADR(adr);
  return (
    <div data-testid="adr-viewer">
      <h3 data-testid="adr-title">{adr.id}: {adr.title}</h3>
      <span data-testid="adr-status">{adr.status}</span>
      <span data-testid="adr-valid">{validation.valid ? "valid" : "invalid"}</span>
      {!validation.valid && (
        <ul data-testid="adr-issues">
          {validation.missing.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MENTORING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Mentoring", () => {
  it("validates a well-formed SMART goal as valid", () => {
    const goal: SmartGoal = {
      specific: "Own the authentication module refactor end to end",
      measurable: "Shipped to production, zero P0 bugs in 30 days, reviewed by L3",
      achievable: true,
      relevant: "Reduce auth latency (Q2 OKR)",
      timeBound: "Q2 2026",
    };
    const result = validateSmartGoal(goal);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("flags a vague, non-time-bound goal as invalid", () => {
    const goal: SmartGoal = {
      specific: "Be better",
      measurable: "Feels right",
      achievable: false,
      relevant: "",
      timeBound: "sometime",
    };
    const result = validateSmartGoal(goal);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(3);
  });

  it("classifies nit-prefixed comments as non-blocking", () => {
    expect(classifyReviewComment("nit: rename this to `handleSubmit`")).toBe("non-blocking");
    expect(classifyReviewComment("optional: could extract to a hook")).toBe("non-blocking");
  });

  it("classifies questions as question type", () => {
    expect(classifyReviewComment("What if the API returns null here?")).toBe("question");
    expect(classifyReviewComment("why does this need to be async?")).toBe("question");
  });

  it("classifies praise comments", () => {
    expect(classifyReviewComment("Great abstraction — really clean")).toBe("praise");
    expect(classifyReviewComment("Love this pattern, very readable")).toBe("praise");
  });

  it("classifies unqualified comments as blocking", () => {
    expect(classifyReviewComment("This will cause a memory leak")).toBe("blocking");
    expect(classifyReviewComment("Missing error handling for the fetch")).toBe("blocking");
  });

  it("scores a specific, reasoned comment highest", () => {
    const comment: ReviewComment = {
      text: "Extract the date formatting logic into a useDateFormat hook — it's reused in 3 places now and centralising it prevents drift",
      type: "blocking",
      hasReason: true,
      isSpecific: true,
    };
    expect(scoreReviewComment(comment).score).toBeGreaterThanOrEqual(6);
  });

  it("scores a vague comment with no reason lowest", () => {
    const comment: ReviewComment = {
      text: "This is messy",
      type: "blocking",
      hasReason: false,
      isSpecific: false,
    };
    const { score, feedback } = scoreReviewComment(comment);
    expect(score).toBeLessThan(3);
    expect(feedback).toContain("Explain why this change improves the code");
  });

  it("praise comment always gets bonus score and feedback note", () => {
    const comment: ReviewComment = {
      text: "Nice use of useMemo here",
      type: "praise",
      hasReason: false,
      isSpecific: true,
    };
    const { score, feedback } = scoreReviewComment(comment);
    expect(score).toBeGreaterThanOrEqual(5); // specific(3) + praise(2)
    expect(feedback.some(f => f.includes("positive reinforcement"))).toBe(true);
  });

  it("pairing session with enough switches is balanced", () => {
    const session: PairingSession = {
      pattern: "driver-navigator",
      durationMinutes: 120,
      switchIntervalMinutes: 25,
    };
    expect(getPairingSwitchCount(session)).toBe(4);
    expect(isPairingSessionBalanced(session)).toBe(true);
  });

  it("short pairing session with infrequent switches is not balanced", () => {
    const session: PairingSession = {
      pattern: "driver-navigator",
      durationMinutes: 30,
      switchIntervalMinutes: 60,
    };
    expect(getPairingSwitchCount(session)).toBe(0);
    expect(isPairingSessionBalanced(session)).toBe(false);
  });

  it("ReviewFeedback component renders comments with type and score", () => {
    const comments: ReviewComment[] = [
      { text: "nit: rename var", type: "non-blocking", hasReason: false, isSpecific: true },
      { text: "Great work here!", type: "praise", hasReason: false, isSpecific: true },
    ];
    render(<ReviewFeedback comments={comments} />);
    expect(screen.getByTestId("comment-0")).toHaveAttribute("data-type", "non-blocking");
    expect(screen.getByTestId("comment-1")).toHaveAttribute("data-type", "praise");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TECH DECISION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Tech decisions: ADRs, decision matrices, debt triage", () => {
  const goodADR: ADR = {
    id: "ADR-001",
    title: "Use TanStack Query for server state management",
    status: "accepted",
    context: "We need a consistent way to cache and synchronise server state across the app. Current ad-hoc fetch + useState patterns cause duplicate requests and stale data.",
    decision: "Adopt TanStack Query (React Query) for all server state",
    consequences: {
      positive: ["Automatic caching", "Background refetch", "Loading/error states built-in"],
      negative: ["Additional dependency", "Learning curve for team"],
    },
  };

  it("validates a well-formed ADR as valid", () => {
    const result = validateADR(goodADR);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("rejects an ADR with wrong ID format", () => {
    const badADR = { ...goodADR, id: "001" };
    const result = validateADR(badADR);
    expect(result.valid).toBe(false);
    expect(result.missing.some(m => m.includes("ADR-NNN"))).toBe(true);
  });

  it("rejects an ADR with no negative consequences (dishonest)", () => {
    const badADR = { ...goodADR, consequences: { positive: ["Good"], negative: [] } };
    const result = validateADR(badADR);
    expect(result.valid).toBe(false);
    expect(result.missing.some(m => m.includes("negative"))).toBe(true);
  });

  it("accepted ADR is actionable, deprecated is not", () => {
    expect(isADRActionable({ ...goodADR, status: "accepted" })).toBe(true);
    expect(isADRActionable({ ...goodADR, status: "deprecated" })).toBe(false);
    expect(isADRActionable({ ...goodADR, status: "superseded" })).toBe(false);
  });

  it("ADRViewer component renders title, status, and validity", () => {
    render(<ADRViewer adr={goodADR} />);
    expect(screen.getByTestId("adr-title")).toHaveTextContent("ADR-001");
    expect(screen.getByTestId("adr-status")).toHaveTextContent("accepted");
    expect(screen.getByTestId("adr-valid")).toHaveTextContent("valid");
  });

  it("decision matrix picks the highest weighted-score option", () => {
    const criteria: DecisionCriteria[] = [
      { name: "Performance", weight: 0.4 },
      { name: "DX", weight: 0.3 },
      { name: "Bundle", weight: 0.3 },
    ];
    const options: DecisionOption[] = [
      { name: "React Query", scores: [4, 5, 4] },  // 0.4*4 + 0.3*5 + 0.3*4 = 1.6+1.5+1.2 = 4.3
      { name: "SWR", scores: [3, 4, 5] },           // 0.4*3 + 0.3*4 + 0.3*5 = 1.2+1.2+1.5 = 3.9
      { name: "Redux", scores: [5, 2, 3] },          // 0.4*5 + 0.3*2 + 0.3*3 = 2.0+0.6+0.9 = 3.5
    ];
    expect(pickBestOption(criteria, options)).toBe("React Query");
  });

  it("weighted scores are computed correctly per option", () => {
    const criteria: DecisionCriteria[] = [
      { name: "A", weight: 0.5 },
      { name: "B", weight: 0.5 },
    ];
    const options: DecisionOption[] = [
      { name: "X", scores: [4, 2] }, // (4*0.5) + (2*0.5) = 3.0
      { name: "Y", scores: [3, 4] }, // (3*0.5) + (4*0.5) = 3.5
    ];
    const scores = computeWeightedScores(criteria, options);
    expect(scores.find(s => s.name === "X")!.score).toBeCloseTo(3.0);
    expect(scores.find(s => s.name === "Y")!.score).toBeCloseTo(3.5);
  });

  it("tech debt triage: high-impact low-effort → do now", () => {
    expect(triageDebt({ description: "Remove dead code", impact: "high", effort: "low" })).toBe("do-now");
  });

  it("tech debt triage: high-impact high-effort → plan", () => {
    expect(triageDebt({ description: "Migrate to new API", impact: "high", effort: "high" })).toBe("plan");
  });

  it("tech debt triage: low-impact low-effort → batch", () => {
    expect(triageDebt({ description: "Rename variables", impact: "low", effort: "low" })).toBe("batch");
  });

  it("tech debt triage: low-impact high-effort → skip", () => {
    expect(triageDebt({ description: "Rewrite in Rust", impact: "low", effort: "high" })).toBe("skip");
  });

  it("tech decision with all checks passes with grade A", () => {
    const decision: TechDecision = {
      alternativesConsidered: 3,
      reversible: true,
      affectedTeamsConsulted: true,
      tradeOffsDocumented: true,
      reviewDateSet: true,
    };
    const result = scoreTechDecision(decision);
    expect(result.score).toBe(5);
    expect(result.grade).toBe("A");
  });

  it("tech decision missing alternatives and consultation gets grade C or D", () => {
    const decision: TechDecision = {
      alternativesConsidered: 1,
      reversible: true,
      affectedTeamsConsulted: false,
      tradeOffsDocumented: true,
      reviewDateSet: false,
    };
    const result = scoreTechDecision(decision);
    expect(result.grade).toMatch(/C|D/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RFC & DOCUMENTATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — RFCs & documentation", () => {
  const goodRFC: RFC = {
    id: "RFC-012",
    title: "Adopt Zod for runtime schema validation",
    status: "review",
    summary: "Introduce Zod as the standard library for validating API responses and form data across the frontend.",
    motivation: "We currently have inconsistent validation — some endpoints have no validation, leading to silent type errors in production.",
    design: "Wrap all fetch calls with a Zod schema. Export schemas from a shared package. Auto-generate types with z.infer<>.",
    drawbacks: ["Adds ~14kB gzip to bundle", "Every API schema must be maintained alongside the backend type"],
    alternatives: ["Yup (larger bundle, older API)", "io-ts (functional style, steeper learning curve)", "Manual guards (no standardisation)"],
    unresolvedQuestions: ["Should we validate on every request or only in development?"],
  };

  it("validates a complete RFC as valid", () => {
    const result = validateRFC(goodRFC);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it("rejects an RFC with missing summary", () => {
    const bad = { ...goodRFC, summary: "short" };
    const result = validateRFC(bad);
    expect(result.valid).toBe(false);
    expect(result.missing.some(m => m.includes("Summary"))).toBe(true);
  });

  it("rejects an RFC with fewer than 2 alternatives", () => {
    const bad = { ...goodRFC, alternatives: ["Yup"] };
    const result = validateRFC(bad);
    expect(result.valid).toBe(false);
    expect(result.missing.some(m => m.includes("Alternatives"))).toBe(true);
  });

  it("rejects an RFC with no drawbacks listed", () => {
    const bad = { ...goodRFC, drawbacks: [] };
    const result = validateRFC(bad);
    expect(result.valid).toBe(false);
    expect(result.missing.some(m => m.includes("Drawbacks"))).toBe(true);
  });

  it("getRFCNextStep returns correct next action for each status", () => {
    expect(getRFCNextStep("draft")).toContain("Share with team");
    expect(getRFCNextStep("review")).toContain("Address feedback");
    expect(getRFCNextStep("accepted")).toContain("implementation");
    expect(getRFCNextStep("rejected")).toContain("rejected");
    expect(getRFCNextStep("revised")).toContain("review period");
  });

  it("classifies documentation type from purpose description", () => {
    expect(classifyDocType({ purpose: "Getting started tutorial for new engineers" })).toBe("tutorial");
    expect(classifyDocType({ purpose: "How to configure authentication" })).toBe("how-to");
    expect(classifyDocType({ purpose: "Complete API reference for useForm hook" })).toBe("reference");
    expect(classifyDocType({ purpose: "Why we chose React over Vue" })).toBe("explanation");
  });

  it("scores a fully documented function at maximum", () => {
    const doc: FunctionDoc = {
      name: "formatCurrency",
      description: "Formats a number as a localised currency string",
      params: [
        { name: "amount", description: "The numeric value to format" },
        { name: "currency", description: "ISO 4217 currency code (e.g. USD)" },
      ],
      returns: "Formatted string e.g. '$1,234.56'",
      example: "formatCurrency(1234.56, 'USD') // '$1,234.56'",
    };
    const result = scoreFunctionDoc(doc, 2);
    expect(result.score).toBe(5);
    expect(result.issues).toHaveLength(0);
  });

  it("flags missing example and undocumented param", () => {
    const doc: FunctionDoc = {
      name: "slugify",
      description: "Converts a string to URL-safe slug",
      params: [{ name: "text", description: "Input string" }],
      returns: "URL slug",
    };
    const result = scoreFunctionDoc(doc, 2); // expects 2 params, got 1
    expect(result.issues.some(i => i.includes("parameters"))).toBe(true);
    expect(result.issues.some(i => i.includes("example"))).toBe(true);
  });

  it("validates a complete runbook as valid", () => {
    const runbook: Runbook = {
      title: "High API latency alert",
      symptom: "P95 API latency exceeds 2s for more than 5 minutes",
      possibleCauses: ["Database connection pool exhausted", "Upstream service degraded", "Memory pressure causing GC pauses"],
      diagnosticSteps: [
        "Check Datadog APM for slow traces",
        "Query pg_stat_activity for long-running queries",
        "Review recent deploys in release history",
      ],
      remediation: ["Restart workers if connection pool exhausted", "Roll back if correlated with recent deploy"],
      escalationPath: "Escalate to DBA team (Slack: #on-call-db) if DB queries implicated",
      lastTestedDate: "2026-01-15",
    };
    const result = validateRunbook(runbook);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("flags a runbook missing escalation path and test date", () => {
    const runbook: Runbook = {
      title: "Memory alert",
      symptom: "Memory usage above 90%",
      possibleCauses: ["Memory leak"],
      diagnosticSteps: ["Check heap snapshot", "Review recent deploys"],
      remediation: ["Restart pod"],
      escalationPath: "",
    };
    const result = validateRunbook(runbook);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes("Escalation"))).toBe(true);
    expect(result.issues.some(i => i.includes("lastTestedDate"))).toBe(true);
  });
});
