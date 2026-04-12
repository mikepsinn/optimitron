import { readFile } from 'node:fs/promises';
import { stdin } from 'node:process';
import { parseArgs } from 'node:util';
import { formatTestOutputReview, reviewTestOutput } from './test-output-review.js';

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stdin as AsyncIterable<string | Uint8Array>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const args = parseArgs({
  allowPositionals: true,
  options: {
    file: { type: 'string' },
    force: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    model: { type: 'string' },
    source: { type: 'string' },
    stdin: { type: 'boolean', default: false },
  },
});

const passthrough = args.positionals.filter((value) => value !== '--');
const passthroughValue = (name: string): string | undefined => {
  const index = passthrough.indexOf(`--${name}`);
  return index >= 0 ? passthrough[index + 1] : undefined;
};
const passthroughFlag = (name: string): boolean => passthrough.includes(`--${name}`);

const file = args.values.file ?? passthroughValue('file') ?? passthrough.find((value) => !value.startsWith('--'));
const sourceLabel = args.values.source ?? passthroughValue('source') ?? (file ? `file:${file}` : 'stdin');
const rawOutput = file
  ? await readFile(file, 'utf8')
  : args.values.stdin || passthroughFlag('stdin') || !stdin.isTTY
    ? await readStdin()
    : '';

if (!rawOutput.trim()) {
  throw new Error('No test output provided. Pass --file <path> or pipe output to stdin.');
}

const review = await reviewTestOutput({
  apiKey: process.env['GOOGLE_GENERATIVE_AI_API_KEY'],
  force: args.values.force || passthroughFlag('force'),
  model: args.values.model ?? passthroughValue('model'),
  output: rawOutput,
  sourceLabel,
});

const output = args.values.json || passthroughFlag('json')
  ? JSON.stringify(review, null, 2)
  : formatTestOutputReview(review);

process.stdout.write(`${output}\n`);
