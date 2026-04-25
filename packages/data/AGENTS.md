# AGENTS.md — @optimitron/data

## Scope

Data fetchers and importers — OECD, World Bank, WHO, FRED, Congress, IMF, Census, plus health data importers (Apple Health, Fitbit, Oura, etc.), unit conversion, inflation adjustment, and curated datasets.

## Key Exports (do not break these signatures)

- `fetchers` namespace — all public data source fetchers
- `catalog` — curated dataset catalog
- `importers` — health data import pipeline
- `jurisdictions` — jurisdiction registry
- `wishocraticItemsRegistry` — item catalog for RAPPA
- `datasets` — pre-aggregated datasets
- `parameters` sub-path — calculation parameters and citations

## Dependencies

- `@optimitron/optimizer` — time series types and utilities
- `import type` from `@optimitron/db` is OK (type-only)

## Rules

- **No Prisma runtime imports.** Use `import type` only from `@optimitron/db`.
- **Fetchers must be pluggable.** Take jurisdiction config as a parameter — no hardcoded data sources.
- **Rate limit external APIs.** Always respect rate limits and cache responses.

## Off-Limits

- `packages/optimizer/*` — use it, don't modify it
- `packages/web/*`
- `packages/db/prisma/schema.prisma`
