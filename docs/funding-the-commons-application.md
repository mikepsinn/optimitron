# Funding The Commons Application

## Summary
Optimitron is open-source public-goods infrastructure for evidence-based governance. It combines a domain-agnostic causal inference engine, a citizen preference aggregation system, decentralized storage receipts, and verifiable impact attestations so policy recommendations can be audited instead of merely asserted.

The core question is simple: if public budgets are supposed to improve public welfare, why are most allocation decisions still made through lobbying, incumbency, and intuition instead of reproducible evidence? Optimitron exists to make that failure legible and correctable.

## The Problem
Public institutions routinely face three failures at once:

1. Citizens cannot express priorities in a structured way that can be compared to actual spending.
2. Even when governments publish data, causal analysis is fragmented across spreadsheets, PDFs, dashboards, and expert silos.
3. There is rarely a durable, tamper-evident receipt layer showing what was analyzed, what evidence was used, and what conclusion was published.

That leaves a vacuum where public trust declines and budget debates default to ideology, media cycles, or institutional inertia.

## What Optimitron Contributes As A Public Good
Optimitron is designed as reusable infrastructure, not a closed consulting workflow.

- The analysis engine is open source and domain-agnostic.
- The methodology is documented in published papers covering the optimizer, Wishocracy, OPG, OBG, and related governance mechanisms.
- The monorepo already includes roughly 1,737 pre-existing tests, plus new integration coverage for Storacha, Hypercerts, and the autonomous agent layer.
- The project has a live demo, reproducible examples, and a legacy user base from earlier health-data infrastructure work.

This matters because evidence-based governance should not depend on proprietary black boxes. If a recommendation changes how public money is spent, the data pipeline, assumptions, confidence scores, and receipts should be inspectable by anyone.

## What We Built For PL Genesis
We used Protocol Labs ecosystem infrastructure to add a durable audit trail to the existing Optimitron stack.

### Storacha
`@optimitron/storage` stores Wishocracy aggregation snapshots and Optimitron policy analysis outputs as content-addressed JSON with linked `previousCid` history chains. This creates a verifiable chronology of what changed and when.

### Hypercerts
`@optimitron/hypercerts` maps each policy recommendation into Hypercerts-compatible AT Protocol records:

- activity claims for the recommendation itself
- measurement records for PIS, CCS, welfare, evidence grade, preference weight, allocation share, and preference gap
- evaluation records for Wishocracy preference aggregation outputs
- attachments linking source analyses and supporting URLs

### ERC-8004 + Gemini Agent
`@optimitron/agent` adds an autonomous policy analyst that:

1. discovers the largest preference gaps
2. plans tractable analyses
3. executes the existing causal analysis pipeline
4. uses Gemini structured output to interpret and verify results
5. publishes receipts through Hypercerts and Storacha
6. emits machine-readable `agent.json` and `agent_log.json` artifacts

The package also includes ERC-8004 helper functions for agent identity and reputation registry interactions on Sepolia-compatible flows.

## Why This Fits Funding The Commons
Funding The Commons is fundamentally about turning shared infrastructure into durable institutions. Optimitron fits because it is:

- legible: every conclusion is tied to evidence, measurements, and source links
- forkable: civic groups, journalists, researchers, and local governments can reuse the stack
- composable: Storacha, Hypercerts, and ERC-8004 are infrastructure layers, not one-off hacks
- aligned with public accountability: the product makes it easier to inspect how public claims are made

We are not building a nicer policy dashboard. We are building receipts for public reasoning.

## Traction And Credibility
- Open-source TypeScript monorepo with extensive tests and reproducible package builds
- Live demo covering US budget optimization and policy analysis workflows
- Published methodology papers across the core algorithmic components
- Real users and operational experience from the legacy health-data platform that preceded Optimitron
- Working integrations with Protocol Labs-aligned infrastructure across storage, attestations, and agent receipts

## Sustainability
The public-good core remains open source. Sustainability comes from adjacent paid layers:

- API access for researchers and think tanks
- premium reporting and deployment support for civic organizations
- custom jurisdiction analyses and alignment scorecards
- grants and ecosystem funding for the commons layer itself

That structure keeps the underlying methodology and receipt system open while allowing funded implementation and support.

## What Support Would Unlock
Support from Funding The Commons would accelerate:

1. broader jurisdiction coverage and data ingestion hardening
2. stronger verification tooling and public audit workflows
3. more complete civic-facing reports and reproducible demos
4. deployment of the receipt stack for live pilot analyses

## Links
- GitHub: https://github.com/mikepsinn/optimitron
- Live demo: https://mikepsinn.github.io/optimitron/
- Key papers: https://dfda-spec.warondisease.org, https://wishocracy.warondisease.org, https://opg.warondisease.org, https://obg.warondisease.org, https://iab.warondisease.org
