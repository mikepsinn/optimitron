# United States: program funding scenarios

These scenarios compare monetized benefits within specified program funding caps. They do not optimize the complete budget for median healthy life years and real after-tax median income growth.

Baseline: FY2025 estimate, $6.87T.

Objective: Maximize expected net present social benefit across the explicit reference-scale options, subject to the financing ceiling and protected baseline accounts.

Value basis: 2025 USD present values for one appropriation tranche. Mortality is valued with VSL; clinical health with value per DALY, less delivery costs; preschool uses participant earnings NPV. Monetized health is not income. Housing rent transfers are reported separately.

Simulation: 5,000 common draws; seed 20260926; allocation grid $1M.
Intervals below are the 5th–95th percentiles of the specified model. They combine evidence with explicit scenario assumptions; they are not clinical confidence intervals.

## Preferred allocation within the modeled choices

1% maximum military reallocation: reallocate $288M once from the military baseline, keeping total outlays unchanged.
Expected net present benefit: $304.02B (−$129.79B–$1.25T).
P(net benefit > 0 | model): 83.2%.

| Program | Additional appropriation |
|---|---:|
| Shift Drug Policy from Criminal to Health Approach | $88M |
| Right to Trial & FDA Upgrade Act | $200M |

## Full budget ledger

| Line | Baseline | Proposed | Change |
|---|---:|---:|---:|
| Social Security | $1.46T | $1.46T | $0 |
| Interest on Debt | $892B | $892B | $0 |
| Military | $886B | $885.71B | −$288M |
| Medicare | $874B | $874B | $0 |
| Medicaid | $616B | $616B | $0 |
| Veterans Affairs | $325B | $325B | $0 |
| Other Mandatory Programs | $842B | $842B | $0 |
| Transportation | $105B | $105B | $0 |
| Education | $102B | $102B | $0 |
| HUD / Housing | $73B | $73B | $0 |
| Foreign Aid / International Affairs | $63B | $63B | $0 |
| Energy | $52B | $52B | $0 |
| Science / NASA | $44B | $44B | $0 |
| Justice / Law Enforcement | $40B | $40B | $0 |
| Agriculture | $38B | $38B | $0 |
| EPA / Environment | $12B | $12B | $0 |
| Health (non-Medicare/Medicaid) | $94B | $94.29B | $288M |
| Homeland Security | $62B | $62B | $0 |
| Labor | $42B | $42B | $0 |
| Commerce / Economic Development | $18B | $18B | $0 |
| Interior / Natural Resources | $17B | $17B | $0 |
| Treasury / General Government | $30B | $30B | $0 |
| State Department / Diplomacy | $19B | $19B | $0 |
| Unreconciled baseline / other outlays | $165B | $165B | $0 |
| **Total** | **$6.87T** | **$6.87T** | **$0** |

## Funding-envelope sensitivity

| Maximum military reallocation | Actual reallocation | Net present benefit, mean (90% model interval) |
|---|---:|---:|
| 0% maximum military reallocation | $0 | $0 ($0–$0) |
| 1% maximum military reallocation | $288M | $304.02B (−$129.79B–$1.25T) |
| 5% maximum military reallocation | $288M | $304.02B (−$129.79B–$1.25T) |
| 10% maximum military reallocation | $288M | $304.02B (−$129.79B–$1.25T) |

## Other sensitivity checks

| Assumption | Reallocation | Net present benefit |
|---|---:|---:|
| High military opportunity cost ($10 per dollar) | $288M | $302.24B (−$131.99B–$1.25T) |
| No clinical discovery or access benefit | $88M | $1.41B ($81.55M–$3.18B) |
| Low military opportunity cost ($0.25 per dollar) | $3.13B | $310.04B (−$124.99B–$1.26T) |

## Policy reference cases

Reference cases are standalone comparisons. Clinical-trial access and funding overlap; their standalone benefits must not be added.

### Right to Trial & FDA Upgrade Act

Reference case: Ten years of trial-access infrastructure; conditional US health benefits followed for 20 years.
Reference appropriation: $200M. Funding cap: $200M.
Present benefit: $303.38B (−$130.41B–$1.25T).
Benefit net of downstream costs per public dollar: 1,516.88 (-652.06–6,262.14).
Net benefit after financing opportunity cost: $302.61B (−$131.53B–$1.25T).

20-year US follow-up: a discovery hazard derived from the canonical average wait, uncertain capacity translation, US burden share, adoption and delivery costs. Funding changes discovery for one year; funded access infrastructure for ten years. Baseline discovery resumes afterwards, while discoveries already made remain available. Both reforms modify one shared process. Original global benchmarks remain separate below.

| Native outcome | Mean (90% model interval) | Unit |
|---|---:|---|
| US healthy years gained over 20 years | 11,283,575.33 (413,494.5–34,082,462.2) | DALYs averted |
| Discounted US healthy years gained | 6,950,908.1 (252,661.65–21,268,224.94) | DALYs averted |
| Added treatment delivery cost (present value) | 392,324,597,756.46 (8,066,158,273.49–1,423,353,371,622.96) | 2025 USD present value |
| Global lifetime DALYs: canonical formula, app scenario priors | 421,516,612,081.88 (226,728,360,203.24–703,019,421,863.16) | global lifetime DALYs |

- This reproduces the canonical state-legislation scenario. It is an analogue for, not a direct estimate of, the broader federal Right to Trial & FDA Upgrade Act.
- The 5.48 discovery multiplier is an explicit assumption, not the observed effect of any enacted law; its range is conditional on a mature operating system and does not include the chance of adoption.
- The result covers global future generations. It is not annual US QALYs, current-population healthy life expectancy, or median healthy life years.
- Launch cost is not total social cost. Do not use it as the full denominator for comparison with treatment programs that include delivery costs.
- This and pragmatic-trial reform share discovery, infrastructure, participants and outcomes. Standalone lifetime totals must not be added.
- The funding cap is the evaluated reference-program scale, not an estimate of national absorption capacity. Unmodeled expansion is not implicitly assigned zero benefit.
- The clinical allocation case is conditional on implementing the funded program, not a measured effect or a probability of passing the proposed law. Funding affects discovery for its financed period; benefits are followed for 20 years.
- The shared-process maximum assumes full overlap between trial funding and access capacity during the first year. Complementarity is not estimated; this assumption can favor access over extra funding.
- Canonical clinical source amounts have no verified price year. This adapter treats their quoted dollar amounts as 2025 planning allowances, a scenario valuation assumption.

<details><summary>Inputs and sources</summary>

| Input | Low / mode / high | Basis | Source |
|---|---|---|---|
| Universal Right to Try with Evidence Implementation Cost (USD) | 25000000 / 65000000 / 200000000 | scenario; scenario-range. Total implementation cost of adopting Universal Right to Try with Evidence in all 50 states: a central $15 million campaign estimate covering legislation or amendment in all 50 states plus $50 million for the shared registry's first ten years. The model bill requires participating centers to fund continued registry operation after year ten. This launch-cost numerator excludes patient or payer spending on treatment delivery, trial-site services, and permitted study costs. The wide interval represents campaign and infrastructure cost uncertainty without separate scenario parameters. Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-state_rtt_implementation_cost_total) |
| Universal Right to Try with Evidence Treatment Discovery Multiplier (x) | 1.1 / 5.48 / 15 | scenario; scenario-range. Conditional multiplier on the worldwide first-treatment discovery rate after all 50 states adopt and a mature pooled pragmatic-trial system operates under applicable federal authorization. The 5.48x central calibration reproduces the prior model's 82.2 versus 15 first treatments per year; it is an assumption, not an observed effect estimate. This single input incorporates patient or payer funding of treatment delivery, trial-site services, and permitted study costs, newly viable post-Phase-1 treatment-condition pairs, evaluable protocol quality, candidate supply, and scientific success. Its range describes productivity of an operating system, not the separate probability that advocacy achieves full adoption and implementation. Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-state_rtt_treatment_discovery_multiplier) |
| Total Number of Rare Diseases Globally (diseases) | 6000 / 7000 / 10000 | scenario; scenario-range. Total number of rare diseases globally Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-rare_diseases_count_global) |
| Rare diseases without treatment (fraction) | 0.95 / 0.95 / 0.95 | scenario; fixed. Canonical queue-model calibration. The rare-disease queue is a proxy for the wider therapeutic frontier, not a measured schedule for curing all diseases. | [Source](https://manual.warondisease.org/knowledge/appendix/state-right-to-trial-impact) |
| Diseases Getting First Treatment Per Year (diseases/year) | 8 / 15 / 30 | scenario; scenario-range. Number of diseases that receive their FIRST effective treatment each year under current system. ~9 rare diseases/year (based on 40 years of ODA: 350 with treatment ÷ 40 years), plus ~5-10 common diseases. Note: FDA approves ~50 drugs/year, but most are for diseases that already have treatments. Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-new_disease_first_treatments_per_year) |
| Global Annual DALY Burden (DALYs/year) | 2880000000 / 2880000000 / 2880000000 | empirical; fixed. Canonical GBD annual burden. Holding it constant across future generations is a separate model assumption. | [Source](https://vizhub.healthdata.org/gbd-results/) |
| Eventually Avoidable DALY Percentage (percentage) | 0.5 / 0.926278079009 / 0.98 | scenario; scenario-range. Percentage of DALYs that are eventually avoidable with sufficient biomedical research. Uses same methodology as EVENTUALLY_AVOIDABLE_DEATH_PCT. Most non-fatal chronic conditions (arthritis, depression, chronic pain) are also addressable through research, so the percentage is similar to deaths. Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-eventually_avoidable_daly_pct) |
| Real discount rate (fraction/year) | 0.01 / 0.03 / 0.07 | scenario; scenario-range. Explicit time preference; discounts future clinical benefits and delivery costs once. | [Source](https://opg.warondisease.org) |
| Value of a healthy year (2025 USD/DALY) | 50000 / 100000 / 150000 | scenario; scenario-range. Decision valuation range, not a biological effect or a cash payment. DALYs are valued here using the OBG health-year convention. | [Source](https://obg.warondisease.org) |
| Forgone military benefit (present welfare USD/reallocated USD) | 0.25 / 1 / 10 | scenario; scenario-range. Uncalibrated financing opportunity-cost prior for one budget tranche. All model benefits and losses are present values. Catastrophic security tails are not quantified. | [Source](https://opg.warondisease.org) |
| US share of global disease burden (fraction) | 0.025 / 0.042375 / 0.07 | scenario; scenario-range. Population-share anchor 339M/8B with a wide analyst burden-share range; replace with a US GBD disease-age breakdown before deployment. | [Source](https://opg.warondisease.org) |
| Clinical benefit realized within 20 years (fraction) | 0 / 0.2 / 0.6 | scenario; scenario-range. Explicit adoption/delivery scenario. Includes a large attenuation from technical availability to population benefit; not an empirical interval. | [Source](https://opg.warondisease.org) |
| Capacity-to-discovery translation (fraction) | -0.03 / 0.1 / 0.3 | scenario; scenario-range. Only this share of the assumed capacity multiplier changes discovery hazard. Negative draws allow capacity expansion to reduce useful discovery. Analyst sensitivity, not a causal estimate. | [Source](https://opg.warondisease.org) |
| Added treatment delivery cost (2025 USD/DALY gained) | 0 / 20000 / 150000 | scenario; scenario-range. Subtract downstream patient/payer resource costs before ranking. This broad prior is not a clinical ICER; explicit delivery evidence is still needed. | [Source](https://opg.warondisease.org) |
| Existing pragmatic research funding (2025 USD) | 250000000 / 500000000 / 1000000000 | scenario; scenario-range. OBG paper approximate baseline, with an analyst factor-of-two range. Additional funding changes capacity relative to this baseline. | [Source](https://obg.warondisease.org) |
| Discovery-to-availability delay (years) | 1 / 3 / 6 | scenario; scenario-range. Explicit discovery/delivery timing assumption; not a measured FDA review duration. | [Source](https://opg.warondisease.org) |

</details>

### Shift Drug Policy from Criminal to Health Approach

Reference case: 10,000 additional person-years retained in methadone treatment; estimates the treatment component of the proposal.
Reference appropriation: $88M. Funding cap: $88M.
Present benefit: $1.75B ($470.51M–$3.48B).
Benefit net of downstream costs per public dollar: 19.84 (5.35–39.51).
Net benefit after financing opportunity cost: $1.41B ($81.55M–$3.18B).

10,000 additional person-years retained in methadone treatment; estimates the treatment component of the proposal. cost = added retained person-years × annual treatment cost × CPI2024/CPI2016; deaths averted = added retained person-years × mortality difference/1,000 × transport share 2024 USD; NIDA preliminary 2016 treatment cost converted using CPI-U. Includes medication and support services; excludes separate law-reform costs.

| Native outcome | Mean (90% model interval) | Unit |
|---|---:|---|
| Deaths averted in one treatment year | 126.07 (36.97–232.58) | deaths |

- Decriminalization, treatment expansion and harm reduction are different interventions. This estimate does not attribute the treatment effect to changing the criminal law.
- Mortality varies during induction and after cessation. Do not apply a full treatment-year benefit to a short enrollment, or add overdose deaths separately to all-cause mortality.
- Deaths averted are not QALYs. An age-specific survival and quality-of-life model is needed before estimating healthy years; enforcement savings and wage effects are not estimated.
- The funding cap is the evaluated reference-program scale, not an estimate of national absorption capacity. Unmodeled expansion is not implicitly assigned zero benefit.

<details><summary>Inputs and sources</summary>

| Input | Low / mode / high | Basis | Source |
|---|---|---|---|
| Additional retained treatment-years (person-years) | 10000 / 10000 / 10000 | scenario; fixed. A service-delivery target, not a claim that decriminalization causes this enrollment. Count time retained, not people who briefly enroll. | [Source](https://opg.warondisease.org) |
| Annual methadone program cost (2016 USD/person-year) | 6552 / 6552 / 6552 | empirical; fixed. NIDA quotes a preliminary Department of Defense estimate of $126/week including medication, psychosocial and medical support. Local procurement and present capacity can differ. | [Source](https://nida.nih.gov/sites/default/files/21349-medications-to-treat-opioid-use-disorder_0.pdf) |
| 2024 annual CPI-U (index) | 313.689 / 313.689 / 313.689 | empirical; fixed. Annual all-items US city average CPI-U. | [Source](https://www.bls.gov/cpi/tables/supplemental-files/historical-cpi-u-202412.pdf) |
| 2016 annual CPI-U (index) | 240.007 / 240.007 / 240.007 | empirical; fixed. Deflates the preliminary treatment-cost estimate. | [Source](https://www.bls.gov/cpi/tables/supplemental-files/historical-cpi-u-202412.pdf) |
| Mortality difference during treatment (deaths/1,000 person-years) | 14 / 25 / 36 | empirical; published-interval. Sordo et al. BMJ 2017 meta-analysis reports an average difference of 25 deaths/1,000 person-years (95% CI 14–36). Cohort evidence, not randomized assignment or the causal effect of a decriminalization law. | [Source](https://www.bmj.com/content/357/bmj.j1550) |
| Mortality effect retained in the target setting (fraction) | 0 / 0.5 / 1 | scenario; scenario-range. Explicit zero/half/full transport sensitivity, not a published interval. Allows for selection bias, a different opioid supply, baseline care and implementation. | [Source](https://opg.warondisease.org) |
| Value of a statistical life (2025 USD/death averted) | 6300000 / 14200000 / 20700000 | scenario; scenario-range. DOT central 2025 valuation (https://www.transportation.gov/office-policy/transportation-policy/revised-departmental-guidance-on-valuation-of-a-statistical-life-in-economic-analysis); HHS low/high valuation sensitivity. Valuation uncertainty is distinct from mortality-effect uncertainty. | [Source](https://aspe.hhs.gov/sites/default/files/documents/639756a60fbe7e51786bcec176ad52f1/Standard-RIA-Values-2025.pdf) |
| Forgone military benefit (present welfare USD/reallocated USD) | 0.25 / 1 / 10 | scenario; scenario-range. Uncalibrated financing opportunity-cost prior for one budget tranche. All model benefits and losses are present values. Catastrophic security tails are not quantified. | [Source](https://opg.warondisease.org) |
| 2024-to-2025 price conversion (ratio) | 1.0263126854942315 / 1.0263126854942315 / 1.0263126854942315 | scenario; fixed. CPI-U 321.943/313.689; applied symmetrically to 2024 program costs and earnings/rent benefits. | [Source](https://www.govinfo.gov/content/pkg/ECONI-2026-03/pdf/ECONI-2026-03.pdf) |

</details>

### Pragmatic Clinical Trial Funding Reform

Reference case: One year of extra pragmatic-trial funding; US health benefits followed for 20 years.
Reference appropriation: $20M. Funding cap: $20M.
Present benefit: $273.41M (−$121.97M–$1.08B).
Benefit net of downstream costs per public dollar: 13.67 (-6.1–54.09).
Net benefit after financing opportunity cost: $197.11M (−$214.68M–$1B).

20-year US follow-up: a discovery hazard derived from the canonical average wait, uncertain capacity translation, US burden share, adoption and delivery costs. Funding changes discovery for one year; funded access infrastructure for ten years. Baseline discovery resumes afterwards, while discoveries already made remain available. Both reforms modify one shared process. Original global benchmarks remain separate below.

| Native outcome | Mean (90% model interval) | Unit |
|---|---:|---|
| US healthy years gained over 20 years | 9,731.67 (574.22–27,821.49) | DALYs averted |
| Discounted US healthy years gained | 6,408.97 (348.52–18,577.05) | DALYs averted |
| Added treatment delivery cost (present value) | 365,185,839.97 (11,164,123.63–1,256,286,547.09) | 2025 USD present value |
| Conditional RECOVERY-scale global QALYs (separate benchmark) | 3,521,689.88 (885,124.57–7,236,857.49) | global QALYs |

- RECOVERY is a successful pandemic platform, not an unbiased draw from all possible trials. The canonical $4/QALY is retrospective discovery value including downstream adoption, not a demonstrated prospective portfolio yield.
- The million-lives figure is a modeled global adoption estimate, and QALYs per death is a model assumption. Their inherited ranges are not published confidence intervals.
- No finite common cohort horizon or US-only benefit is supplied. A prospective portfolio model needs trial success, attributable acceleration, adoption and delivery costs before comparison with domestic annual programs.
- Pragmatic-trial and Right-to-Trial benefits overlap. Evaluate one shared discovery counterfactual; do not sum these standalone outputs.
- The funding cap is the evaluated reference-program scale, not an estimate of national absorption capacity. Unmodeled expansion is not implicitly assigned zero benefit.
- The clinical allocation case is conditional on implementing the funded program, not a measured effect or a probability of passing the proposed law. Funding affects discovery for its financed period; benefits are followed for 20 years.
- The shared-process maximum assumes full overlap between trial funding and access capacity during the first year. Complementarity is not estimated; this assumption can favor access over extra funding.
- Canonical clinical source amounts have no verified price year. This adapter treats their quoted dollar amounts as 2025 planning allowances, a scenario valuation assumption.

<details><summary>Inputs and sources</summary>

| Input | Low / mode / high | Basis | Source |
|---|---|---|---|
| RECOVERY Trial Total Cost (USD) | 15000000 / 20000000 / 25000000 | scenario; scenario-range. Total cost of UK RECOVERY trial. Enrolled tens of thousands of patients across multiple treatment arms. Discovered dexamethasone reduces COVID mortality by ~1/3 in severe cases. Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-recovery_trial_total_cost) |
| RECOVERY Trial Global Lives Saved (lives) | 500000 / 1000000 / 2000000 | scenario; scenario-range. Estimated lives saved globally by RECOVERY trial's dexamethasone discovery. NHS England estimate (March 2021). Based on Águas et al. Nature Communications 2021 methodology applying RECOVERY trial mortality reductions (36% ventilated, 18% oxygen) to global COVID hospitalizations. Wide uncertainty range reflects extrapolation assumptions. Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-recovery_trial_global_lives_saved) |
| QALYs per COVID Death Averted (QALYs/death) | 3 / 5 / 10 | scenario; scenario-range. Average QALYs gained per COVID death averted. Conservative estimate reflecting older age distribution of COVID mortality. See confidence_interval for range. Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-qalys_per_covid_death_averted) |
| Pragmatic Trial Cost per Patient (USD/patient) | 97 / 929 / 3000 | scenario; scenario-range. Embedded pragmatic trial cost per patient. Uses ADAPTABLE trial ($929) as DELIBERATELY CONSERVATIVE central estimate. Ramsberg & Platt (2018) reviewed 108 embedded pragmatic trials; 64 with cost data had median of only $97/patient - this estimate may overstate costs by 10x. Confidence interval spans meta-analysis median to complex chronic disease trials. Bounds are inherited model ranges, not asserted to be a published sampling interval. | [Source](https://manual.WarOnDisease.org/calculations.html#sec-dfda_pragmatic_trial_cost_per_patient) |
| Share of RECOVERY-like downstream benefit (fraction) | 0 / 0.5 / 1 | scenario; scenario-range. Explicit sensitivity scenario, not an empirical expected yield for an unselected research portfolio. Zero allows no adopted effective discovery; one reproduces the historical benchmark model. This aggregate factor includes candidate success, attributable discovery and downstream adoption. | [Source](https://opg.warondisease.org) |
| Real discount rate (fraction/year) | 0.01 / 0.03 / 0.07 | scenario; scenario-range. Explicit time preference; discounts future clinical benefits and delivery costs once. | [Source](https://opg.warondisease.org) |
| Value of a healthy year (2025 USD/DALY) | 50000 / 100000 / 150000 | scenario; scenario-range. Decision valuation range, not a biological effect or a cash payment. DALYs are valued here using the OBG health-year convention. | [Source](https://obg.warondisease.org) |
| Forgone military benefit (present welfare USD/reallocated USD) | 0.25 / 1 / 10 | scenario; scenario-range. Uncalibrated financing opportunity-cost prior for one budget tranche. All model benefits and losses are present values. Catastrophic security tails are not quantified. | [Source](https://opg.warondisease.org) |
| US share of global disease burden (fraction) | 0.025 / 0.042375 / 0.07 | scenario; scenario-range. Population-share anchor 339M/8B with a wide analyst burden-share range; replace with a US GBD disease-age breakdown before deployment. | [Source](https://opg.warondisease.org) |
| Clinical benefit realized within 20 years (fraction) | 0 / 0.2 / 0.6 | scenario; scenario-range. Explicit adoption/delivery scenario. Includes a large attenuation from technical availability to population benefit; not an empirical interval. | [Source](https://opg.warondisease.org) |
| Capacity-to-discovery translation (fraction) | -0.03 / 0.1 / 0.3 | scenario; scenario-range. Only this share of the assumed capacity multiplier changes discovery hazard. Negative draws allow capacity expansion to reduce useful discovery. Analyst sensitivity, not a causal estimate. | [Source](https://opg.warondisease.org) |
| Added treatment delivery cost (2025 USD/DALY gained) | 0 / 20000 / 150000 | scenario; scenario-range. Subtract downstream patient/payer resource costs before ranking. This broad prior is not a clinical ICER; explicit delivery evidence is still needed. | [Source](https://opg.warondisease.org) |
| Existing pragmatic research funding (2025 USD) | 250000000 / 500000000 / 1000000000 | scenario; scenario-range. OBG paper approximate baseline, with an analyst factor-of-two range. Additional funding changes capacity relative to this baseline. | [Source](https://obg.warondisease.org) |
| Discovery-to-availability delay (years) | 1 / 3 / 6 | scenario; scenario-range. Explicit discovery/delivery timing assumption; not a measured FDA review duration. | [Source](https://opg.warondisease.org) |

</details>

### Universal Pre-K (Ages 3-4)

Reference case: One annual cohort of 100,000 additional children receiving a Perry-like two-year program.
Reference appropriation: $2.84B. Funding cap: $2.84B.
Present benefit: $5.7B ($1.85B–$9.47B).
Benefit net of downstream costs per public dollar: 2.01 (0.65–3.34).
Net benefit after financing opportunity cost: −$5.13B (−$17.53B–$4.46B).

One annual cohort of 100,000 additional children receiving a Perry-like two-year program. cost = additional children × Perry total cost × CPI2024/CPI2006; earnings NPV = additional children × Perry lifetime earnings NPV × CPI2024/CPI2006 × transport share 2024 USD; both cost and earnings converted from 2006 USD using CPI-U. Cost covers the whole preschool program for one entering cohort.

| Native outcome | Mean (90% model interval) | Unit |
|---|---:|---|
| Participant lifetime earnings (present value) | 5,697,487,373.44 (1,846,722,406.92–9,466,151,185.18) | 2025 USD present value |

- Perry studied disadvantaged children in one 1960s setting. Scaling to universal pre-K requires separate estimates for children with existing childcare and different baseline resources.
- The earnings amount is already a present value: do not discount it again or multiply it by the 62-year horizon. No additional crime, fiscal or health benefit is added.
- The 0/0.5/1 transport range is an explicit analyst scenario. It is not a published confidence interval, and the model does not estimate national median income or health.
- The funding cap is the evaluated reference-program scale, not an estimate of national absorption capacity. Unmodeled expansion is not implicitly assigned zero benefit.

<details><summary>Inputs and sources</summary>

| Input | Low / mode / high | Basis | Source |
|---|---|---|---|
| Additional children (children) | 100000 / 100000 / 100000 | scenario; fixed. Reference enrollment choice, not the US eligible population. Existing preschool enrollees are not counted as additional beneficiaries. | [Source](https://opg.warondisease.org) |
| Perry program cost per child (2006 USD/child) | 17759 / 17759 / 17759 | empirical; fixed. Published total program cost, not an annual cost. The intensive program included home visits; universal provision may differ. | [Source](https://www.nber.org/papers/w15471) |
| Participant lifetime earnings gain (2006 USD/child) | 70535 / 70535 / 70535 | empirical; fixed. Hendren and Sprung-Keyser extrapolate Perry earnings to age 65. This is a modeled lifetime earnings NPV, not a national median or an annual benefit. No sampling interval is supplied here. | [Source](https://opportunityinsights.org/wp-content/uploads/2019/07/Welfare-Appendix.pdf) |
| 2024 annual CPI-U (index) | 313.689 / 313.689 / 313.689 | empirical; fixed. Annual all-items US city average CPI-U. | [Source](https://www.bls.gov/cpi/tables/supplemental-files/historical-cpi-u-202412.pdf) |
| 2006 annual CPI-U (index) | 201.6 / 201.6 / 201.6 | empirical; fixed. Common deflator for program costs and benefits. | [Source](https://www.bls.gov/cpi/tables/supplemental-files/historical-cpi-u-202412.pdf) |
| Share of Perry earnings effect achieved (fraction) | 0 / 0.5 / 1 | scenario; scenario-range. Explicit sensitivity prior: zero to full Perry effect, midpoint one-half. Not estimated from a meta-analysis or elicited from experts. Captures implementation quality and the counterfactual preschool option. | [Source](https://opg.warondisease.org) |
| Forgone military benefit (present welfare USD/reallocated USD) | 0.25 / 1 / 10 | scenario; scenario-range. Uncalibrated financing opportunity-cost prior for one budget tranche. All model benefits and losses are present values. Catastrophic security tails are not quantified. | [Source](https://opg.warondisease.org) |
| 2024-to-2025 price conversion (ratio) | 1.0263126854942315 / 1.0263126854942315 / 1.0263126854942315 | scenario; fixed. CPI-U 321.943/313.689; applied symmetrically to 2024 program costs and earnings/rent benefits. | [Source](https://www.govinfo.gov/content/pkg/ECONI-2026-03/pdf/ECONI-2026-03.pdf) |

</details>

### Housing Supply Deregulation

Reference case: One local reform affecting a reference group of 100,000 renter households over ten years.
Reference appropriation: $103M. Funding cap: $103M.
Present gross renter benefit: $796.44M ($236.52M–$1.43B).
Net social benefit is not estimated; gross transfers are excluded from the allocation objective.

One local reform affecting a reference group of 100,000 renter households over ten years. annual renter savings = households × baseline annual rent × 23% × transport share × ramp; ramp is zero through year 2, linear to full effect at year 8; NPV sums years 1–10 at 3% 2024 USD reference implementation budget, an explicit scenario rather than a sourced estimate of the cost of zoning reform. Private construction is not included.

| Native outcome | Mean (90% model interval) | Unit |
|---|---:|---|
| Renter savings over 10 years (present value) | 796,444,168.34 (236,519,371.28–1,427,101,436.4) | 2025 USD present value |

- The study concerns a large citywide reform and new-tenancy rents. Smaller spot upzonings and existing leases need not have the same effect.
- The two-year delay and linear ramp are scenario assumptions; the eight-year endpoint comes from the study. Adoption may fail and construction may remain constrained.
- Renter savings are a distributional household benefit, partly offset by landlord income changes. They are not net economic surplus, wage income, national median income or public-budget savings.
- Excluded from aggregate social-benefit allocation: a landlord/tenant incidence model and net resource-cost estimate are required. A renter-benefit objective may evaluate this scenario separately.
- The old national GDP claim is not used to calibrate this local effect. Greaney's published correction identifies substantial model and code problems: https://www.aeaweb.org/articles?id=10.1257/mac.20230141
- The funding cap is the evaluated reference-program scale, not an estimate of national absorption capacity. Unmodeled expansion is not implicitly assigned zero benefit.
- Gross renter savings are retained but excluded from the net-social-benefit allocation objective because landlord losses and construction costs are not yet estimated.

<details><summary>Inputs and sources</summary>

| Input | Low / mode / high | Basis | Source |
|---|---|---|---|
| Affected renter households (households) | 100000 / 100000 / 100000 | scenario; fixed. Reference local population; replace with jurisdiction-specific renter households. Do not apply a local effect to every US resident. | [Source](https://opg.warondisease.org) |
| Local implementation budget (2024 USD) | 50000000 / 100000000 / 200000000 | scenario; scenario-range. Explicit planning sensitivity, not observed Auckland expenditure or an empirical cost interval. Does not claim to fund private construction. | [Source](https://opg.warondisease.org) |
| Baseline annual household rent (2024 USD/household/year) | 18000 / 18000 / 18000 | scenario; fixed. Illustrative $1,500/month local baseline, not a national rental statistic; replace with target-jurisdiction data. | [Source](https://opg.warondisease.org) |
| Auckland rent effect after eight years (fraction) | 0.23 / 0.23 / 0.23 | empirical; fixed. Greenaway-McGrevy and So (2026), preferred synthetic control: quality-adjusted rents for new tenancies 23% below no-reform counterfactual in 2024, eight years after the 2016 reform. Point estimate, not a confidence interval. | [Source](https://doi.org/10.1111/ecin.70075) |
| Share of Auckland effect achieved (fraction) | 0 / 0.5 / 1 | scenario; scenario-range. Explicit zero/half/full scenario for comparability, land constraints, construction capacity and adoption; not published transport uncertainty. | [Source](https://opg.warondisease.org) |
| Real annual discount rate (fraction/year) | 0.03 / 0.03 / 0.03 | scenario; fixed. Decision-model discount-rate assumption, not a measured outcome. | [Source](https://opg.warondisease.org) |
| 2024-to-2025 price conversion (ratio) | 1.0263126854942315 / 1.0263126854942315 / 1.0263126854942315 | scenario; fixed. CPI-U 321.943/313.689; applied symmetrically to 2024 program costs and earnings/rent benefits. | [Source](https://www.govinfo.gov/content/pkg/ECONI-2026-03/pdf/ECONI-2026-03.pdf) |

</details>

## Shared assumptions

- **Real discount rate:** 0.01 / 0.03 / 0.07 fraction/year. Explicit time preference; discounts future clinical benefits and delivery costs once. [Source](https://opg.warondisease.org).
- **Value of a healthy year:** 50000 / 100000 / 150000 2025 USD/DALY. Decision valuation range, not a biological effect or a cash payment. DALYs are valued here using the OBG health-year convention. [Source](https://obg.warondisease.org).
- **Value of a statistical life:** 6300000 / 14200000 / 20700000 2025 USD/death averted. DOT central 2025 valuation (https://www.transportation.gov/office-policy/transportation-policy/revised-departmental-guidance-on-valuation-of-a-statistical-life-in-economic-analysis); HHS low/high valuation sensitivity. Valuation uncertainty is distinct from mortality-effect uncertainty. [Source](https://aspe.hhs.gov/sites/default/files/documents/639756a60fbe7e51786bcec176ad52f1/Standard-RIA-Values-2025.pdf).
- **Forgone military benefit:** 0.25 / 1 / 10 present welfare USD/reallocated USD. Uncalibrated financing opportunity-cost prior for one budget tranche. All model benefits and losses are present values. Catastrophic security tails are not quantified. [Source](https://opg.warondisease.org).
- **US share of global disease burden:** 0.025 / 0.042375 / 0.07 fraction. Population-share anchor 339M/8B with a wide analyst burden-share range; replace with a US GBD disease-age breakdown before deployment. [Source](https://opg.warondisease.org).
- **Clinical benefit realized within 20 years:** 0 / 0.2 / 0.6 fraction. Explicit adoption/delivery scenario. Includes a large attenuation from technical availability to population benefit; not an empirical interval. [Source](https://opg.warondisease.org).
- **Capacity-to-discovery translation:** -0.03 / 0.1 / 0.3 fraction. Only this share of the assumed capacity multiplier changes discovery hazard. Negative draws allow capacity expansion to reduce useful discovery. Analyst sensitivity, not a causal estimate. [Source](https://opg.warondisease.org).
- **Added treatment delivery cost:** 0 / 20000 / 150000 2025 USD/DALY gained. Subtract downstream patient/payer resource costs before ranking. This broad prior is not a clinical ICER; explicit delivery evidence is still needed. [Source](https://opg.warondisease.org).
- **Existing pragmatic research funding:** 250000000 / 500000000 / 1000000000 2025 USD. OBG paper approximate baseline, with an analyst factor-of-two range. Additional funding changes capacity relative to this baseline. [Source](https://obg.warondisease.org).
- **Discovery-to-availability delay:** 1 / 3 / 6 years. Explicit discovery/delivery timing assumption; not a measured FDA review duration. [Source](https://opg.warondisease.org).
- **2024-to-2025 price conversion:** 1.0263126854942315 / 1.0263126854942315 / 1.0263126854942315 ratio. CPI-U 321.943/313.689; applied symmetrically to 2024 program costs and earnings/rent benefits. [Source](https://www.govinfo.gov/content/pkg/ECONI-2026-03/pdf/ECONI-2026-03.pdf).

## Scope and interpretation

- The $165B residual balances the displayed estimates; it does not identify a spendable account or prove that the category crosswalk is complete.
- Veterans Affairs includes mandatory and discretionary activities. International Affairs may overlap State; agriculture and cross-agency defense activities also need an account crosswalk.
- Existing lines remain fixed except for an explicit military reduction and the cost of selected incremental programs. No peer spending gap funds this model.
- A modeled one-year appropriation is treated as a same-year outlay equivalent. Actual obligation and outlay timing, contracts, and legislative authority require implementation planning.
- This is a constrained reference-program decision, not a demonstrated globally optimal US budget. Most baseline programs are held fixed because their marginal causal effects and statutory constraints are not calibrated.
- The grid optimum is exact within the supplied menu and Monte Carlo expected values. Monte Carlo propagates specified uncertainty; it does not establish causality or account for omitted risks.
- Clinical discovery assumptions dominate some results. The zero-clinical-benefit sensitivity shows the recommendation when those effects do not materialize.
- Ranges marked scenario are analyst or canonical-model priors, not expert-elicited probabilities or empirical confidence intervals. The reported probability of benefit is conditional on this model.
- Distinct input parameters are sampled independently. Shared inputs reuse the same draw across alternatives; other correlations are not estimated.
- No sum is labeled median after-tax income or median healthy life expectancy. Those require incidence, taxes, survival and distributional data not present here.
- Policy benefit horizons differ and remain explicit: existing lifetime earnings NPV, one treatment year, twenty-year clinical flows, and ten-year renter savings. Annual spending does not imply annual realization of lifetime benefits.
- National peer-spending differences are descriptive context. They do not enter this optimization as free savings or causal response curves.

Generated 2026-09-27T03:44:00.859Z.
