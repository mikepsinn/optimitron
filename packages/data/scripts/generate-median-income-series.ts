import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildPipMedianIncomeSeries,
  renderGeneratedMedianIncomeModule,
} from '../src/datasets/median-income-series-build.ts';
import { fetchPIPIncomeSeries } from '../src/fetchers/world-bank-pip.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  const pipRecords = await fetchPIPIncomeSeries({
    welfareType: 'income',
    period: { startYear: 1981, endYear: new Date().getUTCFullYear() },
  });

  const generatedRecords = buildPipMedianIncomeSeries(pipRecords);
  const metadata = {
    generatedAt: new Date().toISOString(),
    recordCount: generatedRecords.length,
    sources: ['World Bank PIP'] as const,
    caveats: [
      'This generated snapshot currently includes the broad-coverage PIP median-income series.',
      'PIP median income is not guaranteed to be after-tax disposable income.',
      'PIP rows may include interpolated years; use isInterpolated metadata or excludeInterpolated filters when you need survey-only observations.',
      'OECD IDD after-tax disposable-income derivation utilities exist in the library, but the OECD bulk API is rate-limited and is not bundled into this generated snapshot yet.',
    ],
  };
  const moduleSource = renderGeneratedMedianIncomeModule(
    generatedRecords,
    metadata,
  );

  const outputDir = path.resolve(__dirname, '../src/generated');
  const outputPath = path.join(outputDir, 'median-income-series.ts');
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, moduleSource, 'utf8');

  console.log(
    `Wrote ${generatedRecords.length} generated median-income records to ${outputPath}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
