import { describe, expect, it } from 'vitest';
import { buildServiceCountry, parseShaXml } from '../../scripts/generate-healthcare-services.js';

type Row = Parameters<typeof buildServiceCountry>[2][number];
const dimensions = {
  REF_AREA: 'JPN', FREQ: 'A', MEASURE: 'EXP_HEALTH', UNIT_MEASURE: 'PT_EXP_HLTH',
  FINANCING_SCHEME: '_T', FINANCING_SCHEME_REV: '_Z', FUNCTION: '_T',
  MODE_PROVISION: '_T', PROVIDER: '_T', FACTOR_PROVISION: '_Z', ASSET_TYPE: '_Z', PRICE_BASE: '_Z',
};
const fixture = (): Row[] => [2017, 2018, 2019].flatMap(year => [
  ['_T', '_T', 100], ['_T', 'HC1', 70], ['_T', 'HC2', 30],
  ['HF1', '_T', 60], ['HF1', 'HC1', 45], ['HF1', 'HC2', 15],
].map(([fund, func, value]) => ({
  dimensions: { ...dimensions, FINANCING_SCHEME: String(fund), FUNCTION: String(func) },
  year, value: Number(value),
})));

describe('SHA healthcare service composition', () => {
  it('normalizes compulsory spending within its own total, not all financing', () => {
    const result = buildServiceCountry('JPN', 'Japan', fixture());
    expect(result.services.find(s => s.id === 'HC1')).toMatchObject({
      sharePercent: 70, governmentCompulsorySharePercent: 75,
    });
    expect(result.governmentCompulsoryPercentOfTotal).toBe(60);
    expect(result.governmentCompulsoryUnallocatedSharePercent).toBe(0);
  });

  it('keeps a missing year unpriced and allocates no invented function value', () => {
    const rows = fixture().filter(r => !(r.year === 2018 && r.dimensions.FINANCING_SCHEME === '_T' && r.dimensions.FUNCTION === 'HC2'));
    const result = buildServiceCountry('JPN', 'Japan', rows);
    expect(result.services.find(s => s.id === 'HC2')?.sharePercent).toBeNull();
    expect(result.unallocatedSharePercent).toBe(30);
    expect(buildServiceCountry('SGP', 'Singapore', rows).unallocatedSharePercent).toBeNull();
  });

  it('rejects overlapping categories, duplicate rows and different source scopes', () => {
    const overlap = fixture().map(r => r.dimensions.FUNCTION === 'HC2' && r.dimensions.FINANCING_SCHEME === '_T' ? { ...r, value: 50 } : r);
    expect(() => buildServiceCountry('JPN', 'Japan', overlap)).toThrow('overlap');
    const rows = fixture();
    expect(() => buildServiceCountry('JPN', 'Japan', [...rows, rows[0]!])).toThrow('Duplicate');
    expect(() => buildServiceCountry('JPN', 'Japan', rows.map(r => ({ ...r, dimensions: { ...r.dimensions, PROVIDER: 'HP1' } })))).toThrow('dimension');
  });

  it('reads official numeric series while keeping an absent value distinct from zero', () => {
    const key = Object.entries(dimensions).map(([id, value]) => `<generic:Value id="${id}" value="${value}" />`).join('');
    const xml = `<message:GenericData><generic:Series><generic:SeriesKey>${key}</generic:SeriesKey>
      <generic:Obs><generic:ObsDimension id="TIME_PERIOD" value="2017" /><generic:ObsValue value="0" /></generic:Obs>
      <generic:Obs><generic:ObsDimension id="TIME_PERIOD" value="2018" /></generic:Obs>
      </generic:Series></message:GenericData>`;
    expect(parseShaXml(xml).map(r => r.value)).toEqual([0, null]);
    expect(() => parseShaXml(xml.replace('value="0"', 'value="-1"'))).toThrow('Invalid');
    expect(() => parseShaXml('Internal server error')).toThrow('complete OECD');
  });
});
