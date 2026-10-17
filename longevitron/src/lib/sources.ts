import type { SourceDefinition } from './schema';

const GHO = 'https://ghoapi.azureedge.net/api';

/** Every source that records may cite. Add a source here, then run `pnpm fetch:sources`. */
export const SOURCES: SourceDefinition[] = [
  {
    id: 'who-gho-hale',
    publisher: 'World Health Organization, Global Health Observatory',
    title: 'Healthy life expectancy (HALE) at birth (years), both sexes, countries',
    url: `${GHO}/WHOSIS_000002?$filter=${encodeURIComponent("SpatialDimType eq 'COUNTRY' and Dim1 eq 'SEX_BTSX'")}`,
    table: {
      rows: 'value',
      key: 'Id',
      fields: { geo: 'SpatialDim', year: 'TimeDim', value: 'NumericValue', low: 'Low', high: 'High' },
    },
  },
  {
    id: 'who-gho-countries',
    publisher: 'World Health Organization, Global Health Observatory',
    title: 'GHO country dimension: codes, names, and WHO regions',
    url: `${GHO}/DIMENSION/COUNTRY/DimensionValues`,
    table: {
      rows: 'value',
      key: 'Code',
      fields: { code: 'Code', name: 'Title', region: 'ParentTitle' },
    },
  },
];

export function getSource(id: string): SourceDefinition {
  const source = SOURCES.find(candidate => candidate.id === id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}
