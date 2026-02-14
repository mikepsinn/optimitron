# Government Spending Metric Comparison

Window: 1990-2023, jurisdictions: 50

## Internationally Comparable Metrics

| Metric | Source | US Latest | Analysis Coverage | Global Coverage |
|--------|--------|-----------|------------------|-----------------|
| General Government Expense (% GDP) | World Bank WDI GC.XPN.TOTL.GD.ZS | 2023: 24.9% | 1402 obs / 47 jurisdictions | 4241 obs / 186 jurisdictions |
| General Government Final Consumption (% GDP) | World Bank WDI NE.CON.GOVT.ZS | 2022: 13.9% | 1639 obs / 49 jurisdictions | 6798 obs / 223 jurisdictions |
| Government Expense Per Capita (PPP) | Derived from GC.XPN.TOTL.GD.ZS and NY.GDP.PCAP.PP.CD | 2023: $20,492 | 1402 obs / 47 jurisdictions | 4241 obs / 186 jurisdictions |

## US-Only Context Metrics (Not Cross-Country Comparable Defaults)

| Metric | Source | Latest | Latest Calendar-Year Average |
|--------|--------|--------|------------------------------|
| Federal Net Outlays (% GDP) | FRED FYONGDA188S | 2024-01-01: 23.0% | 2024: 23.0% |
| Federal + State/Local Current Expenditures (% GDP, derived) | FRED FGEXPND + SLEXPND over GDP | 2025-07-01: 37.9% | 2025: 37.9% |
| Government Consumption + Investment (% GDP, derived) | FRED GCE over GDP | 2025-07-01: 17.1% | 2025: 17.2% |

## Recommendation

Primary default for international comparison: `wb.gc_xpn_totl_gd_zs`

- GC.XPN.TOTL.GD.ZS is the broadest internationally harmonized spending-size series in the current pipeline.
- It is already available for the full analysis panel and aligns with the current cross-country optimizer input.
- Per-capita PPP companion metrics help separate real spending scale from GDP-ratio denominator effects.

Caveats:
- Different accounting frameworks can still reduce comparability across countries.
- Expense % GDP reflects both numerator policy changes and denominator (GDP) fluctuations.
- US-only flow measures (federal outlays, federal+state/local current expenditures) are useful context but not panel-compatible defaults.
