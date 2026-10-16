# @optimitron/wishocracy

RAPPA (Randomized Aggregated Pairwise Preference Allocation): turns "split $100 between A and B" answers into budget weights, with confidence intervals and alignment scoring.

**Paper:** [Wishocracy](https://wishocracy.warondisease.org) — Preference aggregation system for democratic resource allocation.

**Related:** [Optimocracy](https://optimocracy.warondisease.org) — Two-metric welfare function shared with OPG and OBG.

**Source:** [QMD](https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/wishocracy-paper.qmd)

## Sparse data: what wishocracy.org uses

Each person answers only a few of the possible pairs, so the comparison data is sparse. These functions handle that (`src/log-least-squares.ts`):

- **`logLeastSquaresWeights`**: the paper's method for sparse data. Every answer is one observation of the ratio between two items. Answers are pooled per pair and one set of weights is fitted by logarithmic least squares. An unanswered pair adds nothing. A weak pull toward equal weights keeps items in disconnected parts of the comparison graph defined.
- **Funding votes** (`fundingSupport`, and the `fundingVotes` option): the paper's zero-funding filter. A split of $100 cannot say "nothing", so a separate yes or no on "should this be funded at all?" carries opposition. Each item's weight is scaled by its share of "yes" votes. wishocracy.org counts "fund neither" answers and programs skipped on its selection screen as "no".
- **`logLeastSquaresConfidenceIntervals`**: percentile bootstrap intervals. They resample participants, not single answers, and each participant's funding votes go with them.
- **`answerAgreement`**: how many of a person's answers their fitted weights reproduce. A tie agrees with neither side.

## Dense-matrix methods

Classic AHP methods for when most pairs are answered:

- `aggregateComparisons`, `buildComparisonMatrix`, `principalEigenvector`
- `consistencyRatio`
- `bootstrapConfidenceIntervals`, `analyseConvergence`

They read an unanswered pair as a tie, which pulls sparse results toward equal weights.

## Other features

- Citizen Alignment Scores (politician vs citizen preferences)
- Preference gap analysis
- Manipulation resistance detection
- Matrix completion for incomplete data
- Smart pair selection (minimize comparisons needed)

## Tests

Unit-tested — run `pnpm --filter @optimitron/wishocracy test` for the live count.

```bash
pnpm test --filter @optimitron/wishocracy
```
