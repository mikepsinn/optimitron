/* eslint-disable eqeqeq -- intentional nullish checks while normalizing sparse external data */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AggregatedNOf1DrugEnforcementRow {
  iso3: string;
  year: number;
  publicOrderSafetySpendingLcu: number | null;
  publicOrderSafetySpendingPctGdp: number | null;
  publicOrderSafetySpendingPerCapitaPpp: number | null;
  drugTraffickingArrestsCount: number | null;
  drugPossessionArrestsCount: number | null;
  totalArrestsCount: number | null;
  drugTraffickingArrestShare: number | null;
  drugLawArrestShare: number | null;
  estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp: number | null;
  estimatedDrugLawEnforcementSpendingPerCapitaPpp: number | null;
  oecdAccidentalPoisoningDeathsPer100k: number | null;
  wbUnintentionalPoisoningDeathsPer100k: number | null;
  spendingCurrency: string | null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const DEFAULT_AGGREGATED_NOF1_DRUG_ENFORCEMENT_PANEL_PATH = resolve(
  __dirname,
  '..',
  '..',
  'raw',
  'aggregated-nof1',
  'derived-drug-enforcement-panel.csv',
);

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line.charAt(index);
    if (inQuotes) {
      if (char === '"') {
        if (index + 1 < line.length && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function parseNullableNumber(raw: string | undefined): number | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return value;
}

function parseRequiredYear(raw: string | undefined): number | null {
  if (raw == null) return null;
  const year = Number(raw.trim());
  if (!Number.isInteger(year) || year < 0) return null;
  return year;
}

function headerIndexMap(headerLine: string): Map<string, number> {
  const headers = parseCsvLine(headerLine);
  const mapping = new Map<string, number>();
  headers.forEach((header, index) => {
    const normalized = header.replace(/^\uFEFF/, '').trim();
    mapping.set(normalized, index);
  });
  return mapping;
}

function getField(fields: string[], mapping: Map<string, number>, key: string): string | undefined {
  const index = mapping.get(key);
  if (index == null) return undefined;
  return fields[index];
}

export function parseAggregatedNOf1DrugEnforcementCsv(
  csvText: string,
): AggregatedNOf1DrugEnforcementRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const headerLine = lines[0];
  if (headerLine === undefined) return [];
  const mapping = headerIndexMap(headerLine);
  const rows: AggregatedNOf1DrugEnforcementRow[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const line = lines[rowIndex];
    if (line === undefined) continue;
    const fields = parseCsvLine(line);
    const iso3Raw = getField(fields, mapping, 'iso3')?.trim() ?? '';
    const year = parseRequiredYear(getField(fields, mapping, 'year'));
    if (iso3Raw.length !== 3 || year == null) continue;

    const spendingCurrencyRaw = getField(fields, mapping, 'spendingCurrency')?.trim();
    rows.push({
      iso3: iso3Raw,
      year,
      publicOrderSafetySpendingLcu: parseNullableNumber(
        getField(fields, mapping, 'publicOrderSafetySpendingLcu'),
      ),
      publicOrderSafetySpendingPctGdp: parseNullableNumber(
        getField(fields, mapping, 'publicOrderSafetySpendingPctGdp'),
      ),
      publicOrderSafetySpendingPerCapitaPpp: parseNullableNumber(
        getField(fields, mapping, 'publicOrderSafetySpendingPerCapitaPpp'),
      ),
      drugTraffickingArrestsCount: parseNullableNumber(
        getField(fields, mapping, 'drugTraffickingArrestsCount'),
      ),
      drugPossessionArrestsCount: parseNullableNumber(
        getField(fields, mapping, 'drugPossessionArrestsCount'),
      ),
      totalArrestsCount: parseNullableNumber(getField(fields, mapping, 'totalArrestsCount')),
      drugTraffickingArrestShare: parseNullableNumber(
        getField(fields, mapping, 'drugTraffickingArrestShare'),
      ),
      drugLawArrestShare: parseNullableNumber(getField(fields, mapping, 'drugLawArrestShare')),
      estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp: parseNullableNumber(
        getField(fields, mapping, 'estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp'),
      ),
      estimatedDrugLawEnforcementSpendingPerCapitaPpp: parseNullableNumber(
        getField(fields, mapping, 'estimatedDrugLawEnforcementSpendingPerCapitaPpp'),
      ),
      oecdAccidentalPoisoningDeathsPer100k: parseNullableNumber(
        getField(fields, mapping, 'oecdAccidentalPoisoningDeathsPer100k'),
      ),
      wbUnintentionalPoisoningDeathsPer100k: parseNullableNumber(
        getField(fields, mapping, 'wbUnintentionalPoisoningDeathsPer100k'),
      ),
      spendingCurrency:
        spendingCurrencyRaw && spendingCurrencyRaw.length > 0 ? spendingCurrencyRaw : null,
    });
  }

  return rows;
}

export function loadAggregatedNOf1DrugEnforcementPanel(
  filePath: string = DEFAULT_AGGREGATED_NOF1_DRUG_ENFORCEMENT_PANEL_PATH,
): AggregatedNOf1DrugEnforcementRow[] {
  const csvText = readFileSync(filePath, 'utf8');
  return parseAggregatedNOf1DrugEnforcementCsv(csvText);
}
