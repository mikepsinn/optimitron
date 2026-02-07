# Track Spec: OPG Evidence + Policy Scoring Expansion (v1)

## Background
OPG needs to consume new OBG findings and expand policy-level recommendations using consistent evidence grades and directionality metrics.

## Objective
Connect policy levers with spending outcomes and causal evidence grades to produce ranked policy recommendations.

## Inputs
- Policy dataset
- Spending categories
- Welfare effects from optimizer

## Outputs
- Ranked policy recommendations
- Evidence grade and blocking factors

## Constraints
- Domain-agnostic core
- No runtime DB dependencies

## Acceptance Criteria
- Policy scoring aligns with evidence grade and direction score.
- Recommendations map cleanly to spending categories.
