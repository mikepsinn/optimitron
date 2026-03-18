# @optimitron/wishocracy

RAPPA (Randomized Aggregated Pairwise Preference Allocation) — preference aggregation via pairwise comparisons with eigenvector weighting, consistency validation, and alignment scoring.

**Paper:** [Wishocracy](https://wishocracy.warondisease.org) — Preference aggregation system for democratic resource allocation.

**Related:** [Optimocracy](https://optimocracy.warondisease.org) — Two-metric welfare function shared with OPG and OBG.

**Source:** [QMD](https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/wishocracy-paper.qmd)

## Features

- Pairwise comparison matrix construction & eigenvector weight extraction
- Consistency ratio (CR) validation
- Citizen Alignment Scores (politician vs citizen preferences)
- Preference gap analysis
- Bootstrap confidence intervals
- Manipulation resistance detection
- Matrix completion for incomplete data
- Smart pair selection (minimize comparisons needed)

## Tests

162 unit tests.

```bash
pnpm test --filter @optimitron/wishocracy
```
