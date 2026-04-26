# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (uses webpack explicitly)
npm run build    # Static export build
npm run lint     # ESLint
```

No test runner is configured — correctness is validated in-browser via Pyodide.

## Architecture

TorqueFlow is a **fully static, client-side** robotics learning platform. Users solve robotics problems by writing Python code that runs in the browser via Pyodide. There is no backend.

`next.config.ts` sets `output: "export"`, so there is no SSR and no server components — all interactive code must be `"use client"`.

### Problem Data Model

Every problem lives in `src/data/problems/<topic>/<slug>.ts` (or flat in `src/data/problems/` for older entries) and exports a single `Problem` object typed in `src/data/types.ts`. Key fields:

- `starterCode` — Python stub the user edits
- `testRunnerCode` — Python script with a `__TEST_CASES__` placeholder; the hook injects serialized JSON test cases at runtime
- `testCases` — array of `{ id, input, expected }` used to populate the placeholder
- `vizType` — string key that maps to a lazy-loaded visualization component
- `solutionCode` — reference solution shown in the Solution tab

All problems are aggregated in `src/data/problems.ts` which exports the `problems` array and `getProblemBySlug(slug)`.

### Execution Flow

1. User writes Python in the Monaco editor (`src/components/editor/CodeEditor.tsx`); code is persisted to localStorage per slug via `src/lib/storage.ts`.
2. "Run" triggers `usePyodide().runCode(userCode, testRunnerCode, testCases)` in `src/hooks/usePyodide.ts`.
3. The hook concatenates user code + test runner, injects `__TEST_CASES__` as JSON, redirects `sys.stdout`, and executes in Pyodide (loaded from CDN, NumPy pre-loaded).
4. Results (`{ id, passed, output, expected, error }[]`) and captured stdout are returned.
5. If all tests pass, `useProgress().markSolved(slug)` writes to localStorage.

### Problem Page Layout

`src/app/problems/[slug]/ProblemPageClient.tsx` is the single client component for the problem-solving UI:

- **Left column**: tabbed panel — Description / Theory / Solution — plus the visualization component
- **Right column**: `CodeEditor` (Monaco) + `TestCasePanel` (runs code, shows per-test results and stdout)
- Visualization components are dynamically imported (`next/dynamic`, SSR disabled) via a `vizType → component` map

### Adding a New Problem

1. Create `src/data/problems/<topic>/<slug>.ts` following the `Problem` interface.
2. Write `testRunnerCode` that reads `__TEST_CASES__` via `import json; cases = json.loads("""__TEST_CASES__""")` and outputs a JSON array of `{ id, passed, output, expected, error }`.
3. If a new `vizType` is needed, create `src/components/visualizations/<Name>Viz.tsx` and add it to the dynamic import map in `ProblemPageClient.tsx`.
4. Import and add the problem to the `problems` array in `src/data/problems.ts`.

### Visualizations

All viz components live in `src/components/visualizations/` and receive problem-specific props. They use React Three Fiber / Drei for 3D, or plain SVG/Canvas for 2D. They must be client-safe (no SSR).
