import { NUMERIC_FIELDS, type DataRecord, type NumericField } from '../src/lib/schema';

const DATA_ELEMENT = /<data\b([^>]*)>([^<]*)<\/data>/g;
const ATTRIBUTE = /([\w-]+)="([^"]*)"/g;
/** Decimals, percentages, and money. Plain integers (years, counts) are allowed. */
const UNSOURCED_NUMBER = /\d+\.\d+|\d+\s?%|[$€£]\s?\d/g;

function attributes(source: string): Record<string, string> {
  return Object.fromEntries([...source.matchAll(ATTRIBUTE)].map(match => [match[1], match[2]]));
}

function visibleText(html: string): string {
  return html
    .replace(/<head\b[\s\S]*?<\/head>/gi, ' ')
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Every displayed number with a decimal, %, or currency sign must be a <data> element
 * that cites a record, and its text must be a correct rounding of that record field.
 */
export function checkPageHtml(file: string, html: string, records: Map<string, DataRecord>): string[] {
  const errors: string[] = [];
  for (const [, rawAttributes, text] of html.matchAll(DATA_ELEMENT)) {
    const { 'data-record': recordId, 'data-field': field = 'value' } = attributes(rawAttributes);
    if (!recordId) {
      errors.push(`${file}: <data>${text}</data> has no data-record`);
      continue;
    }
    const record = records.get(recordId);
    if (!record) {
      errors.push(`${file}: ${recordId} is not a record`);
      continue;
    }
    if (!NUMERIC_FIELDS.includes(field as NumericField) || record[field as NumericField] === undefined) {
      errors.push(`${file}: ${recordId} has no numeric field "${field}"`);
      continue;
    }
    const expected = record[field as NumericField] as number;
    const decimals = text.includes('.') ? text.split('.')[1].length : 0;
    const shown = Number(text.replace(/,/g, ''));
    if (!Number.isFinite(shown) || Math.abs(shown - expected) > 0.5 * 10 ** -decimals + 1e-9) {
      errors.push(`${file}: shows ${text} for ${recordId}.${field}, record is ${expected}`);
    }
  }
  const unsourced = visibleText(html.replace(DATA_ELEMENT, ' ')).match(UNSOURCED_NUMBER) ?? [];
  for (const number of new Set(unsourced)) {
    errors.push(`${file}: "${number}" has no record. Render it with <RecordValue>.`);
  }
  return errors;
}
