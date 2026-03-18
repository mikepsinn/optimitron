# Track Spec: Funding Readiness Pack (v1)

## Background
Optimitron already provides core causal inference and preference aggregation libraries. Funding readiness requires a reproducible, data-sourced pilot package that external reviewers can validate without internal context.

## Objectives
- Deliver a reproducible pilot report for the US federal budget with clear data provenance.
- Demonstrate that the causal + optimization pipeline can run on real sources, not just seeded data.
- Provide clear artifacts that funders can evaluate quickly (one-pager, funding plan, pilot spec).
- Align domain types with the Prisma schema for credibility and future deployment.

## Scope
In scope:
- US federal pilot report generation.
- Data provenance and verification snapshot.
- Prisma-aligned DTOs and mapping helpers.
- Documentation that explains how to reproduce the results.

Out of scope (v1):
- Full on-chain identity or incentive layers.
- Production multi-tenant web UI.
- Automated, continuous data ingestion.

## Deliverables
- `reports/us-federal-optimocracy-report.md` and summary JSON generated from real data.
- Funding collateral: `ONE_PAGER.md`, `FUNDING.md`, `PILOT_SPEC.md`.
- Verified data provenance section with sources and timestamps.
- Prisma-aligned DTOs and mapping helpers to reduce schema drift.

## Acceptance Criteria
- A clean install and a single command reproduces the pilot report.
- Report outputs cite data sources and label simulated inputs if used.
- All schema-aligned mappings compile against the Prisma client.
- The pilot report includes a verification snapshot with confidence metrics.

## Risks
- Data availability or rate limits may prevent reproducible generation.
- Overlap between simulated and real data could dilute credibility.
- Prisma schema drift could reintroduce type mismatches.
