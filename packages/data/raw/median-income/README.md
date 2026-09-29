# Disposable-income source snapshot

Public source responses retrieved on 2026-09-29. `manifest.json` records URLs,
retrieval times, and SHA-256 checksums. No survey microdata is included.

Replay the OECD and Eurostat series without refreshing unrelated PIP/IMF data:

```sh
pnpm --filter @optimitron/data exec tsx scripts/generate-median-income-series.ts --survey-snapshot
pnpm --filter @optimitron/data run generate:country-panel --income-only
pnpm --filter @optimitron/web run generate
```

Constant 2021 income is nominal local income multiplied by
`CPI(2021) / CPI(observation year)`, then divided by **2021** private-consumption
PPP. Exact-year factors are required. Reindexing CPI cannot change the result.
Current-year PPP converts nominal income only.

The comparison panel uses OECD IDD METH2012/D_CUR, square-root household
equivalence, OECD CPI, and OECD PPP for every country. Eurostat uses a different
equivalence scale and stays outside that comparison cohort.

Some historical Eurostat national-currency amounts still use currencies that
World Bank has rebased to euros. Keep their nominal observations but withhold
derived amounts until units are reconciled: BGR before 2026, HRV before 2023,
LTU before 2015, CYP before 2009, MLT before 2007, SVN before 2007, SVK before
2009. These are observed source-series breaks, not inferred adoption dates.
EST and LVA are already back-converted. See World Bank's denomination notes for
[Croatia](https://databank.worldbank.org/metadataglossary/world-development-indicators/country/HRV)
and [Bulgaria](https://databank.worldbank.org/metadataglossary/world-development-indicators/country/BGR).

OECD's grouped TIME_PERIOD JSON response repeated series keys and lost
observations during JSON parsing. AllDimensions returns 622 income observations;
580 have the factors needed for constant-2021 conversion. Its CSV response gives
the same 622 observations. The reduced real-response test fixture preserves
multiple years and tests dimension order and dataset-selected structures.

At 2021 prices, the pinned 2021 observations give US income of $46,600 and
Swiss income of $43,083.79 (CHF53,624.15687 / 1.24464797973633).
The independent [OECD Society at a Glance 2024 workbook](https://stat.link/files/918d8db3-en/1or2b8.xlsx)
also places the US above Switzerland, but uses an earlier vintage ($46,625 and
$39,697.52). The [OECD methodology](https://www.oecd.org/en/publications/society-at-a-glance-2024_918d8db3-en/full-report/household-income_3ee61044.html)
defines disposable income, square-root equivalence, and private-consumption PPP.
