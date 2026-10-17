import Link from 'next/link';
import { countries, latestHale, slugOf } from '../lib/data';
import { RecordInterval, RecordValue } from './RecordValue';

export default function WorldPage() {
  const rows = countries
    .map(country => ({ country, record: latestHale(country.code)! }))
    .sort((a, b) => b.record.value - a.record.value || a.country.name.localeCompare(b.country.name));
  const years = [...new Set(rows.map(row => row.record.year))].sort();

  return (
    <>
      <h1>Healthy life expectancy, by country</h1>
      <p className="lede">
        Longevitron calculates, for each country, the budget and the laws that would raise average healthy
        life expectancy (HALE) the most. HALE is the number of years that a newborn can expect to live in
        full health.
      </p>
      <p className="notice">
        Status: the budget model is not published yet. It will publish only after it passes the evals on
        the <Link href="/method/">Method</Link> page. The first country is the United States.
      </p>

      <h2>Average HALE at birth, both sexes</h2>
      <p className="muted">
        {rows.length} countries. WHO estimates for {years.join(', ')}. The interval is the WHO uncertainty
        interval.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Country</th>
            <th scope="col" className="hide-mobile">Region</th>
            <th scope="col" className="num">HALE (years)</th>
            <th scope="col" className="num">Interval</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ country, record }) => (
            <tr key={country.code}>
              <td><Link href={`/countries/${slugOf(country)}/`}>{country.name}</Link></td>
              <td className="muted hide-mobile">{country.region}</td>
              <td className="num"><RecordValue record={record} /></td>
              <td className="num muted"><RecordInterval record={record} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
