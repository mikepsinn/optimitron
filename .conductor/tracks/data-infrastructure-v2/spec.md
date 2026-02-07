# Track Spec: OECD + Direct Outcomes + FRED Improvements (v2)

## Background
The current data backbone mixes real OECD panel series with synthetic direct outcomes, and fetcher reliability varies by source. OBG and OPG need consistent, provenance-backed datasets for PPP-adjusted spending, outcomes, and confound controls.

## Objectives
- Expand OECD panel coverage with direct outcomes fields.
- Replace or explicitly mark synthetic direct outcomes.
- Improve FRED pipeline reliability and caching.
- Document provenance and dataset versions for reproducibility.

## Data Sources
- OECD panel data
- World Bank PPP
- FRED
- WHO HALE
- Direct outcomes by category (education, healthcare, crime, climate)

## Standards
- Per-capita PPP as the primary spending metric
- % GDP as a secondary metric
- GDP deflator option for US conversion

## Deliverables
- Updated datasets with provenance metadata
- Fetchers with caching and versioning
- JSDoc documentation of all sources

## Acceptance Criteria
- All sources have documented provenance and versioning metadata.
- Direct outcomes are sourced or clearly labeled as simulated.
- OECD panel includes direct outcomes fields.
- FRED fetcher is reliable with key + rate-limit handling.

## Risks
- Gaps in education or climate outcome series.
- Source volatility or API limits requiring fallbacks.
