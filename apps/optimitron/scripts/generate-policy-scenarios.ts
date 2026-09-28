import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { generateDecisionMarkdown } from '@optimitron/obg';
import { generateDecisionAnalysis } from './analysis/generate-decision-analysis.js';

const { values } = parseArgs({
  options: {
    draws: { type: 'string' },
    seed: { type: 'string' },
    'generated-at': { type: 'string' },
    'output-dir': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
});

if (values.help) {
  console.log(`Generate standalone US policy funding scenarios.

pnpm --filter @optimitron/web generate:policy-scenarios [options]

  --draws <count>          Monte Carlo draws (default: 5000)
  --seed <integer>         Reproducible random seed (default: 20260926)
  --generated-at <ISO>     Fixed report timestamp for reproducible artifacts
  --output-dir <path>      Destination (default: apps/optimitron/public/reports)

Writes us-budget-policy-decision.json and us-budget-policy-decision.md.
These compare specified program options; they do not replace the country budget generator.`);
} else {
  const report = generateDecisionAnalysis({
    ...(values.draws !== undefined ? { draws: Number(values.draws) } : {}),
    ...(values.seed !== undefined ? { seed: Number(values.seed) } : {}),
    ...(values['generated-at'] !== undefined ? { generatedAt: values['generated-at'] } : {}),
  });
  const outputDirectory = values['output-dir']
    ? resolve(values['output-dir'])
    : resolve(dirname(fileURLToPath(import.meta.url)), '../public/reports');
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = generateDecisionMarkdown(report);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(resolve(outputDirectory, 'us-budget-policy-decision.json'), json);
  writeFileSync(resolve(outputDirectory, 'us-budget-policy-decision.md'), markdown);
  console.log(`Generated ${report.policies.length} policy cases and ${report.scenarios.length} funding scenarios (${report.draws} draws, seed ${report.seed}) in ${outputDirectory}`);
}
