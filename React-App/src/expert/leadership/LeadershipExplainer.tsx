// TOPIC: Leadership — Visual Explainer
// Mentoring, Tech Decisions, RFCs & Documentation

import React, { useState } from "react";

const s = {
  container: { fontFamily: "monospace", fontSize: 13, padding: 20, maxWidth: 900 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#1e293b" } as React.CSSProperties,
  h3: { fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#334155" } as React.CSSProperties,
  tabs: { display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" as const },
  tab: (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
    background: active ? "#6366f1" : "#e2e8f0",
    color: active ? "#fff" : "#334155",
    fontFamily: "monospace", fontSize: 12, fontWeight: 600,
  }),
  code: {
    background: "#0f172a", color: "#e2e8f0", borderRadius: 8,
    padding: "14px 16px", overflowX: "auto" as const,
    lineHeight: 1.6, fontSize: 12, marginBottom: 12,
  } as React.CSSProperties,
  card: {
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 8, padding: "12px 16px", marginBottom: 10,
  } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } as React.CSSProperties,
  label: (color: string): React.CSSProperties => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 4,
    background: color, color: "#fff", fontSize: 11, fontWeight: 700, marginBottom: 6,
  }),
  note: {
    background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6,
    padding: "8px 12px", fontSize: 12, marginBottom: 10, color: "#78350f",
  } as React.CSSProperties,
  row: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 } as React.CSSProperties,
  btn: (color = "#6366f1"): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
    background: color, color: "#fff", fontFamily: "monospace",
    fontSize: 12, fontWeight: 600, marginRight: 6,
  }),
};

// ─── Demo 1: Mentoring ────────────────────────────────────────────────────────

const MENTOR_TABS = ["levels", "code reviews", "SMART goals", "pairing"] as const;
type MentorTab = (typeof MENTOR_TABS)[number];

const MentoringDemo: React.FC = () => {
  const [tab, setTab] = useState<MentorTab>("levels");
  const [reviewText, setReviewText] = useState("");
  const [reviewResult, setReviewResult] = useState<{ type: string; tips: string[] } | null>(null);

  const analyseReview = () => {
    const lower = reviewText.toLowerCase();
    let type = "blocking";
    const tips: string[] = [];
    if (lower.startsWith("nit:") || lower.startsWith("optional:")) type = "non-blocking";
    else if (lower.includes("what if") || lower.includes("why does") || lower.startsWith("?")) type = "question";
    else if (lower.includes("great") || lower.includes("nice") || lower.includes("love")) type = "praise";

    if (!lower.includes("because") && !lower.includes("since") && !lower.includes("→") && type !== "praise") {
      tips.push("Add a reason — explain WHY, not just WHAT");
    }
    if (reviewText.length < 30 && type === "blocking") {
      tips.push("Be more specific — what exactly should change?");
    }
    if (type !== "praise") tips.push("Consider: could this be a question instead of a command?");

    setReviewResult({ type, tips });
  };

  return (
    <div>
      <div style={s.tabs}>
        {MENTOR_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "levels" && (
        <>
          <div style={s.note}>Engineering levels describe scope of ownership, not years of experience.</div>
          {[
            { level: "L1 Junior", color: "#94a3b8", owns: "Defined tasks", unblocks: "Asks for help early", impact: "Individual PRs", growth: "Focused on learning: language, tools, codebase patterns" },
            { level: "L2 Mid", color: "#6366f1", owns: "Features end-to-end", unblocks: "Resolves own blockers", impact: "Team-level", growth: "Learns system design, starts mentoring L1s informally" },
            { level: "L3 Senior", color: "#0891b2", owns: "System / subsystem", unblocks: "Unblocks the whole team", impact: "Team + cross-team", growth: "Sets technical direction, drives RFCs, runs design reviews" },
            { level: "L4 Staff", color: "#7c3aed", owns: "Multi-team initiative", unblocks: "Org-level clarity", impact: "Org-wide", growth: "Defines standards, shapes roadmap, builds engineering culture" },
          ].map(({ level, color, owns, unblocks, impact, growth }) => (
            <div key={level} style={{ ...s.card, borderLeft: `4px solid ${color}` }}>
              <div style={s.label(color)}>{level}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 6, fontSize: 12 }}>
                <div><strong>Owns:</strong><br />{owns}</div>
                <div><strong>Unblocks:</strong><br />{unblocks}</div>
                <div><strong>Impact:</strong><br />{impact}</div>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{growth}</div>
            </div>
          ))}
        </>
      )}

      {tab === "code reviews" && (
        <>
          <div style={s.note}>Write a mock code review comment below. The analyser will classify it and suggest improvements.</div>
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder={`Examples:\n"nit: rename this to handleSubmit"\n"This will cause a memory leak because the interval is never cleared"\n"What if the user is not authenticated here?"`}
            style={{ width: "100%", height: 80, padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: 12, boxSizing: "border-box" as const, marginBottom: 8 }}
          />
          <button style={s.btn()} onClick={analyseReview}>Analyse comment</button>

          {reviewResult && (
            <div style={{ ...s.card, marginTop: 10, borderLeft: `4px solid ${reviewResult.type === "blocking" ? "#dc2626" : reviewResult.type === "praise" ? "#059669" : "#6366f1"}` }}>
              <div style={s.label(reviewResult.type === "blocking" ? "#dc2626" : reviewResult.type === "praise" ? "#059669" : reviewResult.type === "non-blocking" ? "#d97706" : "#6366f1")}>
                {reviewResult.type}
              </div>
              {reviewResult.tips.map((tip, i) => (
                <div key={i} style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>💡 {tip}</div>
              ))}
            </div>
          )}

          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Review comment principles</strong>
            {[
              { bad: '"This is messy"', good: '"Extract the date logic into useDateFormat — it\'s used in 3 places now"', why: "Specific + actionable" },
              { bad: '"Move this to a hook"', good: '"nit: could extract to a hook (non-blocking)"', why: "Signal blocking vs optional" },
              { bad: '"Wrong"', good: '"What if `data` is null here? Could this throw?"', why: "Question teaches analysis" },
              { bad: "(no praise at all)", good: '"Great use of useMemo here — avoids the N² sort on every render"', why: "Reinforce good patterns" },
            ].map(({ bad, good, why }) => (
              <div key={bad} style={{ ...s.grid2, marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: "#dc2626" }}>✗ {bad}</div>
                <div style={{ fontSize: 11, color: "#059669" }}>✓ {good} <em>({why})</em></div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "SMART goals" && (
        <>
          <div style={s.note}>SMART goals turn vague aspirations into concrete, trackable growth targets.</div>
          <div style={s.card}>
            <strong style={{ fontSize: 12, color: "#6366f1" }}>Example: L2 → L3 growth goal</strong>
            <table style={{ width: "100%", fontSize: 12, marginTop: 8, borderCollapse: "collapse" as const }}>
              <tbody>
                {[
                  { letter: "S", word: "Specific", value: "Lead the auth module refactor: new token refresh flow, migrate 3 API clients" },
                  { letter: "M", word: "Measurable", value: "All endpoints migrated, E2E test suite green, reviewed by L3, zero auth-related P0s in 30 days post-launch" },
                  { letter: "A", word: "Achievable", value: "Scoped to 6 weeks — existing knowledge of the auth codebase, no external blockers" },
                  { letter: "R", word: "Relevant", value: "Maps directly to Q2 OKR: reduce auth latency by 40%" },
                  { letter: "T", word: "Time-bound", value: "Ship to production by end of Sprint 8 (2026-05-30)" },
                ].map(({ letter, word, value }) => (
                  <tr key={letter}>
                    <td style={{ padding: "4px 8px", fontWeight: 700, color: "#6366f1", fontSize: 14 }}>{letter}</td>
                    <td style={{ padding: "4px 8px", fontWeight: 600, minWidth: 90 }}>{word}</td>
                    <td style={{ padding: "4px 8px", color: "#475569" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={s.grid2}>
            <div style={{ ...s.card, borderTop: "3px solid #dc2626" }}>
              <div style={s.label("#dc2626")}>Anti-pattern goals</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>"Be a better engineer"</li>
                <li>"Learn more about React"</li>
                <li>"Improve code quality"</li>
                <li>"Write more tests"</li>
              </ul>
            </div>
            <div style={{ ...s.card, borderTop: "3px solid #059669" }}>
              <div style={s.label("#059669")}>Good goals</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>"Own 2 features solo in Q2 with zero P0s"</li>
                <li>"Complete React Advanced Patterns course + apply 1 pattern in prod by Q2"</li>
                <li>"Raise test coverage on auth module from 40% → 80% by Sprint 6"</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {tab === "pairing" && (
        <>
          <div style={s.note}>Pair programming accelerates knowledge transfer — faster than code review, more interactive than documentation.</div>
          {[
            { pattern: "Driver / Navigator", color: "#6366f1", desc: "One person types (driver), one thinks ahead and reviews (navigator). Switch every 25 minutes.", best: "Onboarding new engineers to a complex codebase" },
            { pattern: "Ping-Pong (TDD)", color: "#0891b2", desc: "A writes a failing test → B makes it pass → A refactors → B writes next failing test. Repeat.", best: "Feature development with clear requirements; enforces TDD discipline" },
            { pattern: "Strong Style", color: "#7c3aed", desc: "Navigator's idea must flow through driver's hands only — driver types exactly what navigator says.", best: "Teaching junior engineers; navigator (senior) guides without taking over" },
          ].map(({ pattern, color, desc, best }) => (
            <div key={pattern} style={{ ...s.card, borderLeft: `4px solid ${color}` }}>
              <div style={s.label(color)}>{pattern}</div>
              <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 4px" }}>{desc}</p>
              <div style={{ fontSize: 11, color: "#64748b" }}>Best for: {best}</div>
            </div>
          ))}
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Pairing tips</strong>
            <ul style={{ fontSize: 12, color: "#475569", margin: "6px 0 0", paddingLeft: 16 }}>
              <li>Set a clear goal before starting — "we'll implement X until lunch"</li>
              <li>Use a timer — enforce switches; don't let one person drive all day</li>
              <li>Verbalize your thinking — the partner needs to follow your reasoning</li>
              <li>Take breaks — pairing is mentally exhausting; 90-min max without a break</li>
              <li>Retrospect after — what worked? what would you do differently?</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Demo 2: Tech Decisions ───────────────────────────────────────────────────

const TECH_TABS = ["ADRs", "decision matrix", "debt triage", "checklist"] as const;
type TechTab = (typeof TECH_TABS)[number];

const TechDecisionsDemo: React.FC = () => {
  const [tab, setTab] = useState<TechTab>("ADRs");
  const [matrixScores, setMatrixScores] = useState([
    [4, 5, 4],   // React Query
    [3, 4, 5],   // SWR
    [5, 2, 3],   // Redux
  ]);
  const [weights] = useState([0.4, 0.3, 0.3]);
  const options = ["React Query", "SWR", "Redux Toolkit"];
  const criteria = ["Performance", "Dev Experience", "Bundle Size"];

  const scores = matrixScores.map((row, i) => ({
    name: options[i],
    score: row.reduce((sum, s, j) => sum + s * weights[j], 0),
  }));
  const best = scores.reduce((a, b) => (b.score > a.score ? b : a)).name;

  const debtItems = [
    { desc: "Remove unused feature flags", impact: "high" as const, effort: "low" as const },
    { desc: "Migrate to new auth SDK", impact: "high" as const, effort: "high" as const },
    { desc: "Fix variable naming in utils", impact: "low" as const, effort: "low" as const },
    { desc: "Rewrite entire test suite in Vitest", impact: "low" as const, effort: "high" as const },
  ];
  const priorityColor = { "do-now": "#059669", "plan": "#6366f1", "batch": "#d97706", "skip": "#94a3b8" };
  const triage = (impact: "high" | "low", effort: "high" | "low") => {
    if (impact === "high" && effort === "low") return "do-now";
    if (impact === "high" && effort === "high") return "plan";
    if (impact === "low" && effort === "low") return "batch";
    return "skip";
  };

  return (
    <div>
      <div style={s.tabs}>
        {TECH_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "ADRs" && (
        <>
          <div style={s.note}>ADRs capture <strong>why</strong> a decision was made — not just what. Future engineers (including yourself in 6 months) will thank you.</div>
          <div style={s.code}>
            {`# docs/decisions/ADR-001-react-query.md

## Status: Accepted

## Context
We need server-state management with caching and background refresh.
Current pattern (useState + useEffect + fetch) causes:
- Duplicate requests when multiple components need same data
- Stale data shown after mutations
- No loading/error state standardisation

## Decision
Adopt TanStack Query (React Query v5) for all server state.

## Consequences
### Positive
+ Automatic request deduplication
+ Background refetch on window focus
+ Optimistic updates + rollback
+ DevTools for debugging

### Negative
- Adds ~13kB gzip to bundle
- Team needs training (~1 sprint)
- All fetches must be migrated (phased rollout planned)

## Review Date: 2026-10-01`}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.label("#059669")}>ADR statuses</div>
              {["proposed", "accepted", "rejected", "deprecated", "superseded"].map(st => (
                <div key={st} style={{ fontSize: 11, color: "#475569", padding: "2px 0" }}>
                  <code style={{ color: "#6366f1" }}>{st}</code>
                  {st === "proposed" && " — open for feedback"}
                  {st === "accepted" && " — approved, implement it"}
                  {st === "rejected" && " — not doing this (document why)"}
                  {st === "deprecated" && " — no longer applies"}
                  {st === "superseded" && " — replaced by newer ADR"}
                </div>
              ))}
            </div>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>What makes a good ADR</div>
              <ul style={{ fontSize: 11, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>Written at decision time (not after)</li>
                <li>Lists alternatives that were rejected</li>
                <li>Honest about negative consequences</li>
                <li>Has a review date</li>
                <li>Immutable once accepted (create a new ADR to reverse)</li>
                <li>Stored in the repo, versioned with code</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {tab === "decision matrix" && (
        <>
          <div style={s.note}>Weighted decision matrix makes trade-offs explicit and defensible. Adjust scores to see how the recommendation changes.</div>
          <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12, marginBottom: 12 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "8px", textAlign: "left" as const, borderBottom: "2px solid #e2e8f0" }}>Option</th>
                {criteria.map((c, j) => (
                  <th key={c} style={{ padding: "8px", textAlign: "center" as const, borderBottom: "2px solid #e2e8f0" }}>
                    {c}<br /><span style={{ fontWeight: 400, color: "#64748b" }}>({Math.round(weights[j] * 100)}%)</span>
                  </th>
                ))}
                <th style={{ padding: "8px", textAlign: "center" as const, borderBottom: "2px solid #e2e8f0" }}>Weighted Score</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((opt, i) => (
                <tr key={opt.name} style={{ background: opt.name === best ? "#f0fdf4" : "transparent", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px", fontWeight: opt.name === best ? 700 : 400 }}>
                    {opt.name === best ? "✅ " : ""}{opt.name}
                  </td>
                  {matrixScores[i].map((score, j) => (
                    <td key={j} style={{ padding: "4px", textAlign: "center" as const }}>
                      <input
                        type="number" min={1} max={5} value={score}
                        onChange={e => {
                          const val = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                          setMatrixScores(prev => prev.map((row, ri) => ri === i ? row.map((s, si) => si === j ? val : s) : row));
                        }}
                        style={{ width: 40, textAlign: "center" as const, padding: "2px 4px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace" }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: "8px", textAlign: "center" as const, fontWeight: 700, color: opt.name === best ? "#059669" : "#334155" }}>
                    {opt.score.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ ...s.card, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            Recommendation: <strong style={{ color: "#059669" }}>{best}</strong> (highest weighted score)
          </div>
        </>
      )}

      {tab === "debt triage" && (
        <>
          <div style={s.note}>Impact vs Effort matrix: prioritise ruthlessly. High-effort low-impact items are usually never worth doing.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, marginBottom: 12, height: 200 }}>
            {[
              { label: "do-now ⚡", impact: "high", effort: "low", color: "#dcfce7", border: "#bbf7d0", text: "Quick wins — do this week" },
              { label: "plan 📋", impact: "high", effort: "high", color: "#ede9fe", border: "#c4b5fd", text: "Next quarter planning" },
              { label: "batch 🗂", impact: "low", effort: "low", color: "#fef3c7", border: "#fde68a", text: "Do during slow periods" },
              { label: "skip 🗑", impact: "low", effort: "high", color: "#f1f5f9", border: "#e2e8f0", text: "Probably never worth it" },
            ].map(({ label, impact, effort, color, border, text }) => (
              <div key={label} style={{ background: color, border: `1px solid ${border}`, borderRadius: 8, padding: 10, display: "flex", flexDirection: "column" as const, justifyContent: "space-between" }}>
                <strong style={{ fontSize: 12 }}>{label}</strong>
                <div style={{ fontSize: 10, color: "#64748b" }}>Impact: {impact} · Effort: {effort}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{text}</div>
              </div>
            ))}
          </div>
          {debtItems.map(({ desc, impact, effort }) => {
            const priority = triage(impact, effort);
            return (
              <div key={desc} style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0", fontSize: 12 }}>
                <span style={{ minWidth: 70, padding: "2px 8px", borderRadius: 4, background: priorityColor[priority], color: "#fff", fontSize: 10, fontWeight: 700, textAlign: "center" as const }}>{priority}</span>
                <span style={{ color: "#334155" }}>{desc}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>impact:{impact} effort:{effort}</span>
              </div>
            );
          })}
        </>
      )}

      {tab === "checklist" && (
        <>
          <div style={s.note}>Before shipping a significant tech decision, run through this checklist. A "D-grade" decision made fast is worse than a "B-grade" decision made deliberately.</div>
          {[
            { check: "Considered ≥ 3 alternatives", why: "Forces exploration beyond the first idea. The best option is rarely the first one you think of." },
            { check: "Assessed reversibility", why: "Easy to reverse = proceed confidently. Lock-in decisions (new DB, new framework) deserve extra scrutiny." },
            { check: "Consulted affected teams", why: "Surprises are the enemy of alignment. Loop in consumers early — they catch edge cases you miss." },
            { check: "Documented trade-offs (not just the winner)", why: "Future engineers need to know what you decided against and why, or they'll repeat the analysis." },
            { check: "Set a review date", why: "Decisions made with 2026 context may be wrong by 2027. Schedule a check-in before the decision becomes permanent folklore." },
          ].map(({ check, why }) => (
            <div key={check} style={s.card}>
              <div style={s.row}>
                <span style={{ fontSize: 16 }}>☑️</span>
                <div>
                  <strong style={{ fontSize: 12 }}>{check}</strong>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{why}</p>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ─── Demo 3: RFCs & Documentation ─────────────────────────────────────────────

const RFC_TABS = ["RFC structure", "doc types", "API docs", "runbook"] as const;
type RfcTab = (typeof RFC_TABS)[number];

const RFCsDocumentationDemo: React.FC = () => {
  const [tab, setRfcTab] = useState<RfcTab>("RFC structure");
  const [rfcStep, setRfcStep] = useState(0);

  const rfcLifecycle = [
    { status: "Draft", desc: "Author writes RFC. Not yet shared widely. Focus on getting thoughts down.", action: "Share with 1–2 trusted colleagues for early sanity check." },
    { status: "Review", desc: "RFC is open for comments. Team has 1–2 weeks to provide feedback via PR comments or RFC tool.", action: "Address all blocking comments. Update document with changes. Add a CHANGELOG section." },
    { status: "Accepted", desc: "Consensus reached. RFC is approved. Author can begin implementation.", action: "Link RFC in implementation PR. Implement exactly what RFC describes or open a new RFC for divergence." },
    { status: "Rejected", desc: "Not moving forward. Document the reasons — this is as valuable as accepted RFCs.", action: "Record why it was rejected. Future engineers shouldn't repeat the analysis." },
    { status: "Revised", desc: "Feedback requires significant rework. Not rejected, but not ready.", action: "Update the RFC, summarise changes at the top, re-open review period." },
  ];

  return (
    <div>
      <div style={s.tabs}>
        {RFC_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setRfcTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "RFC structure" && (
        <>
          <div style={s.note}>RFCs (Requests for Comments) get alignment before building. A 2-hour RFC saves a 2-week wrong implementation.</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {rfcLifecycle.map((s2, i) => (
              <button key={i} style={{ ...s.btn(rfcStep === i ? "#6366f1" : "#e2e8f0"), color: rfcStep === i ? "#fff" : "#334155" }} onClick={() => setRfcStep(i)}>
                {i + 1}. {s2.status}
              </button>
            ))}
          </div>
          <div style={{ ...s.card, borderLeft: "4px solid #6366f1" }}>
            <strong style={{ color: "#6366f1" }}>{rfcLifecycle[rfcStep].status}</strong>
            <p style={{ fontSize: 12, color: "#334155", margin: "6px 0 4px" }}>{rfcLifecycle[rfcStep].desc}</p>
            <p style={{ fontSize: 12, color: "#059669", margin: 0 }}>→ {rfcLifecycle[rfcStep].action}</p>
          </div>
          <div style={s.code}>
            {`# RFC-012: Adopt Zod for Runtime Validation

## Summary
Introduce Zod as the standard library for validating API responses
and form data across the frontend.

## Motivation
We have 12 API endpoints with no runtime validation. Silent type
mismatches have caused 3 production bugs in the past quarter.

## Detailed Design
Wrap all fetch calls with a Zod schema. Export from shared package.
Auto-generate types with z.infer<typeof schema>.

  const PostSchema = z.object({ id: z.number(), title: z.string() });
  const post = PostSchema.parse(await res.json());

## Drawbacks
- +14kB gzip to bundle
- Every API schema must be maintained alongside backend type

## Alternatives
- Yup: larger bundle, older API
- io-ts: functional style, steeper learning curve
- Manual guards: no standardisation

## Unresolved Questions
- Validate in dev only, or always?
- Generate schemas from OpenAPI spec?`}
          </div>
        </>
      )}

      {tab === "doc types" && (
        <>
          <div style={s.note}>The Diátaxis framework identifies 4 distinct documentation types. Each serves a different reader need — mixing them confuses both.</div>
          {[
            {
              type: "Tutorial", color: "#6366f1", orient: "Learning-oriented",
              desc: "Guides a beginner through a complete, working example. Success = reader reaches the end and something works.",
              example: "'Getting Started with React' — build a Todo app from scratch, step by step",
              rules: ["Always works — test it. A broken tutorial is worse than none.", "Minimal explanation — do, don't explain. Explanation comes later.", "Concrete: 'click the green button', not 'configure the UI'"],
            },
            {
              type: "How-to", color: "#0891b2", orient: "Problem-oriented",
              desc: "Shows how to accomplish a specific goal. Assumes reader has basic knowledge. 'How do I X?'",
              example: "'How to add authentication to your Next.js app'",
              rules: ["Title starts with 'How to...'", "Assumes existing knowledge — no hand-holding basics", "Focused on one task"],
            },
            {
              type: "Reference", color: "#7c3aed", orient: "Information-oriented",
              desc: "Dry, accurate, complete. Lists all props, all options, all edge cases. Like a dictionary.",
              example: "useForm() API — all props, all return values, all types",
              rules: ["100% accurate and up-to-date (auto-generate from types if possible)", "No tutorial content — just facts", "Must be exhaustive"],
            },
            {
              type: "Explanation", color: "#d97706", orient: "Understanding-oriented",
              desc: "Discusses concepts, design decisions, 'why'. For readers who want to understand, not just use.",
              example: "'Why React uses a Virtual DOM' or 'The philosophy behind our design system'",
              rules: ["Can be opinionated", "Links to reference for specifics", "Doesn't need to be actionable"],
            },
          ].map(({ type, color, orient, desc, example, rules }) => (
            <div key={type} style={{ ...s.card, borderLeft: `4px solid ${color}`, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={s.label(color)}>{type}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{orient}</span>
              </div>
              <p style={{ fontSize: 12, color: "#334155", margin: "0 0 4px" }}>{desc}</p>
              <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 6px" }}>Example: <em>{example}</em></p>
              <ul style={{ fontSize: 11, color: "#475569", margin: 0, paddingLeft: 16 }}>
                {rules.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {tab === "API docs" && (
        <>
          <div style={s.note}>Good API documentation has a description, all parameters typed and explained, return value, and at least one code example. Readers learn from examples, not prose.</div>
          <div style={s.grid2}>
            <div style={{ ...s.card, borderTop: "3px solid #dc2626" }}>
              <div style={s.label("#dc2626")}>Undocumented function</div>
              <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
                {`export function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency
  }).format(amount);
}`}
              </div>
              <p style={{ fontSize: 11, color: "#dc2626", margin: "6px 0 0" }}>Reader must read the implementation to understand it.</p>
            </div>
            <div style={{ ...s.card, borderTop: "3px solid #059669" }}>
              <div style={s.label("#059669")}>Well-documented (TSDoc)</div>
              <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
                {`/**
 * Formats a number as a localised currency string.
 *
 * @param amount  - The numeric value to format
 * @param currency - ISO 4217 code (e.g. 'USD', 'EUR')
 * @returns Formatted string e.g. '$1,234.56'
 * @throws {RangeError} If currency code is invalid
 *
 * @example
 * formatCurrency(1234.56, 'USD') // '$1,234.56'
 * formatCurrency(1000, 'EUR')    // '€1,000.00'
 */
export function formatCurrency(
  amount: number,
  currency: string
): string { ... }`}
              </div>
            </div>
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>TSDoc tag reference</strong>
            {[
              { tag: "@param name — description", use: "Document each parameter" },
              { tag: "@returns — what the function returns", use: "Document return value + type" },
              { tag: "@throws {ErrorType} — when", use: "Document error conditions" },
              { tag: "@example — code snippet", use: "Show how to call it (most valuable)" },
              { tag: "@deprecated — use X instead", use: "Mark obsolete APIs" },
              { tag: "@see {@link OtherFunction}", use: "Cross-reference related APIs" },
            ].map(({ tag, use }) => (
              <div key={tag} style={s.row}>
                <code style={{ minWidth: 240, fontSize: 11, color: "#6366f1" }}>{tag}</code>
                <span style={{ fontSize: 11, color: "#64748b" }}>{use}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "runbook" && (
        <>
          <div style={s.note}>Runbooks are for on-call engineers at 3am. Write for someone who is stressed and may not know your system well. Be concrete, not vague.</div>
          <div style={s.code}>
            {`# Runbook: High API Latency Alert

## Symptom
P95 API latency exceeds 2s for > 5 minutes.
Alert: "api-latency-p95 > 2000ms" in PagerDuty.

## Possible Causes
1. Database connection pool exhausted (most common)
2. Upstream dependency (Auth service) degraded
3. Memory pressure causing GC pauses
4. Recent deploy with a slow query / N+1

## Diagnostic Steps
1. Open Datadog APM → Service Map → find the slowest span
2. Run: SELECT * FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC
3. Check deploy history: did latency increase after a specific deploy?
4. Check Auth service status page and Slack #status-auth

## Remediation
- If DB pool exhausted: kubectl rollout restart deployment/api
- If correlated with deploy: kubectl rollout undo deployment/api
- If Auth service: route traffic to cached responses (toggle feature flag: use-cached-auth)
- If GC: increase pod memory limit in values.yaml (PR required)

## Escalation
If not resolved in 30 minutes: page DBA team via PagerDuty escalation policy "db-on-call"
Slack: #on-call-db

## Last Tested: 2026-01-15 — by Alice`}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.label("#dc2626")}>Runbook anti-patterns</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>"Check the logs" — which logs? where?</li>
                <li>"Restart if needed" — when is it needed?</li>
                <li>No escalation path — who do you call?</li>
                <li>Never tested — does it actually work?</li>
                <li>Stored in a wiki (stale, no PR review)</li>
              </ul>
            </div>
            <div style={s.card}>
              <div style={s.label("#059669")}>Runbook best practices</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>Concrete commands — copy-paste ready</li>
                <li>Decision tree — if X then Y, else Z</li>
                <li>Time-boxed — "if not resolved in 30 min, escalate"</li>
                <li>Tested quarterly — mark lastTestedDate</li>
                <li>Stored in repo — versioned, PR-reviewed</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Explainer ───────────────────────────────────────────────────────────

const MAIN_TABS = ["Mentoring", "Tech Decisions", "RFCs & Docs"] as const;
type MainTab = (typeof MAIN_TABS)[number];

export const LeadershipExplainer: React.FC = () => {
  const [tab, setTab] = useState<MainTab>("Mentoring");

  return (
    <div style={s.container}>
      <h2 style={s.h2}>Expert — Leadership</h2>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Mentoring · Tech Decisions (ADRs, Decision Matrices) · RFCs & Documentation
      </p>
      <div style={s.tabs}>
        {MAIN_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Mentoring" && <><h3 style={s.h3}>Mentoring</h3><MentoringDemo /></>}
      {tab === "Tech Decisions" && <><h3 style={s.h3}>Tech Decisions — ADRs, Decision Matrices, Debt Triage</h3><TechDecisionsDemo /></>}
      {tab === "RFCs & Docs" && <><h3 style={s.h3}>RFCs & Documentation</h3><RFCsDocumentationDemo /></>}
    </div>
  );
};

export default LeadershipExplainer;
