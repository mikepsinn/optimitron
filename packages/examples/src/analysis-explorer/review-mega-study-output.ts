import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewMegaStudyApiPayload } from './publication-review.js';
import type { MegaStudyApiPayload } from './mega-study-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultInputPath = path.resolve(__dirname, '../../output/mega-studies/mega-study-api.json');

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const inputPath = path.resolve(process.cwd(), getArg('file') ?? defaultInputPath);
  const raw = fs.readFileSync(inputPath, 'utf8');
  const payload = JSON.parse(raw) as MegaStudyApiPayload;
  const result = await reviewMegaStudyApiPayload(payload, {
    apiKey: process.env['GOOGLE_GENERATIVE_AI_API_KEY'],
    model: getArg('model'),
  });
  const outputPath = path.join(path.dirname(inputPath), 'mega-study-publication-review.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    input: result.input,
    review: result.review,
  }, null, 2), 'utf8');

  console.log(result.formatted);
  console.log(`Review artifact: ${outputPath}`);
}

main().catch((error) => {
  console.error('Failed to review mega study output:', error);
  process.exitCode = 1;
});
