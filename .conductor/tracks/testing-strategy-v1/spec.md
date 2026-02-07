# Track Spec: Hypothesis-Driven Tests for Findings (v1)

## Background
Findings and methodology changes need explicit hypothesis-driven tests across optimizer, OBG, and OPG to keep results defensible and reproducible.

## Objective
Define a hypothesis-driven test format and require each report claim to map to a test.

## Scope
- Confound controls
- Minimum effective spending logic
- Policy scoring and evidence grades

## Acceptance Criteria
- Each report claim has a test mapped in code.
- Confound control and reversal checks are covered.
- Tests run in CI for all library packages.
