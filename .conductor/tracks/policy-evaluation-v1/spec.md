# Track Spec: 3-Layer Policy Evaluation Pipeline (v1)

## Background
Current policy analyses mix generated exemplars and static ranking outputs. The next step is a reproducible pipeline that evaluates each policy through three independent evidence layers and produces one comparable score.

## Objective
Create a generalized `PolicyEvaluation` pipeline that can evaluate any policy with:
- Within-jurisdiction longitudinal evidence
- Natural-experiment before/after evidence
- Cross-jurisdiction panel evidence

## Scope
- Type definitions for policy evaluations and natural experiments
- Runner functions per evidence layer
- Aggregation logic and evidence-grade derivation
- JSON and markdown outputs for downstream web rendering

## Deliverables
- `PolicyEvaluation` and `NaturalExperiment` types in `@optimitron/opg`
- Layered analysis runner and aggregation helper
- Generated `policy-evaluations.json` and report markdown
- Integration hooks to OBG spending/category evidence

## Acceptance Criteria
- At least one policy has all three evidence layers populated.
- Aggregated score and A-F grade are deterministic and test-covered.
- Output schema is stable enough for web rendering without post-processing.

## Risks
- Natural experiment datasets may have sparse or inconsistent pre/post coverage.
- Mapping policy levers to spending categories can inject subjective assumptions.
- Layer weighting can dominate results if quality weights are poorly calibrated.
