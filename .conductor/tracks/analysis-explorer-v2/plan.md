# Plan: Temporal Calibration + Report Reliability (v2)

1. [x] Add temporal profile fields to predictor registry entries.
   - Add onset-delay candidate years, duration-of-action candidate years, and preferred filling strategy per predictor.
   - Keep defaults backward-compatible for existing analyses.
2. [x] Add optional predictor/outcome pair temporal overrides.
   - Add a small override table/config for well-known pairs where lag structure is domain-established.
   - Enforce deterministic precedence: pair override > predictor default > global fallback.
3. [x] Implement temporal profile search for pair analysis.
   - Evaluate candidate onset/duration combinations.
   - Score combinations using directional strength + significance + support thresholds.
   - Keep deterministic tie-breakers.
4. [x] Add temporal sensitivity outputs to pair-study artifacts.
   - Include selected profile, runner-up profiles, and score deltas.
   - Add instability warning when top profiles are too close.
5. [x] Add recommendation gating policy.
   - Hide or downgrade actionable recommendations when subject/pair support is below threshold.
   - Add plain-language fallback text for exploratory-only pairs.
6. [x] Add outlier robustness policy for actionable ranges.
   - Add configurable winsorization/quantile support for extreme predictor ranges.
   - Surface robust range and raw range separately where useful.
7. [x] Add quality-tier badges for outcome reports.
   - Add simple tiers (strong/moderate/exploratory/insufficient) driven by support + significance + stability.
8. [ ] Integrate direct after-tax median disposable income source(s).
   - Add fetcher(s) and normalization pipeline for direct series where available.
   - Maintain explicit proxy fallback for uncovered jurisdictions/years.
9. [ ] Add derived growth-series quality checks.
   - Require minimum continuity for YoY calculations.
   - Add missingness/interpolation diagnostics in report metadata.
10. [ ] Add report output contract tests for new temporal/sensitivity sections.
   - Validate selected profile fields, gating behavior, and fallback labeling.
11. [ ] Add integration benchmark for generation runtime.
   - Compare cached and uncached generation times.
   - Guard against unacceptable runtime regressions.
12. [ ] Update web pages to keep advanced diagnostics collapsed by default.
   - Reader-first summary always visible.
   - Technical appendix expandable with explicit caveats.
13. [x] Add budget-allocation style derived predictors and report sections.
   - Add derived sector-share predictors (`% of government expenditure`) for health, education, R&D, and military.
   - Add derived civilian (non-military) per-capita spending predictor.
   - Surface allocation-share table in outcome mega-study reports.
14. [ ] Add multi-horizon outcome modeling and reliability selection.
   - Keep level outcomes as primary decision targets.
   - Add parallel growth horizons (`1y YoY`, `3y CAGR`, `5y CAGR` / long-difference variants).
   - Choose default decision horizon per outcome by reliability score (support + stability + significance).
15. [x] Add hard data-sufficiency gates before pair scoring.
   - Require minimum continuity/coverage thresholds before generating recommendations.
   - Emit explicit "insufficient-data" outcome/pair pages instead of low-confidence pseudo-recommendations.
16. [ ] Split report targets into model-optimal vs decision-optimal.
   - Keep raw model-optimal target for diagnostics.
   - Add support-constrained decision target/range (observed-support and robust-window bounded) for actionable guidance.
   - Show explicit divergence metrics between model-optimal and decision-optimal.
17. [ ] Refactor evidence semantics for human clarity.
   - Separate `internal signal strength` from `decision confidence`.
   - Replace ambiguous A-F emphasis in reader-first sections with calibrated confidence labels.
   - Keep raw scoring components in technical appendix.
18. [ ] Simplify report templates to prioritize actionability.
   - In outcome pages, show a concise "recommended range + confidence + direction" table first.
   - Hide/de-emphasize repetitive monitor-only sections when no actionable rows exist.
   - Move bulky diagnostics (full subject tables, ASCII histograms) to expandable appendix/debug outputs.
19. [ ] Add universal report contract for any predictor/outcome pair.
   - Define required pair and outcome markdown sections and link behavior.
   - Ensure report generation scales to arbitrary predictor/outcome selections with the same schema.
20. [x] Integrate optimizer MED/diminishing-returns outputs into pair reports.
   - Show minimum effective dose (MED), diminishing-returns knee, and plateau-zone diagnostics when identifiable.
   - Fall back to "no reliable MED/knee detected" when support is insufficient.
21. [x] Enforce no-extrapolation decision targets in reader-facing recommendations.
   - For any predictor, default recommendation must stay within observed-support and robust-support windows.
   - Keep unconstrained model optimum only in diagnostics; never as the primary recommendation when outside support.
22. [ ] Add education-specific predictor decomposition for budget guidance.
   - Split broad education spending into at least:
     - instruction-facing K-12 spend
     - administrative/overhead spend
     - early-childhood spend
     - tertiary/higher-education public spend
   - Run pair studies on each component so recommendations are composition-sensitive, not only total-volume-sensitive.
23. [ ] Add direct student-performance outcomes and align lags.
   - Integrate internationally comparable student-performance outcomes (for example PISA-based proficiency/score panels) where coverage allows.
   - Add US-specific companion outcomes (for example NAEP trend series) in US-only analysis tracks.
   - Calibrate education predictor/outcome temporal profiles to longer lag candidates than default fiscal outcomes.
24. [ ] Add education recommendation reliability gate and fallback language.
   - Require direct-learning-outcome support before issuing large education spending scale-up/down guidance.
   - When direct outcome support is insufficient, label education recommendations as composition-exploratory and suppress large absolute budget deltas.
25. [x] Add a predictor objective-profile registry.
   - For each discretionary predictor, define:
     - primary direct mission outcomes
     - guardrail outcomes
     - lag defaults and minimum support/event rules
   - Exclude predictors from recommendation tables when no objective profile is defined.
26. [ ] Add direct mission outcomes for non-education predictors.
   - Drug-policy spending: overdose mortality and related harm outcomes.
   - Military spending: external conflict/security outcomes.
   - Health spending: avoidable mortality/HALE-related direct outcomes.
   - Keep outcome-source provenance and coverage diagnostics in artifacts.
35. [ ] Replace weighted drug-enforcement proxy with direct audited drug-enforcement expenditure where available.
   - Add country-year direct spending ingestion from primary national/international budget sources.
   - Keep weighted proxy path as explicit fallback only when direct spending is unavailable.
   - Report direct-vs-proxy coverage split in study metadata.
27. [ ] Add two-stage recommendation gating (direct objective + guardrails).
   - Stage 1: direct mission-outcome evidence must pass support/reliability thresholds.
   - Stage 2: welfare guardrails (after-tax median income and HALE level/growth) must not materially regress.
   - If either stage fails, suppress large scale-up recommendations and emit plain-language "no clear gain" guidance.
28. [ ] Add rare-event support handling for low-base-rate outcomes.
   - Require minimum event counts across lagged bins before recommendation eligibility.
   - Use longer aggregation windows and rate-based reporting for sparse outcomes.
   - Emit explicit low-event warnings instead of unstable numeric targets.
29. [x] Add direct-objective-first report sections.
  - In pair pages, show "What this spending is for" and direct-outcome results before macro spillover metrics.
  - In mega studies, show recommendation rows only when direct objective and guardrail status are both visible.
  - Keep technical diagnostics in appendix/debug outputs.
32. [ ] Improve direct KPI coverage quality for education and security.
   - Add learning-quality outcomes (for example harmonized test scores / PISA-compatible panels) beyond completion rates.
   - Add population-normalized security outcomes (for example battle-related deaths per 100k) and non-fatal security KPIs where available.
   - Keep sparse-series handling and low-event guards explicit in report output.
33. [ ] Add direct military mission KPI for foreign attack/security incident prevention.
   - Add internationally comparable source(s) for cross-border attacks / terrorism / hostile incidents where possible.
   - Use this KPI as the primary military mission outcome once minimum coverage thresholds are met.
   - Keep battle-related deaths as secondary context until primary source coverage is adequate.
34. [x] Add single-pair pilot report for `drug war spending -> overdose deaths`.
   - Build a focused US report with temporal profile search, adaptive bin table, support-constrained suggested level, MED, and slowdown knee.
   - Include a death-rate sensitivity check to reduce population-growth confounding risk in interpretation.
   - Keep wording simple and evidence-first for rapid review.
30. [ ] Add "no-scale-up unless clear gain" decision policy tests.
   - Add contract tests that block large recommendation deltas when direct mission outcomes show weak/null signal.
   - Add regression fixtures for education-like failure modes (high spending, flat direct outcomes).
31. [ ] Add optional welfare/net-value translation layer.
   - Keep direct mission KPI outputs as primary report surface.
   - Add optional configurable value weights to translate KPI deltas into a comparable net-value score.
   - Keep assumptions explicit and separate from evidence-first tables.

## Progress Notes (2026-02-13)
- Switched report-facing predictor set to discretionary PPP per-capita spending predictors.
  - Added derived per-capita PPP predictors for education, health, R&D, and military spending.
  - Kept `% GDP` spending predictors available in registry but marked non-discretionary for report exclusion.
  - Marked tax revenue `% GDP` non-discretionary for exclusion from report-facing predictor scope.
- Completed deterministic temporal precedence wiring:
  - predictor registry temporal defaults
  - pair-level override map
  - fallback path
- Added temporal candidate search per pair:
  - evaluates onset/duration combinations for predictor defaults
  - deterministic scoring and tie-breakers
  - selected profile now drives actual runner/alignment configuration
- Pair report metadata now includes selected lag/duration/filling and source (`pair_override` / `predictor_default` / `global_fallback`).
- Added temporal sensitivity diagnostics in pair outputs:
  - selected profile score
  - top runner-ups with score deltas
  - instability warning when top profiles are too close
- Added recommendation gating + fallback language:
  - pair reports now carry `actionable` vs `exploratory` status and gate reasons
  - exploratory pairs are downgraded to non-prescriptive guidance
- Added outlier-robust sensitivity for predictor targets:
  - trimmed (p10-p90) robustness summary alongside raw ranges
  - raw-vs-robust optimal deltas surfaced in pair/outcome reports
  - quality warning when tail influence materially shifts the target
- Ported useful decision-oriented structure from US budget report into generalized outcome reports:
  - Top Recommendations section (action verbs + status)
  - Evidence Snapshot table (status, evidence, significance, directional score, support)
- Added quality tiers to pair/outcome outputs:
  - pair-level tier field (`strong`/`moderate`/`exploratory`/`insufficient`)
  - tier counts in lead takeaway and tier columns in outcome tables/appendix
- Current calibration snapshot after regeneration:
  - quality tier distribution: 15 exploratory, 5 insufficient, 0 moderate, 0 strong
  - mean absolute raw-vs-robust optimal delta is large (~81.5%), so tail influence remains material
- Refactored outcome mega-study reports to lead with optimal-value clarity per predictor (human-readable targets), with ranking details moved to appendix.
- Added budget-allocation style derived predictors to generalized analysis scope:
  - `predictor.derived.gov_non_military_expenditure_per_capita_ppp`
  - `predictor.derived.gov_health_share_of_gov_expenditure_pct`
  - `predictor.derived.education_share_of_gov_expenditure_pct`
  - `predictor.derived.rd_share_of_gov_expenditure_pct`
  - `predictor.derived.military_share_of_gov_expenditure_pct`
- Added `Budget Allocation Signals` section in outcome reports to mirror allocation-focused decision support from the US budget report.
- Integrated optimizer response-curve diagnostics into pair/outcome report templates:
  - pair pages now show MED, diminishing-returns knee, plateau zone, and support-constrained target diagnostics
  - outcome recommendation/evidence tables now expose observed-support targets plus MED/knee columns
- Refined direction labeling semantics in reports:
  - action-direction label now derives from forward association sign with predictive-strength gating (weak predictive signal -> neutral)
  - added warning pathway for forward-sign vs directional-score-sign conflicts to reduce misinterpretation risk
- Shifted reader-facing reports to number-first presentation:
  - removed primary `actionable/exploratory` language from lead sections and target tables
  - replaced recommendation wording with numeric target summaries (best estimate, observed-support target, MED, knee, robust target)
  - kept gating/actionability internals in artifact JSON for downstream API/debug use
- Enforced no-extrapolation decision-target policy in report generation:
  - reader-facing lead takeaways, top-target text, allocation-share table, and optimal-level tables now use support-constrained/robust decision targets by default
  - raw model optima are now labeled diagnostics-only in outcome and pair markdown templates
  - API payload now includes both `targets.decisionBest` + `targets.decisionTargetSource` and `targets.modelBest` for explicit separation
- Implemented hard sufficiency gating in outcome scoring + recommendations:
  - pairs with `dataSufficiency.status = insufficient_data` are still generated as pair pages but are excluded from outcome ranking/scoring candidates
  - decision-target resolver now returns `unavailable` for insufficiency-gated pairs, preventing recommendation emission
  - pair pages now emit explicit insufficient-data decision summaries (blocking reasons + support stats)
  - outcome pages now show `Sufficiency-Gated Pairs`/`Insufficient-Data Status` sections when rows are excluded
  - index now reports `Pairs excluded from ranking by hard sufficiency gate` (current run: 2)
- Simplified reader-facing terminology for lower reading level:
  - added `Quick Meanings` glossary blocks to pair and outcome pages
  - replaced technical labels with plain terms (`recommended level`, `data-backed level`, `backup level`, `math-only guess`, `not enough data`)
  - renamed key outcome tables to plain-language headers (`Top Recommended Levels`, `Quick Confidence Table`, `Recommended Levels By Predictor`, `Predictor Summaries In Plain English`)
  - translated confidence/data/signal labels in tables while keeping technical appendix details available
- Added explicit backend reliability + sufficiency contracts for each pair:
  - `dataSufficiency` (`sufficient` / `insufficient_data`) with thresholded reasons
  - numeric `reliability` object with component scores (support/significance/directional/temporal/robustness), overall score, and band
  - surfaced in pair and outcome markdown tables for web/API readiness
- Added web-ready API payload artifact:
  - `packages/examples/output/mega-studies/mega-study-api.json`
  - schema-versioned (`2026-02-14`) compact contract with pair numeric targets + outcome-index rows
- Kept model-optimal targets raw (no clamping) and added explicit diagnostics for interpretability:
  - pair reports now state when model-optimal is outside the highest-outcome observed bin despite being within global observed support
  - outcome reports now include `Outside Best Observed Bin?` and bin-alignment counts in lead takeaway
  - human-readable targets now call out bin-misaligned model optima to reduce confusion
- Reliability snapshot after latest regeneration:
  - `outcome.who.healthy_life_expectancy_years`: strong signal quality (`A` grades), but most pairs still exploratory due to temporal-stability gate.
  - `outcome.derived.after_tax_median_income_ppp`: similarly strong internal signal (`A` grades), exploratory status dominated by temporal instability + weak directional separation on several pairs.
  - `outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`: mostly `B/C`, exploratory.
  - `outcome.derived.healthy_life_expectancy_growth_yoy_pct`: all `F` / insufficient under current reliability gates; treat as non-decision-grade until multi-horizon/gating upgrades land.
- Added follow-up requirement for generalized direct-objective recommendation policy:
  - move from macro-only associations to predictor-specific direct mission outcomes + guardrails
  - enforce no-scale-up behavior when direct outcomes are weak/flat, even if broad macro correlations are positive
- Added spending KPI tradeoff report artifact (evidence-first):
  - new markdown output groups rows by spending predictor and prioritizes direct mission KPI rows
  - each row now surfaces MED, slowdown knee, data-backed level, and tail marginal signal
  - includes taxpayer-return benchmark label derived from marginal tail signal (positive / near-zero / negative / insufficient)
- Added direct KPI outcome data series and wiring:
  - `outcome.wb.primary_completion_rate_pct` via World Bank `SE.PRM.CMPT.ZS`
  - `outcome.wb.battle_related_deaths` via World Bank `VC.BTL.DETH`
  - expanded default outcome scope to include both direct KPI outcomes in mega-study generation
- Simplified report semantics to reduce guardrail complexity:
  - replaced guardrail-heavy lead framing with `Primary KPI Results` + optional `Secondary Outcome Checks`
  - kept cross-outcome checks visible but secondary to direct spending KPI relationships
- Next highest-priority implementation order:
  1) Implement items 26-28 (remaining direct-outcome expansion + recommendation gates + rare-event handling).
  2) Implement item 32 (better education/security direct KPI coverage quality).
  3) Implement items 22-24 as the next education reliability pass.
  4) Implement item 14 (multi-horizon outcomes).
  5) Implement item 8 (direct after-tax median income integration).

## Progress Notes (2026-03-12)
- LLM review integration: Gemini reviews policy evaluation outputs for reasonableness (scored 94/100 on golden path).
- Mega study publication review functionality added in `packages/examples/src/analysis-explorer/publication-review.ts`.
- Gemini model updated from `gemini-2.5-flash` → `gemini-3-flash-preview`.
- `askGemini()` convenience helper added to `@optomitron/agent` for structured LLM review calls.
- Mega study generator updated with review workflow integration.
- Updated golden path results timestamp and output artifacts.

## Progress Notes (2026-02-14)
- Pivoted to a single clear-cut pilot pair before broader KPI expansion:
  - implemented `drug war spending per capita -> overdose deaths` focused study module with:
    - temporal lag/duration search
    - adaptive spending bins
    - support-constrained suggested level
    - minimum effective dose + diminishing-returns knee diagnostics
    - sensitivity check against overdose death rate
  - outputs:
    - `packages/examples/output/drug-war-overdose-study.md`
    - `packages/examples/output/drug-war-overdose-study.json`
- Added dedicated generation entrypoint:
  - `pnpm --filter @optomitron/examples generate:drug-war-overdose`
- Added tests for the new pilot analysis module:
  - `packages/examples/src/us-federal-analysis/__tests__/drug-war-overdose-study.test.ts`
- Added follow-up requirement to replace weak military proxy KPIs with a foreign-attack/security incident KPI source before military mission recommendations are trusted.
- Refined MED handling for harmful/no-benefit trajectories:
  - extended optimizer MED objective support (`maximize_outcome` / `minimize_outcome` / `any_change`)
  - pilot report now sets MED to `$0` when higher spending shows no average improvement after selected lag/duration
  - added separate `first detected change` threshold to show where measurable adverse/beneficial shift begins
- Wired downloaded aggregated proxy panel into a runnable cross-jurisdiction report:
  - added loader in `@optomitron/data` for `derived-drug-war-proxy-panel.csv`
  - added aggregated generator + report templates in `@optomitron/examples`
  - new artifacts:
    - `packages/examples/output/drug-war-proxy-aggregated-study.md`
    - `packages/examples/output/drug-war-proxy-aggregated-study.json`
  - current baseline run: 36 included jurisdictions, 947 aligned lagged pairs, support-constrained suggested level around `$380 PPP/person`
  - caveat remains explicit: predictor is COFOG `GF03` proxy (public order/safety), not narcotics-only spending.
- Replaced raw GF03 predictor in aggregated drug analysis with estimated drug-enforcement spending.
  - Added estimated predictor sources:
    - `estimated_drug_trafficking_enforcement` (default)
    - `estimated_drug_law_enforcement`
  - Formula family:
    - `GF03 PPP-per-capita spending × UNODC drug-arrest share`
  - Updated generator output artifacts:
    - `packages/examples/output/drug-enforcement-aggregated-study.md`
    - `packages/examples/output/drug-enforcement-aggregated-study.json`
  - Current baseline run (trafficking estimate): 23 included jurisdictions, 146 lag-aligned pairs, support-constrained suggested level around `$51.9 PPP/person`.
  - Caveat remains explicit: predictor is a budget-allocation estimate (weighted proxy), not audited direct drug-enforcement ledger totals.
- Added side-by-side generator for trafficking vs drug-law weighted predictors.
  - New script:
    - `pnpm --filter @optomitron/examples generate:drug-enforcement-aggregated-comparison`
  - New artifacts:
    - `packages/examples/output/drug-enforcement-aggregated-study-trafficking.md`
    - `packages/examples/output/drug-enforcement-aggregated-study-trafficking.json`
    - `packages/examples/output/drug-enforcement-aggregated-study-drug-law.md`
    - `packages/examples/output/drug-enforcement-aggregated-study-drug-law.json`
    - `packages/examples/output/drug-enforcement-aggregated-comparison.md`
    - `packages/examples/output/drug-enforcement-aggregated-comparison.json`
  - Current comparison snapshot:
    - trafficking-weighted suggested level: `$51.9 PPP/person` (23 jurisdictions, 146 pairs)
    - drug-law-weighted suggested level: `$23.2 PPP/person` (19 jurisdictions, 121 pairs)
