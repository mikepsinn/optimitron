# Plan: PL Genesis Integrations (v1)

## Phase 1: Scaffolding
- [x] Add workspace package scaffolds for `hypercerts`, `storage`, and `agent`.
- [x] Add track metadata/spec/plan for reproducibility.

## Phase 2: Storacha Storage (done)
- [x] Add linked snapshot schemas for Wishocracy and Optimitron payloads.
- [x] Add Storacha client wrapper and chain/history helpers.
- [x] Add package tests for upload/retrieve/history behavior.

## Phase 3: Hypercerts
- [x] Add record schemas and mapping helpers for activity claims, measurements, evaluations, and attachments.
- [x] Add publish/read helpers with injected AT Protocol clients.
- [x] Add package tests for mapping and publish flows.

## Phase 4: Autonomous Agent (Gemini + ERC-8004)
- [x] Define typed agent schemas and injected adapters for each pipeline step: discover preference gaps, run causal analysis, publish hypercerts, and store Storacha receipts.
- [x] Wire Gemini structured-output reasoning into discover, plan, interpret, verify, and publish decisions.
- [x] Add ERC-8004 interaction helpers using ethers v6 interfaces for identity and reputation registries.
- [x] Add `agent.json` manifest and `agent_log.json` structured execution logging.
- [x] Add safety guardrails: input validation, API response checks, insufficient-data abort, and call/runtime caps.
- [x] Add end-to-end orchestration tests with mocked tools and publishers.

## Phase 5: Applications And Comms
- [x] Add `docs/funding-the-commons-application.md`.
- [x] Add `docs/crecimiento-application.md`.
- [x] Add a publish-ready PL Genesis community vote X thread draft.
