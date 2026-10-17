import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { countries, haleSeries, manifest, slugOf } from '../../../lib/data';
import { getSource } from '../../../lib/sources';
import { RecordInterval, RecordValue } from '../../RecordValue';

export const dynamicParams = false;

export function generateStaticParams() {
  return countries.map(country => ({ code: slugOf(country) }));
}

type Props = { params: Promise<{ code: string }> };

const findCountry = async (params: Props['params']) => {
  const { code } = await params;
  return countries.find(country => slugOf(country) === code);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = await findCountry(params);
  return { title: country?.name };
}

export default async function CountryPage({ params }: Props) {
  const country = await findCountry(params);
  if (!country) notFound();
  const series = haleSeries(country.code);
  const latest = series.at(-1)!;
  const source = getSource(latest.source);
  const saved = manifest.find(entry => entry.id === latest.source)!;

  return (
    <>
      <p className="muted"><Link href="/">Countries</Link> › {country.region}</p>
      <h1>{country.name}</h1>

      <div className="headline">
        <span className="headline-value"><RecordValue record={latest} /></span>
        <span>
          healthy years at birth in <RecordValue record={latest} field="year" decimals={0} />
          <br />
          <span className="muted">WHO interval <RecordInterval record={latest} /></span>
        </span>
      </div>

      <h2>Trials, budget, and laws</h2>
      <p className="notice">
        Not calculated yet. The model publishes only after it passes the evals on
        the <Link href="/method/">Method</Link> page.
      </p>

      <h2>History</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col" className="num">HALE (years)</th>
            <th scope="col" className="num">Interval</th>
          </tr>
        </thead>
        <tbody>
          {[...series].reverse().map(record => (
            <tr key={record.id}>
              <td><RecordValue record={record} field="year" decimals={0} /></td>
              <td className="num"><RecordValue record={record} /></td>
              <td className="num muted"><RecordInterval record={record} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Source</h2>
      <p>
        {source.publisher}: {source.title}.{' '}
        <a href={source.url}>Source data</a>. Retrieved {saved.retrievedAt.slice(0, 10)}. SHA-256{' '}
        <code>{saved.sha256}</code>.
      </p>
    </>
  );
}
