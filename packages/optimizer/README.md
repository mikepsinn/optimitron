# @optimitron/optimizer

Domain-agnostic causal inference engine for time series data.

Implements temporal alignment, Pearson/Spearman correlation, Bradford Hill scoring, Predictor Impact Score (PIS), optimal value analysis, and effect size calculation.

**Paper:** [dFDA Specification](https://dfda-spec.warondisease.org) — Decentralized FDA framework for automated causal inference from personal health data.

**Source:** [QMD](https://github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/dfda-spec-paper.qmd)

## Usage

```typescript
import { alignTimeSeries, calculateCorrelation, calculatePIS } from '@optimitron/optimizer';

const pairs = alignTimeSeries(predictor, outcome, { onsetDelay: 7, durationOfAction: 14 });
const correlation = calculateCorrelation(pairs);
const pis = calculatePIS(pairs, correlation);
```

## Tests

176 unit tests covering all algorithms.

```bash
pnpm test --filter @optimitron/optimizer
```
