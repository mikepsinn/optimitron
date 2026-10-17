import { describe, expect, it } from 'vitest';
import type { DataRecord } from '../src/lib/schema';
import { checkPageHtml } from './page-check';

const record: DataRecord = {
  id: 'hale-at-birth:USA:2023', variable: 'hale-at-birth', unit: 'years', geo: 'USA', year: 2023,
  value: 64.63, low: 60.9, high: 67.9, source: 'who-gho-hale', rowKey: 1,
};
const records = new Map([[record.id, record]]);
const cell = (text: string, field = 'value', id = record.id) =>
  `<data value="0" data-record="${id}" data-field="${field}">${text}</data>`;
const check = (body: string) => checkPageHtml('page.html', `<html><head><title>9.9</title></head><body>${body}</body></html>`, records);

describe('checkPageHtml', () => {
  it('accepts correct roundings of record fields and plain integers', () => {
    expect(check(`<p>In 2023, ${cell('64.6')} (${cell('60.9', 'low')}–${cell('67.9', 'high')}) across 185 countries.</p>`)).toEqual([]);
  });

  it('rejects an unsourced decimal, percentage, or money amount in visible text', () => {
    expect(check('<p>HALE rose 2.4 years, 12% faster, for $5 billion.</p>')).toHaveLength(3);
  });

  it('ignores numbers inside scripts and the document head', () => {
    expect(check('<script>self.__next_f.push([1,"64.63"])</script><p>ok</p>')).toEqual([]);
  });

  it('rejects a shown value that is not a correct rounding of the record', () => {
    expect(check(cell('64.7'))).toEqual(['page.html: shows 64.7 for hale-at-birth:USA:2023.value, record is 64.63']);
  });

  it('rejects a citation to a record or field that does not exist', () => {
    expect(check(cell('64.6', 'value', 'hale-at-birth:USA:1999'))).toEqual(['page.html: hale-at-birth:USA:1999 is not a record']);
    expect(check(cell('64.6', 'median'))).toEqual(['page.html: hale-at-birth:USA:2023 has no numeric field "median"']);
  });
});
