# Optomitron

**Optimal Policy & Budget Generator** — Evidence-based governance calculations

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Optomitron is a TypeScript library that implements the algorithms from the [Optimocracy](https://optimocracy.warondisease.org) framework:

| Component | Question Answered | Output |
|-----------|-------------------|--------|
| **OPG** (Optimal Policy Generator) | "What policies should jurisdiction X adopt?" | Enact/Replace/Repeal/Maintain recommendations |
| **OBG** (Optimal Budget Generator) | "How much should we spend on category Y?" | Optimal Spending Levels + gap analysis |

All calculations optimize for **two welfare metrics**:
1. **Real after-tax median income growth** (pp/year)
2. **Median healthy life years** (years)

## Installation

```bash
pnpm add @optomitron/core
```

## Quick Start

```typescript
import { 
  calculateCCS, 
  scoreStrength, 
  scoreConsistency,
  estimateOSL,
  calculateBIS 
} from '@optomitron/core';

// Calculate Bradford Hill causal confidence score
const scores = {
  strength: scoreStrength(0.5),           // Standardized effect size
  consistency: scoreConsistency(12),       // 12 jurisdictions with concordant effects
  temporality: 1.0,                        // Policy preceded outcome
  gradient: 0.6,                           // Dose-response correlation
  experiment: 0.85,                        // Synthetic control method
  plausibility: 0.8,                       // Mechanism validated
  coherence: 0.7,                          // Literature support
  analogy: 0.5,                            // Similar policies exist
  specificity: 0.8,                        // Targeted outcomes
};

const ccs = calculateCCS(scores);
console.log(`Causal Confidence Score: ${ccs.toFixed(2)}`);

// Estimate optimal spending level
const spendingData = [
  { spending: 5000, outcome: 0.6, jurisdiction: 'US-TX', year: 2023 },
  { spending: 8000, outcome: 0.75, jurisdiction: 'US-CA', year: 2023 },
  { spending: 12000, outcome: 0.82, jurisdiction: 'US-NY', year: 2023 },
  // ... more data points
];

const osl = estimateOSL(spendingData);
console.log(`Optimal Spending Level: $${osl.oslUsd.toLocaleString()}`);
```

## Architecture

```
optomitron/
├── packages/
│   └── core/                    # Core calculation library
│       ├── src/
│       │   ├── types/           # Zod schemas & TypeScript types
│       │   ├── opg/             # Optimal Policy Generator
│       │   │   └── bradford-hill.ts
│       │   └── obg/             # Optimal Budget Generator
│       │       ├── diminishing-returns.ts
│       │       ├── cost-effectiveness.ts
│       │       └── budget-impact-score.ts
│       └── tests/
└── reports/                     # Generated markdown reports
```

## Key Algorithms

### Bradford Hill Criteria Scoring

Nine criteria for causal inference, operationalized as scoring functions:

| Criterion | Formula | Range |
|-----------|---------|-------|
| Strength | `1 - e^(-|β|/0.3)` | 0-1 |
| Consistency | `1 - e^(-N_j/10)` | 0-1 |
| Temporality | Binary gate | 0 or 1 |
| Gradient | `r²/(r² + 0.25)` | 0-1 |
| Experiment | `w_method × (1 - violations)` | 0-1 |

### Diminishing Returns Modeling

Fits spending-outcome curves to find the "knee" where marginal returns equal opportunity cost:

```
OSL: ∂Outcome/∂Spending = r (discount rate)
```

Supports log-linear and saturation (Michaelis-Menten) models.

### Budget Impact Score (BIS)

Combines quality, precision, and recency weights:

```
BIS = min(1, Σ(w_Q × w_P × w_R) / K)
```

Where:
- `w_Q` = method quality weight (RCT=1.0, cross-sectional=0.25)
- `w_P` = 1/SE² (precision)
- `w_R` = e^(-0.03×age) (recency decay)

## Papers

This library implements algorithms from:

- [Optimocracy: Evidence-Based Governance](https://optimocracy.warondisease.org) — The overall framework
- [Optimal Policy Generator (OPG)](https://opg.warondisease.org) — Policy recommendations
- [Optimal Budget Generator (OBG)](https://obg.warondisease.org) — Budget allocation

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Generate a report
pnpm report --jurisdiction=texas
```

## License

MIT © [Mike P. Sinn](https://mikesinn.com)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
