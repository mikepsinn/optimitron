# @optimitron/data

Data fetchers (OECD, World Bank, WHO, FRED, Congress.gov) and health data importers (Apple Health, Fitbit, Oura, MyFitnessPal, Withings, Google Fit, Cronometer, Strava, generic CSV).

All importers are file-based and local-first — parse user data exports without requiring OAuth or API keys.

**Paper:** [dFDA Specification](https://dfda-spec.warondisease.org) — Data ingestion and standardization for the decentralized FDA framework.

## Features

- 5 API fetchers with caching
- 9 health data importers (all output unified `ParsedHealthRecord` format)
- 80+ canonical variable definitions with `resolveVariableName()`
- Economic data CSV loader (Gapminder format)
- Streaming XML parser for large files (500MB+ Apple Health exports)

## Tests

296 unit tests.

```bash
pnpm test --filter @optimitron/data
```
