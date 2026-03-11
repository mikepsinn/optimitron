# Track Spec: PL Genesis Integrations (v1)

## Background
Optomitron already has the core analysis and preference aggregation engines. The PL Genesis build needs portable integration packages that can attest results, store history on decentralized infrastructure, and orchestrate the analysis flow as an autonomous agent.

## Objectives
- Add a `@optomitron/hypercerts` package that maps Optomitron and Wishocracy outputs into Hypercerts-compatible AT Protocol records.
- Add a `@optomitron/storage` package that stores analysis and aggregation snapshots as linked Storacha/IPFS JSON payloads.
- Add a `@optomitron/agent` package that discovers preference gaps, plans analyses, executes internal tools, verifies outputs, and publishes receipts.
- Add non-code application docs for Funding the Commons and Crecimiento.

## Scope
In scope:
- Pure library packages with Zod schemas, mapping helpers, injected network adapters, and tests.
- Agent manifest/log generation plus ERC-8004 helper wrappers for identity and reputation calls.
- Documentation artifacts for the two narrative submissions.

Out of scope (v1):
- Full `packages/web` UI integration.
- Production wallet custody, OAuth callback hosting, or secret management.
- On-chain deployment automation.

## Deliverables
- `packages/hypercerts`
- `packages/storage`
- `packages/agent`
- `docs/funding-the-commons-application.md`
- `docs/crecimiento-application.md`

## Acceptance Criteria
- New packages build under the monorepo and expose typed public APIs.
- Core functions are covered by package tests.
- Agent execution produces a structured run log and manifest.
- External network operations are abstracted behind adapters so tests run without credentials.
