# AGENTS.md — @optimitron/storage

## Scope

IPFS-backed snapshot storage for Wishocracy aggregations, policy analyses, and health analyses. Storacha client, Pinata integration, encrypted storage.

## Key Exports (do not break these signatures)

- Snapshot types: `WishocracyAggregationSnapshot`, `PolicyAnalysisSnapshot`, `HealthAnalysisSnapshot`
- Store functions: `wishocracyStore`, `analysisStore`, `healthAnalysisStore`
- `client` — Storacha client
- `pinata` — Pinata integration
- `encryptedStore` — encrypted storage
- `crypto` — cryptographic utilities

## Dependencies

- `@optimitron/optimizer` — time series types

## Rules

- **CIDs are permanent.** Once stored, content is immutable and addressed by hash.
- **Validate before storing.** Use Zod schemas to validate snapshots.

## Off-Limits

- `apps/optimitron/*`
- `packages/agent/*` — agent consumes storage, not the other way around
