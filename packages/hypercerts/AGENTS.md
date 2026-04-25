# AGENTS.md — @optimitron/hypercerts

## Scope

Hypercert record builders and AT Protocol publishing helpers. Creates verifiable impact certificates for policy analyses, alignment scores, referrals, and deposits.

## Key Exports (do not break these signatures)

- Bundle builders: `policyBundle`, `alignmentBundle`, `referralBundle`, `depositBundle`
- Record creators: `createRights`, `createActivity`, `createMeasurement`, `createEvaluation`, `createAttachment`
- `publish` — AT Protocol publishing
- `read` — AT Protocol reading

## Dependencies

**None** from other `@optimitron/*` packages (standalone).

## Rules

- **AT Protocol compliance.** Records must conform to AT Protocol lexicon schemas.
- **Immutable once published.** Hypercerts are permanent — validate thoroughly before publishing.

## Off-Limits

- `packages/agent/*` — agent consumes hypercerts, not the other way around
- `packages/web/*`
