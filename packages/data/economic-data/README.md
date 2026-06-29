# Economic Data

Reusable country-year economic, health, energy, population, political, and government-spending datasets.

This repository is primarily a data bundle. It keeps small public-reference datasets in Git so downstream projects can load them deterministically instead of depending on live APIs for every analysis run.

## Contents

- `data/` - 60 CSV files and 5 XLSX workbooks.
- `data/data-source-urls.xlsx` - source/provenance notes for the collected datasets.
- `data/global-data-by-country_combined_country_data.csv` - broad country-level panel assembled from multiple source files.
- `data/data_*` CSVs - mostly Gapminder-style country-by-year tables.
- `dollar-value/` - optional Streamlit simulator for exploring USD value scenarios.

The data covers:

- Health: life expectancy, BMI, blood pressure, cholesterol, HIV deaths, suicide, smoking, alcohol, and sugar intake.
- Income and poverty: GDP, GDP growth, income per person, national income, and poverty thresholds.
- Energy: CO2, coal, electricity, oil, gas, nuclear, hydro, energy use, and energy production.
- Population and geography: total population, population growth, country regions, and immigration.
- Politics and governance: democracy, civil liberties, political rights, corruption perception, Gini, and public-spending measures.
- Military and government finance: SIPRI military spending, federal budget data, government expenditure, procurement, social spending, education spending, and health spending.

## Data Format

Most `data/data_*.csv` files use a wide country-year format:

```csv
country,1800,1801,1802,...
Afghanistan,328,328,328,...
Albania,400,400,400,...
```

Other files are source-specific CSV exports or XLSX workbooks. Inspect the header before assuming a schema.

## Typical Uses

- Building country panels for economic and policy analysis.
- Joining health, income, energy, population, and governance indicators by country/year.
- Keeping a local fallback snapshot for projects that also use World Bank, OECD, WHO, SIPRI, or Gapminder-style API/data sources.
- Reproducing analyses without depending on network availability.

## Using the Data

Read CSV files directly from `data/` with your language of choice.

Python example:

```python
import pandas as pd

life_expectancy = pd.read_csv("data/data_health_life_expectancy_years.csv")
print(life_expectancy.head())
```

Node.js example:

```js
import { readFileSync } from "node:fs";

const csv = readFileSync(
  "data/data_income_income_per_person_gdppercapita_ppp_inflation_adjusted.csv",
  "utf8",
);
console.log(csv.split("\n").slice(0, 3).join("\n"));
```

## Dollar-Value Simulator

The `dollar-value/` directory contains a small Streamlit app for simulating potential changes in USD value under simplified economic scenarios.

Run it with:

```bash
cd dollar-value
pip install -r requirements.txt
streamlit run app.py
```

The simulator is educational. Real currency values are affected by policy changes, international events, market sentiment, and many other factors not modeled here.

## License

GPL-3.0. See `LICENSE`.
