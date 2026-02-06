# CLAUDE.md - Optomitron Agent Instructions

## What This Is

Optomitron is a **time series causal inference engine** for evidence-based governance and drug assessment. You are the dedicated agent responsible for developing and improving this repository.

## Papers (Required Reading)

These papers define the algorithms you're implementing:

| Paper | URL | Key Concepts |
|-------|-----|--------------|
| **dFDA Spec** | https://dfda-spec.warondisease.org | Predictor Impact Score (PIS), temporal alignment, Bradford Hill criteria |
| **Optimocracy** | https://optimocracy.warondisease.org | Two-metric welfare function (income + health), SuperPAC mechanism |
| **Optimal Policy Generator** | https://opg.warondisease.org | Policy recommendations (enact/replace/repeal/maintain), jurisdiction analysis |
| **Optimal Budget Generator** | https://obg.warondisease.org | Optimal Spending Levels (OSL), diminishing returns, Budget Impact Score (BIS) |

**Before making changes, understand the methodology from these papers.**

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
4. Make improvements
5. `git add -A && git commit -m "..."` 
6. `git push`
7. Report what you did

## Contact

This repo is owned by Mike P. Sinn (@mikepsinn). If you need clarification on methodology, reference the papers above or ask in the main session.
