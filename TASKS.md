# TASKS.md - Optomitron Task Queue

## How This Works
- Agent picks the **first unclaimed task** (status: `todo`)
- Sets it to `in_progress` while working
- Sets to `done` when complete, `blocked` if stuck
- If blocked, agent sends a message explaining why
- If all tasks are done, agent proposes new tasks based on codebase analysis

## Priority Order (work top to bottom)

### P0: Foundation (must work first)
- [x] ~~Initial scaffold~~ (done 2026-02-06)
- [x] ~~Create @optomitron/causal package~~ (done 2026-02-06)
- [x] ~~Create @optomitron/data package~~ (done 2026-02-06)
- [ ] `todo` — **Fix build**: Run `pnpm install && pnpm build` across all packages, fix any TypeScript errors
- [ ] `todo` — **Add vitest config**: Create vitest.config.ts for each package so `pnpm test` works

### P1: Tests (validate what exists)
- [ ] `todo` — **Test temporal alignment**: Unit tests for alignOutcomeBased, alignPredictorBased, edge cases (empty data, single measurement)
- [ ] `todo` — **Test statistics**: Unit tests for pearsonCorrelation, spearmanCorrelation, calculateEffectSize
- [ ] `todo` — **Test Bradford Hill scoring**: Unit tests for each scoring function (scoreStrength, scoreConsistency, etc.)
- [ ] `todo` — **Test PIS calculation**: Integration test with realistic mock data showing full PIS pipeline
- [ ] `todo` — **Test OBG diminishing returns**: Unit tests for fitLogModel, fitSaturationModel, findOSL
- [ ] `todo` — **Test BIS calculation**: Unit tests for calculateBIS, scoreToGrade

### P2: Data Layer
- [ ] `todo` — **Add FRED data fetcher**: Federal Reserve Economic Data (GDP, income, CPI)
- [ ] `todo` — **Add WHO data fetcher**: Health outcome data (life expectancy, HALE, mortality)
- [ ] `todo` — **Add Census/BLS fetcher**: US-specific income and employment data
- [ ] `todo` — **Add CEA Registry fetcher**: Cost-effectiveness analysis data
- [ ] `todo` — **Add SIPRI fetcher**: Military spending data
- [ ] `todo` — **Add data caching layer**: Simple file-based cache to avoid re-fetching

### P3: CLI & Reports
- [ ] `todo` — **Create CLI entry point**: `tsx src/cli/report.ts --jurisdiction=USA` generates markdown
- [ ] `todo` — **Budget gap report**: Markdown report showing current vs optimal spending
- [ ] `todo` — **Policy recommendation report**: Markdown report for a jurisdiction
- [ ] `todo` — **Example scripts**: Working examples in `/examples` directory

### P4: Documentation
- [ ] `todo` — **Add JSDoc to all public functions**: Every exported function needs proper documentation
- [ ] `todo` — **Add TypeDoc generation**: Auto-generate API docs
- [ ] `todo` — **Add architecture diagram**: Mermaid diagram in README showing data flow
- [ ] `todo` — **Add CONTRIBUTING.md**: How to add new data sources, new scoring functions

### P5: CI/CD
- [ ] `todo` — **GitHub Actions**: CI pipeline (build, test, lint on PR)
- [ ] `todo` — **Automated releases**: Semantic versioning with changesets

## Proposing New Tasks
If all tasks above are done, analyze the codebase and propose new tasks by:
1. Running the test suite and identifying gaps
2. Checking for TODO/FIXME comments in code
3. Reviewing papers for unimplemented algorithms
4. Add new tasks to this file under a new section "## Agent-Proposed Tasks"
