# Longevitron — Similar Existing Work

Checked 2026-10-17. "Partly verified" means some details came from summaries or search results, not the primary page. Verify an item before a record cites it.

## Summary

No public project does all four things that Longevitron plans:

1. Reallocate a whole government budget across functions.
2. Maximize HALE.
3. Add policy and law levers that have measured effects.
4. Trace every number to a source through evals that agents must pass.

Each part exists somewhere. Longevitron combines them for the US.

## The 3 most similar projects

| # | Project | What it shares with Longevitron | How Longevitron differs |
|---|---|---|---|
| 1 | **HIPtool** (World Bank, UCL, Gates; PLoS One 2021, PMC8629222) | A fixed budget, published cost-effectiveness data, and an optimizer that selects interventions to maximize health (DALYs averted). Reported gains from reallocation: +22% to +49% DALYs averted in 3 countries. | HIPtool covers the health sector only, low- and middle-income countries, and clinical services. It has no laws and no source tracing. The site did not load during the check. |
| 2 | **ACE-Prevention** (Univ. of Queensland, Deakin; Vos et al. 2010) | One method, one high-income country (Australia), 150 interventions, including taxes and regulation | ACE-Prevention is a static report from 2010. It has no allocation engine, no bill text, and no updates. |
| 3 | **Policy Priority Inference** (policypriority.org; MIT licence) | A model of how spending across budget programs drives outcome indicators over time | PPI targets the Sustainable Development Goals (SDGs), not HALE. It does not use intervention cost-effectiveness data. |

A close fourth is **FairChoices** (Bergen Centre for Ethics and Priority Setting, fairchoices.uib.no). It optimizes packages of more than 100 interventions for 82 countries, and the output includes life expectancy.

## Internal prior art in this repository

- `packages/obg` builds a budget from COFOG data and compares health spending with HALE across countries.
- `packages/opg` ranks policies.

Longevitron imports nothing from Optimitron. Copy a method from these packages only after you read and test it.

## Items by category

### Cost-effectiveness data (league-table rows)

| Item | Use for Longevitron | Access | Verified |
|---|---|---|---|
| DCP3 / DCP4 (dcp-3.org, dcp4.w.uib.no) | 218-intervention list. Horton et al. 2017 league table of 93 interventions (PMC5552255). | Free PDFs and annexes (World Bank Open Knowledge Repository) | Partly |
| Tufts CEA Registry (cevr.tuftsmedicalcenter.org) | More than 10,000 cost-per-QALY studies, including US studies | Premium tier, or request access as a nonprofit | Partly |
| GH CEA Registry (ghcearegistry.org) | Cost-per-DALY ratios | Historically a free Excel file; page returned 503 | Partly |
| WHO-CHOICE and UHC Compendium (who.int) | Costs every intervention against a scenario with none in place, which fits "rebuild the budget from zero" | Regional results; no bulk export found | Partly |
| NCPP ranking (Maciosek et al., Ann Fam Med 2017;15:14) | Ranks 28 US clinical preventive services | Free article | Partly |
| CHOICES (choicesproject.org, Harvard) | US obesity policy models, for example sugary-drink taxes | Free reports | Partly |
| WSIPP Benefit-Cost Results (wsipp.wa.gov/BenefitCost) | US method built for legislators, with Monte Carlo risk | Free | Yes |
| GiveWell models | Pattern for transparent parameters | Public sheets | Yes |

### Budget thresholds

- **US opportunity cost:** Vanness et al., Ann Intern Med 2021;174:25–32, estimate about $104,000 per QALY (range $51,000–209,000). This is a candidate shadow price for the "same total budget" limit.
- **ICER (US):** uses $100,000–150,000 per QALY as a price benchmark.
- **NICE (UK):** reports a new range of £25,000–35,000 per QALY from 2026. Partly verified.

### Governments that funded down a ranked list

- **Oregon Health Plan Prioritized List:** 660 ranked condition–treatment lines, with a funding line set by the legislature. This is the only US case of the "fund cheapest first" rule, so it is a candidate backtest. Reports say the ranking stops when the waiver ends on 31 Dec 2026. Partly verified.
- **Ethiopia and Pakistan essential packages:** these adapted DCP3 evidence to one country. Less than half of the interventions had evidence that applied there. Use their method to adapt published ratios to the US.

### Spending mix and outcomes (category-level model and backtest)

- **Bradley and Taylor (Yale).** Panels of OECD countries and US states found that more social spending per health dollar goes with better health outcomes. These are associations only.
- **IMF and EC efficiency-frontier studies.** They use data envelopment analysis (DEA) and stochastic frontier analysis (SFA). These are methods for the COFOG backtest.

### Policy evidence (bill sections)

- **WHO NCD "best buys"**, 2nd edition, 2024. Taxes, marketing rules, and salt, sugar and trans-fat limits. CC BY-NC-SA 3.0 IGO.
- **The Community Guide** (CPSTF). US systematic reviews, with economic evidence.
- **What Works for Health** (County Health Rankings). Evidence ratings, but no cost per DALY.
- **Millions Saved** (CGD, 2016). Programs that succeeded at scale.

### Enacted law (source laws for bills)

- **LawAtlas** (Temple University). Coded laws over time, with effective dates for effect studies. Free account.
- **ChangeLab Solutions.** Model ordinances. Some models have reuse restrictions.
- **CDC STATE System** (tobacco; Socrata API), **NIAAA APIS** (alcohol), and **NCSL** databases.
- **WCRF NOURISHING and MOVING.** Nutrition and physical-activity laws in force worldwide.

### Healthy-longevity organizations (possible endorsers)

- **Alliance for Longevity Initiatives (A4LI).** Asks Congress for a national healthy-life-expectancy goal and more aging-biology funding. This matches the Longevitron goal.
- **Lifespan Research Institute** (Lifespan.io, merged with SENS Research Foundation in 2024).
- **National Academy of Medicine Global Roadmap for Healthy Longevity** (2022). A shared framing, with no costed interventions.
- **Lancet Commission on Investing in Health, "Global Health 2050"** (2024).

### Benefit-cost rankings

- **Copenhagen Consensus, "Halftime for the SDGs"** (2023). 12 investments with benefit-cost ratios of 18 to 125.

### Lesson from wellbeing budgets

New Zealand's Wellbeing Budget (2019) and its CBAx impact-value database: a 2026 amendment removed the wellbeing rules from the Public Finance Act. Lesson: a budget framework needs a broad coalition, or it lasts only a few years. Partly verified.

### AI and agent attempts

Squiggle AI, A-HEMP, the AI Economist and the Rethink Priorities cross-cause model exist. None of them targets government budgets or HALE.

## Data to ingest next

| Need | Source | Access |
|---|---|---|
| US outlays by budget function | OMB Historical Table 3.2, `whitehouse.gov/wp-content/uploads/2026/04/hist03z2_fy2027.xlsx` | Free |
| US outlays by function, monthly | Treasury Fiscal Data, `api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_9` | Free API, no key, tested |
| COFOG panel, many countries | IMF SDMX `IMF.STA/GFS_COFOG` | Free with attribution, tested |
| COFOG panel, OECD | `sdmx.oecd.org/public/rest/data/OECD.SDD.NAD,DSD_NASEC10@DF_TABLE11,/all` | Free, tested |
| COFOG panel, EU | Eurostat `gov_10a_exp` | Free, tested |
| US government spending by function, all levels | BEA NIPA Table 3.16 | Free API key |
| Healthy years lost by cause | IHME GBD Results | Free registration, non-commercial only |
| Cost per DALY/QALY | GH CEA Registry, Horton 2017 tables, DCP3 annexes, ACE-Prevention, WSIPP | See above |

## Not verified

- hiptool.org status and licence
- FairChoices details
- GH CEA Registry current terms
- DCP3 licence
- WHO-CHOICE regional download
- Exact date of the NZ repeal
- Oregon 2026–27 funding line
- BEA treatment of Medicare and Medicaid
- Whether Policy Priority Inference has built-in optimization
- Atomica and Thanzi La Onse licences
- Copenhagen Consensus total-benefit figure
- APIS and NCSL access terms
- OECD dataset licence
