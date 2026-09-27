#!/usr/bin/env tsx

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { COUNTRY_PANEL, COUNTRY_PANEL_METADATA, fetchers } from "@optimitron/data";
import {
  fetchStrictAfterTaxMedianIncomeSeries,
  getMedianIncomeSeries,
  MEDIAN_INCOME_SERIES_METADATA,
} from "@optimitron/data/datasets/median-income-series";
import type { GovernmentSizeAnalysis, HistoricalGovernmentSizeAnalysis } from "../src/lib/government-size-analysis";
import {
  generateGovernmentWelfareAnalysis,
  generateGovernmentWelfareMarkdown,
  GOVERNMENT_WELFARE_SOURCE_URLS as urls,
  type GovernmentWelfareSourceCache,
  type WelfareObservation,
} from "./analysis/government-welfare-analysis";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(appRoot, "src/data/us-government-size-analysis.json");
const markdownTarget = resolve(appRoot, "public/reports/us-government-size-analysis.md");
const period = { startYear: 2000, endYear: 2023 };

async function loadSources(refresh: boolean): Promise<GovernmentWelfareSourceCache> {
  const names = new Map(COUNTRY_PANEL.map(row => [row.jurisdictionIso3, row.jurisdictionName]));
  const incomeQuery = { period, strictAfterTaxOnly: true, priceBasis: "real" as const, purchasingPower: "ppp" as const, excludeInterpolated: true };
  if (refresh) {
    const [spending, hale, income] = await Promise.all([
      fetchers.fetchIMFGovExpenditurePctGDP({ period }),
      fetchers.fetchWHOHealthyLifeExpectancy({ period }),
      fetchStrictAfterTaxMedianIncomeSeries(incomeQuery),
    ]);
    if (!spending.length || !hale.length || !income.length) {
      throw new Error(`Source refresh incomplete: IMF=${spending.length}, WHO=${hale.length}, strict income=${income.length}. Existing report was not replaced.`);
    }
    const now = new Date().toISOString();
    const named = (point: { jurisdictionIso3: string; year: number; value: number; source?: string }, source: string, sourceUrl: string): WelfareObservation => ({
      ...point, jurisdictionName: names.get(point.jurisdictionIso3) ?? point.jurisdictionIso3, source, sourceUrl,
    });
    return {
      schemaVersion: 1,
      sourceMode: "IMF and WHO fetched live; strict OECD/Eurostat income combines retained records with live responses",
      sourceSnapshots: [
        { name: "IMF spending / WHO HALE live fetch", generatedAt: now, url: urls.imf },
        { name: "Bundled income records eligible for retained fetcher fallback", generatedAt: MEDIAN_INCOME_SERIES_METADATA.generatedAt, url: "https://data-explorer.oecd.org/" },
      ],
      spending: spending.map(point => named(point, "IMF Fiscal Monitor", urls.imf)),
      hale: hale.map(point => named(point, "WHO HALE", urls.who)),
      income,
    };
  }
  const panelPoints = (field: "totalGovSpendingPctGdp" | "haleYears", source: string, sourceUrl: string): WelfareObservation[] => COUNTRY_PANEL.flatMap(row => {
    const value = row[field];
    return value == null ? [] : [{ jurisdictionIso3: row.jurisdictionIso3, jurisdictionName: row.jurisdictionName, year: row.year, value, source, sourceUrl }];
  });
  return {
    schemaVersion: 1,
    sourceMode: "Bundled public source snapshots; no new network fetch",
    sourceSnapshots: [
      { name: "Country panel: IMF spending", generatedAt: COUNTRY_PANEL_METADATA.generatedAt, url: urls.imf },
      { name: "Country panel: WHO HALE (both sexes)", generatedAt: COUNTRY_PANEL_METADATA.healthRefresh?.refreshedAt ?? COUNTRY_PANEL_METADATA.generatedAt, url: urls.who },
      { name: "Strict OECD / Eurostat disposable-income records", generatedAt: MEDIAN_INCOME_SERIES_METADATA.generatedAt, url: "https://data-explorer.oecd.org/" },
    ],
    spending: panelPoints("totalGovSpendingPctGdp", "IMF Fiscal Monitor", urls.imf),
    hale: panelPoints("haleYears", "WHO HALE", urls.who),
    income: getMedianIncomeSeries(incomeQuery),
  };
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: {
    "source-cache": { type: "string" },
    "write-source-cache": { type: "string" },
    "refresh-sources": { type: "boolean", default: false },
    "generated-at": { type: "string" },
  } });
  if (values["source-cache"] && values["refresh-sources"]) throw new Error("Choose a source cache or a live refresh, not both.");
  const source = values["source-cache"]
    ? JSON.parse(readFileSync(resolve(values["source-cache"]), "utf8")) as GovernmentWelfareSourceCache
    : await loadSources(values["refresh-sources"]);
  const previous = JSON.parse(readFileSync(target, "utf8")) as GovernmentSizeAnalysis | HistoricalGovernmentSizeAnalysis;
  const historicalBenchmark = "schemaVersion" in previous ? previous.historicalBenchmark : previous;
  const report = generateGovernmentWelfareAnalysis(source, { generatedAt: values["generated-at"], historicalBenchmark });
  if (values["write-source-cache"]) {
    const cacheTarget = resolve(values["write-source-cache"]);
    mkdirSync(dirname(cacheTarget), { recursive: true });
    writeFileSync(cacheTarget, `${JSON.stringify(source, null, 2)}\n`);
  }
  mkdirSync(dirname(markdownTarget), { recursive: true });
  writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(markdownTarget, generateGovernmentWelfareMarkdown(report));
  console.log(`Government welfare report generated ${report.generatedAt}. ${report.sourceMode}.`);
  for (const outcome of report.outcomes) console.log(`${outcome.name}: ${outcome.countryCount} countries, ${outcome.sourceObservationCount} source observations.`);
  console.log(`JSON: ${target}\nMarkdown: ${markdownTarget}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
