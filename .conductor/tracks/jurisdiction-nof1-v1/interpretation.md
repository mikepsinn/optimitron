# Interpreting Jurisdiction N-of-1 Evidence

## Purpose
Jurisdiction rows are subject-level summaries, not standalone policy verdicts. They should be interpreted as one evidence layer in the aggregate n-of-1 study.

## Quality Gate Meaning
- `Pass`: jurisdiction has enough aligned pairs and minimum signal strength.
- `Flagged`: at least one threshold failed (for example low pair count or weak signal).

Flagged rows are still visible for transparency but down-weighted in ranking score.

## Common Weak-Evidence Patterns
- `coverage.low_pairs`: too few aligned pairs for stable estimates.
- `signal.weak`: forward/predictive correlation and percent-change are all near zero.
- `signal.missing_correlations`: insufficient correlation diagnostics in source data.

## Confounding Cautions
- A jurisdiction can show strong local signal while disagreeing with aggregate direction.
- Direction disagreement (`reversed` or `mixed`) is a transferability warning, not proof of model failure.
- Always inspect aggregate comparison deltas before treating a local estimate as globally generalizable.

## Recommended Reading Order
1. Pair-study aggregate evidence grade and quality badges.
2. Jurisdiction quality-gate status and reason codes.
3. Direction agreement vs aggregate.
4. Magnitude deltas (predictive/forward/% change) and pair counts.
