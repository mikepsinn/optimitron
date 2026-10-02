# Medical Treatment Data: Citation Audit and Source-Replacement Plan

Status: proposed. No data, schema, or UI change is applied. The owner must approve each phase.
Scope: `packages/data/src/datasets/medical-data/treatments/*.json`. The dfda repository holds a
byte-for-byte copy at optimitron commit `06ffef0f`, and this directory has not changed since that
commit. Do not edit the dfda copy. Re-import it after an approved upstream change.

## 1. Findings

### 1.1 Citation inventory

Run `pnpm --filter @optimitron/data run audit:medical-citations -- --probe 20`. The script writes
`inventory.json`, `treatments.csv`, `citations.csv`, and `summary.md` to
`packages/data/output/medical-citation-audit/` (gitignored).

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
outcomes plus the 5,135 side-effect rows. 391 treatments have no outcome rows.

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
3. Rankings at `/treatment-rankings` sort by `effectiveness` or `safetyScore`. Both are model scores
   with no primary source by construction.
4. Optimitron's `apps/dfda` treatment report shows the first three citations as links. They are the
   expired redirects, so a reader who clicks gets HTTP 404.
5. No UI in either app shows the `ai-estimated` tag. The dfda outcome label says only "Current best
   estimates".
6. `percentageChange` mixes three meanings: percent change from baseline, percent slowing relative to
   placebo, and a difference relative to an unrelated baseline. The dfda label says "Estimated
   outcome changes relative to the baselines shown", which is wrong for the second and third meanings.

## 2. Proposed plan

### 2.1 Data model: an explicit provenance layer

Do not hand-edit the snapshot. Add a reviewed sidecar file per condition and merge it in the loader.
The snapshot stays byte-identical, so the dfda checksum import does not change until the owner
re-pins it. Both READMEs already call for "an explicitly versioned correction layer".

```ts
// packages/data/src/datasets/medical-data/provenance/<condition-slug>.json
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
  field: string;          // e.g. "sideEffects[name=Headache].percentage", "primaryOutcomes[0].absoluteChange"
  status: ValueStatus;
  value?: number | string;        // replacement value when status is "corrected"
  snapshotValue: number | string; // the value this entry reviewed; a mismatch fails validation
  effectMeasure?: "difference-vs-placebo" | "within-arm-change" | "relative-slowing-pct"
    | "incidence-drug" | "incidence-placebo" | "list-price" | "count";
  comparatorValue?: number;       // e.g. the placebo incidence for a side effect
  population?: string;            // e.g. "TRAILBLAZER-ALZ 2, low/medium tau"
  sources: SourceRef[];
  method?: string;
  reviewedBy: string;
  reviewedAt: string;     // ISO date of the review, not of generation
}
```

Rules:

1. A value without an entry is `unverified-ai-estimate`. The default needs no edit to the 30,973
   values, and a value cannot look verified by accident.
2. `snapshotValue` must equal the current snapshot value. A test fails when the snapshot changes
   under a reviewed entry.
3. A `SourceRef` must be a DOI, PMID, PMC, NCT study, or regulatory-label URL. The test reuses
   `classifyCitationUrl` from this change.
4. Mark `effectiveness`, `safetyScore`, and `confidenceScore` as `model-score` once, with the
   formula and a link to the method. Do not invent a source for them.
5. Treat redirect citations as historical metadata. Do not render them as links.
6. Downgrade the 84 `trial` rows to `unverified-ai-estimate` until an NCT ID and arm labels are stored.

The `@optimitron/db` Prisma schema does not change. These types live in `@optimitron/data`. If the
owner later moves the data into the database, that is a separate schema change for approval.

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

1. Lecanemab (its outcome label appears in a video).
2. The other five Alzheimer's treatments in section 3.
3. Conditions ordered by page traffic.
4. A CI check: the share of displayed values with `verified`, `corrected`, or `derived` status, per
   condition, reported by the audit script.

## 3. Worked example: Alzheimer's disease

Pending research results.
