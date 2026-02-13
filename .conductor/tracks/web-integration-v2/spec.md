# Track Spec: Wire Library Outputs to Pages + JSON Schema (v2)

## Background
Analysis code and reports are ahead of web presentation. The web app needs stable contracts and page flows to expose generic pair studies, outcome hubs, and jurisdiction drilldowns without per-report custom wiring.

## Objective
Create durable web integration contracts and routes for analysis explorer features.

## Scope
- Shared JSON schemas for:
  - outcome hub rankings
  - predictor/outcome pair studies
  - jurisdiction N-of-1 summaries
- Canonical relationship naming in payload contracts:
  - unit-level: `NOf1VariableRelationship`
  - aggregate-level: `AggregateVariableRelationship`
- Route and URL conventions for deep-linkable study pages.
- Data freshness metadata and provenance rendering.

## Deliverables
- Typed schema files for web data payloads.
- Web pages for:
  - outcome hub
  - pair study
  - jurisdiction drilldown
- Caching and invalidation hooks for generated payloads.
  - Implemented via cached adapter in `packages/web/src/lib/analysis-explorer-data.ts`.
  - URL contracts documented in `.conductor/tracks/web-integration-v2/routes.md`.

## Acceptance Criteria
- Web pages render solely from schema-conformant payloads.
- Deep links are stable and round-trip between pages.
- Each page shows freshness/provenance metadata.
  - Shared component: `packages/web/src/components/analysis/provenance-block.tsx`.
