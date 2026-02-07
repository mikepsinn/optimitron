/**
 * WHO Global Health Observatory (GHO) HALE Fetcher
 *
 * Fetches Healthy Life Expectancy (HALE) at birth by country.
 * API endpoint: https://ghoapi.azureedge.net/api/WHOSIS_000002
 */

import type { FetchOptions } from '../types.js';

const GHO_API_BASE = 'https://ghoapi.azureedge.net/api';
const WHO_HALE_INDICATOR_CODE = 'WHOSIS_000002';

const DEFAULT_RATE_LIMIT_MS = 250;
const DEFAULT_MAX_RETRIES = 3;

export interface WHOHALERecord {
  countryIso3: string;
  year: number;
  haleYears: number;
  source: string;
}

interface GHORawRecord {
  SpatialDim: string;
  TimeDim: string;
  NumericValue: number | null;
}

interface GHOResponse {
  value: GHORawRecord[];
  '@odata.nextLink'?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGHOFilter(options: FetchOptions): string {
  const parts: string[] = [];

  if (options.jurisdictions?.length) {
    const countryFilter = options.jurisdictions.map((c) => `SpatialDim eq '${c}'`).join(' or ');
    parts.push(`(${countryFilter})`);
  }

  if (options.period) {
    parts.push(`TimeDim ge '${options.period.startYear}' and TimeDim le '${options.period.endYear}'`);
  }

  // Both sexes (BTSX) for HALE
  parts.push("Dim1 eq 'BTSX'");

  return parts.join(' and ');
}

export function parseWHOHALERecords(records: GHORawRecord[]): WHOHALERecord[] {
  return records
    .filter((record) => record.NumericValue !== null && record.SpatialDim)
    .map((record) => ({
      countryIso3: record.SpatialDim,
      year: parseInt(record.TimeDim, 10),
      haleYears: record.NumericValue as number,
      source: `WHO GHO (${WHO_HALE_INDICATOR_CODE})`,
    }));
}

export interface WHOHALEFetcherOptions {
  rateLimitMs?: number;
  maxRetries?: number;
}

export class WHOHALEFetcher {
  private readonly rateLimitMs: number;
  private readonly maxRetries: number;

  constructor(options: WHOHALEFetcherOptions = {}) {
    this.rateLimitMs = options.rateLimitMs ?? DEFAULT_RATE_LIMIT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  async fetch(options: FetchOptions = {}): Promise<WHOHALERecord[]> {
    const filter = buildGHOFilter(options);
    let url = `${GHO_API_BASE}/${WHO_HALE_INDICATOR_CODE}?$filter=${encodeURI(filter)}`;
    const records: GHORawRecord[] = [];

    try {
      while (url) {
        const page = await this.fetchPage(url);
        if (!page) break;

        records.push(...page.value);

        if (options.limit && records.length >= options.limit) {
          break;
        }

        url = page['@odata.nextLink'] ?? '';

        if (url && this.rateLimitMs > 0) {
          await sleep(this.rateLimitMs);
        }
      }
    } catch (error) {
      console.error('WHO HALE fetch error:', error);
      return [];
    }

    const parsed = parseWHOHALERecords(records);
    return options.limit ? parsed.slice(0, options.limit) : parsed;
  }

  private async fetchPage(url: string): Promise<GHOResponse | null> {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          const backoffMs = this.rateLimitMs * Math.pow(2, attempt);
          await sleep(backoffMs);
          attempt += 1;
          continue;
        }

        if (!response.ok) {
          console.warn(`WHO HALE API ${response.status}: ${response.statusText}`);
          return null;
        }

        return (await response.json()) as GHOResponse;
      } catch (error) {
        if (attempt >= this.maxRetries) {
          console.error('WHO HALE fetch error:', error);
          return null;
        }

        const backoffMs = this.rateLimitMs * Math.pow(2, attempt);
        await sleep(backoffMs);
      }

      attempt += 1;
    }

    return null;
  }
}

export const WHO_HALE_SOURCE_URL = `${GHO_API_BASE}/${WHO_HALE_INDICATOR_CODE}`;
