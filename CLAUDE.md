# CLAUDE.md - Optomitron Agent Instructions

## What This Is

Optomitron is a **time series causal inference engine** for evidence-based governance and drug assessment. You are the dedicated agent responsible for developing and improving this repository.

## Papers (Required Reading)

These papers define the algorithms you're implementing. **Read the local QMD files** for full detail — they contain the actual math, schemas, and worked examples.

| Paper | Local Path (read this!) | Web URL |
|-------|------------------------|---------|
| **dFDA Spec** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/dfda-spec-paper.qmd` | https://dfda-spec.warondisease.org |
| **Optimocracy** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/optimocracy-paper.qmd` | https://optimocracy.warondisease.org |
| **Optimal Policy Generator** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/optimal-policy-generator-spec.qmd` | https://opg.warondisease.org |
| **Optimal Budget Generator** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/optimal-budget-generator-spec.qmd` | https://obg.warondisease.org |

**Before implementing an algorithm, read the relevant paper section.** The QMD files have:
- Exact mathematical formulas
- Worked examples with real numbers
- SQL schemas for data structures
- Parameter values and justifications
- Bradford Hill scoring functions with saturation constants

### How to Use the Papers
1. Working on `@optomitron/causal`? → Read dFDA Spec (PIS, temporal alignment, effect size)
2. Working on OPG? → Read Optimal Policy Generator (Policy Impact Score, CCS, jurisdiction analysis)
3. Working on OBG? → Read Optimal Budget Generator (OSL, diminishing returns, BIS)
4. Working on welfare metrics? → Read Optimocracy (two-metric welfare function)

The papers are large (1000-2000 lines each). Read the specific section relevant to what you're implementing — don't try to read them all at once.

## Architecture

```
optomitron/
├── packages/
│   ├── causal/          # 🧠 CORE: Domain-agnostic causal inference
│   │   ├── types.ts              # TimeSeries, AlignedPair, PIS types
│   │   ├── temporal-alignment.ts # Onset delay δ, duration τ, pairing
│   │   ├── statistics.ts         # Correlation, effect size, p-values
│   │   └── predictor-impact-score.ts  # Bradford Hill, PIS calculation
│   │
│   ├── data/            # 📊 Data fetchers (TODO)
│   │   ├── oecd.ts               # OECD spending/outcomes
│   │   ├── world-bank.ts         # World Development Indicators
│   │   ├── census.ts             # US Census Bureau
│   │   └── ...
│   │
│   └── core/            # 🔧 High-level API
│       ├── opg/                  # Policy-specific (uses causal)
│       └── obg/                  # Budget-specific (uses causal)
```

## The Core Insight

The same causal inference engine works across domains:

| Application | Predictor | Outcome | Example |
|-------------|-----------|---------|---------|
| **dFDA** | Drug/Supplement | Symptom/Biomarker | "Does magnesium improve sleep?" |
| **OPG** | Policy | Welfare metrics | "Does tobacco tax reduce smoking?" |
| **OBG** | Spending level | Welfare metrics | "What's the optimal education budget?" |

All use:
- **Temporal alignment** (onset delay δ, duration of action τ)
- **Bradford Hill criteria** for causal confidence
- **Predictor Impact Score** composite metric

## Current State

✅ Implemented:
- `@optomitron/causal` - Core causal inference engine
- Temporal alignment (outcome-based and predictor-based pairing)
- Bradford Hill scoring functions
- Predictor Impact Score calculation
- Effect size (percent change from baseline)
- Optimal value analysis
- Data quality validation

🔲 TODO:
- [ ] Unit tests for all modules
- [ ] `@optomitron/data` package with data fetchers
- [ ] CLI for generating reports
- [ ] Integration tests with real data
- [ ] TypeDoc documentation
- [ ] Example notebooks/scripts
- [ ] CI/CD with GitHub Actions

## Development Guidelines

### ⚠️ HARD RULE: Every Change Gets Tests

**No code ships without tests. Period.**

- Every new function → unit test
- Every new module → integration test
- Every bug fix → regression test that would have caught it
- Every data fetcher → test with mocked API responses
- If you touch a file, check if it has tests. If not, add them.

Test files go next to the source: `foo.ts` → `foo.test.ts`

```bash
pnpm test                    # Run all tests
pnpm --filter @optomitron/causal test  # Test specific package
```

### Test Quality Standards
- Test happy path AND edge cases (empty arrays, NaN, zero division, etc.)
- Test with realistic data from the papers (not just trivial examples)
- Aim for >90% coverage on calculation modules
- Data fetchers: mock the HTTP responses, don't hit real APIs in tests

### Code Style
- Use Zod for runtime type validation
- Export types from `types.ts`
- Document functions with JSDoc
- Include paper references in comments

### Commit Messages
Follow conventional commits:
- `feat: Add OECD data fetcher`
- `fix: Correct p-value calculation for small n`
- `test: Add temporal alignment unit tests`
- `docs: Update README with usage examples`

## Priority Tasks

When you run, prioritize in this order:

1. **Fix any failing tests or build errors** (always first)
2. **Check test coverage** — if ANY module has <80% coverage, write tests before new features
3. **Pick from TASKS.md** — follow the prioritized queue
4. **Every change must include tests** — this is non-negotiable

### The Test Rule
If you implement a function, you write its tests in the same PR. 
If you find existing code without tests, writing those tests IS a valid task.
No exceptions. No "I'll add tests later." Tests ship with code.

## Workflow

1. `cd /mnt/e/code/optomitron`
2. `git pull` (get latest)
3. Check for issues: `pnpm test`, `pnpm build`
4. **Self-review pass** (see below)
5. Make improvements
6. `git add -A && git commit -m "..."` 
7. `git push`
8. Report what you did

## Self-Review: Be Ruthlessly Critical

Every run, before picking a new task, spend 2 minutes scanning the codebase with fresh eyes. Ask yourself:

### Code Smells to Fix Immediately
- **Dead code**: Unused imports, unreachable branches, commented-out code → delete it
- **Copy-paste**: Same logic in multiple places → extract to shared function
- **Over-engineering**: Abstract base classes nobody extends, factories that create one thing, "generic" wrappers with one use case → simplify
- **Wrong abstractions**: If a function takes 8 parameters, it's doing too much → split it
- **Misleading names**: If you have to read the implementation to understand what a function does, rename it
- **Magic numbers**: Unexplained constants → named constants with comments citing the paper
- **Stale TODOs**: TODO comments older than 1 week with no plan → either do it or delete it

### Architecture Smells
- **Packages that import each other circularly** → restructure
- **Giant files** (>500 lines) → split by responsibility
- **Types duplicated across packages** → move to shared types
- **Unnecessary dependencies** → if you can do it in 10 lines, don't import a library
- **Over-abstraction**: Don't build "frameworks" — build working code. If there's only one implementation, you don't need an interface.

### The Simplicity Test
For every piece of code, ask: **"Could a junior developer understand this in 30 seconds?"**
If not, simplify it. This is a library for calculating correlations and scoring evidence — it should not feel like enterprise Java.

### What Good Looks Like
- Functions are <30 lines
- Files are <300 lines
- Module names tell you exactly what's inside
- Tests read like documentation
- No unnecessary abstractions — just functions that take data and return results

## Contact

This repo is owned by Mike P. Sinn (@mikepsinn). If you need clarification on methodology, reference the papers above or ask in the main session.
