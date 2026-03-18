# Conductor Overhaul Plan (Optimitron)

Date: 2026-02-07

This plan is based on a full repository scan (agent guidelines, conductor files, all package `src/` trees, reports, web data JSON, and key roadmap docs). It proposes a new track map that aligns the conductor with current code reality and the next critical milestones.

## 1) Current State Snapshot (Condensed)

- Existing active tracks: `funding-readiness-v1`, `misconception-analyses-v1`, `optimal-budget-v1`.
- OBG has multi-outcome optimizer, diminishing returns/OSL modeling, and N-of-1 country pipeline in place.
- Data includes OECD panel (23×23), OECD direct outcomes (dense/synthetic), and multiple US datasets.
- Web consumes static JSON data files in `packages/web/src/data/` (optimal budgets, cross-country, efficient frontier).
- Reports include `us-optimal-budget-v2/v3/v4/v5` and cross-country health spending.
- Extension + chat UI exist with local storage and NLP parsing.

## 2) Overhaul Goals

- Make the conductor reflect the **minimum-effective-spending** reframing and **wealth confound control** requirements.
- Separate data infrastructure from analysis tracks to keep specs focused and reproducible.
- Create explicit integration tracks (OBG ↔ OPG, library → web, library → extension/chat UI).
- Add a dedicated **testing strategy** track: hypothesis-driven tests for all findings.
- Add a dedicated **funding/grants** execution track (applications, timelines, artifacts).

## 3) Proposed Track Map

### Track Index (New + Updated)

| Track ID | Title | Priority | Effort | Agent Tier | Dependencies |
| --- | --- | --- | --- | --- | --- |
| `optimal-budget-v2` | OBG Minimum Effective Spending + Efficient Frontier | P0 | L | Codex | data-infrastructure-v2, optimizer-core-v2 |
| `opg-core-v1` | OPG Evidence + Policy Scoring Expansion | P0 | M | Codex | optimizer-core-v2, data-infrastructure-v2 |
| `obg-opg-integration-v1` | OBG → OPG Budget-Policy Bridge | P0 | M | Claude | optimal-budget-v2, opg-core-v1 |
| `data-infrastructure-v2` | OECD + Direct Outcomes + FRED Improvements | P0 | L | Codex | none |
| `optimizer-core-v2` | Partial Correlations + Diminishing Returns Detection | P0 | M | Codex | none |
| `web-integration-v2` | Wire Library Outputs to Pages + JSON Schema | P1 | M | Codex | optimal-budget-v2, opg-core-v1, misconception-tier3-v1 |
| `funding-grants-v1` | Gitcoin + Optimism + VitaDAO Applications | P1 | S | Claude | funding-readiness-v1, optimal-budget-v2 |
| `testing-strategy-v1` | Hypothesis-Driven Tests for Findings | P0 | M | Codex | optimizer-core-v2, optimal-budget-v2, opg-core-v1 |
| `misconception-tier3-v1` | Remaining Tier 3 Analyses | P1 | M | Codex | data-infrastructure-v2, optimizer-core-v2 |
| `extension-digital-twin-safe-v1` | Chrome Extension: Data Model + Export | P2 | M | Codex | optimizer-core-v2 |
| `chat-ui-improvements-v1` | Chat UI: NLP + Measurement Ingestion | P2 | S | Codex | optimizer-core-v2 |
| `funding-readiness-v2` | Pilot Pack Refresh + Reproducibility | P1 | M | Claude | optimal-budget-v2, web-integration-v2 |

Notes:
- Existing tracks `funding-readiness-v1`, `misconception-analyses-v1`, `optimal-budget-v1` should be archived after their v2 successors are created.
- Track IDs use `-v2` where the core objective has shifted (e.g., minimum effective dose framing).

## 4) Track Specs + Plan Checklists

Below, each proposed track includes:
- A) What conductor tracks should exist
- B) What each `spec.md` should contain
- C) What the `plan.md` checklist should include
- D) How the track interconnects (dependencies)

---

### Track: `optimal-budget-v2` — OBG Minimum Effective Spending + Efficient Frontier

**A. Track Intent**
- New core OBG track focused on minimum effective spending, efficient frontier benchmarking, and wealth-confound control.

**B. `spec.md` should contain**
- Background: v1 limitations (US-only N, wealth confounds, monotonic trends).
- Objectives: minimum effective dose per category; overspend ratios; efficient frontier countries.
- Data requirements: OECD panel + per-capita PPP; direct outcomes; GDP confound control; COVID sensitivity.
- Methodology: partial correlations, decile-floor analysis, N-of-1 per country with aggregation.
- Deliverables: OBG API functions (`findMinimumEffectiveSpending`), report v6, JSON for web.
- Acceptance criteria: reproducible outputs; all metrics include baseline-change + z-score; confound flags.
- Risks: synthetic direct outcomes, missing education data gaps.

**C. `plan.md` checklist**
1. Add `findMinimumEffectiveSpending()` to `packages/obg` with tests.
2. Implement efficient frontier extraction (best outcomes per dollar).
3. Add overspend ratio calculation per category.
4. Wire partial correlation results into OBG report output.
5. Generate `reports/us-optimal-budget-v6.md` (minimum effective framing).
6. Generate JSON outputs for web (v6).
7. Add COVID sensitivity toggle to report metadata.
8. Add explicit confound flag to each category.

**D. Dependencies**
- Depends on `data-infrastructure-v2` for PPP and direct outcomes data quality.
- Depends on `optimizer-core-v2` for partial correlation utility.

---

### Track: `opg-core-v1` — OPG Evidence + Policy Scoring Expansion

**A. Track Intent**
- Expand OPG scoring to consume new OBG findings and produce policy-level recommendations tied to budget categories.

**B. `spec.md` should contain**
- Objective: connect policy levers with spending outcomes; integrate causal evidence grades.
- Inputs: policy dataset, spending categories, welfare effects from optimizer.
- Output: ranked policy recommendations with evidence grade + blocking factors.
- Constraints: domain-agnostic core, no DB runtime.
- Acceptance: policy scoring aligns with evidence grade and direction score.

**C. `plan.md` checklist**
1. Define policy category → spending category mapping schema.
2. Add `PolicyImpactScore` computed from optimizer `FullAnalysisResult`.
3. Add `policyEvidenceGrade` derivation (Bradford Hill + predictive Pearson).
4. Add unit tests for policy score derivation.
5. Generate sample policy report JSON for web.

**D. Dependencies**
- Requires `optimizer-core-v2` (partial correlation and causal direction metrics).
- Uses `data-infrastructure-v2` for policy + spending datasets.

---

### Track: `obg-opg-integration-v1` — Budget-to-Policy Bridge

**A. Track Intent**
- Make budget allocations inform policy-level recommendations (and vice versa).

**B. `spec.md` should contain**
- Objective: link OBG category shifts to OPG policy actions.
- Interface: define shared data contract (`BudgetAdjustment` → `PolicyRecommendation`).
- Deliverables: bridge module, integration tests in `packages/examples`.
- Acceptance: top OBG reallocations produce policy action list with consistent evidence.

**C. `plan.md` checklist**
1. Define shared data contract in OPG (type-only, no DB).
2. Implement OBG → OPG adapter in `packages/examples`.
3. Add integration test: OBG output → OPG recommendations.
4. Add report section that cross-links budget and policy items.

**D. Dependencies**
- Depends on `optimal-budget-v2` and `opg-core-v1`.

---

### Track: `data-infrastructure-v2` — OECD + Direct Outcomes + FRED Improvements

**A. Track Intent**
- Build reliable data backbone for OBG/OPG: OECD panel expansion, direct outcomes, FRED pipelines.

**B. `spec.md` should contain**
- Data sources: OECD, World Bank PPP, FRED, WHO (HALE), direct outcomes by category.
- Standards: per-capita PPP (primary), %GDP (secondary), GDP deflator.
- Deliverables: updated datasets, fetchers, cache + versioning.
- Acceptance: dataset provenance; all sources documented in JSDoc.

**C. `plan.md` checklist**
1. Replace synthetic OECD direct outcomes with sourced series or mark explicitly as simulated.
2. Add WHO HALE fetcher + dataset wiring.
3. Expand OECD panel to include direct outcomes fields (education, healthcare, crime, climate).
4. Add GDP deflator option for US spending conversion.
5. Add caching/versioning metadata for static datasets.
6. Improve FRED fetcher reliability (keys, rate-limit handling).

**D. Dependencies**
- Foundational. No dependencies.

---

### Track: `optimizer-core-v2` — Partial Correlations + Diminishing Returns Detection

**A. Track Intent**
- Promote confound control and diminishing returns detection to core optimizer utilities.

**B. `spec.md` should contain**
- Objective: add partial correlation utility and diminishing returns detection hooks.
- API changes: `runFullAnalysis` optional `confoundSeries` and output `partialR`.
- Tests: synthetic datasets with known confounds.
- Acceptance: partial correlation logic validated and documented.

**C. `plan.md` checklist**
1. Add `partialCorrelation()` in `statistics.ts`.
2. Add `partialR` output to `FullAnalysisResult` (non-breaking optional).
3. Add `diminishingReturnsDetection()` helper (baseline slope change detection).
4. Add tests for `partialCorrelation` and diminishing returns detection.
5. Update report generator to include `partialR` when present.

**D. Dependencies**
- Foundational. No dependencies.

---

### Track: `web-integration-v2` — Wire Library Outputs to Pages + JSON Schema

**A. Track Intent**
- Ensure latest OBG/OPG findings and misconceptions show on the website, not just in reports.

**B. `spec.md` should contain**
- Objective: map library outputs to static JSON files + UI.
- Expected data formats for `packages/web/src/data/`.
- Deliverables: new pages for misconceptions, efficient frontier, OBG/OPG integration.
- Acceptance: pages render with current JSON schemas and are versioned.

**C. `plan.md` checklist**
1. Define JSON schema for OBG v6 and OPG report outputs.
2. Add `/misconceptions` page with data cards.
3. Add OBG efficient frontier visualization.
4. Wire OPG policy recommendations into existing `us-policy-analysis.json`.
5. Add data freshness metadata to each JSON file.

**D. Dependencies**
- Depends on `optimal-budget-v2`, `opg-core-v1`, and `misconception-tier3-v1`.

---

### Track: `funding-grants-v1` — Gitcoin + Optimism + VitaDAO Applications

**A. Track Intent**
- Turn `GRANTS.md` into executed applications with trackable artifacts.

**B. `spec.md` should contain**
- Target programs: Gitcoin, Optimism RetroPGF, VitaDAO.
- Required deliverables: application drafts, decks, metrics.
- Impact narrative: reproducibility + public good framing.
- Acceptance: submissions scheduled with deadlines and owners.

**C. `plan.md` checklist**
1. Build a 1-page impact brief per grant (Gitcoin, Optimism, VitaDAO).
2. Create metrics table from reports (usage, datasets, outputs).
3. Prepare screenshots/figures from web outputs.
4. Draft application text and store in `/grants/`.
5. Submit and record submission metadata.

**D. Dependencies**
- Depends on `funding-readiness-v1` assets and `optimal-budget-v2` outputs.

---

### Track: `testing-strategy-v1` — Hypothesis-Driven Tests for Findings

**A. Track Intent**
- Enforce testing of every finding and methodology change across optimizer/obg/opg.

**B. `spec.md` should contain**
- Definition of hypothesis-driven test format.
- Mapping: each report claim → test in code.
- Acceptance: tests cover confound controls and reversal checks.

**C. `plan.md` checklist**
1. Define a `HypothesisTestCase` format and helpers.
2. Add tests for partial correlation confounds (GDP example).
3. Add tests for minimum effective spending logic.
4. Add tests for policy scoring and evidence grades.
5. Add a report-to-tests mapping table in `reports/`.

**D. Dependencies**
- Depends on `optimizer-core-v2`, `optimal-budget-v2`, `opg-core-v1`.

---

### Track: `misconception-tier3-v1` — Remaining Tier 3 Analyses

**A. Track Intent**
- Complete Tier 3 misconceptions in TODO list and publish to web.

**B. `spec.md` should contain**
- The Tier 3 list (regulation, rent control, privatization, climate, college ROI).
- Data requirements and sources per misconception.
- Standard analysis workflow + thresholds.
- Acceptance: reports + JSON for web.

**C. `plan.md` checklist**
1. Build datasets for Tier 3 misconceptions.
2. Run analyses (absolute + YoY), produce markdown reports.
3. Add `misconceptions.json` for web.
4. Add tests for dataset integrity.

**D. Dependencies**
- Depends on `data-infrastructure-v2` and `optimizer-core-v2`.

---

### Track: `extension-digital-twin-safe-v1` — Chrome Extension Improvements

**A. Track Intent**
- Make extension a reliable local data source for the optimizer pipeline.

**B. `spec.md` should contain**
- Data schema + export format.
- Local-only privacy guarantees.
- Acceptance: export feeds directly into optimizer or data importers.

**C. `plan.md` checklist**
1. Add export format aligned with `@optimitron/data` importers.
2. Add unit tests for storage schema and export formatting.
3. Add UI for export + data summary.
4. Add integration example in `packages/examples`.

**D. Dependencies**
- Depends on `optimizer-core-v2` for output format expectations.

---

### Track: `chat-ui-improvements-v1` — NLP + Measurement Ingestion

**A. Track Intent**
- Improve Chat UI’s text-to-measurements pipeline and structured capture.

**B. `spec.md` should contain**
- NLP targets: measurement extraction, time references, units.
- Acceptance: higher parse success rates with tests.

**C. `plan.md` checklist**
1. Expand regex parser coverage for common health metrics.
2. Add confidence scoring to NLP outputs.
3. Add tests for key parsing cases.
4. Add export to optimizer-ready `TimeSeries` format.

**D. Dependencies**
- Depends on `optimizer-core-v2` for TimeSeries format usage.

---

### Track: `funding-readiness-v2` — Pilot Pack Refresh + Reproducibility

**A. Track Intent**
- Update pilot pack to align with new OBG v2 outputs and reproducible pipelines.

**B. `spec.md` should contain**
- Objective: reproducible pilot report with verified data sources.
- Deliverables: updated reports, provenance snapshots, command-line runner.
- Acceptance: clean install + one command reproduces outputs.

**C. `plan.md` checklist**
1. Update pilot report to use minimum effective spending framing.
2. Add data provenance snapshot (timestamps, data source versions).
3. Update `PILOT_SPEC.md` with current methodology.
4. Add reproducibility CLI entrypoint.

**D. Dependencies**
- Depends on `optimal-budget-v2` and `web-integration-v2` outputs.

---

## 5) Inter-Track Dependencies (Summary)

- `data-infrastructure-v2` → `optimizer-core-v2` (data shapes drive confound controls)
- `optimizer-core-v2` → `optimal-budget-v2`, `opg-core-v1`, `testing-strategy-v1`
- `optimal-budget-v2` → `obg-opg-integration-v1`, `web-integration-v2`, `funding-readiness-v2`, `funding-grants-v1`
- `opg-core-v1` → `obg-opg-integration-v1`, `web-integration-v2`, `testing-strategy-v1`
- `misconception-tier3-v1` → `web-integration-v2`
- `extension-digital-twin-safe-v1` + `chat-ui-improvements-v1` → future health tracking integrations

## 6) Recommended Execution Order

1. `data-infrastructure-v2`
2. `optimizer-core-v2`
3. `optimal-budget-v2`
4. `opg-core-v1`
5. `testing-strategy-v1`
6. `obg-opg-integration-v1`
7. `misconception-tier3-v1`
8. `web-integration-v2`
9. `funding-readiness-v2`
10. `funding-grants-v1`
11. `extension-digital-twin-safe-v1`
12. `chat-ui-improvements-v1`

## 7) Notes for Conductor Implementation

- Each track should include `metadata.json` with `status`, `owner`, and `updatedAt` fields.
- The `tracks.md` index should be regenerated to list new tracks and archive v1 tracks.
- For any track that modifies methodology, ensure the `testing-strategy-v1` items are in place before finalizing.
