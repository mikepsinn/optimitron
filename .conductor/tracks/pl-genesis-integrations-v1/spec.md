# Track Spec: PL Genesis Integrations (v1)

## Background
Optimitron already has the core analysis and preference aggregation engines. This track adds decentralized infrastructure integrations: tamper-proof storage for analysis results, verifiable impact attestations via Hypercerts, and an autonomous agent that orchestrates the full pipeline.

## Objectives
- Add a `@optimitron/storage` package that stores analysis and aggregation snapshots as linked Storacha/IPFS JSON payloads with verifiable history chains.
- Add a `@optimitron/hypercerts` package that maps Optimitron and Wishocracy outputs into Hypercerts-compatible AT Protocol records.
- Add a `@optimitron/agent` package that uses Gemini structured-output reasoning to discover preference gaps, plan analyses, interpret results, verify outputs, and publish hypercerts and Storacha receipts. Includes ERC-8004 identity and reputation helper integration.

## Scope
In scope:
- Pure library packages with Zod schemas, mapping helpers, injected network adapters, and tests.
- A typed Gemini orchestration layer with injected adapters wrapping the Optimitron pipeline.
- Agent manifest/log generation plus ERC-8004 helper wrappers for identity and reputation calls.

Out of scope (v1):
- Full `packages/web` UI integration.
- Production wallet custody, OAuth callback hosting, or secret management.
- On-chain deployment automation (testnet only).

## Deliverables
- `packages/storage`
- `packages/hypercerts`
- `packages/agent`

## Acceptance Criteria
- New packages build under the monorepo and expose typed public APIs.
- Core functions are covered by package tests.
- Agent execution produces a structured run log and manifest through injected adapters and Gemini reasoning.
- External network operations are abstracted behind adapters so tests run without credentials.
