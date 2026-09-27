# Government spending, health and income

Generated: 2026-09-27T16:29:54.980Z
Source mode: Bundled public source snapshots; no new network fetch

Predictor: General government expenditure (% GDP). IMF Fiscal Monitor: central, state, local government and social security combined.

| Outcome | Countries | Source observations | Years | Within-country correlation, mean [95% interval] | Outcome difference, mean [95% interval] |
| --- | ---: | ---: | --- | --- | --- |
| Healthy life expectancy (HALE) | 180 | 3944 | 2000–2021 | 0.172 [0.105, 0.239] | 0.703 [0.416, 1.001] years |
| Real after-tax median income | 35 | 668 | 2000–2023 | 0.081 [-0.066, 0.227] | 0.019 [-9.022, 8.093] % of lower-spending baseline income |

## Data and calculation

- [Country panel: IMF spending and WHO HALE](https://www.imf.org/external/datamapper/G_X_G01_GDP_PT), snapshot generated 2026-04-04T20:46:12.368Z.
- [Strict OECD / Eurostat disposable-income records](https://data-explorer.oecd.org/), snapshot generated 2026-04-04T20:40:15.693Z.

- **Healthy life expectancy (HALE):** WHO expected healthy years at birth, both sexes. HALE is a population expectation, not median individual healthspan.
- **Real after-tax median income:** Survey-based median disposable income after direct taxes and cash transfers, adjusted for prices and purchasing power. One OECD or Eurostat series per country; no spending-derived income or PIP fallback.

- Each country is compared with itself over 2000–2023 using retained OBG runCountryAnalysis and optimizer algorithms. No interpolation or extrapolation is added.
- Higher-spending years are above that country's own mean spending share. Outcome difference compares the following 1–4 years after higher versus lower spending. Health differences are in years; income differences are percentages of each country's own baseline, not pooled dollars across incompatible price bases.
- Exploratory annual summaries require at least eight aligned pairs, variation in both series and at least 10% of pairs in each exposure group. The generic optimizer's 30-pair quality check and its warnings remain in the country diagnostics; these summaries are not evidence-qualified policy recommendations.
- Country trends and time-varying confounding can explain these associations. The report compares observed outcomes; it does not solve a joint national budget or convert total healthy years into median healthspan.
- Income source metadata specifies inflation and PPP conversion bases. Annual PPP factors and different OECD/Eurostat price bases limit comparisons across countries and across time.

95% percentile bootstrap interval for the equally weighted mean of country estimates; whole countries are resampled. It does not include source measurement error or identify a causal policy effect.
Bootstrap draws: 2000; seed: 20260926.

## Healthy life expectancy (HALE): country results

| Country | Survey/source | Paired years | Lower / higher spending (% GDP) | Correlation | Outcome difference | Included in average |
| --- | --- | ---: | --- | ---: | ---: | --- |
| Afghanistan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 19 | 16.911 / 26.37 | 0.911 | 1.877 years | Exploratory summary; Insufficient pairs (<30) |
| Angola | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22.54 / 34.773 | -0.256 | -0.799 years | Exploratory summary; Insufficient pairs (<30) |
| Albania | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 29.138 / 32.162 | -0.359 | -0.36 years | Exploratory summary; Insufficient pairs (<30) |
| United Arab Emirates | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 18.975 / 29.031 | -0.037 | -0.152 years | Exploratory summary; Insufficient pairs (<30) |
| ARG | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 25.544 / 38.3 | 0.215 | 0.221 years | Exploratory summary; Insufficient pairs (<30) |
| Armenia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 16 | 22.338 / 26.825 | 0.292 | 0.668 years | Exploratory summary; Insufficient pairs (<30) |
| Antigua and Barbuda | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 21.082 / 25.44 | -0.146 | -0.555 years | Exploratory summary; Insufficient pairs (<30) |
| Australia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 35.145 / 37.96 | 0.556 | 1.041 years | Exploratory summary; Insufficient pairs (<30) |
| Austria | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 50.533 / 53.311 | -0.145 | -0.006 years | Exploratory summary; Insufficient pairs (<30) |
| Azerbaijan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22.238 / 35.231 | 0.872 | 3.064 years | Exploratory summary; Insufficient pairs (<30) |
| Burundi | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.87 / 37.836 | 0.189 | -0.28 years | Exploratory summary; Insufficient pairs (<30) |
| Belgium | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 50.291 / 54.92 | 0.628 | 1.043 years | Exploratory summary; Insufficient pairs (<30) |
| Benin | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 14.1 / 16.6 | 0.309 | -0.244 years | Exploratory summary; Insufficient pairs (<30) |
| Burkina Faso | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 19.9 / 23.42 | 0.728 | 3.581 years | Exploratory summary; Insufficient pairs (<30) |
| Bangladesh | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 10.22 / 12.155 | 0.774 | 3.338 years | Exploratory summary; Insufficient pairs (<30) |
| Bulgaria | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 33.308 / 36.444 | -0.111 | 0.131 years | Exploratory summary; Insufficient pairs (<30) |
| Bahrain | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.58 / 31.973 | 0.455 | 1.281 years | Exploratory summary; Insufficient pairs (<30) |
| Bahamas, The | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 12.9 / 19.67 | -0.529 | -0.525 years | Exploratory summary; Insufficient pairs (<30) |
| Bosnia and Herzegovina | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 43.082 / 48.67 | -0.229 | 0.403 years | Exploratory summary; Insufficient pairs (<30) |
| Belarus | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 20 | 39.627 / 47.633 | -0.396 | -1.383 years | Exploratory summary; Insufficient pairs (<30) |
| Belize | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22.792 / 27.7 | 0.613 | 1.311 years | Exploratory summary; Insufficient pairs (<30) |
| Bolivia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 31.93 / 37.909 | 0.507 | 1.195 years | Exploratory summary; Insufficient pairs (<30) |
| Brazil | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 20 | 40.242 / 44.563 | 0.123 | 0.2 years | Exploratory summary; Insufficient pairs (<30) |
| Barbados | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 25.55 / 29.985 | 0.185 | 0.031 years | Exploratory summary; Insufficient pairs (<30) |
| Brunei Darussalam | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 30.564 / 36.78 | -0.228 | 0.106 years | Exploratory summary; Insufficient pairs (<30) |
| Bhutan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 30.4 / 39.18 | -0.692 | -2.088 years | Exploratory summary; Insufficient pairs (<30) |
| Botswana | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 36.7 / 46.014 | -0.408 | -4.684 years | Exploratory summary; Insufficient pairs (<30) |
| Central African Republic | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.182 / 17.29 | 0.259 | 0.694 years | Exploratory summary; Insufficient pairs (<30) |
| Canada | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 39.727 / 43.75 | 0.234 | 0.097 years | Exploratory summary; Insufficient pairs (<30) |
| Switzerland | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 31.15 / 33.091 | 0.09 | 0.01 years | Exploratory summary; Insufficient pairs (<30) |
| Chile | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 21.783 / 25.5 | 0.602 | 1.164 years | Exploratory summary; Insufficient pairs (<30) |
| China | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 18.8 / 30.155 | 0.808 | 2.285 years | Exploratory summary; Insufficient pairs (<30) |
| Côte d'Ivoire | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.6 / 17.178 | 0.879 | 5.605 years | Exploratory summary; Insufficient pairs (<30) |
| Cameroon | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.991 / 18.71 | 0.841 | 4.521 years | Exploratory summary; Insufficient pairs (<30) |
| Congo, Dem. Rep. | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 6.7 / 13.292 | 0.841 | 4.549 years | Exploratory summary; Insufficient pairs (<30) |
| Congo, Rep. | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 23.685 / 36.45 | 0.232 | 0.153 years | Exploratory summary; Insufficient pairs (<30) |
| Colombia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 27.827 / 31.54 | -0.029 | 0.111 years | Exploratory summary; Insufficient pairs (<30) |
| Comoros | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.164 / 18.571 | 0.786 | 1.664 years | Exploratory summary; Insufficient pairs (<30) |
| Cabo Verde | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 26.986 / 32.9 | 0.557 | 1.275 years | Exploratory summary; Insufficient pairs (<30) |
| Costa Rica | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 16.445 / 19.32 | -0.364 | 0.095 years | Exploratory summary; Insufficient pairs (<30) |
| Cyprus | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 38.333 / 43.889 | 0.664 | 1.271 years | Exploratory summary; Insufficient pairs (<30) |
| Czechia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 40.985 / 44.713 | -0.435 | -0.682 years | Exploratory summary; Insufficient pairs (<30) |
| Germany | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 44.767 / 48.211 | -0.451 | -0.726 years | Exploratory summary; Insufficient pairs (<30) |
| Djibouti | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.987 / 30.717 | 0.363 | 0.443 years | Exploratory summary; Insufficient pairs (<30) |
| Denmark | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 51.173 / 55.2 | 0.239 | 0.685 years | Exploratory summary; Insufficient pairs (<30) |
| Dominican Republic | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 16.138 / 18.575 | 0.101 | -0.125 years | Exploratory summary; Insufficient pairs (<30) |
| Algeria | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 29.367 / 37.683 | 0.624 | 0.67 years | Exploratory summary; Insufficient pairs (<30) |
| Ecuador | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22.437 / 40.792 | 0.755 | 1.606 years | Exploratory summary; Insufficient pairs (<30) |
| Egypt, Arab Rep. | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 28.088 / 31.854 | 0.28 | 0.699 years | Exploratory summary; Insufficient pairs (<30) |
| Eritrea | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 19 | 33.81 / 63.022 | -0.741 | -3.698 years | Exploratory summary; Insufficient pairs (<30) |
| Spain | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 39.785 / 46.675 | 0.802 | 1.341 years | Exploratory summary; Insufficient pairs (<30) |
| Estonia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 35.29 / 40.336 | 0.667 | 3.254 years | Exploratory summary; Insufficient pairs (<30) |
| Ethiopia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 17.208 / 23.563 | -0.906 | -7.372 years | Exploratory summary; Insufficient pairs (<30) |
| Finland | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 47.689 / 54.808 | 0.824 | 1.65 years | Exploratory summary; Insufficient pairs (<30) |
| Fiji | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.762 / 30.475 | -0.56 | -0.705 years | Exploratory summary; Insufficient pairs (<30) |
| France | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 53.89 / 58.036 | 0.673 | 0.972 years | Exploratory summary; Insufficient pairs (<30) |
| Micronesia, Fed. Sts. | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 58.791 / 66.31 | -0.216 | -0.402 years | Exploratory summary; Insufficient pairs (<30) |
| Gabon | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 19.733 / 25.111 | -0.121 | 0.304 years | Exploratory summary; Insufficient pairs (<30) |
| United Kingdom | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 37.642 / 43.422 | 0.724 | 0.798 years | Exploratory summary; Insufficient pairs (<30) |
| Georgia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 18.429 / 28.979 | 0.183 | 0.847 years | Exploratory summary; Insufficient pairs (<30) |
| Ghana | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 14.291 / 21.66 | 0.859 | 3.202 years | Exploratory summary; Insufficient pairs (<30) |
| Guinea | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 12.75 / 18.1 | 0.521 | 2.322 years | Exploratory summary; Insufficient pairs (<30) |
| Gambia, The | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 11.655 / 20.26 | 0.888 | 2.624 years | Exploratory summary; Insufficient pairs (<30) |
| Guinea-Bissau | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 16.78 / 22.055 | 0.014 | -0.092 years | Exploratory summary; Insufficient pairs (<30) |
| Equatorial Guinea | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 16.823 / 33 | 0.476 | 1.687 years | Exploratory summary; Insufficient pairs (<30) |
| Greece | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 47.9 / 53.9 | 0.252 | 0.666 years | Exploratory summary; Insufficient pairs (<30) |
| Grenada | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.54 / 29.8 | -0.154 | -0.05 years | Exploratory summary; Insufficient pairs (<30) |
| Guatemala | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.118 / 14.32 | 0.035 | 0.014 years | Exploratory summary; Insufficient pairs (<30) |
| Guyana | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 23.058 / 27.333 | 0.379 | 0.91 years | Exploratory summary; Insufficient pairs (<30) |
| Honduras | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.767 / 27.017 | -0.113 | -0.018 years | Exploratory summary; Insufficient pairs (<30) |
| Croatia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 45.964 / 50.13 | -0.402 | -0.859 years | Exploratory summary; Insufficient pairs (<30) |
| Haiti | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 8.427 / 13.15 | 0.262 | -1.004 years | Exploratory summary; Insufficient pairs (<30) |
| Hungary | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 47.333 / 50.117 | -0.123 | -0.068 years | Exploratory summary; Insufficient pairs (<30) |
| Indonesia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 16.74 / 18.555 | 0.06 | -0.027 years | Exploratory summary; Insufficient pairs (<30) |
| India | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 26.785 / 29.063 | -0.362 | -1.653 years | Exploratory summary; Insufficient pairs (<30) |
| Ireland | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 29.538 / 44.325 | -0.027 | 0.565 years | Exploratory summary; Insufficient pairs (<30) |
| Iran, Islamic Rep. | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.164 / 16.3 | 0.017 | -0.084 years | Exploratory summary; Insufficient pairs (<30) |
| Iraq | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 17 | 41.036 / 62.167 | -0.55 | -1.33 years | Exploratory summary; Insufficient pairs (<30) |
| Iceland | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 44.454 / 50.713 | 0.007 | -0.042 years | Exploratory summary; Insufficient pairs (<30) |
| Israel | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 39.142 / 44.222 | -0.776 | -1.542 years | Exploratory summary; Insufficient pairs (<30) |
| Italy | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 47.358 / 50.889 | 0.631 | 1.212 years | Exploratory summary; Insufficient pairs (<30) |
| Jamaica | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 27.75 / 32.833 | -0.047 | -0.029 years | Exploratory summary; Insufficient pairs (<30) |
| Jordan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 31.182 / 36.33 | -0.279 | -0.767 years | Exploratory summary; Insufficient pairs (<30) |
| Japan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 34.344 / 38.375 | 0.538 | 2.084 years | Exploratory summary; Insufficient pairs (<30) |
| Kazakhstan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 19 | 20.7 / 23.788 | -0.293 | -1.11 years | Exploratory summary; Insufficient pairs (<30) |
| Kenya | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 16.67 / 23.509 | 0.97 | 5.806 years | Exploratory summary; Insufficient pairs (<30) |
| Kyrgyz Republic | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 29.608 / 37.644 | 0.541 | 2.029 years | Exploratory summary; Insufficient pairs (<30) |
| Cambodia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.39 / 16.982 | 0.323 | 2.16 years | Exploratory summary; Insufficient pairs (<30) |
| Kiribati | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 78.24 / 100.009 | 0.247 | 0.596 years | Exploratory summary; Insufficient pairs (<30) |
| Korea, Rep. | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 17.67 / 19.618 | 0.687 | 2.693 years | Exploratory summary; Insufficient pairs (<30) |
| Kuwait | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 35.773 / 50.19 | 0.586 | 1.177 years | Exploratory summary; Insufficient pairs (<30) |
| Lao PDR | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 16.32 / 22.355 | 0.431 | 1.394 years | Exploratory summary; Insufficient pairs (<30) |
| Lebanon | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 29.125 / 36.233 | 0.064 | -0.065 years | Exploratory summary; Insufficient pairs (<30) |
| Liberia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 14.93 / 32.291 | 0.86 | 3.941 years | Exploratory summary; Insufficient pairs (<30) |
| Libya | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 36.579 / 57.829 | -0.597 | -0.778 years | Exploratory summary; Insufficient pairs (<30) |
| St. Lucia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22.946 / 27.138 | -0.053 | 0.119 years | Exploratory summary; Insufficient pairs (<30) |
| Sri Lanka | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 18.342 / 20.889 | -0.7 | -2.894 years | Exploratory summary; Insufficient pairs (<30) |
| Lesotho | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 40.863 / 55.285 | 0.638 | 3.798 years | Exploratory summary; Insufficient pairs (<30) |
| Lithuania | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 34.543 / 40.543 | -0.065 | -0.107 years | Exploratory summary; Insufficient pairs (<30) |
| Luxembourg | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 39.222 / 42.825 | 0.275 | 0.046 years | Exploratory summary; Insufficient pairs (<30) |
| Latvia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 35.79 / 40.255 | 0.062 | -0.299 years | Exploratory summary; Insufficient pairs (<30) |
| Morocco | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 25.66 / 29.973 | 0.62 | 1.071 years | Exploratory summary; Insufficient pairs (<30) |
| Moldova | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 32.214 / 39.771 | -0.397 | -2.246 years | Exploratory summary; Insufficient pairs (<30) |
| Madagascar | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 12.69 / 16.755 | -0.446 | -1.259 years | Exploratory summary; Insufficient pairs (<30) |
| Maldives | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 28.927 / 36.88 | 0.202 | 0.732 years | Exploratory summary; Insufficient pairs (<30) |
| Mexico | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 20.75 / 26.377 | -0.331 | -0.953 years | Exploratory summary; Insufficient pairs (<30) |
| North Macedonia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 31.692 / 35.35 | -0.565 | -0.757 years | Exploratory summary; Insufficient pairs (<30) |
| Mali | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 19.427 / 22.51 | 0.345 | 1.121 years | Exploratory summary; Insufficient pairs (<30) |
| Malta | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 36.9 / 42.554 | -0.766 | -1.173 years | Exploratory summary; Insufficient pairs (<30) |
| Myanmar | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 15.03 / 21.3 | 0.545 | 3.489 years | Exploratory summary; Insufficient pairs (<30) |
| Montenegro | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 19 | 41.775 / 48.382 | 0.16 | 0.766 years | Exploratory summary; Insufficient pairs (<30) |
| Mongolia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 30.16 / 36.191 | 0.006 | -1.386 years | Exploratory summary; Insufficient pairs (<30) |
| Mozambique | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 19.144 / 30.533 | 0.865 | 4.186 years | Exploratory summary; Insufficient pairs (<30) |
| Mauritania | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 17 | 18.918 / 22.85 | -0.05 | -0.233 years | Exploratory summary; Insufficient pairs (<30) |
| Mauritius | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22.708 / 25.644 | 0.391 | -0.014 years | Exploratory summary; Insufficient pairs (<30) |
| Malawi | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 19 | 16.963 / 20.309 | 0.725 | 5.082 years | Exploratory summary; Insufficient pairs (<30) |
| Malaysia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.409 / 27.72 | -0.522 | -0.309 years | Exploratory summary; Insufficient pairs (<30) |
| Namibia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 29.564 / 39.24 | 0.552 | 4.243 years | Exploratory summary; Insufficient pairs (<30) |
| Niger | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 15.438 / 21.537 | 0.757 | 3.231 years | Exploratory summary; Insufficient pairs (<30) |
| Nigeria | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 9.15 / 14.711 | -0.872 | -3.581 years | Exploratory summary; Insufficient pairs (<30) |
| Nicaragua | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 21.055 / 26.02 | -0.1 | 0.108 years | Exploratory summary; Insufficient pairs (<30) |
| Netherlands | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 43.583 / 47.311 | 0.128 | 0.309 years | Exploratory summary; Insufficient pairs (<30) |
| Norway | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 42.6 / 49.078 | 0.53 | 0.811 years | Exploratory summary; Insufficient pairs (<30) |
| Nepal | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.75 / 22.986 | 0.718 | 1.598 years | Exploratory summary; Insufficient pairs (<30) |
| New Zealand | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 36.833 / 40.167 | 0.182 | 0.238 years | Exploratory summary; Insufficient pairs (<30) |
| Oman | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 31.85 / 41.044 | 0.17 | 0.276 years | Exploratory summary; Insufficient pairs (<30) |
| Pakistan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.712 / 18.585 | 0.865 | 2.376 years | Exploratory summary; Insufficient pairs (<30) |
| Panama | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 21.95 / 24 | -0.285 | -0.143 years | Exploratory summary; Insufficient pairs (<30) |
| Peru | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 19.95 / 21.933 | -0.35 | -0.196 years | Exploratory summary; Insufficient pairs (<30) |
| Philippines | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 18.033 / 21.133 | -0.363 | -0.483 years | Exploratory summary; Insufficient pairs (<30) |
| Papua New Guinea | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 19.608 / 23.875 | 0.309 | 0.441 years | Exploratory summary; Insufficient pairs (<30) |
| Poland | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 42.218 / 45.04 | -0.402 | -1.302 years | Exploratory summary; Insufficient pairs (<30) |
| Puerto Rico (U.S.) | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 7 | 21.25 / 22.167 | 0.075 | -0.232 years | Excluded; Insufficient pairs (<30) |
| Portugal | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 44.492 / 49.644 | 0.593 | 0.955 years | Exploratory summary; Insufficient pairs (<30) |
| Paraguay | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.767 / 18.583 | -0.522 | -0.514 years | Exploratory summary; Insufficient pairs (<30) |
| Qatar | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 28.764 / 34.5 | 0.441 | 1.276 years | Exploratory summary; Insufficient pairs (<30) |
| Romania | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 32.667 / 35.567 | -0.601 | -0.923 years | Exploratory summary; Insufficient pairs (<30) |
| Russian Federation | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 31.27 / 35.564 | 0.558 | 3.038 years | Exploratory summary; Insufficient pairs (<30) |
| Rwanda | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 20.19 / 26.518 | 0.772 | 7.033 years | Exploratory summary; Insufficient pairs (<30) |
| Saudi Arabia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 30.527 / 35.84 | 0.228 | -0.378 years | Exploratory summary; Insufficient pairs (<30) |
| Sudan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 11.433 / 18 | 0.183 | 0.464 years | Exploratory summary; Insufficient pairs (<30) |
| Senegal | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 18.044 / 24.275 | 0.796 | 3.878 years | Exploratory summary; Insufficient pairs (<30) |
| Singapore | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 11.44 / 16.145 | 0.092 | -0.394 years | Exploratory summary; Insufficient pairs (<30) |
| Solomon Islands | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 20.533 / 38.144 | 0.649 | 1.169 years | Exploratory summary; Insufficient pairs (<30) |
| Sierra Leone | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 10.71 / 13.718 | 0.716 | 4.25 years | Exploratory summary; Insufficient pairs (<30) |
| El Salvador | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22.77 / 27.809 | 0.115 | 0.085 years | Exploratory summary; Insufficient pairs (<30) |
| Serbia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 36.113 / 41.708 | 0.587 | 1.978 years | Exploratory summary; Insufficient pairs (<30) |
| South Sudan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 10 | 30.267 / 66.475 | -0.357 | -0.332 years | Exploratory summary; Insufficient pairs (<30) |
| São Tomé and Príncipe | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 29.836 / 49.91 | -0.19 | -1.401 years | Exploratory summary; Insufficient pairs (<30) |
| Suriname | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 21.825 / 29.244 | -0.206 | -0.027 years | Exploratory summary; Insufficient pairs (<30) |
| Slovak Republic | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 39.429 / 45.6 | -0.083 | -0.211 years | Exploratory summary; Insufficient pairs (<30) |
| Slovenia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 45.883 / 51.211 | 0.079 | 0.88 years | Exploratory summary; Insufficient pairs (<30) |
| Sweden | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 49.427 / 51.83 | -0.49 | -0.406 years | Exploratory summary; Insufficient pairs (<30) |
| Eswatini | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 27.378 / 33.225 | 0.626 | 5.221 years | Exploratory summary; Insufficient pairs (<30) |
| Seychelles | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 34.146 / 46.9 | 0.412 | 1.128 years | Exploratory summary; Insufficient pairs (<30) |
| Syrian Arab Republic | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 10 | 25.8 / 29.72 | -0.397 | -0.214 years | Exploratory summary; Insufficient pairs (<30) |
| Chad | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 10.867 / 15.825 | 0.125 | 0.123 years | Exploratory summary; Insufficient pairs (<30) |
| Togo | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 12.2 / 20.09 | 0.846 | 3.806 years | Exploratory summary; Insufficient pairs (<30) |
| Thailand | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 19.69 / 22.436 | 0.086 | 0.79 years | Exploratory summary; Insufficient pairs (<30) |
| Tajikistan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 20.95 / 29.822 | 0.904 | 2.362 years | Exploratory summary; Insufficient pairs (<30) |
| Turkmenistan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 14.417 / 20.244 | -0.518 | -0.851 years | Exploratory summary; Insufficient pairs (<30) |
| Timor-Leste | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 20 | 74.5 / 114.12 | 0.066 | 0.133 years | Exploratory summary; Insufficient pairs (<30) |
| Tonga | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22.236 / 36.21 | 0.444 | 0.791 years | Exploratory summary; Insufficient pairs (<30) |
| Trinidad and Tobago | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.513 / 32.092 | 0.336 | 1.282 years | Exploratory summary; Insufficient pairs (<30) |
| Tunisia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 23.645 / 29.07 | 0.127 | 0.597 years | Exploratory summary; Insufficient pairs (<30) |
| Türkiye | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 33.333 / 39.117 | -0.306 | -0.219 years | Exploratory summary; Insufficient pairs (<30) |
| Tanzania | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 14.857 / 18.221 | 0.65 | 4.323 years | Exploratory summary; Insufficient pairs (<30) |
| Uganda | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 13.42 / 16.645 | 0.09 | -1.44 years | Exploratory summary; Insufficient pairs (<30) |
| Ukraine | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 39.95 / 46.418 | 0.602 | 1.199 years | Exploratory summary; Insufficient pairs (<30) |
| Uruguay | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 27.008 / 29.925 | -0.043 | 0.868 years | Exploratory summary; Insufficient pairs (<30) |
| United States | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 20 | 34.579 / 39.833 | -0.105 | 0.358 years | Exploratory summary; Insufficient pairs (<30) |
| Uzbekistan | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 24.154 / 30.138 | -0.806 | -3.932 years | Exploratory summary; Insufficient pairs (<30) |
| St. Vincent and the Grenadines | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 26.062 / 30.225 | 0.183 | 0.194 years | Exploratory summary; Insufficient pairs (<30) |
| Venezuela, RB | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 20.817 / 34.56 | 0.508 | 0.892 years | Exploratory summary; Insufficient pairs (<30) |
| Viet Nam | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 20.242 / 23.378 | 0.055 | 0.229 years | Exploratory summary; Insufficient pairs (<30) |
| Vanuatu | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 22 / 34.989 | 0.454 | 1.41 years | Exploratory summary; Insufficient pairs (<30) |
| Samoa | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 28.7 / 31.742 | -0.211 | -0.074 years | Exploratory summary; Insufficient pairs (<30) |
| Yemen, Rep. | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 15.686 / 34.314 | 0.042 | -0.211 years | Exploratory summary; Insufficient pairs (<30) |
| South Africa | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 23.656 / 29.825 | 0.888 | 7.808 years | Exploratory summary; Insufficient pairs (<30) |
| Zambia | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 21 | 20.682 / 27.53 | 0.091 | 1.394 years | Exploratory summary; Insufficient pairs (<30) |
| Zimbabwe | [WHO HALE](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates) | 16 | 6.957 / 15.267 | 0.699 | 4.433 years | Exploratory summary; Insufficient pairs (<30) |

## Real after-tax median income: country results

| Country | Survey/source | Paired years | Lower / higher spending (% GDP) | Correlation | Outcome difference | Included in average |
| --- | --- | ---: | --- | ---: | ---: | --- |
| Austria | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 50.787 / 54.175 | 0.198 | 9.176 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Belgium | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 50.615 / 55.16 | 0.56 | 6.94 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Bulgaria | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 20 | 33.308 / 36.913 | 0.48 | 32.649 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Switzerland | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 19 | 31.15 / 33.211 | 0.526 | 3.773 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Cyprus | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 38.845 / 43.76 | 0.256 | 17.82 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Czechia | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 41.017 / 44.733 | -0.412 | -4.379 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Germany | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 22 | 44.767 / 48.55 | -0.021 | -7.938 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Denmark | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 49.9 / 54.669 | -0.36 | -11.776 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Spain | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 39.785 / 46.93 | 0.552 | 9.888 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Estonia | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 22 | 35.167 / 40.454 | 0.516 | 49.597 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Finland | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 47.689 / 54.679 | 0.692 | 23.577 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| France | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 53.89 / 58.177 | 0.803 | 19.738 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| United Kingdom | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 17 | 37.7 / 42.6 | -0.202 | -4.048 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Greece | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 47.9 / 54.055 | -0.285 | -8.141 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Croatia | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 16 | 45.257 / 48.789 | -0.176 | -10.183 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Hungary | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 47.589 / 50.117 | -0.639 | -5.718 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Ireland | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 28.547 / 44.325 | -0.564 | -9.346 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Iceland | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 19 | 44.467 / 50.786 | -0.376 | -11.866 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Italy | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 47.593 / 52.322 | 0.682 | 6.897 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Lithuania | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 34.529 / 40.343 | 0.329 | 28.328 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Luxembourg | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 39.43 / 43.023 | 0.551 | 6.797 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Latvia | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 36.675 / 41.856 | 0.503 | 34.373 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| North Macedonia | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 14 | 31.622 / 34.72 | 0.266 | 6.837 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Malta | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 36.588 / 42.008 | -0.691 | -32.074 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Montenegro | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 10 | 45.483 / 49.5 | 0.321 | 8.599 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Netherlands | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 22 | 43.517 / 47.17 | -0.191 | 0.063 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Norway | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 41.958 / 48.473 | 0.206 | 3.589 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Poland | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 42.227 / 44.93 | -0.41 | -20.604 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Portugal | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 23 | 44.446 / 49.41 | -0.16 | -0.081 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Romania | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 19 | 33.027 / 36.387 | 0.189 | 10.391 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Serbia | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 13 | 40.244 / 44.15 | 0.153 | 2.089 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Slovak Republic | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 39.158 / 43.311 | -0.224 | -62.015 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Slovenia | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 21 | 45.875 / 51.289 | -0.107 | -98.034 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Sweden | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 22 | 49.331 / 51.789 | -0.641 | -10.655 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |
| Türkiye | [Eurostat EU-SILC](https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en) | 20 | 31.488 / 34.658 | 0.509 | 16.389 % of lower-spending baseline income | Exploratory summary; Insufficient pairs (<30) |

## Earlier spending-floor hypothesis

Original report generated: 2026-04-06T06:40:33.931Z.
The earlier calculation chose the lowest spending bin near the best observed composite score. These historical hypotheses are retained for comparison, not recalculated as national welfare-maximizing budgets.

| Earlier objective | US-equivalent floor (% GDP) | Band (% GDP) | Qualifying jurisdictions |
| --- | ---: | --- | ---: |
| Combined Direct Welfare | 23.448 | 22.477–24.3 | 18 |
| Healthy Life Expectancy Only | 20.054 | 18.225–22.477 | 29 |
| Median Income Only | 27.838 | 24.3–44.661 | 16 |
