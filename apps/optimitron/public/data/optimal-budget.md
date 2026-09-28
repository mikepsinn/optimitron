# Optimal Budget Generator

Reference population: 1,000,000. Healthcare: 178 countries worldwide. Other public spending: 30 European countries.
Annual public spending: 2017, 2018, 2019 average, in 2021 international dollars (GDP purchasing power parity). Includes national and local government.

## Method

Healthcare: find the observed cost/health Pareto frontier. Select the minimum TOTAL current healthcare cost among countries within the chosen number of healthy years of the best observed HALE, with reported public financing. The default gap is one year, an explicit preference rather than a fitted optimum. The public budget line uses the selected country’s COFOG government health expenditure, including health research and investment. The separate care-cost comparison shows WHO domestic public, domestic private and external current costs; these amounts are not added to the budget.
For every other category, select the lowest public-cost observed country meeting every listed outcome target. Multiply annual public cost per resident by population. Changing country changes population, not the ideal system or inherited spending constraints.
Healthcare uses WHO healthy life expectancy; education uses PISA mathematics proficiency. The remaining eight categories use national healthy life expectancy and median disposable income as a general success screen, not sector-specific evidence of effectiveness.
Non-health targets are unweighted country quantiles. The default is the highest of the 80th, 90th and 95th percentiles with at least three countries meeting both national outcomes. Healthcare uses an absolute healthy-year gap, so adding countries with poor outcomes cannot weaken its target. Missing financing never lowers that target.
Assumptions: selected systems can be transferred and combined; annual costs scale linearly with population. These assumptions do not establish the combined country’s future health or income.
WHO HALE is average expected healthy years, not median individual healthspan. Income is 2019 Eurostat equivalised disposable income in PPS (survey-year label; income usually refers to the prior year). It is neither GDP nor household income divided by household size.
All ten budget categories use COFOG government accounts and retain the selected country’s reported service breakdown where available. Children are components of the parent, never additional allocations. R&D and pensions are already included; research investment scenarios are not added again. Government, research and debt includes basic research, foreign aid, administration and debt transactions. This benchmark has no current-budget constraint or inherited military spending floor.
SHA current health and COFOG health have different accounting boundaries, not merely different capital coverage. No capital amount is inferred by subtracting the two series. The COFOG ledger prevents adding SHA healthcare on top of overlapping COFOG social care.
Costs = Eurostat spending in million euros / same-year GDP in million euros × World Bank GDP per capita in constant 2021 international dollars, averaged across 2017–2019. This uses GDP purchasing power parity for all categories, not sector-specific PPPs.
Alternative ranges use up to three cheapest qualifying countries per category, not sampling confidence intervals. The public-health cost range can include lower amounts from systems with larger private bills. Missing observations never become zero spending.
Each annual current-health share of GDP is multiplied by GDP per capita in constant 2021 international dollars; financing-source shares split that annual total before averaging 2017–2019. This uses economy-wide GDP PPP and inflation, not a health-specific price index.
HALE limits are arithmetic means of WHO annual lower and upper limits, not a new confidence interval for the three-year mean or for policy effects.
Latest available World Bank midyear population estimate through the last completed calendar year. Country/economy metadata excludes regional and income aggregates; population estimates may use demographic models.
For each year, general-government COFOG GF07 total expenditure in national currency / World Bank GDP in current national currency × World Bank GDP per capita in constant 2021 international dollars. Average annual amounts across 2017–2019. OECD currency observations use their UNIT_MULT; IMF CSV observations are already in actual units.

## Global healthcare frontier

The care columns show WHO recurring costs. The final column is the whole public COFOG budget at the default non-health outcome target.

| Maximum healthy-year gap | Reference | HALE | Public care / resident | Private care / resident | Total care / resident | Whole public budget / resident |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Japan | 73.48 | $4,164 | $794 | $4,959 | $20,876 |
| 0 | Singapore | 73.52 | $2,566 | $2,553 | $5,119 | $20,010 |
| 0.5 | Japan | 73.48 | $4,164 | $794 | $4,959 | $20,876 |
| 1.5 | South Korea | 72.22 | $1,993 | $1,524 | $3,517 | $19,644 |
| 2 | South Korea | 72.22 | $1,993 | $1,524 | $3,517 | $19,644 |

The frontier removes countries for which another observed country is no more expensive and no worse in health, with at least one strict improvement. This is an observed comparison, not a causal estimate of healthcare policy effects. National HALE also reflects conditions outside healthcare.

Year sensitivity at gap 1: 2017: Japan (178 countries); 2018: Singapore (178 countries); 2019: Japan (178 countries).

Year sensitivity at gap 0: 2017: Japan (178 countries); 2018: Singapore (178 countries); 2019: Singapore (178 countries).

Year sensitivity at gap 0.5: 2017: Japan (178 countries); 2018: Singapore (178 countries); 2019: Japan (178 countries).

Year sensitivity at gap 1.5: 2017: South Korea (178 countries); 2018: South Korea (178 countries); 2019: South Korea (178 countries).

Year sensitivity at gap 2: 2017: South Korea (178 countries); 2018: Israel (178 countries); 2019: South Korea (178 countries).

### Japan policies

- [Universal insurance with a shared price schedule](https://www.mhlw.go.jp/file/05-Shingikai-12601000-Seisakutoukatsukan-Sanjikanshitsu_Shakaihoshoutantou/0000083552.pdf): Public insurance covers the population. A national fee schedule sets reimbursement prices across insurance plans and providers. Universal insurance dates to 1961; this ministry-hosted account predates the 2017–2019 comparison.
- [Income-based limits on large medical bills](https://www.mhlw.go.jp/wp/hakusyo/kousei/19-2/dl/02_en.pdf): High-cost medical benefits cap household copayments according to income and age, with extra protection for repeated expensive treatment. Described in the 2019 ministry report; its insurance-system table is dated April 2020. No current thresholds are assumed.
- [Payments that encourage generic medicines](https://www.oecd.org/en/publications/oecd-economic-surveys-japan-2019_fd63f374-en/full-report/component-6.html): The 2018 fee revision rewarded prescriptions using generic names and discouraged pharmacies with very low generic substitution. The 2018 revision occurred during the comparison period; its separate effect on national outcomes is not estimated.

### South Korea policies

- [One national insurance pool](https://www.nhis.or.kr/english/wbheaa01300m01.do): National Health Insurance combines employment and regional insurance in one insurer, pooling contributions and purchasing covered care nationally. Insurers merged in 2000; employment and regional finances were integrated in 2003.
- [National claims review and quality assessment](https://www.hira.or.kr/eng/news/01/__icsFiles/afieldfile/2012/04/29/2011_HIRA_Brochure.pdf): HIRA reviews medical claims, assesses care quality and checks medication use through a national review system. Documented in HIRA’s 2011 institutional report, before the comparison period.
- [Bundled payments for selected procedures](https://www.nhis.or.kr/english/wbheaa01300m01.do): Diagnosis-related payments cover seven disease groups, replacing separate charges for each service within those covered admissions. NHIS records compulsory DRG payments for seven groups from 2012; this is not a claim that all care uses bundled payment.

### Singapore policies

- [Subsidised care plus lifelong insurance](https://www.moh.gov.sg/newsroom/medishield-life-coverage/): Public institutions provide subsidised care. MediShield Life pools the risk of large hospital bills and selected costly outpatient treatment. MediShield Life began in 2015; this January 2019 ministry statement describes the comparison-period system.
- [Medical savings for remaining bills](https://www.moh.gov.sg/newsroom/medishield-life-coverage/): MediSave balances can pay eligible costs left after subsidies and insurance. These savings are still part of the resources healthcare consumes. Described in the January 2019 ministry statement; savings are not treated as free healthcare in the cost comparison.
- [A fund for patients who cannot afford care](https://www.moh.gov.sg/newsroom/medishield-life-coverage/): MediFund and institutional financial assistance help patients who still face financial difficulty after subsidies, insurance and medical savings. Described in the January 2019 ministry statement.

### Japan healthcare services

Percent of all current healthcare spending, public and private. These are the observed system’s shares, not separately optimized allocations.

| Service | Share |
| --- | ---: |
| Treatment | 55.429% |
| Rehabilitation | 1.093% |
| Long-term care (health) | 18.505% |
| Laboratory tests, imaging and other ancillary services | 0.585% |
| Medicines and medical goods outside care packages | 19.704% |
| Prevention | 2.938% |
| Health system administration | 1.746% |
| Other healthcare services (unspecified) | Unreported |
| Unallocated | 0.000% |
| Source rounding | 0.000% |

### Singapore healthcare services

Percent of all current healthcare spending, public and private. These are the observed system’s shares, not separately optimized allocations.

| Service | Share |
| --- | ---: |
| Treatment | Unreported |
| Rehabilitation | Unreported |
| Long-term care (health) | Unreported |
| Laboratory tests, imaging and other ancillary services | Unreported |
| Medicines and medical goods outside care packages | Unreported |
| Prevention | Unreported |
| Health system administration | Unreported |
| Other healthcare services (unspecified) | Unreported |
| Unallocated | Unreported% |
| Source rounding | Unreported% |

### Korea healthcare services

Percent of all current healthcare spending, public and private. These are the observed system’s shares, not separately optimized allocations.

| Service | Share |
| --- | ---: |
| Treatment | 57.254% |
| Rehabilitation | 1.183% |
| Long-term care (health) | 12.430% |
| Laboratory tests, imaging and other ancillary services | 1.326% |
| Medicines and medical goods outside care packages | 21.318% |
| Prevention | 3.626% |
| Health system administration | 2.861% |
| Other healthcare services (unspecified) | Unreported |
| Unallocated | 0.001% |
| Source rounding | 0.000% |

## Top 20% non-health targets; healthcare within 1 healthy years (default)

Annual public budget: **$20,875,963,013**; **$20,876 per resident**.

| Category | Per resident | Annual public budget | Reference | Eligible countries |
| --- | ---: | ---: | --- | ---: |
| Government, research and debt | $3,660 | $3,659,646,199 | Switzerland | 3 |
| Weapons and Military | $76 | $76,198,658 | Iceland | 3 |
| Police, courts and fire services | $918 | $917,610,653 | Iceland | 3 |
| Transport, energy and industry | $3,064 | $3,064,045,570 | Switzerland | 3 |
| Waste, pollution and nature | $418 | $417,872,654 | Iceland | 3 |
| Housing and community services | $152 | $152,056,526 | Switzerland | 3 |
| Healthcare | $3,413 | $3,412,897,610 | Japan | 2 |
| Culture, recreation and religion | $827 | $827,212,001 | Switzerland | 3 |
| Education | $1,791 | $1,791,433,399 | Poland | 6 |
| Pensions and social support | $6,557 | $6,556,989,745 | Iceland | 3 |

### Reference outcomes and alternatives

**Government, research and debt**

- Healthy life expectancy: target 71.16; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 22435.40; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($3,660 public per resident); Iceland ($5,425 public per resident); Luxembourg ($6,760 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Executive and legislative organs, financial and fiscal affairs, external affairs | $701 |
| Foreign economic aid | $309 |
| General services | $903 |
| Basic research | $1,428 |
| R&D General public services | $1 |
| General public services n.e.c. | $0 |
| Public debt transactions | $318 |
| Transfers of a general character between different levels of government | $0 |

**Weapons and Military**

- Healthy life expectancy: target 71.16; selected reference 71.33 years (WHO HALE, population average).
- Median disposable income: target 22435.40; selected reference 23621.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Iceland ($76 public per resident); Luxembourg ($498 public per resident); Switzerland ($635 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Military defence | $0 |
| Civil defence | $72 |
| Foreign military aid | $4 |
| R&D Defence | $0 |
| Defence n.e.c. | $0 |
| Unallocated / source rounding | $-0 |

**Police, courts and fire services**

- Healthy life expectancy: target 71.16; selected reference 71.33 years (WHO HALE, population average).
- Median disposable income: target 22435.40; selected reference 23621.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Iceland ($918 public per resident); Switzerland ($1,312 public per resident); Luxembourg ($1,479 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Police services | $472 |
| Fire-protection services | $63 |
| Law courts | $156 |
| Prisons | $48 |
| R&D Public order and safety | $0 |
| Public order and safety n.e.c. | $178 |
| Unallocated / source rounding | $0 |

**Transport, energy and industry**

- Healthy life expectancy: target 71.16; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 22435.40; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($3,064 public per resident); Iceland ($3,258 public per resident); Luxembourg ($6,974 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| General economic, commercial and labour affairs | $79 |
| Agriculture, forestry, fishing and hunting | $537 |
| Fuel and energy | $257 |
| Mining, manufacturing and construction | $0 |
| Transport | $1,974 |
| Communication | $7 |
| Other industries | $114 |
| R&D Economic affairs | $92 |
| Economic affairs n.e.c. | $3 |
| Unallocated / source rounding | $0 |

**Waste, pollution and nature**

- Healthy life expectancy: target 71.16; selected reference 71.33 years (WHO HALE, population average).
- Median disposable income: target 22435.40; selected reference 23621.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Iceland ($418 public per resident); Switzerland ($454 public per resident); Luxembourg ($1,144 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Waste management | $251 |
| Waste water management | $0 |
| Pollution abatement | $0 |
| Protection of biodiversity and landscape | $133 |
| R&D Environmental protection | $3 |
| Environmental protection n.e.c. | $31 |

**Housing and community services**

- Healthy life expectancy: target 71.16; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 22435.40; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($152 public per resident); Iceland ($412 public per resident); Luxembourg ($728 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Housing development | $0 |
| Community development | $52 |
| Water supply | $100 |
| Street lighting | $0 |
| R&D Housing and community amenities | $0 |
| Housing and community amenities n.e.c. | $0 |

**Healthcare**

- Healthy life expectancy: target 72.52; selected reference 73.48 years (WHO HALE, population average).
- Cheapest qualifying alternatives: Japan ($3,413 public per resident); Singapore ($2,547 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Medical products, appliances and equipment | $550 |
| Outpatient services | $1,318 |
| Hospital services | $1,253 |
| Public health services | $210 |
| R&D Health | $7 |
| Health n.e.c. | $74 |

**Culture, recreation and religion**

- Healthy life expectancy: target 71.16; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 22435.40; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($827 public per resident); Luxembourg ($1,646 public per resident); Iceland ($1,977 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Recreational and sporting services | $282 |
| Cultural services | $318 |
| Broadcasting and publishing services | $191 |
| Religious and other community services | $35 |
| R&D Recreation, culture and religion | $1 |
| Recreation, culture and religion n.e.c. | $0 |

**Education**

- Students reaching basic maths proficiency: target 83.72; selected reference 85.30 % of 15-year-olds (PISA 2018, Level 2+).
- Cheapest qualifying alternatives: Poland ($1,791 public per resident); Estonia ($2,402 public per resident); Ireland ($2,793 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Pre-primary and primary education | $746 |
| Secondary education | $412 |
| Post-secondary non-tertiary education | $1 |
| Tertiary education | $438 |
| Education not definable by level | $36 |
| Subsidiary services to education | $101 |
| R&D Education | $28 |
| Education n.e.c. | $30 |

**Pensions and social support**

- Healthy life expectancy: target 71.16; selected reference 71.33 years (WHO HALE, population average).
- Median disposable income: target 22435.40; selected reference 23621.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Iceland ($6,557 public per resident); Switzerland ($10,375 public per resident); Luxembourg ($23,717 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Sickness and disability | $1,974 |
| Old age | $2,017 |
| Survivors | $9 |
| Family and children | $1,354 |
| Unemployment | $396 |
| Housing | $251 |
| Social exclusion n.e.c. | $311 |
| R&D Social protection | $0 |
| Social protection n.e.c. | $245 |
| Unallocated / source rounding | $0 |

## Top 10% non-health targets; healthcare within 1 healthy years

Annual public budget: **$25,545,975,751**; **$25,546 per resident**.

| Category | Per resident | Annual public budget | Reference | Eligible countries |
| --- | ---: | ---: | --- | ---: |
| Government, research and debt | $3,660 | $3,659,646,199 | Switzerland | 2 |
| Weapons and Military | $498 | $497,564,692 | Luxembourg | 2 |
| Police, courts and fire services | $1,312 | $1,312,115,443 | Switzerland | 2 |
| Transport, energy and industry | $3,064 | $3,064,045,570 | Switzerland | 2 |
| Waste, pollution and nature | $454 | $454,437,194 | Switzerland | 2 |
| Housing and community services | $152 | $152,056,526 | Switzerland | 2 |
| Healthcare | $3,413 | $3,412,897,610 | Japan | 2 |
| Culture, recreation and religion | $827 | $827,212,001 | Switzerland | 2 |
| Education | $1,791 | $1,791,433,399 | Poland | 3 |
| Pensions and social support | $10,375 | $10,374,567,118 | Switzerland | 2 |

### Reference outcomes and alternatives

**Government, research and debt**

- Healthy life expectancy: target 71.33; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 23988.90; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($3,660 public per resident); Luxembourg ($6,760 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Executive and legislative organs, financial and fiscal affairs, external affairs | $701 |
| Foreign economic aid | $309 |
| General services | $903 |
| Basic research | $1,428 |
| R&D General public services | $1 |
| General public services n.e.c. | $0 |
| Public debt transactions | $318 |
| Transfers of a general character between different levels of government | $0 |

**Weapons and Military**

- Healthy life expectancy: target 71.33; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 23988.90; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($498 public per resident); Switzerland ($635 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Military defence | $397 |
| Civil defence | $0 |
| Foreign military aid | $99 |
| R&D Defence | $0 |
| Defence n.e.c. | $2 |

**Police, courts and fire services**

- Healthy life expectancy: target 71.33; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 23988.90; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($1,312 public per resident); Luxembourg ($1,479 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Police services | $550 |
| Fire-protection services | $95 |
| Law courts | $224 |
| Prisons | $152 |
| R&D Public order and safety | $0 |
| Public order and safety n.e.c. | $292 |

**Transport, energy and industry**

- Healthy life expectancy: target 71.33; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 23988.90; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($3,064 public per resident); Luxembourg ($6,974 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| General economic, commercial and labour affairs | $79 |
| Agriculture, forestry, fishing and hunting | $537 |
| Fuel and energy | $257 |
| Mining, manufacturing and construction | $0 |
| Transport | $1,974 |
| Communication | $7 |
| Other industries | $114 |
| R&D Economic affairs | $92 |
| Economic affairs n.e.c. | $3 |
| Unallocated / source rounding | $0 |

**Waste, pollution and nature**

- Healthy life expectancy: target 71.33; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 23988.90; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($454 public per resident); Luxembourg ($1,144 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Waste management | $116 |
| Waste water management | $204 |
| Pollution abatement | $46 |
| Protection of biodiversity and landscape | $36 |
| R&D Environmental protection | $7 |
| Environmental protection n.e.c. | $45 |

**Housing and community services**

- Healthy life expectancy: target 71.33; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 23988.90; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($152 public per resident); Luxembourg ($728 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Housing development | $0 |
| Community development | $52 |
| Water supply | $100 |
| Street lighting | $0 |
| R&D Housing and community amenities | $0 |
| Housing and community amenities n.e.c. | $0 |

**Healthcare**

- Healthy life expectancy: target 72.52; selected reference 73.48 years (WHO HALE, population average).
- Cheapest qualifying alternatives: Japan ($3,413 public per resident); Singapore ($2,547 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Medical products, appliances and equipment | $550 |
| Outpatient services | $1,318 |
| Hospital services | $1,253 |
| Public health services | $210 |
| R&D Health | $7 |
| Health n.e.c. | $74 |

**Culture, recreation and religion**

- Healthy life expectancy: target 71.33; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 23988.90; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($827 public per resident); Luxembourg ($1,646 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Recreational and sporting services | $282 |
| Cultural services | $318 |
| Broadcasting and publishing services | $191 |
| Religious and other community services | $35 |
| R&D Recreation, culture and religion | $1 |
| Recreation, culture and religion n.e.c. | $0 |

**Education**

- Students reaching basic maths proficiency: target 85.03; selected reference 85.30 % of 15-year-olds (PISA 2018, Level 2+).
- Cheapest qualifying alternatives: Poland ($1,791 public per resident); Estonia ($2,402 public per resident); Denmark ($4,202 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Pre-primary and primary education | $746 |
| Secondary education | $412 |
| Post-secondary non-tertiary education | $1 |
| Tertiary education | $438 |
| Education not definable by level | $36 |
| Subsidiary services to education | $101 |
| R&D Education | $28 |
| Education n.e.c. | $30 |

**Pensions and social support**

- Healthy life expectancy: target 71.33; selected reference 71.37 years (WHO HALE, population average).
- Median disposable income: target 23988.90; selected reference 27268.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Switzerland ($10,375 public per resident); Luxembourg ($23,717 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Sickness and disability | $2,269 |
| Old age | $5,237 |
| Survivors | $238 |
| Family and children | $365 |
| Unemployment | $866 |
| Housing | $27 |
| Social exclusion n.e.c. | $1,365 |
| R&D Social protection | $0 |
| Social protection n.e.c. | $7 |
| Unallocated / source rounding | $-0 |

## Top 5% non-health targets; healthcare within 1 healthy years

Annual public budget: **$48,761,299,906**; **$48,761 per resident**.

| Category | Per resident | Annual public budget | Reference | Eligible countries |
| --- | ---: | ---: | --- | ---: |
| Government, research and debt | $6,760 | $6,760,155,765 | Luxembourg | 1 |
| Weapons and Military | $498 | $497,564,692 | Luxembourg | 1 |
| Police, courts and fire services | $1,479 | $1,478,775,129 | Luxembourg | 1 |
| Transport, energy and industry | $6,974 | $6,974,176,558 | Luxembourg | 1 |
| Waste, pollution and nature | $1,144 | $1,144,327,549 | Luxembourg | 1 |
| Housing and community services | $728 | $728,192,517 | Luxembourg | 1 |
| Healthcare | $3,413 | $3,412,897,610 | Japan | 2 |
| Culture, recreation and religion | $1,646 | $1,646,348,784 | Luxembourg | 1 |
| Education | $2,402 | $2,401,976,742 | Estonia | 2 |
| Pensions and social support | $23,717 | $23,716,884,559 | Luxembourg | 1 |

### Reference outcomes and alternatives

**Government, research and debt**

- Healthy life expectancy: target 71.40; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 27015.10; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($6,760 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Executive and legislative organs, financial and fiscal affairs, external affairs | $2,349 |
| Foreign economic aid | $787 |
| General services | $2,299 |
| Basic research | $595 |
| R&D General public services | $2 |
| General public services n.e.c. | $57 |
| Public debt transactions | $671 |
| Transfers of a general character between different levels of government | $0 |
| Unallocated / source rounding | $-0 |

**Weapons and Military**

- Healthy life expectancy: target 71.40; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 27015.10; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($498 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Military defence | $397 |
| Civil defence | $0 |
| Foreign military aid | $99 |
| R&D Defence | $0 |
| Defence n.e.c. | $2 |

**Police, courts and fire services**

- Healthy life expectancy: target 71.40; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 27015.10; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($1,479 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Police services | $636 |
| Fire-protection services | $247 |
| Law courts | $289 |
| Prisons | $200 |
| R&D Public order and safety | $25 |
| Public order and safety n.e.c. | $82 |
| Unallocated / source rounding | $-0 |

**Transport, energy and industry**

- Healthy life expectancy: target 71.40; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 27015.10; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($6,974 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| General economic, commercial and labour affairs | $941 |
| Agriculture, forestry, fishing and hunting | $407 |
| Fuel and energy | $127 |
| Mining, manufacturing and construction | $139 |
| Transport | $4,480 |
| Communication | $72 |
| Other industries | $199 |
| R&D Economic affairs | $595 |
| Economic affairs n.e.c. | $15 |
| Unallocated / source rounding | $0 |

**Waste, pollution and nature**

- Healthy life expectancy: target 71.40; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 27015.10; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($1,144 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Waste management | $230 |
| Waste water management | $558 |
| Pollution abatement | $170 |
| Protection of biodiversity and landscape | $131 |
| R&D Environmental protection | $2 |
| Environmental protection n.e.c. | $53 |
| Unallocated / source rounding | $-0 |

**Housing and community services**

- Healthy life expectancy: target 71.40; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 27015.10; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($728 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Housing development | $260 |
| Community development | $201 |
| Water supply | $158 |
| Street lighting | $43 |
| R&D Housing and community amenities | $0 |
| Housing and community amenities n.e.c. | $66 |
| Unallocated / source rounding | $0 |

**Healthcare**

- Healthy life expectancy: target 72.52; selected reference 73.48 years (WHO HALE, population average).
- Cheapest qualifying alternatives: Japan ($3,413 public per resident); Singapore ($2,547 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Medical products, appliances and equipment | $550 |
| Outpatient services | $1,318 |
| Hospital services | $1,253 |
| Public health services | $210 |
| R&D Health | $7 |
| Health n.e.c. | $74 |

**Culture, recreation and religion**

- Healthy life expectancy: target 71.40; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 27015.10; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($1,646 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Recreational and sporting services | $688 |
| Cultural services | $693 |
| Broadcasting and publishing services | $123 |
| Religious and other community services | $127 |
| R&D Recreation, culture and religion | $1 |
| Recreation, culture and religion n.e.c. | $15 |
| Unallocated / source rounding | $0 |

**Education**

- Students reaching basic maths proficiency: target 85.36; selected reference 89.80 % of 15-year-olds (PISA 2018, Level 2+).
- Cheapest qualifying alternatives: Estonia ($2,402 public per resident); Denmark ($4,202 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Pre-primary and primary education | $940 |
| Secondary education | $613 |
| Post-secondary non-tertiary education | $33 |
| Tertiary education | $462 |
| Education not definable by level | $117 |
| Subsidiary services to education | $111 |
| R&D Education | $46 |
| Education n.e.c. | $81 |
| Unallocated / source rounding | $0 |

**Pensions and social support**

- Healthy life expectancy: target 71.40; selected reference 71.43 years (WHO HALE, population average).
- Median disposable income: target 27015.10; selected reference 28943.00 2019 PPS per equivalised person (Eurostat EU-SILC).
- Cheapest qualifying alternatives: Luxembourg ($23,717 public per resident).

| Service | Annual cost per resident |
| --- | ---: |
| Sickness and disability | $3,946 |
| Old age | $12,635 |
| Survivors | $2 |
| Family and children | $4,659 |
| Unemployment | $1,227 |
| Housing | $99 |
| Social exclusion n.e.c. | $948 |
| R&D Social protection | $0 |
| Social protection n.e.c. | $198 |
| Unallocated / source rounding | $0 |

## Sources

Snapshot generated 2026-09-27T23:47:51.516Z.

- [Source API](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_exp?lang=en&unit=MIO_EUR&sector=S13&na_item=TE&sinceTimePeriod=2017&untilTimePeriod=2019); retrieved 2026-09-27T19:12:14.969Z; SHA-256 `f6250f09540026420df6f4341f3e839eb387465fd6f9dd464fd16234520cbb35`.
- [Source API](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_gdp?lang=en&unit=CP_MEUR&na_item=B1GQ&sinceTimePeriod=2017&untilTimePeriod=2019); retrieved 2026-09-27T19:12:16.483Z; SHA-256 `c983febc0beddcb35bdc671b3b8d5dd355bfd9ec1ee239edd8f2213c21bebb81`.
- [Source API](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ilc_di03?lang=en&unit=PPS&age=TOTAL&sex=T&statinfo=MED_EI&time=2019); retrieved 2026-09-27T19:12:16.632Z; SHA-256 `fda0ad2deb0b481c0b0458eefef19ef66cec3b28bf22e7a838dd99f2acf75f1b`.
- [Source API](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/educ_outc_pisa?lang=en&field=EF461&sex=T&time=2018); retrieved 2026-09-27T19:14:37.837Z; SHA-256 `175cfa81a688d721c43b3b796666a4c8f8ffceca098fc4bb1a32d70eb3303142`.
- [Source API](https://ghoapi.azureedge.net/api/WHOSIS_000002?%24filter=TimeDim+ge+2017+and+TimeDim+le+2019+and+Dim1+eq+%27SEX_BTSX%27); retrieved 2026-09-27T19:26:46.558Z; SHA-256 `4c20e94994698da70c668512860db2db27004aeb0df371b8dc3ca95470248202`.
- [Source API](https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.PP.KD?date=2017:2019&format=json&per_page=20000); retrieved 2026-09-27T19:12:16.714Z; SHA-256 `c58b9edddf7d1080118fe96950db04711fbc5bff4298cb6c4d32750ed8207d6d`.
- [Source API](https://api.worldbank.org/v2/country/all/indicator/SH.XPD.CHEX.GD.ZS?date=2017:2019&format=json&per_page=20000); retrieved 2026-09-27T19:12:17.467Z; SHA-256 `6a27078a040d483cca4b8965a70140706b9ffac3dbad7d566720b6162961336d`.
- [Source API](https://api.worldbank.org/v2/country/all/indicator/SH.XPD.GHED.CH.ZS?date=2017:2019&format=json&per_page=20000); retrieved 2026-09-27T23:36:23.450Z; SHA-256 `c7c9c151e1fd65458da2e26b857c46578484914e68016e5026a4652c5ba5a7a2`.
- [Source API](https://api.worldbank.org/v2/country/all/indicator/SH.XPD.PVTD.CH.ZS?date=2017:2019&format=json&per_page=20000); retrieved 2026-09-27T23:36:23.979Z; SHA-256 `64eaafec2359221b9f7144e9fbff8f84179d84f618ff74b76ca68476afff9367`.
- [Source API](https://api.worldbank.org/v2/country/all/indicator/SH.XPD.EHEX.CH.ZS?date=2017:2019&format=json&per_page=20000); retrieved 2026-09-27T23:36:24.397Z; SHA-256 `8d89a1a79a2923b7ec5cb06c23c4f666c51464b5b850a96b840da13a17984abb`.
- [Source API](https://api.worldbank.org/v2/country/all/indicator/SH.XPD.OOPC.CH.ZS?date=2017:2019&format=json&per_page=20000); retrieved 2026-09-27T23:36:24.778Z; SHA-256 `6b49a51ff8f2b7dbf2600a456ae755f74d6930c277a3cf0d4db4169798d171b2`.
- [Source API](https://api.worldbank.org/v2/country?format=json&per_page=400); retrieved 2026-09-27T23:36:24.823Z; SHA-256 `d29d57f8adf954c5e2a1520a02fb2c7b45575d8db3bd327a9dff47d66914231c`.
- [Source API](https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?date=2000:2025&format=json&per_page=20000); retrieved 2026-09-27T23:36:25.208Z; SHA-256 `9f5b06621149da8759afaa661311af7aab5c8b4d29bf1ae9a76197ab543b9f65`.
- [WHO HALE](https://www.who.int/data/gho/data/indicators/indicator-details/GHO/gho-ghe-hale-healthy-life-expectancy); both-sex observations retrieved 2026-09-27T19:26:46.558Z.
- [PISA mathematics proficiency](https://ec.europa.eu/eurostat/databrowser/view/educ_outc_pisa/default/table?lang=en).

- [WHO health expenditure definitions](https://apps.who.int/nha/database/).
- [World Bank population](https://data.worldbank.org/indicator/SP.POP.TOTL).

### Data quality exclusions

- BRN 2017: Published financing shares do not sum to total current health cost within 0.001%; financing split omitted.
- GEO 2017: Published financing shares do not sum to total current health cost within 0.001%; financing split omitted.
- KIR 2017: Published financing shares do not sum to total current health cost within 0.001%; financing split omitted.
- PRT 2019: Published financing shares do not sum to total current health cost within 0.001%; financing split omitted.
- SRB 2019: Published financing shares do not sum to total current health cost within 0.001%; financing split omitted.
- TON 2017: Published financing shares do not sum to total current health cost within 0.001%; financing split omitted.

### Healthcare service sources

Arithmetic mean of 2017–2019 annual function shares. All-financing shares partition total current expenditure; HF1 shares are normalized within government/compulsory schemes. Neither includes capital. Multiplying these mean shares by a separately sourced mean cost is a composition estimate, not a separately measured programme cost.

- [OECD source](https://sdmx.oecd.org/public/rest/v1/dataflow/OECD.ELS.HD/DSD_SHA@DF_SHA/1.1?references=all); retrieved 2026-09-27T23:41:10.509Z; SHA-256 `636f67b47750f3f0517e9b8f03d432cf2830f623a8fd2ab942b6e13052644053`.
- [OECD source](https://sdmx.oecd.org/public/rest/v1/data/OECD.ELS.HD,DSD_SHA@DF_SHA,1.1/.A.EXP_HEALTH.PT_EXP_HLTH._T+HF1._Z.HC0+HC1+HC2+HC3+HC4+HC5+HC6+HC7+_T._T._T._Z._Z._Z?startPeriod=2017&endPeriod=2019); retrieved 2026-09-27T23:41:11.359Z; SHA-256 `0292e8796f2eb19a7ae452deefdddd34505ea1824608caeadf8a626aa5d57ead`.
- [OECD source](https://sdmx.oecd.org/public/rest/v1/data/OECD.ELS.HD,DSD_SHA@DF_SHA_HK,1.1/.A.CAPITAL_FORM.PT_B1GQ._Z._Z._Z._Z._T._Z._T._Z?startPeriod=2017&endPeriod=2019); retrieved 2026-09-27T23:41:12.940Z; SHA-256 `dfbdb48e9689f40e5b306ce70931ecbf28d9bb6232a359e421b4bc37f2f77063`.

### Government healthcare budget sources

- Japan: OECD national accounts; general government total expenditure, including capital and health R&D.
- South Korea: OECD national accounts; general government total expenditure, including capital and health R&D.
- Singapore: IMF Government Finance Statistics; general government expenditure, cash basis (CA), including capital.

- [COFOG or GDP source](https://sdmx.oecd.org/public/rest/v1/data/OECD.SDD.NAD,DSD_NASEC10@DF_TABLE11,1.1/A.JPN+KOR.S13...OTE..GF07+GF0701+GF0702+GF0703+GF0704+GF0705+GF0706...V..?startPeriod=2017&endPeriod=2019); retrieved 2026-09-27T23:47:50.073Z; SHA-256 `f08950e0b38263d690a052b531798d0bd68f0e8554df7e0dcde8884096901fb6`.
- [COFOG or GDP source](https://api.imf.org/external/sdmx/2.1/data/IMF.STA,GFS_COFOG,11.0.0/SGP.S13.G2MF.GF07_T.POGDP_PT+XDC.A?startPeriod=2017&endPeriod=2019); retrieved 2026-09-27T23:47:51.044Z; SHA-256 `d5bfcc65dc86c38d01857b717f8732f754bd4cb78d2c54de613b244264428c3b`.
- [COFOG or GDP source](https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CN?date=2017:2019&format=json&per_page=20000); retrieved 2026-09-27T23:47:51.516Z; SHA-256 `8d0b372954dac65637ba05e497dbdd1222aed783caf7e0a1812aecf144658f26`.
- [COFOG or GDP source](https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.PP.KD?date=2017:2019&format=json&per_page=20000); retrieved 2026-09-27T19:12:16.714Z; SHA-256 `c58b9edddf7d1080118fe96950db04711fbc5bff4298cb6c4d32750ed8207d6d`.
