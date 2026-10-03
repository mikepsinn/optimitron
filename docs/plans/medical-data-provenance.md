# Medical Treatment Data: Citation Audit and Source-Replacement Plan

Status: proposed. This change edits no data, schema, or UI. The owner must approve each phase.
Scope: `packages/data/src/datasets/medical-data/treatments/*.json`. The dfda repository
(`mikepsinn/dfda`, `apps/web/data/optimitron/medical-data`) holds a byte-for-byte copy taken at
optimitron commit `06ffef0f`. This directory has not changed since that commit.

Ownership (changed 2026-10-02): dfda is the edited fork of this dataset. Optimitron keeps its
copy unchanged as its database seed. Apply the corrections below in dfda, not in optimitron.
Note: this decision came to this session from another session, not from the owner directly.

## 1. Findings

### 1.1 Citation inventory

The script does not depend on where the dataset is. It reads `<dir>/treatments/*.json`.

```bash
# optimitron copy (default), with 20 redirect links checked over HTTP
pnpm --filter @optimitron/data run audit:medical-citations -- --probe 20
# dfda copy
pnpm --filter @optimitron/data run audit:medical-citations -- --dir <dfda>/apps/web/data/optimitron/medical-data --out <dir>
```

The script writes `inventory.json`, `treatments.csv` (one row per condition and treatment,
with `hasResolvablePrimarySource`), `citations.csv` (one row per citation with its URL kind), and
`summary.md` (per-condition table). The default output folder is
`packages/data/output/medical-citation-audit/` (gitignored). On 2026-10-02 the dfda copy gave
the same counts as the optimitron copy.

| Measure | Count |
| --- | ---: |
| Condition files | 216 |
| Treatments (condition/treatment rows) | 1,214 |
| Citations | 13,707 |
| Vertex AI grounding redirect links | 12,492 |
| ClinicalTrials.gov search links (one per treatment, not a study record) | 1,214 |
| Other links | 1 (`google.com/search?q=time+in+Ribeirão+Preto` on pancreatic cancer / Olaparib) |
| DOI, PubMed, PMC, NCT study, or regulatory-label links | 0 |
| Treatments with a resolvable primary source | **0 of 1,214** |
| Redirect links that resolve (sample of 20, spread across the snapshot) | 0 (all HTTP 404) |
| Numeric values with a per-value source | 0 of 30,973 |

The redirect `title` holds only the target domain. There are 1,266 distinct domains. The most
frequent are `nih.gov` (4,990), `researchgate.net` (1,939), `mdpi.com` (272), `oup.com` (234),
`frontiersin.org` (207), `semanticscholar.org` (197), `tandfonline.com` (193), `wikipedia.org` (160),
`bmj.com` (136), `droracle.ai` (109), `dntb.gov.ua` (100), and `youtube.com` (92). The domain does not
identify a document, so the redirects cannot be repaired. Each source must be found again.

### 1.2 Outcome rows

| Outcome provenance | Primary | Secondary | Total |
| --- | ---: | ---: | ---: |
| `dataSource: "ai-estimated"` | 2,886 | 2,416 | 5,302 |
| `dataSource: "trial"` | 34 | 50 | 84 |
| No `dataSource`, name only (no values) | 170 | 220 | 390 |
| Side-effect rows (the schema has no source field) | | | 5,135 |

The task brief counted 5,305 rows "with no dataSource". That count is the 170 name-only primary
outcomes plus the 5,135 side-effect rows. It leaves out the 220 name-only secondary outcomes, so
the full count of rows without `dataSource` is 5,525. 391 treatments have no outcome rows.

### 1.3 How the generator made each value

The generator is in `apps/dfda/lib/actions/` (`hybrid-treatment-data.ts` calls the others).

| Field | Origin | Source stored |
| --- | --- | --- |
| `effectiveness`, `safetyScore`, `confidenceScore`, `evidenceQuality`, `nnt`, `nnh`, `participants`, `phase`, `sideEffects`, `responseRate`, `remissionRate`, `dosageRange`, `timeToEffect`, `treatmentDuration`, all `healthEconomics` | One Gemini structured-output call without search grounding (`treatment-comparisons.ts`) | None |
| `primaryOutcomes` / `secondaryOutcomes` with `ai-estimated` | A second Gemini call without grounding. The prompt asks for "realistic baseline values and typical changes" (`generate-outcomes-ai.ts`) | None |
| `trial` outcome rows | `fetch-trial-results.ts` parses ClinicalTrials.gov posted results. It reads the first measurement group of each category as "baseline" and "endpoint" | None. The NCT IDs are dropped |
| `trials` | ClinicalTrials.gov `countTotal` for the condition and intervention on 2025-11-04 | Search link only |
| `monitoringCost` | AI value. A fixed table value (1,000 USD for neurological) replaces it only when it is 0 or missing | None |
| `citations` (redirects) | A separate grounded query: "What is the clinical evidence for X effectiveness in treating Y?" | Redirect URL only |

Consequences:

1. The citations come from a different query than the numbers. A working redirect would still not
   support any displayed number.
2. The 84 `trial` rows are parser artifacts, not efficacy results. Example: Inotuzumab ozogamicin,
   "Number of Participants According to Prior HSCT", baseline "10 Participants", +50%. The parser
   compares two arms or two categories as if they were two time points.
3. The dfda repository page `/treatment-rankings` (`apps/web/lib/demo/treatment-estimates.ts`,
   `rankTreatments`) sorts by `effectiveness` or `safetyScore`. Optimitron's
   `apps/dfda/components/condition/TreatmentRankings.tsx` shows the snapshot order, which is the
   order the generator prompt asked Gemini to produce ("Rank treatments by effectiveness"). In
   both apps the order comes from model scores with no primary source by construction.
4. Optimitron's `apps/dfda` treatment report shows the first three citations as links. They are the
   expired redirects, so a reader who clicks gets HTTP 404.
5. No UI in either app shows the `ai-estimated` tag. The dfda repository outcome label
   (`/outcome-labels/demo/...`) says only "Current best estimates".
6. `percentageChange` mixes three meanings: percent change from baseline, percent slowing relative to
   placebo, and a difference relative to an unrelated baseline. The dfda repository outcome label
   (`apps/web/components/demo/treatment-outcomes.tsx`) says "Estimated outcome changes relative to
   the baselines shown", which is wrong for the second and third meanings. Optimitron's
   `apps/dfda` cards show the values under "Primary Outcomes" and "Secondary Benefits" and do not
   say what the percentage means.

## 2. Proposed plan

### 2.1 Data model: an explicit provenance layer

Put the layer in the edited copy, which is now dfda. Two options:

- **A. Sidecar file (recommended).** Add one reviewed provenance file per condition, and merge it in
  the loader (`lib/demo/treatment-estimates.ts` in dfda). The original values stay readable for
  audit, and each correction carries its own source and reviewer. The dfda import README
  (`apps/web/data/optimitron/README.md`) already allows "an explicitly versioned correction layer".
  The optimitron medical-data README asks to document each correction and fix the generator.
- **B. Inline fields.** Add `sources` and `effectMeasure` to each value in the condition files.
  This option is simpler to read, but it mixes original and corrected values. Use it when the
  generator is rewritten and emits sourced data directly.

```ts
// <medical-data>/provenance/<condition-slug>.json
interface SourceRef {
  id: string;             // "doi:10.1056/nejmoa2212948" | "pmid:36449413" | "nct:NCT03887455" | "label:<url>"
  url: string;            // https://doi.org/..., https://pubmed.ncbi.nlm.nih.gov/..., https://clinicaltrials.gov/study/...
  citation: string;       // "van Dyck CH et al. N Engl J Med 2023;388:9-21"
  locator?: string;       // "Table 2", "Section 6.1, Table 3"
  quote?: string;         // exact text that contains the number
}

type ValueStatus =
  | "verified"            // the value equals a number in a cited primary source
  | "corrected"           // the snapshot value was wrong; `value` holds the source number
  | "derived"             // computed from verified values; `method` gives the arithmetic
  | "model-score"         // composite 0-100 score; no primary source can exist
  | "unverified-ai-estimate"; // default for every value without an entry

interface ValueProvenance {
  treatment: string;      // treatment slug, e.g. "lecanemab"
  field: string;          // select list items by name, never by position:
                          // "sideEffects[name=Headache].percentage",
                          // "primaryOutcomes[name=Clinical Dementia Rating-Sum of Boxes (CDR-SB)].absoluteChange"
  status: ValueStatus;
  value?: number | string;        // replacement value when status is "corrected"
  snapshotValue: number | string; // the value this entry reviewed; a mismatch fails validation
  effectMeasure?: "difference-vs-placebo" | "within-arm-change" | "relative-slowing-pct"
    | "incidence-drug" | "incidence-placebo" | "list-price" | "acquisition-cost"
    | "cost-per-qaly" | "count";
  comparatorValue?: number;       // e.g. the placebo incidence for a side effect
  ci95?: [number, number];
  timepoint?: string;             // e.g. "18 months"
  population?: string;            // e.g. "TRAILBLAZER-ALZ 2, low/medium tau"
  dose?: string;                  // e.g. "10 mg/day", "9.5 mg/24 h patch", "2025 titration"
  asOf?: string;                  // price date, e.g. "2026-09-23"
  sources: SourceRef[];
  method?: string;
  reviewedBy: string;
  reviewedAt: string;     // ISO date of the review, not of generation
}
```

Rules:

1. A value without an entry is `unverified-ai-estimate`. The default needs no edit to the 30,973
   values, and a value cannot look verified by accident.
2. `field` selects a list item by its `name`, so a change in item order cannot move a source to a
   different outcome. `snapshotValue` must equal the current value at that selector. A test fails
   when the name is missing, matches more than one item, or the value changed.
3. A `SourceRef` must be a DOI, PMID, PMC, NCT study, or regulatory-label URL. The validation
   can reuse or copy `classifyCitationUrl` from `packages/data/src/datasets/medical-citation-audit.ts`.
4. Mark `effectiveness`, `safetyScore`, and `confidenceScore` as `model-score` once, with the
   formula and a link to the method. Do not invent a source for them.
5. Treat redirect citations as historical metadata. Do not render them as links.
6. Downgrade the 84 `trial` rows to `unverified-ai-estimate` until an NCT ID and arm labels are stored.

These types live with the dfda loader. The `@optimitron/db` Prisma schema does not change. A move
of this data into a database is a separate schema change that needs approval.

### 2.2 UI (after the data layer, owner approval needed for copy)

- Show a per-value marker: a source link for `verified`, `corrected`, and `derived`; the text
  "Unverified AI estimate" for everything else.
- Label the ranking control "AI-estimated effectiveness score (unverified)" until scores have a
  documented method.
- Make the outcome subtitle follow `effectMeasure`, for example "Difference vs placebo at 18 months".
- Show side effects as "drug % vs placebo %" when `comparatorValue` exists.
- Remove the redirect links from the optimitron `apps/dfda` treatment report footer.

### 2.3 Source replacement pipeline (deterministic first, model second)

1. **Trials.** Query the ClinicalTrials.gov API v2 for completed phase 3 trials with posted results
   for each condition and intervention. Store the NCT IDs. Read outcome and adverse-event tables with
   arm labels. Do not use the current baseline/endpoint heuristic.
2. **Publications.** Query PubMed E-utilities with `<NCT>[si]` to find the trial papers. Add a
   systematic-review query (Cochrane, `systematic[sb]`). Store PMID and DOI (Crossref or `esummary`).
3. **Labels.** Read adverse-reaction tables, with placebo rates, from DailyMed or Drugs@FDA.
4. **Costs.** Use the manufacturer list-price release for brand drugs, CMS NADAC for generics, and
   ICER, NICE, or CADTH reports for $/QALY. Record the price date.
5. **Model extraction, with a check.** A model may propose a value from a fetched document only with
   a `quote` and `locator`. Code then confirms that the quote occurs in the fetched text and that the
   number occurs in the quote. A failed check leaves the value as `unverified-ai-estimate`.
6. **Human review.** A person approves each `corrected` entry before merge. Start with values that
   appear in screenshots and videos.
7. **Generator.** Change `hybrid-treatment-data.ts` so new data carries `sources` and
   `effectMeasure` and keeps NCT IDs. If grounding stays, resolve each grounding URL when it is
   generated, because the redirects expire.

### 2.4 Order of work

1. Lecanemab, because its outcome label appears in a video. Another session reported that it is
   applying the Lecanemab corrections in dfda now.
2. The other five Alzheimer's treatments in section 3.
3. Conditions ordered by page traffic.
4. A CI check: the share of displayed values with `verified`, `corrected`, or `derived` status, per
   condition, reported by the audit script.

## 3. Worked example: Alzheimer's disease

File: `treatments/alzheimers-disease.json`. Six research agents each checked one treatment row on
2026-10-02. They read each number from a fetched document: PubMed, ClinicalTrials.gov posted
results, FDA labels (Drugs@FDA or DailyMed), Cochrane full text on PMC, ICER and NICE reports, and
CMS NADAC prices. "Computed" means arithmetic on fetched counts. I checked a subset again in the
fetched files:

- Lecanemab: label Table 5 (headache 11 vs 8, ARIA-H 14 vs 8), baselines 24.45 and 41.2, the
  NEJM abstract (−59.1 centiloids), and ICER Tables 4.3 and 4.5.
- Donepezil: the NADAC price of $0.04843 per 10 mg tablet.
- Rivastigmine: capsule dizziness 21 vs 11 and diarrhea 19 vs 11.

Values marked † were read through a summarizing web fetch of the JAMA full text. Where the label or
ClinicalTrials.gov also reports them, they agree. For memantine, the Cochrane 2019 full text was
blocked, so its values come from the abstract.

Column meanings:

- **Current** is the snapshot value.
- **Corrected** is the source value. Side effects are "drug % vs placebo %". "Diff" means drug
  minus placebo. "Within-arm" means change from baseline in one arm.
- **Status** is one of: Matches, Wrong, Wrong meaning (right number, wrong label in the UI),
  Outdated, No source, Remove row.

The paths use the order of the items in the file. `scores` means `effectiveness` /
`safetyScore` / `confidenceScore`. No primary source can exist for these three model scores, and
the treatment order in both apps comes from them (see section 1.3, item 3).

### 3.1 Problems common to the six rows

1. **Effect sizes shown as change from baseline (6 of 6).** Most `absoluteChange` values are the
   difference vs placebo. Most `percentageChange` values are "% slowing vs placebo" or that
   difference divided by the stored baseline. The dfda repository outcome label says "Estimated
   outcome changes relative to the baselines shown". For the cholinesterase inhibitors this is worse than a
   wording issue: the drug arm often declines while the row shows an improvement.
2. **Wrong baselines or scales.** Lecanemab ADCS-MCI-ADL 78 (0-87) vs 41.2 (0-53). Donanemab
   iADRS 80 vs 104. Galantamine NPI 25 (0-144) vs about 12 (0-120). Donepezil and rivastigmine
   ADAS-Cog range 0-75 vs 0-70.
3. **Rows with no source, or with evidence against them.** Galantamine CDR-SB (Cochrane: "no data
   for this outcome"). Rivastigmine "Caregiver Burden (hypothetical scale…)". Donepezil and
   rivastigmine NPI benefit (Cochrane: no difference). Memantine CMAI and Zarit. Donanemab tau PET
   (no difference, P = .45). Lecanemab "CSF Aβ42/40".
4. **Side effects.** No row shows a placebo rate. Two values are the placebo rate (donanemab
   headache 10%, memantine confusion 5%). Rivastigmine mixes capsule and patch rates.
5. **`participants` is too high in all six rows**, by 1.1 to 3.6 times the matching published total.
6. **Costs.** The ICER $/QALY and QALY values for both antibodies match no assessment. Generic drug
   costs are off by 2 to 4 times vs NADAC. `icer` is null for the cholinesterase inhibitors,
   but NICE found them dominant. `costPerResponder` is `totalAnnual / responseRate` in all four
   older drugs. It ignores the placebo response.
7. **Dosage is out of date for both antibodies.** Their labels changed in 2025-2026.
8. **`nnt` and `nnh`.** No stored value names its endpoint, and none has a drug-specific
   published source. Galantamine NNT 12 is the published value for the whole drug class. The
   tables give computed values with the event named.

### 3.2 Lecanemab

Sources:
[Clarity AD](https://doi.org/10.1056/NEJMoa2212948) (van Dyck 2023, PMID 36449413, NCT03887455) ·
[Study 201](https://doi.org/10.1186/s13195-021-00813-8) (PMID 33865446, NCT01767311) ·
[FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) ·
[FDA label 2023](https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/761269Orig1s001lbl.pdf) ·
[EMA EPAR](https://www.ema.europa.eu/en/documents/assessment-report/leqembi-epar-public-assessment-report_en.pdf) ·
[ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) ·
[Eisai price](https://www.eisai.com/news/2023/news202302.html) ·
[CT.gov count](https://clinicaltrials.gov/api/v2/studies?query.cond=Alzheimer%27s%20Disease&query.intr=lecanemab&countTotal=true&pageSize=1)

| Field | Current | Corrected | Status | Source |
| --- | --- | --- | --- | --- |
| dosageRange | 10 mg/kg IV biweekly | Start: 10 mg/kg IV every 2 weeks, or 500 mg SC weekly. After 18 months: 10 mg/kg IV every 4 weeks, or 360 mg SC weekly | Outdated | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) |
| scores | 55 / 50 / 80 | none | No source | – |
| evidenceQuality | Moderate | No GRADE rating. ICER: "Promising but Inconclusive" | No source | [ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) |
| nnt | 16 | None published. Computed about 7 for ≥1.5-point CDR-SB worsening (36% vs 50%, post hoc) | No source | [EMA EPAR](https://www.ema.europa.eu/en/documents/assessment-report/leqembi-epar-public-assessment-report_en.pdf) |
| nnh | 8 | None published. Computed 8.4 for any ARIA (21.3% vs 9.4%) | No source | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) |
| participants | 3000 | 2,651 randomized (1,795 Clarity AD + 856 Study 201) | Wrong | [Clarity AD](https://doi.org/10.1056/NEJMoa2212948), [Study 201](https://doi.org/10.1186/s13195-021-00813-8) |
| trials | 26 | 32 (search count on 2026-10-02, not a trial count) | Outdated | [CT.gov count](https://clinicaltrials.gov/api/v2/studies?query.cond=Alzheimer%27s%20Disease&query.intr=lecanemab&countTotal=true&pageSize=1) |
| timeToEffect | 6-12 months | Significant from 6 months; amyloid falls from week 13 | Matches | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) |
| primaryOutcomes[0] CDR-SB baseline | 3.2 (0-18) | 3.17 vs 3.22 | Matches | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) |
| primaryOutcomes[0] absoluteChange | −0.45 | Diff −0.45 (95% CI −0.67 to −0.23). Within-arm +1.21 vs +1.66 | Matches (diff) | [Clarity AD](https://doi.org/10.1056/NEJMoa2212948) |
| primaryOutcomes[0] percentageChange | 27 | 27% slowing vs placebo. Within-arm change is +38% | Wrong meaning | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) |
| primaryOutcomes[1] ADAS-Cog14 baseline | 27.0 (0-90) | 24.45 vs 24.37 (0-90) | Wrong | [FDA label 2023](https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/761269Orig1s001lbl.pdf) |
| primaryOutcomes[1] absoluteChange | −1.44 | Diff −1.44 (−2.27 to −0.61). Within-arm +4.14 vs +5.58 | Matches (diff) | [Clarity AD](https://doi.org/10.1056/NEJMoa2212948) |
| primaryOutcomes[1] percentageChange | 26 | 26% slowing vs placebo | Wrong meaning | [FDA label 2023](https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/761269Orig1s001lbl.pdf) |
| primaryOutcomes[2] ADCS-MCI-ADL baseline | 78.0 (0-87) | 41.2 vs 40.9 (scale 0-53) | Wrong | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975), [Clarity AD](https://doi.org/10.1056/NEJMoa2212948) |
| primaryOutcomes[2] absoluteChange | +2.0 | Diff +2.0 (1.2 to 2.8). Within-arm −3.5 vs −5.5 | Matches (diff) | [Clarity AD](https://doi.org/10.1056/NEJMoa2212948) |
| primaryOutcomes[2] percentageChange | 37 | 37% less decline vs placebo | Wrong meaning | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) |
| primaryOutcomes[3] amyloid baseline | 79.0 CL | 77.9 CL (lecanemab arm) | Wrong | [EMA EPAR](https://www.ema.europa.eu/en/documents/assessment-report/leqembi-epar-public-assessment-report_en.pdf) |
| primaryOutcomes[3] absoluteChange | −55.5 CL | Within-arm −55.48 vs +3.64. Diff −59.1 (−62.6 to −55.6). The other three rows show diff, so show −59.1 here, or label every row | Wrong meaning | [EMA EPAR](https://www.ema.europa.eu/en/documents/assessment-report/leqembi-epar-public-assessment-report_en.pdf), [Clarity AD](https://doi.org/10.1056/NEJMoa2212948) |
| primaryOutcomes[3] percentageChange | −70.3 | −71.2% within-arm (−55.48 / 77.9) | Wrong | [EMA EPAR](https://www.ema.europa.eu/en/documents/assessment-report/leqembi-epar-public-assessment-report_en.pdf) |
| secondaryOutcomes[0] CSF p-tau181 | 23.0 pg/mL, −4.7, −20.6% | Within-arm −15.9 vs +12.9 pg/mL. No baseline found | Wrong | [ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) Table D3.4 |
| secondaryOutcomes[1] "CSF Aβ42/40 ratio" | 0.09, +0.006, +6.6% | No CSF ratio result was found. The values match the plasma Aβ42/40 ratio: 0.088; +0.008 vs +0.001; diff +0.007 | Wrong (rename or remove) | [FDA label 2023](https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/761269Orig1s001lbl.pdf) Table 6 |
| secondaryOutcomes[2] plasma p-tau181 | 20.0 pg/mL, −2.8, −14% | 3.70 vs 3.74 pg/mL; −0.58 vs +0.20; diff −0.78 | Wrong | [FDA label 2023](https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/761269Orig1s001lbl.pdf) Table 6 |
| sideEffects Infusion-related reactions | 26 | 26% vs 7% | Matches | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) |
| sideEffects ARIA-E | 13 | 13% vs 2% (NEJM 12.6% vs 1.7%) | Matches | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975) |
| sideEffects ARIA-H | 17 | 17% vs 9% for any ARIA-H on MRI (label §5.1; NEJM 17.3% vs 9.0%). The label's adverse-reaction table row counts microhemorrhage only: 14% vs 8% | Matches. Label it "any ARIA-H on MRI" | [FDA label 2026](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9d1ff786-e577-410a-a273-c4d7d0e4e975), [Clarity AD](https://doi.org/10.1056/NEJMoa2212948) |
| sideEffects Headache | 13 | 11% vs 8% (Clarity AD). Study 1: 14% vs 10% | Wrong | [FDA label 2023](https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/761269Orig1s001lbl.pdf) Table 5 |
| annualCostOfCare.drugCost | 26500 | $26,500/yr list price at launch (75 kg patient) | Matches | [Eisai price](https://www.eisai.com/news/2023/news202302.html) |
| annualCostOfCare.monitoringCost | 8000 | No source. ICER inputs give about $3,100 in year 1 (4 MRIs at $261, 26 infusions at $78) | No source | [ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) |
| annualCostOfCare.sideEffectManagement | 2000 | No source. ICER inputs give about $170 | No source | [ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) |
| annualCostOfCare.totalAnnual | 36500 | Sum of the three values above | No source | – |
| icer | 640000 | $254,000/QALY (health care sector); $236,000 (societal) | Wrong | [ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) Table 4.5 |
| qalysGained, vsComparator.qalysGainedDifference | 0.23 | 0.50 (3.84 vs 3.34) | Wrong | [ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) Table 4.3 |
| vsComparator.costDifference | 36500 | Lifetime +$126,000 ($489,000 vs $363,000). 36,500 is one year's cost | Wrong meaning | [ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) Table 4.3 |
| costEffectivenessRating | poor | ICER panel: "low" long-term value. Price benchmark $8,900-$21,500/yr | Matches | [ICER 2023](https://icer.org/wp-content/uploads/2023/04/ICER_Alzheimers-Disease_Final-Report_For-Publication_04172023.pdf) |

### 3.3 Donanemab

Sources:
[TRAILBLAZER-ALZ 2](https://doi.org/10.1001/jama.2023.13239) (Sims 2023, PMID 37459141) ·
[NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) ·
[TRAILBLAZER-ALZ](https://doi.org/10.1056/NEJMoa2100708) (Mintun 2021, NCT03367403) ·
[FDA label 2024](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/761248s000lbl.pdf) ·
[FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) ·
[Lilly price 2024](https://investor.lilly.com/news-releases/news-release-details/lillys-kisunlatm-donanemab-azbt-approved-fda-treatment-early) ·
[Lilly WAC 2025](https://pricinginfo.lilly.com/assets/pdf/Colorado_WAC_Disclosure_Sheet-Kisunla.pdf) ·
[ICER 2022](https://icer.org/news-insights/press-releases/icer-releases-draft-evidence-report-on-treatments-for-alzheimers-disease/) ·
[NICE ID6222](https://www.nice.org.uk/guidance/gid-ta11221/documents) ·
[MJA 2026](https://doi.org/10.5694/mja2.70186) ·
[C2H 2026](https://c2h.niph.go.jp/results/C2H2406/C2H2406_Summary_Eng.pdf)

The trial reports two populations: low/medium tau (n = 1,182) and combined (n = 1,736). The FDA
label reports the combined population. The stored row mixes both populations and the phase 2 trial.

| Field | Current | Corrected | Status | Source |
| --- | --- | --- | --- | --- |
| dosageRange | 700 mg ×3, then 1400 mg every 4 weeks | 350, 700, 1,050 mg, then 1,400 mg every 4 weeks (label 07/2025). The new schedule lowered ARIA-E from 24.9% to 16.2% | Outdated | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| phase | Phase 3 | Approved 2024-07-02 | Outdated | [FDA label 2024](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/761248s000lbl.pdf) |
| scores | 57 / 48 / 78 | none | No source | – |
| evidenceQuality | Moderate | No GRADE rating. ICER (2022): evidence "insufficient" | No source | [ICER 2022](https://icer.org/news-insights/press-releases/icer-releases-draft-evidence-report-on-treatments-for-alzheimers-disease/) |
| nnt | 9 | None published. Continuous endpoints give no responder rate | No source | – |
| nnh | 4 | None published. Computed 4.6 for ARIA-E (24.0% vs 2.1%); 16.4 for symptomatic ARIA-E | No source | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| participants | 3500 | 1,993 randomized (1,736 + 257) | Wrong | [TRAILBLAZER-ALZ 2](https://doi.org/10.1001/jama.2023.13239), [TRAILBLAZER-ALZ](https://doi.org/10.1056/NEJMoa2100708) |
| trials | 10 | 18 (search count on 2026-10-02) | Outdated | [CT.gov count](https://clinicaltrials.gov/api/v2/studies?query.cond=Alzheimer%27s%20Disease&query.intr=donanemab&countTotal=true&pageSize=1) |
| timeToEffect | 6-12 months | No clinical onset stated. Amyloid falls from week 24 | No source | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| treatmentDuration | Until amyloid clearance (6-18 months), then monitoring | Consider stopping when amyloid is minimal; 47% eligible by week 52, 69% by week 76 | Matches | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| primaryOutcomes[0] CDR-SB baseline | 3.0 | 3.92 vs 3.89 | Wrong | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) Table 9 |
| primaryOutcomes[0] absoluteChange | −0.7 | Diff −0.70 (−0.95 to −0.45). Within-arm +1.72 vs +2.42 | Matches (diff) | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| primaryOutcomes[0] percentageChange | 36.8 | 28.9% slowing (combined)†; 36.0% (low/medium tau)† | Wrong | [TRAILBLAZER-ALZ 2](https://doi.org/10.1001/jama.2023.13239) |
| primaryOutcomes[1] amyloid baseline | 100 CL | 104.0 vs 101.8 | Matches | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) Table 8 |
| primaryOutcomes[1] absoluteChange | −80 CL | Within-arm −87.0 vs −0.7. Diff −86.4 (−88.9 to −83.9). 76.4% vs 0.3% reached < 24.1 CL† | Wrong | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| primaryOutcomes[1] percentageChange | −80 | −83.7% within-arm (Lilly: "84%") | Wrong | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| primaryOutcomes[2] iADRS baseline | 80 (0-144) | 104.1 vs 103.6 | Wrong | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| primaryOutcomes[2] absoluteChange | +2.9 | Diff +2.92 (1.51 to 4.33) | Matches (diff) | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| primaryOutcomes[2] percentageChange | 29 | 22.3% slowing (combined); 35.1% (low/medium tau) | Wrong | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| secondaryOutcomes[0] ADAS-Cog13 baseline | 25 (0-85) | 28.5 vs 29.2 | Wrong | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| secondaryOutcomes[0] absoluteChange | −1.3 | Diff −1.33 (−2.09 to −0.57) | Matches (diff) | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| secondaryOutcomes[0] percentageChange | 26 | 19.5% slowing (label "20%") | Wrong | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| secondaryOutcomes[1] name | ADCS-ADL-MCI | ADCS-iADL (scale 0-59) | Wrong | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| secondaryOutcomes[1] baseline | 75 (0-78) | 48.0 vs 48.0 (0-59) | Wrong | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| secondaryOutcomes[1] absoluteChange | +1.2 | Diff +1.70 (0.84 to 2.57). The value 1.2 is the non-significant phase 2 result | Wrong | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| secondaryOutcomes[1] percentageChange | 40 | 27.8% slowing (combined, label "28%"); 39.9% (low/medium tau) | Wrong | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| secondaryOutcomes[2] tau PET (medial temporal) | 1.4 SUVR, −0.09, −6.7%, positive | No medial temporal result was published. Frontal SUVR change: +0.040 vs +0.044, diff −0.004 (P = .45) | Remove row | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| sideEffects ARIA-E | 24 | 24.0% vs 2.1% (old dosing); 16% (current dosing) | Matches (old dosing) | [TRAILBLAZER-ALZ 2](https://doi.org/10.1001/jama.2023.13239), [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| sideEffects ARIA-H | 31 | 31% vs 13% | Matches | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| sideEffects Headache | 10 | 14.0% vs 9.8% (label 13 vs 10). The stored 10 is the placebo rate | Wrong | [NCT04437511 results](https://clinicaltrials.gov/study/NCT04437511) |
| sideEffects Infusion-related reactions | 8.7 | 8.7% vs 0.5% (old dosing); 16% (current dosing) | Matches (old dosing) | [FDA label 2025](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=190352d4-ef62-4679-b4fa-e846e2766afa) |
| annualCostOfCare.drugCost | 27500 | $32,000 for 12 months at launch ($695.65 per vial); $32,400 at 2025 WAC ($704.35) | Wrong | [Lilly price 2024](https://investor.lilly.com/news-releases/news-release-details/lillys-kisunlatm-donanemab-azbt-approved-fda-treatment-early), [Lilly WAC 2025](https://pricinginfo.lilly.com/assets/pdf/Colorado_WAC_Disclosure_Sheet-Kisunla.pdf) |
| annualCostOfCare.monitoringCost / sideEffectManagement / totalAnnual | 8000 / 2500 / 38000 | No source. The label requires 5 MRIs in year 1 | No source | – |
| icer | 600000 | No US value: ICER rated the evidence "insufficient". NICE committee about £69,000/QALY; Australia A$342,424/QALY; Japan ¥17.8M/QALY. The row also contradicts itself: 38,000 / 0.22 = 172,727 | No source | [NICE ID6222](https://www.nice.org.uk/guidance/gid-ta11221/documents), [MJA 2026](https://doi.org/10.5694/mja2.70186), [C2H 2026](https://c2h.niph.go.jp/results/C2H2406/C2H2406_Summary_Eng.pdf) |
| qalysGained, vsComparator.qalysGainedDifference | 0.22 | No US value. Australia: 0.37. NICE value redacted | No source | [MJA 2026](https://doi.org/10.5694/mja2.70186) |
| vsComparator.costDifference | 38000 | No source. It pairs one year's cost with a lifetime QALY gain | No source | – |
| costEffectivenessRating | poor | NICE: not recommended. MJA: "unlikely to be cost-effective" | Matches | [NICE ID6222](https://www.nice.org.uk/guidance/gid-ta11221/documents) |

### 3.4 Donepezil

Sources:
[Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) (Birks & Harvey, PMID 29923184, [full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC6513124/)) ·
[FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) ·
[Rogers 1998a](https://pubmed.ncbi.nlm.nih.gov/9588436/) ·
[Rogers 1998b](https://pubmed.ncbi.nlm.nih.gov/9443470/) ·
[NICE TA217](https://www.nice.org.uk/guidance/ta217) ·
[NADAC 2026](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704)

| Field | Current | Corrected | Status | Source |
| --- | --- | --- | --- | --- |
| dosageRange | 5-10 mg once daily | 5-10 mg daily (mild-moderate); 10-23 mg daily (moderate-severe) | Wrong (incomplete) | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) §2 |
| scores | 45 / 60 / 90 | none | No source | – |
| evidenceQuality | High | GRADE moderate for every outcome | Wrong | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| nnt | 9 | None published. Computed 8 for CIBIC-plus improved (33.1% vs 20.6%, 10 mg) | No source | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| nnh | 12 | None published. Computed 11.7 for nausea (12.9% vs 4.3%, 10 mg) | No source | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| responseRate | 25 | CIBIC-plus improved: 33.1% vs 20.6% | Wrong | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| participants | 30000 | 8,257 in 30 RCTs | Wrong | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| trials | 202 | 206 (search count) | Outdated | [CT.gov count](https://clinicaltrials.gov/api/v2/studies?query.cond=Alzheimer%27s%20Disease&query.intr=Donepezil&countTotal=true&pageSize=1) |
| timeToEffect | 4-6 weeks | Separation at week 3, the first visit. "4-6 weeks" is the label's titration interval | Wrong meaning | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) Fig 4, §2 |
| treatmentDuration | Lifetime | No stop rule. RCT evidence covers 52 weeks at most | No source | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| primaryOutcomes[0] ADAS-Cog baseline | 27 (0-75) | About 26 (scale 0-70) | Wrong (scale) | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) §14.1 |
| primaryOutcomes[0] absoluteChange | −2.5 | Diff −2.67 (−3.31 to −2.02), 10 mg, 24-26 weeks. Within-arm −1.06 vs +1.82 (Rogers 1998b) | Wrong meaning | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| primaryOutcomes[0] percentageChange | −9.3 | No source (= −2.5 / 27). Within-arm about −4% | Wrong meaning | – |
| primaryOutcomes[1] MMSE baseline | 19 (0-30) | 19.0 | Matches | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) Table 1 |
| primaryOutcomes[1] absoluteChange, percentageChange | +1.5, 7.9 | Diff +1.05 (0.73 to 1.37). Within-arm +0.39 vs −0.97 | Wrong | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| primaryOutcomes[2] CDR-SB baseline | 7 (0-18) | Not found | No source | – |
| primaryOutcomes[2] absoluteChange, percentageChange | −0.8, −11.4 | Diff −0.53 (−0.73 to −0.33). Within-arm −0.02 vs +0.58 | Wrong | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| secondaryOutcomes[0] ADCS-ADL | 58 (0-78), +3, 5.2% | The pooled scale is ADCS-ADL-severe (0-54): diff +1.03 (0.21 to 1.85). Both arms declined (−1.5 vs −2.9) | Wrong | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| secondaryOutcomes[1] NPI | 24 (0-144), −3.5, positive | Diff −1.62 (−3.43 to 0.19), not significant: "no difference" | Wrong | [Cochrane 2018](https://doi.org/10.1002/14651858.CD001190.pub3) |
| sideEffects Nausea | 11 | 11% vs 6% | Matches | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) Table 3 |
| sideEffects Diarrhea | 9 | 10% vs 5% | Wrong | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) Table 3 |
| sideEffects Insomnia | 9 | 9% vs 6% | Matches | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) Table 3 |
| sideEffects Muscle cramps | 8 | 6% vs 2% (8% is the 10 mg column) | Wrong | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) Table 3 |
| sideEffects Vomiting | 6 | 5% vs 3% | Wrong | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) Table 3 |
| sideEffects (missing) | – | Fatigue 5% vs 3%; anorexia 4% vs 2%. At 23 mg: nausea 12% vs 3% and vomiting 9% vs 3% (vs 10 mg) | Missing | [FDA label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98e451e1-e4d7-4439-a675-c5457ba20975) Tables 3, 6 |
| annualCostOfCare.drugCost | 75 | $17.68/yr (generic 10 mg, $0.04843 × 365, 2026-09-23) | Wrong | [NADAC 2026](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704) |
| annualCostOfCare.monitoringCost / sideEffectManagement / totalAnnual | 400 / 50 / 525 | No source | No source | – |
| costPerResponder | 2100 | No source (= 525 / 0.25, ignores placebo response) | No source | – |
| qalysGained | 0.05 | 0.034-0.035 (NICE Assessment Group) | Wrong | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |
| icer | null | Dominant: less costly and more effective than best supportive care | Wrong (missing) | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |
| costEffectivenessRating | excellent | NICE: cost-effective, dominant | Matches | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |

### 3.5 Rivastigmine

Sources:
[Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) (Birks et al., PMID 26393402, [full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC7050299/)) ·
[Capsule label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/020823s036,021025s024lbl.pdf) ·
[Patch label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/022083s028lbl.pdf) ·
[IDEAL](https://pubmed.ncbi.nlm.nih.gov/17646619/) (Winblad 2007, NCT00099242) ·
[Nakamura 2011](https://clinicaltrials.gov/study/NCT00423085) ·
[NICE TA217](https://www.nice.org.uk/guidance/ta217) ·
[NADAC 2026](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704)

| Field | Current | Corrected | Status | Source |
| --- | --- | --- | --- | --- |
| dosageRange | 1.5-6 mg twice daily, or 4.6-13.3 mg/24 h patch | Same | Matches | [Capsule label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/020823s036,021025s024lbl.pdf), [Patch label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/022083s028lbl.pdf) |
| scores | 43 / 58 / 88 | none | No source | – |
| evidenceQuality | High | GRADE moderate for every outcome | Wrong | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| nnt | 10 | None published. Computed about 13 for global rating improved (27.5% vs 19.7%) | No source | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| nnh | 15 | None published. Computed 8 for stopping because of side effects (capsule, 20.0% vs 7.4%) | No source | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| responseRate | 25 | 27.5% vs 19.7% | Wrong | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| participants | 20000 | 5,930 in 13 RCTs | Wrong | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| trials | 55 | 55 (search count; includes unrelated studies) | Matches | [CT.gov count](https://clinicaltrials.gov/api/v2/studies?query.cond=Alzheimer%27s%20Disease&query.intr=Rivastigmine&countTotal=true&pageSize=1) |
| timeToEffect | 4-6 weeks | No source. This is the minimum titration time | No source | – |
| treatmentDuration | Lifetime | "For as long as therapeutic benefit persists" | Wrong meaning | [Patch label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/022083s028lbl.pdf) §2.1 |
| primaryOutcomes[0] ADAS-Cog baseline | 25 (0-75) | About 23 (scale 0-70) | Wrong (scale) | [Capsule label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/020823s036,021025s024lbl.pdf) §14 |
| primaryOutcomes[0] absoluteChange | −2 | Diff −1.79 (−2.21 to −1.37) | Matches (diff) | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| primaryOutcomes[0] percentageChange | −8 | No source (= −2 / 25) | Wrong meaning | – |
| primaryOutcomes[1] CIBIC-Plus baseline, percentageChange | 4, −7.5 | CIBIC-Plus is a rating of change. It has no baseline, so a percentage has no meaning | Wrong meaning | [Capsule label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/020823s036,021025s024lbl.pdf) §14 |
| primaryOutcomes[1] absoluteChange | −0.3 | Diff 0.35-0.41 (capsule trials); 0.3 (IDEAL, ADCS-CGIC) | Matches (diff) | [Capsule label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/020823s036,021025s024lbl.pdf), [IDEAL](https://pubmed.ncbi.nlm.nih.gov/17646619/) |
| primaryOutcomes[2] ADCS-ADL baseline | 60 (0-78) | Not checked (IDEAL full text paywalled) | No source | – |
| primaryOutcomes[2] absoluteChange, percentageChange | +2, 3.3 | Diff +2.20 (0.62 to 3.78), 9.5 mg patch | Matches (diff) | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| secondaryOutcomes[0] NPI | 15 (0-144), −3, positive | No difference: SMD −0.04 (−0.14 to 0.06) | Wrong | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| secondaryOutcomes[1] "Caregiver Burden (hypothetical scale…)" | 25 (0-88), −5, −20% | No trial measured it. Carer distress: diff 0.10 (−0.91 to 1.11) | Remove row | [Cochrane 2015](https://doi.org/10.1002/14651858.CD001191.pub4) |
| sideEffects Nausea | 10 | Capsule 47% vs 12%; patch 9.5 mg 7% vs 5% | Wrong | [Capsule label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/020823s036,021025s024lbl.pdf) Table 2, [Patch label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/022083s028lbl.pdf) Table 1 |
| sideEffects Vomiting | 7 | Capsule 31% vs 6%; patch 6% vs 3% | Wrong | same |
| sideEffects Diarrhea | 4 | Capsule 19% vs 11%; patch 6% vs 3% | Wrong | same |
| sideEffects Dizziness | 6 | Capsule 21% vs 11%; patch 2% vs 2% | Wrong | same |
| sideEffects Skin irritation (patch) | 12 | Application-site erythema 39.4% vs 19.2% (placebo patch) | Wrong | [Nakamura 2011](https://clinicaltrials.gov/study/NCT00423085) |
| sideEffects (missing) | – | Capsule anorexia 17% vs 3% | Missing | [Capsule label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/020823s036,021025s024lbl.pdf) |
| annualCostOfCare.drugCost | 150 | Capsule 6 mg twice daily $114/yr; patch 9.5 mg $651/yr | Wrong (mixes forms) | [NADAC 2026](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704) |
| annualCostOfCare.monitoringCost / sideEffectManagement / totalAnnual | 400 / 50 / 600 | No source | No source | – |
| costPerResponder | 2400 | No source (= 600 / 0.25) | No source | – |
| qalysGained | 0.04 | 0.029-0.035 (drug class) | Wrong | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |
| icer | null | Dominant (base case); £37,100/QALY for the patch if a survival effect is assumed | Wrong (missing) | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |
| costEffectivenessRating | excellent | Not a source term. NICE: dominant in base case | No source | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |

### 3.6 Galantamine

Sources:
[Cochrane 2024](https://doi.org/10.1002/14651858.CD001747.pub4) (Lim, Schneider, Loy, PMID 39498781, [full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC11536474/); supersedes the 2006 review) ·
[FDA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/021615s027lbl.pdf) ·
[Tariot 2000](https://doi.org/10.1212/wnl.54.12.2269) ·
[Hager 2014](https://clinicaltrials.gov/study/NCT00679627) ·
[Lanctôt 2003](https://pubmed.ncbi.nlm.nih.gov/12975222/) ·
[NICE TA217](https://www.nice.org.uk/guidance/ta217) ·
[NADAC 2026](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704)

| Field | Current | Corrected | Status | Source |
| --- | --- | --- | --- | --- |
| dosageRange | 8-24 mg daily (ER) | Same. The effective dose is 16-24 mg/day; 8 mg is titration only | Matches | [FDA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/021615s027lbl.pdf) §2.1 |
| scores | 42 / 58 / 85 | none | No source | – |
| evidenceQuality | High | GRADE high for ADAS-Cog, NPI, and nausea | Matches | [Cochrane 2024](https://doi.org/10.1002/14651858.CD001747.pub4) |
| nnt | 12 | 12 is the drug-class value. Galantamine alone: 22 (12 to 157) | Wrong | [Lanctôt 2003](https://pubmed.ncbi.nlm.nih.gov/12975222/) |
| nnh | 18 | None published. Computed 6.6 for nausea (20.7% vs 5.5%) | No source | [FDA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/021615s027lbl.pdf) Table 1 |
| responseRate | 25 | No responder definition gives 25%. ≥4-point ADAS-Cog improvement: 37.0% vs 19.6% (24 mg) | Wrong | [Tariot 2000](https://doi.org/10.1212/wnl.54.12.2269) |
| participants | 15000 | 10,990 in 21 RCTs | Wrong | [Cochrane 2024](https://doi.org/10.1002/14651858.CD001747.pub4) |
| trials | 58 | 59 (search count) | Outdated | [CT.gov count](https://clinicaltrials.gov/api/v2/studies?query.cond=Alzheimer%27s%20Disease&query.intr=Galantamine&countTotal=true&pageSize=1) |
| timeToEffect / treatmentDuration | 4-6 weeks / Lifetime | No source. Trials ran 3-6 months; one ran 24 months | No source | [Cochrane 2024](https://doi.org/10.1002/14651858.CD001747.pub4) |
| primaryOutcomes[0] ADAS-Cog baseline | 28 (0-70) | About 27 (0-70) | Matches | [FDA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/021615s027lbl.pdf) §14 |
| primaryOutcomes[0] absoluteChange, percentageChange | −3, −10.71 | Diff −2.86 (−3.29 to −2.43). Within-arm −1.4 vs +1.7 | Wrong meaning | [Cochrane 2024](https://doi.org/10.1002/14651858.CD001747.pub4), [Tariot 2000](https://doi.org/10.1212/wnl.54.12.2269) |
| primaryOutcomes[1] MMSE | 20 (0-30), +1.2, 6% | Not a pivotal-trial outcome. Hager 2014: baseline 19; diff +0.43 (0.17 to 0.69) at 6 months; within-arm +0.15 vs −0.28 | Wrong | [Hager 2014](https://clinicaltrials.gov/study/NCT00679627) |
| primaryOutcomes[2] CIBIC-Plus | 4 (no change), −0.4, −10% | Rating of change, no baseline. Diff 0.41 / 0.44 (16 / 24 mg) | Wrong meaning | [FDA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/021615s027lbl.pdf) §14 |
| secondaryOutcomes[0] ADCS-ADL baseline | 55 (0-78) | 51.6-54.2 | Matches | [Tariot 2000](https://doi.org/10.1212/wnl.54.12.2269) |
| secondaryOutcomes[0] absoluteChange, percentageChange | +2, 3.64 | Diff +2.3 (24 mg), +3.1 (16 mg). Within-arm −1.5 vs −3.8 | Wrong meaning | [Cochrane 2024](https://doi.org/10.1002/14651858.CD001747.pub4), [Tariot 2000](https://doi.org/10.1212/wnl.54.12.2269) |
| secondaryOutcomes[1] NPI | 25 (0-144), −3, −12% | Baseline 11.0-12.9 on 0-120. Diff −1.63 (−3.07 to −0.20). Within-arm 0.0 vs +2.0 | Wrong | [Tariot 2000](https://doi.org/10.1212/wnl.54.12.2269), [Cochrane 2024](https://doi.org/10.1002/14651858.CD001747.pub4) |
| secondaryOutcomes[2] CDR-SB | 7 (0-18), −0.5, −7.14% | "We found no data for this outcome." | Remove row | [Cochrane 2024](https://doi.org/10.1002/14651858.CD001747.pub4) |
| sideEffects Nausea | 13 | 20.7% vs 5.5% | Wrong | [FDA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/021615s027lbl.pdf) Table 1 |
| sideEffects Vomiting | 8 | 10.5% vs 2.3% | Wrong | same |
| sideEffects Anorexia | 7 | Decreased appetite 7.4% vs 2.1% | Matches | same |
| sideEffects Diarrhea | 6 | 7.4% vs 4.9% | Wrong | same |
| sideEffects Dizziness | 6 | 7.5% vs 3.4% | Wrong | same |
| sideEffects (missing) | – | Stopping for side effects 10.6% vs 2.2%. Label §5.8: deaths in the MCI trials, 13/1,026 vs 1/1,022 | Missing | [FDA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/021615s027lbl.pdf) |
| annualCostOfCare.drugCost | 100 | $330/yr (ER 24 mg, 2026-09-23); $413/yr at generation | Wrong | [NADAC 2026](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704) |
| annualCostOfCare.monitoringCost / sideEffectManagement / totalAnnual | 400 / 50 / 550 | No source | No source | – |
| costPerResponder | 2200 | No source (= 550 / 0.25) | No source | – |
| qalysGained | 0.03 | 0.029-0.035 (drug class) | Matches | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |
| icer | null | Dominant (NICE base case) | Wrong (missing) | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |

### 3.7 Memantine

Sources:
[Cochrane 2019](https://doi.org/10.1002/14651858.CD003154.pub6) (McShane et al., PMID 30891742; abstract only) ·
[Namenda label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021487s010s012s014%2c021627s008lbl.pdf) ·
[Namenda XR label](https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=1fa2b7bc-94e5-4566-a7c5-419f8fd393a7) ·
[Tariot 2004](https://doi.org/10.1001/jama.291.3.317) ·
[Grossberg 2013](https://clinicaltrials.gov/study/NCT00322153) ·
[TEAM-AD](https://clinicaltrials.gov/study/NCT00235716) ·
[Youn 2021](https://doi.org/10.30773/pi.2020.0329) ·
[Livingston 2004](https://doi.org/10.1002/gps.1166) ·
[NICE TA217](https://www.nice.org.uk/guidance/ta217) ·
[NADAC 2026](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704)

The label covers moderate-to-severe AD only. The stored outcomes use mild-to-moderate scales.
For mild AD, Cochrane finds no effect.

| Field | Current | Corrected | Status | Source |
| --- | --- | --- | --- | --- |
| dosageRange | 5-20 mg daily | 5-20 mg/day (20 mg as 10 mg twice daily); XR 7-28 mg once daily; severe renal impairment 5 mg twice daily or XR 14 mg | Wrong (incomplete) | [Namenda label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021487s010s012s014%2c021627s008lbl.pdf), [Namenda XR label](https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=1fa2b7bc-94e5-4566-a7c5-419f8fd393a7) |
| scores | 40 / 68 / 85 | none | No source | – |
| evidenceQuality | High | High for moderate-to-severe AD only. Mild AD: moderate certainty, "probably no difference" | Wrong (population) | [Cochrane 2019](https://doi.org/10.1002/14651858.CD003154.pub6) |
| nnt | 10 | Published 3-8 (global 3 and 6; ADL 4 and 8) | Wrong | [Livingston 2004](https://doi.org/10.1002/gps.1166) |
| nnh | 25 | None published. "No more harmful than placebo". Label rates give 33-100 | No source | [Livingston 2004](https://doi.org/10.1002/gps.1166), [Namenda label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021487s010s012s014%2c021627s008lbl.pdf) |
| responseRate | 25 | None | No source | – |
| participants | 12000 | 7,885 in 29 AD trials | Wrong | [Cochrane 2019](https://doi.org/10.1002/14651858.CD003154.pub6) |
| trials | 73 | 77 (search count; includes trials of other drugs) | Outdated | [CT.gov count](https://clinicaltrials.gov/api/v2/studies?query.cond=Alzheimer%27s%20Disease&query.intr=Memantine&countTotal=true&pageSize=1) |
| timeToEffect | 2-4 weeks | No source. The 20 mg dose is reached at week 4 at the earliest | No source | [Namenda label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021487s010s012s014%2c021627s008lbl.pdf) |
| treatmentDuration | Lifetime | No source. Evidence covers 6-7 months | No source | [Cochrane 2019](https://doi.org/10.1002/14651858.CD003154.pub6) |
| primaryOutcomes[0] ADAS-Cog | 28 (0-70), −1.5, −5.3% | Licensed population uses SIB: diff +3.11 (2.42 to 3.92). Mild AD ADAS-Cog: 0.21 (−0.95 to 1.38), no effect | Wrong | [Cochrane 2019](https://doi.org/10.1002/14651858.CD003154.pub6) |
| primaryOutcomes[1] ADCS-ADL | 45 (0-78), +1.0, 2.2% | ADCS-ADL19 (0-54), moderate-to-severe: diff +1.09 (0.62 to 1.64). Within-arm −2.0 vs −3.4 | Wrong (scale and meaning) | [Cochrane 2019](https://doi.org/10.1002/14651858.CD003154.pub6), [Tariot 2004](https://doi.org/10.1001/jama.291.3.317) |
| primaryOutcomes[2] NPI | 30 (0-144), −5.0, −16.7% | Diff 1.84 points (1.05 to 2.76), moderate-to-severe | Wrong | [Cochrane 2019](https://doi.org/10.1002/14651858.CD003154.pub6) |
| secondaryOutcomes[0] Zarit | 35 (0-88), −3.0, −8.6% | The only trial found: +0.67 vs −1.22, not significant | Remove row | [Youn 2021](https://doi.org/10.30773/pi.2020.0329) |
| secondaryOutcomes[1] MMSE | 15 (0-30), +0.5, 3.3% | TEAM-AD diff +0.12 (−0.61 to 0.84), not significant | No source | [TEAM-AD](https://clinicaltrials.gov/study/NCT00235716) |
| secondaryOutcomes[2] CMAI | 60 (29-203), −4.0, −6.7% | "Not beneficial as a treatment for agitation": 0.50 (−3.71 to 4.71) | Remove row | [Cochrane 2019](https://doi.org/10.1002/14651858.CD003154.pub6) |
| sideEffects Dizziness | 7 | 7% vs 5% | Matches | [Namenda label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021487s010s012s014%2c021627s008lbl.pdf) |
| sideEffects Headache | 6 | 6% vs 3% | Matches | same |
| sideEffects Confusion | 5 | 6% vs 5%. The stored 5 is the placebo rate | Wrong | same |
| sideEffects Constipation | 5 | 5% vs 3% | Matches | same |
| annualCostOfCare.drugCost | 100 | $46/yr (10 mg twice daily); XR 28 mg $125/yr | Wrong | [NADAC 2026](https://data.medicaid.gov/dataset/fbb83258-11c7-47f5-8b18-5f8e79f7e704) |
| annualCostOfCare.monitoringCost | 400 | No source. The label requires no lab monitoring | No source | [Namenda label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021487s010s012s014%2c021627s008lbl.pdf) |
| annualCostOfCare.sideEffectManagement / totalAnnual | 50 / 550 | No source | No source | – |
| costPerResponder | 2200 | No source (= 550 / 0.25) | No source | – |
| qalysGained | 0.03 | Manufacturer 0.031; NICE Assessment Group 0.013 | Wrong (uses the manufacturer model only) | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |
| icer | null | £32,100/QALY (moderate-to-severe); £26,500 (severe), NICE Assessment Group | Wrong (missing) | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |
| costEffectivenessRating | excellent | Under 38% probability of being cost-effective at £30,000/QALY | Wrong | [NICE TA217](https://www.nice.org.uk/guidance/ta217) |

### 3.8 Data that the corrections need

The corrected values above do not fit the current fields:

- An outcome needs `effectMeasure`, the drug and placebo values, a CI, a time point, and a
  population (for example, "combined" vs "low/medium tau").
- A side effect needs a placebo rate and a dose or formulation (capsule vs patch, 2024 vs 2025
  dosing).
- A cost needs a price type (list price vs NADAC acquisition cost), a date, and a currency.

The `ValueProvenance` fields in section 2.1 cover these needs.

## Appendix A. Per-condition inventory

Every one of the 1,214 treatments is unverifiable: each citation is an expired redirect or a
generic search link, and no numeric value has a source. Section 3 is the only place where values
were checked against primary sources. The per-treatment list is in `treatments.csv` from the
script, and the per-citation list is in `citations.csv`.

<details>
<summary>216 conditions (generated by the audit script on 2026-10-02)</summary>

| Condition | Unresolved / treatments | Redirect citations | AI-estimated outcomes | Trial outcomes | Name-only outcomes |
| --- | ---: | ---: | ---: | ---: | ---: |
| acne | 6 / 6 | 58 | 18 | 0 | 0 |
| acute-glomerulonephritis | 5 / 5 | 57 | 21 | 0 | 0 |
| acute-hepatitis-a | 4 / 4 | 27 | 0 | 0 | 0 |
| acute-hepatitis-b | 3 / 3 | 21 | 19 | 0 | 0 |
| acute-hepatitis-c | 5 / 5 | 40 | 27 | 0 | 0 |
| acute-hepatitis-e | 5 / 5 | 48 | 0 | 0 | 0 |
| acute-lymphoid-leukemia | 6 / 6 | 65 | 25 | 16 | 34 |
| acute-myeloid-leukemia | 7 / 7 | 71 | 46 | 0 | 0 |
| addisons-disease | 4 / 4 | 25 | 20 | 0 | 0 |
| adhd | 5 / 5 | 54 | 34 | 0 | 0 |
| african-trypanosomiasis | 5 / 5 | 48 | 34 | 0 | 0 |
| alcohol-use-disorders | 7 / 7 | 68 | 34 | 0 | 0 |
| alcoholic-cardiomyopathy | 6 / 6 | 57 | 6 | 0 | 0 |
| allergic-rhinitis | 6 / 6 | 72 | 27 | 0 | 0 |
| alzheimers-disease | 6 / 6 | 62 | 35 | 0 | 0 |
| amphetamine-use-disorders | 5 / 5 | 39 | 13 | 0 | 0 |
| ankylosing-spondylitis | 6 / 6 | 58 | 32 | 0 | 0 |
| anorexia-nervosa | 5 / 5 | 41 | 20 | 0 | 0 |
| anxiety-disorder | 6 / 6 | 91 | 30 | 0 | 0 |
| appendicitis | 3 / 3 | 40 | 22 | 0 | 0 |
| asbestosis | 6 / 6 | 53 | 0 | 0 | 0 |
| ascariasis | 4 / 4 | 30 | 19 | 0 | 0 |
| asthma | 6 / 6 | 55 | 42 | 0 | 0 |
| atrial-fibrillation | 6 / 6 | 48 | 39 | 0 | 0 |
| benign-prostatic-hyperplasia | 6 / 6 | 66 | 36 | 0 | 0 |
| bipolar-disorder | 7 / 7 | 79 | 42 | 0 | 0 |
| bladder-cancer | 6 / 6 | 67 | 26 | 5 | 5 |
| brain-and-central-nervous-system-cancer | 6 / 6 | 71 | 37 | 0 | 0 |
| breast-cancer | 6 / 6 | 69 | 38 | 0 | 0 |
| burkitt-lymphoma | 5 / 5 | 36 | 18 | 0 | 0 |
| carpal-tunnel-syndrome | 6 / 6 | 57 | 19 | 0 | 0 |
| celiac-disease | 5 / 5 | 78 | 6 | 0 | 0 |
| cellulitis | 5 / 5 | 42 | 32 | 0 | 0 |
| cervical-cancer | 5 / 5 | 60 | 32 | 0 | 0 |
| chagas-disease | 2 / 2 | 21 | 13 | 0 | 0 |
| chlamydia | 3 / 3 | 27 | 12 | 0 | 0 |
| chlamydial-infection | 4 / 4 | 42 | 18 | 0 | 0 |
| chronic-bronchitis | 6 / 6 | 52 | 25 | 0 | 0 |
| chronic-fatigue-syndrome | 6 / 6 | 51 | 14 | 0 | 0 |
| chronic-kidney-disease-due-to-diabetes-mellitus-type-1 | 5 / 5 | 58 | 7 | 0 | 0 |
| chronic-kidney-disease-due-to-diabetes-mellitus-type-2 | 5 / 5 | 54 | 13 | 0 | 0 |
| chronic-kidney-disease-due-to-glomerulonephritis | 6 / 6 | 62 | 0 | 0 | 0 |
| chronic-kidney-disease-due-to-hypertension | 5 / 5 | 64 | 0 | 0 | 0 |
| chronic-lymphoid-leukemia | 5 / 5 | 69 | 35 | 0 | 0 |
| chronic-myeloid-leukemia | 5 / 5 | 47 | 33 | 0 | 0 |
| chronic-sinusitis | 6 / 6 | 57 | 29 | 0 | 0 |
| cluster-headache | 7 / 7 | 60 | 25 | 0 | 0 |
| coal-workers-pneumoconiosis | 6 / 6 | 67 | 0 | 0 | 0 |
| cocaine-use-disorders | 6 / 6 | 47 | 22 | 0 | 0 |
| colon-and-rectum-cancer | 7 / 7 | 76 | 32 | 0 | 0 |
| congenital-heart-anomalies | 7 / 7 | 83 | 49 | 0 | 0 |
| congenital-musculoskeletal-and-limb-anomalies | 6 / 6 | 77 | 12 | 0 | 0 |
| copd | 7 / 7 | 64 | 27 | 0 | 0 |
| coronary-artery-disease | 6 / 6 | 74 | 22 | 0 | 0 |
| covid-19 | 6 / 6 | 70 | 31 | 8 | 51 |
| crohns-disease | 7 / 7 | 64 | 40 | 0 | 0 |
| cushings-syndrome | 6 / 6 | 60 | 45 | 0 | 0 |
| cystic-echinococcosis | 5 / 5 | 44 | 0 | 0 | 0 |
| cysticercosis | 6 / 6 | 57 | 18 | 0 | 0 |
| decubitus-ulcer | 6 / 6 | 95 | 6 | 0 | 0 |
| dengue | 4 / 4 | 34 | 14 | 0 | 0 |
| depression | 6 / 6 | 75 | 38 | 0 | 0 |
| diabetes-mellitus-type-1 | 5 / 5 | 59 | 35 | 0 | 0 |
| diabetes-mellitus-type-2 | 7 / 7 | 81 | 41 | 42 | 55 |
| diarrheal-diseases | 6 / 6 | 50 | 19 | 0 | 0 |
| digestive-congenital-anomalies | 6 / 6 | 55 | 29 | 0 | 0 |
| dilated-cardiomyopathy | 5 / 5 | 57 | 20 | 0 | 0 |
| diphtheria | 5 / 5 | 46 | 7 | 0 | 0 |
| diverticulitis | 6 / 6 | 65 | 26 | 0 | 0 |
| down-syndrome | 7 / 7 | 72 | 28 | 0 | 0 |
| drug-susceptible-tuberculosis | 5 / 5 | 52 | 0 | 0 | 0 |
| dry-eye-disease | 7 / 7 | 76 | 34 | 0 | 0 |
| ectopic-pregnancy | 4 / 4 | 36 | 26 | 0 | 0 |
| eczema | 6 / 6 | 73 | 26 | 0 | 0 |
| emphysema | 6 / 6 | 70 | 27 | 0 | 0 |
| encephalitis | 5 / 5 | 44 | 26 | 0 | 0 |
| endocarditis | 6 / 6 | 56 | 40 | 0 | 0 |
| endometriosis | 7 / 7 | 61 | 35 | 0 | 0 |
| esophageal-cancer | 5 / 5 | 71 | 15 | 1 | 7 |
| extensively-drug-resistant-tuberculosis | 7 / 7 | 66 | 7 | 0 | 0 |
| fibromyalgia | 7 / 7 | 60 | 45 | 0 | 0 |
| frontotemporal-dementia | 5 / 5 | 40 | 7 | 0 | 0 |
| g6pd-deficiency | 3 / 3 | 31 | 0 | 0 | 0 |
| gallbladder-and-biliary-diseases | 4 / 4 | 70 | 29 | 0 | 0 |
| gallbladder-and-biliary-tract-cancer | 6 / 6 | 84 | 20 | 0 | 0 |
| gastritis-and-duodenitis | 6 / 6 | 71 | 0 | 0 | 0 |
| genital-herpes | 4 / 4 | 42 | 20 | 0 | 0 |
| genital-prolapse | 5 / 5 | 50 | 25 | 0 | 0 |
| gerd | 5 / 5 | 49 | 34 | 0 | 0 |
| gingivitis | 5 / 5 | 54 | 16 | 0 | 0 |
| glaucoma | 5 / 5 | 47 | 28 | 0 | 0 |
| gonococcal-infection | 5 / 5 | 54 | 0 | 0 | 0 |
| gonorrhea | 6 / 6 | 61 | 31 | 0 | 0 |
| gout | 6 / 6 | 67 | 24 | 0 | 0 |
| hashimotos-thyroiditis | 6 / 6 | 78 | 29 | 0 | 0 |
| heart-failure | 6 / 6 | 80 | 33 | 0 | 0 |
| hemophilia | 6 / 6 | 54 | 26 | 1 | 21 |
| hemorrhoids | 6 / 6 | 48 | 34 | 0 | 0 |
| hepatoblastoma | 6 / 6 | 50 | 26 | 0 | 0 |
| hiv-aids-drug-susceptible-tuberculosis | 2 / 2 | 23 | 0 | 0 | 0 |
| hiv-aids-extensively-drug-resistant-tuberculosis | 5 / 5 | 52 | 0 | 0 | 0 |
| hiv-aids-multidrug-resistant-tuberculosis-without-extensive-drug-resistance | 6 / 6 | 68 | 0 | 0 | 0 |
| hodgkin-lymphoma | 6 / 6 | 73 | 39 | 0 | 0 |
| hpv-infection | 5 / 5 | 47 | 26 | 0 | 0 |
| hypertension | 5 / 5 | 43 | 29 | 0 | 0 |
| hypertensive-heart-disease | 6 / 6 | 67 | 27 | 0 | 0 |
| hyperthyroidism | 5 / 5 | 44 | 32 | 0 | 0 |
| hypertrophic-cardiomyopathy | 6 / 6 | 74 | 22 | 1 | 34 |
| hypothyroidism | 5 / 5 | 55 | 14 | 0 | 0 |
| idiopathic-epilepsy | 5 / 5 | 45 | 17 | 0 | 0 |
| inflammatory-bowel-disease | 7 / 7 | 69 | 45 | 0 | 0 |
| inguinal-femoral-and-abdominal-hernia | 6 / 6 | 84 | 12 | 0 | 0 |
| insomnia | 7 / 7 | 73 | 43 | 0 | 0 |
| interstitial-cystitis | 7 / 7 | 59 | 33 | 2 | 3 |
| interstitial-lung-disease-and-pulmonary-sarcoidosis | 6 / 6 | 68 | 30 | 0 | 0 |
| intracerebral-hemorrhage | 6 / 6 | 63 | 34 | 0 | 0 |
| invasive-non-typhoidal-salmonella-ints | 5 / 5 | 39 | 0 | 0 | 0 |
| iron-deficiency-anemia | 5 / 5 | 47 | 28 | 0 | 0 |
| irritable-bowel-syndrome | 6 / 6 | 58 | 34 | 0 | 0 |
| ischemic-heart-disease | 6 / 6 | 63 | 41 | 0 | 0 |
| ischemic-stroke | 7 / 7 | 66 | 32 | 0 | 0 |
| kidney-cancer | 5 / 5 | 51 | 31 | 0 | 0 |
| kidney-stones | 6 / 6 | 67 | 40 | 0 | 0 |
| larynx-cancer | 5 / 5 | 59 | 34 | 0 | 0 |
| lewy-body-dementia | 6 / 6 | 54 | 24 | 3 | 7 |
| lip-and-oral-cavity-cancer | 5 / 5 | 53 | 28 | 0 | 0 |
| liver-cancer-due-to-alcohol-use | 7 / 7 | 67 | 0 | 0 | 0 |
| liver-cancer-due-to-hepatitis-b | 7 / 7 | 60 | 0 | 0 | 0 |
| liver-cancer-due-to-hepatitis-c | 6 / 6 | 44 | 0 | 0 | 0 |
| liver-cancer-due-to-nash | 7 / 7 | 64 | 0 | 0 | 0 |
| long-covid | 7 / 7 | 81 | 31 | 0 | 0 |
| lower-extremity-peripheral-arterial-disease | 7 / 7 | 70 | 40 | 0 | 0 |
| lower-respiratory-infections | 5 / 5 | 43 | 26 | 0 | 0 |
| lupus | 7 / 7 | 77 | 51 | 0 | 0 |
| macular-degeneration | 6 / 6 | 57 | 34 | 0 | 0 |
| malaria | 6 / 6 | 77 | 38 | 0 | 0 |
| malignant-neoplasm-of-bone-and-articular-cartilage | 6 / 6 | 91 | 0 | 0 | 0 |
| malignant-skin-melanoma | 6 / 6 | 60 | 37 | 0 | 0 |
| maternal-hypertensive-disorders | 6 / 6 | 62 | 7 | 0 | 0 |
| measles | 3 / 3 | 24 | 14 | 0 | 0 |
| menieres-disease | 6 / 6 | 54 | 27 | 0 | 0 |
| meningitis | 5 / 5 | 43 | 28 | 0 | 0 |
| menopause | 6 / 6 | 54 | 32 | 0 | 0 |
| mesothelioma | 5 / 5 | 61 | 34 | 0 | 0 |
| metabolic-syndrome | 6 / 6 | 66 | 39 | 0 | 0 |
| migraine | 7 / 7 | 76 | 44 | 0 | 0 |
| motor-neuron-disease | 5 / 5 | 52 | 29 | 0 | 0 |
| multidrug-resistant-tuberculosis-without-extensive-drug-resistance | 6 / 6 | 61 | 0 | 0 | 0 |
| multiple-myeloma | 6 / 6 | 58 | 26 | 2 | 20 |
| multiple-sclerosis | 7 / 7 | 63 | 48 | 0 | 0 |
| myocarditis | 6 / 6 | 58 | 34 | 0 | 0 |
| nasopharynx-cancer | 6 / 6 | 59 | 39 | 0 | 0 |
| neural-tube-defects | 5 / 5 | 38 | 13 | 0 | 0 |
| non-melanoma-skin-cancer-squamous-cell-carcinoma | 6 / 6 | 70 | 39 | 0 | 0 |
| non-rheumatic-calcific-aortic-valve-disease | 5 / 5 | 52 | 0 | 0 | 0 |
| non-rheumatic-degenerative-mitral-valve-disease | 5 / 5 | 48 | 0 | 0 | 0 |
| opioid-use-disorders | 5 / 5 | 60 | 27 | 0 | 0 |
| orofacial-clefts | 6 / 6 | 69 | 0 | 0 | 0 |
| osteoarthritis | 7 / 7 | 67 | 30 | 0 | 0 |
| osteoporosis | 6 / 6 | 55 | 42 | 0 | 0 |
| otitis-media | 5 / 5 | 48 | 26 | 0 | 0 |
| ovarian-cancer | 5 / 5 | 48 | 33 | 0 | 0 |
| pancreatic-cancer | 6 / 6 | 70 | 41 | 0 | 0 |
| pancreatitis | 5 / 5 | 66 | 14 | 0 | 0 |
| paralytic-ileus-and-intestinal-obstruction | 6 / 6 | 78 | 0 | 0 | 0 |
| paratyphoid-fever | 5 / 5 | 44 | 0 | 0 | 0 |
| parkinsons-disease | 6 / 6 | 77 | 20 | 0 | 0 |
| peptic-ulcer-disease | 4 / 4 | 45 | 21 | 0 | 0 |
| peripheral-neuropathy | 7 / 7 | 63 | 43 | 0 | 0 |
| pertussis | 4 / 4 | 46 | 18 | 0 | 0 |
| polycystic-ovary-syndrome | 6 / 6 | 67 | 41 | 0 | 0 |
| premenstrual-syndrome | 7 / 7 | 76 | 37 | 0 | 0 |
| prostate-cancer | 5 / 5 | 53 | 35 | 0 | 0 |
| protein-energy-malnutrition | 5 / 5 | 47 | 35 | 0 | 0 |
| psoriasis | 7 / 7 | 61 | 44 | 0 | 0 |
| pulmonary-arterial-hypertension | 6 / 6 | 54 | 32 | 0 | 0 |
| pyoderma | 6 / 6 | 57 | 13 | 0 | 0 |
| restless-legs-syndrome | 6 / 6 | 61 | 31 | 0 | 0 |
| retinoblastoma | 7 / 7 | 74 | 26 | 0 | 0 |
| rheumatic-heart-disease | 5 / 5 | 48 | 32 | 0 | 0 |
| rheumatoid-arthritis | 6 / 6 | 58 | 35 | 3 | 153 |
| rosacea | 7 / 7 | 67 | 34 | 0 | 0 |
| schistosomiasis | 4 / 4 | 43 | 7 | 0 | 0 |
| shingles | 5 / 5 | 51 | 33 | 0 | 0 |
| sickle-cell-disorders | 7 / 7 | 77 | 37 | 0 | 0 |
| silicosis | 7 / 7 | 88 | 21 | 0 | 0 |
| sleep-apnea | 6 / 6 | 61 | 44 | 0 | 0 |
| stomach-cancer | 7 / 7 | 57 | 42 | 0 | 0 |
| subarachnoid-hemorrhage | 6 / 6 | 56 | 31 | 0 | 0 |
| syphilis | 5 / 5 | 49 | 23 | 0 | 0 |
| tension-headache | 5 / 5 | 43 | 25 | 0 | 0 |
| testicular-cancer | 6 / 6 | 61 | 41 | 0 | 0 |
| tetanus | 6 / 6 | 60 | 14 | 0 | 0 |
| thalassemias | 6 / 6 | 53 | 33 | 0 | 0 |
| thyroid-cancer | 6 / 6 | 56 | 37 | 0 | 0 |
| tinnitus | 6 / 6 | 60 | 33 | 0 | 0 |
| tracheal-bronchus-and-lung-cancer | 6 / 6 | 65 | 0 | 0 | 0 |
| typhoid-fever | 5 / 5 | 49 | 34 | 0 | 0 |
| ulcerative-colitis | 7 / 7 | 67 | 48 | 0 | 0 |
| upper-respiratory-infections | 6 / 6 | 52 | 30 | 0 | 0 |
| urinary-tract-infection | 4 / 4 | 38 | 25 | 0 | 0 |
| urinary-tract-infections-and-interstitial-nephritis | 5 / 5 | 55 | 16 | 0 | 0 |
| urogenital-congenital-anomalies | 6 / 6 | 81 | 22 | 0 | 0 |
| urolithiasis | 6 / 6 | 65 | 34 | 0 | 0 |
| uterine-cancer | 7 / 7 | 76 | 28 | 0 | 0 |
| uterine-fibroids | 6 / 6 | 47 | 41 | 0 | 0 |
| varicella-and-herpes-zoster | 5 / 5 | 59 | 33 | 0 | 0 |
| varicose-veins | 6 / 6 | 64 | 32 | 0 | 0 |
| vascular-dementia | 6 / 6 | 57 | 13 | 0 | 0 |
| vascular-intestinal-disorders | 7 / 7 | 66 | 6 | 0 | 0 |
| vertigo | 5 / 5 | 46 | 31 | 0 | 0 |
| visceral-leishmaniasis | 5 / 5 | 45 | 28 | 0 | 0 |
| vitamin-b12-deficiency | 4 / 4 | 38 | 24 | 0 | 0 |
| vitiligo | 6 / 6 | 67 | 18 | 0 | 0 |
| yellow-fever | 2 / 2 | 19 | 6 | 0 | 0 |
| zika-virus | 2 / 2 | 24 | 0 | 0 | 0 |

</details>
