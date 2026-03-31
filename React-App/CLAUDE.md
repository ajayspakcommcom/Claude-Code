# Project Context for Claude Code

## About This Project
This is a React + TypeScript + Webpack learning project following the React.js Roadmap (Beginner → Senior → Expert).

- Full roadmap: `documentation/react-roadmap.md`
- Full session log: `documentation/what-we-did.md`

---

## Goal
Build and explore all React features that are **industry standard**, level by level.

---

## Current Level
- [x] Beginner (Foundations) — COMPLETE
- [ ] Intermediate (Production Ready) — IN PROGRESS
- [ ] Senior (Architecture & Scale)
- [ ] Expert (Frontend Engineer / Architect)

---

## Intermediate Progress
- [x] Advanced React — COMPLETE (`src/intermediate/advanced-react/`)
- [x] Routing — PARTIAL (`React-App-FileRouter/` — separate Vite project)
- [ ] Routing — Remaining concepts — **NEXT (start here)**
- [ ] State Management
- [ ] Forms & Validation
- [ ] Styling
- [ ] Performance
- [ ] API Integration
- [ ] Testing (Basics)
- [ ] Practice

---

## Folder Structure

```
Claude-Code/
├── React-App/                        ← THIS project (Webpack, port 3000)
│   ├── documentation/
│   │   ├── react-roadmap.md
│   │   └── what-we-did.md            ← Full session log, read this to resume
│   └── src/
│       ├── App.tsx
│       ├── beginner/
│       │   ├── react-basics/         ← 6 files
│       │   ├── hooks/                ← 15 built-in + custom/ (8 custom hooks)
│       │   └── practice/             ← Counter, Todo, CRUD
│       └── intermediate/
│           └── advanced-react/       ← 5 files
│
└── React-App-FileRouter/             ← Routing project (Vite, port 5173)
    └── src/routes/                   ← TanStack Router file-based routing
```

---

## How to Resume in a New Session
1. Read this file — you now know the current state
2. Read `documentation/what-we-did.md` for full detail on every file built
3. Next topic to build: **TanStack Router — remaining industry concepts** (inside `React-App-FileRouter/`)
4. After routing is complete → **State Management** (inside `React-App/src/intermediate/`)

---

## TanStack Router — NOT YET COVERED (do these first next session)

All work goes inside `React-App-FileRouter/src/routes/`.

### Must Know (do first)
| Concept | How to implement |
|---------|-----------------|
| **Pending component** | Add `pendingComponent` to a route — shows spinner while loader fetches |
| **Error component** | Add `errorComponent` to a route — per-route error boundary UI |
| **`staleTime` on loader** | `loader: { staleTime: 5000 }` — cache loader data, avoid refetch on revisit |
| **`useNavigate`** | Programmatic navigation after form submit or action |
| **`useParams`** | Read dynamic params (`$userId`) from any deeply nested component |
| **`useSearch`** | Read + update typed search params from any component |
| **`Link` activeOptions** | Exact active matching, include search in active state |

### Good to Know (do second)
| Concept | How to implement |
|---------|-----------------|
| **Lazy routes** | `lazyRouteComponent(() => import('./HeavyPage'))` — code split |
| **Scroll restoration** | Built-in — enable via router config |
| **`activeOptions`** | `<Link activeOptions={{ exact: true, includeSearch: true }}>` |

### Advanced (do last)
| Concept | How to implement |
|---------|-----------------|
| **Route masking** | Show different URL than actual route (modal pattern) |
| **Parallel loaders** | Multiple loaders running simultaneously on one route |
| **Context in loaders** | Pass auth/theme context into `loader` via `router.context` |

---

## Tech Stack
- React 18, TypeScript 5, Webpack 5
- TanStack Router (routing — in React-App-FileRouter)
- Zod (search param validation)

---

## Commands
```bash
# Main app
cd React-App && npm start          # → http://localhost:3000

# Routing app (separate project)
cd React-App-FileRouter && npm run dev   # → http://localhost:5173
```

---

## Progress Log
| Date       | Topic                          | Status |
|------------|-------------------------------|--------|
| 2026-03-30 | Project setup                  | Done   |
| 2026-03-31 | Beginner — React Basics        | Done   |
| 2026-03-31 | Beginner — All Hooks (15+8)    | Done   |
| 2026-03-31 | Beginner — Practice apps       | Done   |
| 2026-03-31 | Intermediate — Advanced React  | Done   |
| 2026-03-31 | Intermediate — Routing         | Done   |
