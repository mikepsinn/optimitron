# Aggregated N-of-1 Raw Data (Drug-War Proxy)

This folder contains the downloaded source files needed for a cross-jurisdiction
aggregated N-of-1 analysis of a drug-war spending proxy vs overdose-like outcomes.

## Files

- `oecd-public-order-safety-spending-gf03-xdc.csv`
  - Source: OECD SDMX `DSD_NASEC10@DF_TABLE11`
  - Slice: `GF03` (Public order and safety), `OTE` (total government expenditure), `S13` (general government)
  - Unit: `XDC` (national currency), annual
- `oecd-accidental-poisoning-death-rate-cicdposn.csv`
  - Source: OECD SDMX `DSD_HEALTH_STAT@DF_COM`
  - Slice: `CICDPOSN` (accidental poisoning), `CSEM` (mortality), `DT_10P5HB` (deaths per 100,000), sex=`_T`, age=`_T`
- `wb-gdp-current-lcu-ny-gdp-mktp-cn.json`
  - Source: World Bank indicator `NY.GDP.MKTP.CN` (GDP, current local currency unit)
- `wb-gdp-per-capita-ppp-current-ny-gdp-pcap-pp-cd.json`
  - Source: World Bank indicator `NY.GDP.PCAP.PP.CD` (GDP per capita, PPP, current international $)
- `wb-population-total-sp-pop-totl.json`
  - Source: World Bank indicator `SP.POP.TOTL`
- `wb-poisoning-mortality-sh-sta-pois-p5.json`
  - Source: World Bank indicator `SH.STA.POIS.P5` (unintentional poisoning mortality per 100,000)
- `download-manifest.json`
  - Download metadata (URL, file size, timestamp)
- `derived-drug-war-proxy-panel.csv`
  - Joined panel for analysis (country-year rows)
- `derived-drug-war-proxy-panel.coverage.json`
  - Coverage summary for the derived panel

## Derived Metrics

In `derived-drug-war-proxy-panel.csv`:

- `publicOrderSafetySpendingPctGdp`
  - `100 * publicOrderSafetySpendingLcu / gdpCurrentLcu`
- `publicOrderSafetySpendingPerCapitaPpp`
  - `(publicOrderSafetySpendingPctGdp / 100) * gdpPerCapitaPppCurrent`

## Important Caveats

- `GF03` is a **proxy** for drug-war spending. It includes broader public order and safety spending, not only narcotics enforcement.
- OECD outcome (`CICDPOSN`) is accidental poisoning mortality, which is overdose-adjacent but not a pure drug-overdose series.
- World Bank poisoning mortality (`SH.STA.POIS.P5`) has broader jurisdiction coverage but is also not opioid-specific.
- This panel is suitable for immediate aggregated N-of-1 prototyping, but a stricter drug-enforcement and overdose-specific panel should still be pursued.
