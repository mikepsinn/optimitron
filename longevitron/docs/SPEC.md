# Longevitron Spec v0

## Goal

For each country, generate the budget and the laws that maximize average
health-adjusted life expectancy (HALE) at birth, as WHO publishes it.
The first country is the United States.

## Limits

1. The total budget stays the same. Money moves between categories only.
2. Debt interest and legally required pension payments stay fixed.
3. No bans on adult choices. Taxes, labels, and information requirements are allowed.
4. No category gets a level outside the range that real countries have. There is no data outside that range.
5. Defence has no floor. The evidence sets its level.

## Model

1. The unit is healthy life-years: HALE change multiplied by population.
2. For each budget category, fit a diminishing-returns curve of HALE against spending per person. Use time lags and country fixed effects.
3. The optimal budget gives each category money until the next dollar buys the same healthy years in every category, inside the limits.
4. Run Monte Carlo draws over the curve parameters. Report the median and the 90% range.
5. Rank laws by healthy years per dollar of public cost.
6. Each bill section adapts a law that a country or state already passed. It cites that law and the effect that was measured after it passed.
7. Each bill has a one-page summary.

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

## Agent loop

1. Pick the open question with the highest value of information: the question whose answer can change the recommended budget most.
2. Research it. Update records through generator scripts only.
3. Open one pull request per question. The pull request lists each changed number and its old and new value.
4. CI runs evals 1–4. The reviewer agent runs eval 6.
5. Auto-merge when all evals pass and the top recommendations do not change. "Do not change" means: no category's optimal amount moves more than 5%, and the order of the top 10 laws stays the same.
6. Otherwise the owner approves the pull request.

## Site

The main readers are policy staff at health and longevity organizations.

1. **Country page:** current budget, optimal budget, healthy years per next $1B per category, ranked laws, endorse button.
2. **Policy page:** evidence, strongest counter-argument, source law, bill text, summary.
3. **World table:** countries ranked by the healthy years that they can gain.
4. **Organizations page:** who endorsed each country platform.
5. **Method and changelog page:** each change and its reason, backtest score history, forecast ledger.

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
| Evals 3–7 | Not built |
| Budget model | Not built |
| Laws | Not built |
| Endorsements | Not built |
