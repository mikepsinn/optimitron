# Longevitron Spec v0

## Goal

For each country, generate the budget, the trials, and the laws that maximize average
healthy life expectancy (HALE) at birth, as WHO publishes it.
The first country is the United States.

## Limits

1. The total budget stays the same. Money moves between uses only.
2. Debt interest and legally required pension payments stay fixed.
3. No bans on adult choices. Taxes, labels, and information requirements are allowed.
4. No category gets a level outside the range that real countries have. There is no data outside that range.
5. Defence has no floor. The evidence sets its level.

## Model

The model compares every use of money in one unit: expected healthy life-years gained in the country, discounted, per dollar. The core method is value-of-information analysis, a standard method in health economics.

### Options

1. **Delivery option.** Fund a proven intervention or program at a stated scale.
2. **Learning option.** Run a trial of an untested candidate: a drug, a program, or a policy. A policy trial uses cluster randomization or a staggered start.
3. **Rule option.** Pass a tax, a label rule, or a product standard. It has a small budget cost, but it has an effect and an enforcement cost.

### Data for each option

Each field cites records.

| Field | Delivery | Learning (trial) | Rule |
|---|---|---|---|
| Allocation unit | One person covered, or one program site | One trial | One law |
| Cost | Fixed setup cost plus cost per unit | Total trial cost | Enforcement cost |
| Capacity | Maximum units per year | Patients, sites, and staff that the trial uses | None |
| Effect | Healthy years per unit, as a distribution | Effect if the candidate works, as a distribution | Healthy years per year in force, as a distribution |
| Probability | None | Prior probability that the candidate works, from a cited reference class | Probability that the measured effect transfers to this country |
| Reach | Eligible people | Eligible people, adoption rate, and adoption delay after a positive result | Population covered |

### Value of a learning option

1. A trial has value because its result changes which delivery options the model funds later.
2. The value of a trial is the expected gain from that better decision, summed over the eligible population and the horizon. This is the expected value of sample information (EVSI). The net value subtracts the trial cost.
3. A negative result also has value when it stops spending on an option that does not work.

### Selection

1. Options can be indivisible, can have setup costs, and can have capacity limits. So the model selects a combination of options with integer optimization (a knapsack with capacity limits). It does not simply fund a sorted list.
2. The constraints are the total budget (limit 1), the fixed obligations (limit 2), the capacity of each option, and the total trial capacity of the country.
3. Total trial capacity can grow by a maximum rate each year. The owner sets the rate. The model shows the ramp.
4. An option enters only if it beats the opportunity cost of current spending. The first reference value is the US estimate of about $104,000 per QALY (Vanness et al., Ann Intern Med 2021). It must enter as a sourced record before the model uses it.
5. The model runs year by year. Trial results that are due in a year update the delivery options for later years.
6. Monte Carlo draws cover all distributions. Report the median and the 90% range.

### Horizon (owner decision open)

Recommended: total healthy life-years over 30 years, discounted 3% per year.

### Category-level check

1. For each COFOG category, fit a diminishing-returns curve of HALE against spending per person. Use time lags and country fixed effects.
2. This model does not select options. It checks large moves, such as a defence cut, against country data. It also supplies the backtest.

### Outputs

1. A ranked list of trials for the country to run, with the expected healthy years of each trial.
2. The optimal budget by category, built from the selected options.
3. Bill sections for the selected rule options. Each section adapts a law that a country or state already passed. It cites that law and the effect that was measured after it passed. Each bill has a one-page summary.

## Evidence records

1. Each number is one record: value, unit, source URL, exact quote, page or locator, retrieval date, and SHA-256 of the saved source file.
2. Pages render from records only.
3. A script makes every record from a saved source file. Nobody types numbers by hand.

## Evals

Agents cannot edit the `evals/` folder. CODEOWNERS requests owner review for it. Branch protection must require code owner review to enforce the rule.

1. **Record check.** Each number on each page maps to a record.
2. **Quote check.** The quote exists in the saved source and contains the value.
3. **Backtest.** Train on years up to 2012. Score on later years. A model change merges only if the score does not get worse.
4. **Known answers.** About 20 well-proven effects. The model reproduces each one inside its published range. Claude drafts the list. The owner or an expert approves it.
5. **Forecast ledger.** Each model version records its forecast for the next WHO HALE release. The site scores each forecast in public when WHO publishes.
6. **Adversarial review.** A reviewer agent must cite a file, a line, and a contradicting source. A verifier agent confirms each finding. The repo records reviewer precision. Vague objections do not count.
7. **Human audit.** Each week the owner checks 10 random records. If more than 5% are wrong, the loop stops.
8. **Prior calibration.** Each prior probability that a candidate works cites a reference class and its base rate. When trials report, the site scores the priors in public (Brier score). Badly calibrated reference classes change.

## Agent loop

1. Pick the open question with the highest value of information: the question whose answer can change the recommended budget most.
2. Research it. Update records through generator scripts only.
3. Open one pull request per question. The pull request lists each changed number and its old and new value.
4. CI runs evals 1–4. The reviewer agent runs eval 6.
5. Auto-merge when all evals pass and the top recommendations do not change. "Do not change" means: no category's optimal amount moves more than 5%, and the order of the top 10 trials and the top 10 laws stays the same.
6. Otherwise the owner approves the pull request.

## Site

The main readers are policy staff at health and longevity organizations.

1. **Country page:** current budget, optimal budget, ranked trials, ranked laws, endorse button.
2. **Trials page:** the ranked trials, each with cost, expected healthy years, and the prior with its reference class.
3. **Policy page:** evidence, strongest counter-argument, source law, bill text, summary.
4. **World table:** countries ranked by the healthy years that they can gain.
5. **Organizations page:** who endorsed each country platform.
6. **Method and changelog page:** each change and its reason, backtest score history, forecast ledger.

## Endorsements

Endorsements are records in a public file. Each record links to the organization's public statement. There is no database.

## Repository

1. For now, Longevitron is the `longevitron/` folder in the Optimitron repository.
2. It has its own `package.json`, lockfile, CI workflow, and `AGENTS.md`. It imports nothing from Optimitron.
3. Later, `git filter-repo --subdirectory-filter longevitron` moves it to its own repository with its history.
4. It becomes public on its own domain after the first verified US result and owner approval.

## Build status

| Item | Status |
|---|---|
| WHO HALE records, 185 countries, 2000–2023 | Live |
| Eval 1, record check | Live |
| Eval 2, quote check (source check for JSON rows) | Live |
| Evals 3–8 | Not built |
| Value-of-information model | Not built |
| Budget model | Not built |
| Laws | Not built |
| Endorsements | Not built |
