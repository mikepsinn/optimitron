import type { Metadata } from 'next';
import { manifest } from '../../lib/data';
import { getSource } from '../../lib/sources';

export const metadata: Metadata = { title: 'Method' };

const EVALS: { name: string; status: 'Live' | 'Planned'; rule: string }[] = [
  { name: 'Record check', status: 'Live', rule: 'Every decimal, percentage, or money amount on every page cites a record, and shows a correct rounding of it.' },
  { name: 'Source check', status: 'Live', rule: 'Every saved source matches its SHA-256 hash. Every record field equals the cited row in that source.' },
  { name: 'Backtest', status: 'Planned', rule: 'The model trains on years up to 2012 and predicts later years. A model change merges only if the error does not increase.' },
  { name: 'Known answers', status: 'Planned', rule: 'The model reproduces about 20 well-proven policy effects inside their published ranges.' },
  { name: 'Forecast ledger', status: 'Planned', rule: 'Each model version records its forecast for the next WHO release. This page scores each forecast when WHO publishes.' },
  { name: 'Adversarial review', status: 'Planned', rule: 'A reviewer agent must cite a file, a line, and a contradicting source. A second agent verifies each finding.' },
  { name: 'Human audit', status: 'Planned', rule: 'Each week the owner checks 10 random records. The agent loop stops if more than 1 in 20 are wrong.' },
  { name: 'Prior calibration', status: 'Planned', rule: 'Each prior chance that a candidate works cites a base rate. When trials report, this page scores the priors.' },
];

export default function MethodPage() {
  return (
    <>
      <h1>Method</h1>

      <h2>Goal</h2>
      <p>
        For each country, find the trials, the budget, and the laws that maximize average healthy life expectancy (HALE)
        at birth, as the World Health Organization publishes it.
      </p>

      <h2>Limits</h2>
      <ol>
        <li>The total budget stays the same. Money moves between uses only.</li>
        <li>Debt interest and legally required pension payments stay fixed.</li>
        <li>No bans on adult choices. Taxes, labels, and information requirements are allowed.</li>
        <li>No category gets a level outside the range that real countries have.</li>
      </ol>

      <h2>Model</h2>
      <p>
        The model compares every use of money in one unit: expected healthy years gained per dollar. It has
        three kinds of options: delivery of proven interventions, trials of promising untested candidates, and
        rules such as taxes and labels. A trial has value because its result changes later decisions. The model
        selects the combination of options with the most expected healthy years, inside the budget and the
        trial capacity of the country.
      </p>
      <p>
        Each law adapts a law that a country or state already passed, and cites the effect that was measured
        after it passed.
      </p>

      <h2>Evals</h2>
      <table>
        <thead>
          <tr><th scope="col">Eval</th><th scope="col">Status</th><th scope="col">Rule</th></tr>
        </thead>
        <tbody>
          {EVALS.map(item => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td><span className={`badge badge-${item.status.toLowerCase()}`}>{item.status}</span></td>
              <td>{item.rule}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Sources</h2>
      <table>
        <thead>
          <tr><th scope="col">Source</th><th scope="col">Retrieved</th><th scope="col">SHA-256</th></tr>
        </thead>
        <tbody>
          {manifest.map(entry => {
            const source = getSource(entry.id);
            return (
              <tr key={entry.id}>
                <td>{source.publisher}: <a href={entry.url}>{source.title}</a></td>
                <td>{entry.retrievedAt.slice(0, 10)}</td>
                <td><code className="hash">{entry.sha256}</code></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
