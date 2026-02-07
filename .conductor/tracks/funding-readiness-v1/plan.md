# Plan: Funding Readiness Pack (v1)

## Phase 1: Baseline Assets
- [x] Generate pilot report and summary output via a single command.
- [x] Add funding collateral docs (`ONE_PAGER.md`, `FUNDING.md`, `PILOT_SPEC.md`).
- [x] Add verification snapshot section to the pilot report.

## Phase 2: Data Credibility
- [ ] Replace seeded values with live data from OECD/World Bank where possible.
- [ ] Add explicit data provenance with source names and timestamps in the report.
- [ ] Document any simulated inputs and why they are placeholders.

## Phase 3: Schema Alignment
- [x] Create Prisma-aligned DTOs and mapping helpers (`@optomitron/db-types`).
- [ ] Resolve Prisma enum drift (e.g., `FillingType` coverage).
- [ ] Add schema validation tests in `@optomitron/db`.

## Phase 4: Productization
- [ ] Provide a clean, repeatable CLI for report generation.
- [x] Add a short "How to reproduce" section with exact commands.
- [ ] Package a minimal demo bundle for external reviewers.

## Phase 5: Funding Readiness
- [x] Write a short funder targeting memo (philanthropy, civic tech, public benefit R&D).
- [x] Add a concise risk and mitigation section for the pilot.
- [ ] Prepare a one-slide diagram of the system flow (for decks).
