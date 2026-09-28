#!/usr/bin/env tsx
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateWelfareBudgetArtifact, renderWelfareBudgetMarkdown } from './analysis/welfare-budget-artifact.js';
import type { WelfareBudgetDocument } from './analysis/welfare-budget-artifact.js';

const args = process.argv.slice(2).filter(arg => arg !== '--');
const inputIndex = args.indexOf('--input');
const outputIndex = args.indexOf('--output');
if (inputIndex < 0 || !args[inputIndex + 1] || args[inputIndex + 1]!.startsWith('--')) {
  throw new Error('Usage: generate:welfare-budget --input <document.json> [--output <directory>]. Requires calibrated response curves for both median outcomes.');
}
if (outputIndex >= 0 && (!args[outputIndex + 1] || args[outputIndex + 1]!.startsWith('--'))) {
  throw new Error('The --output option requires a directory.');
}
const document = JSON.parse(readFileSync(resolve(args[inputIndex + 1]!), 'utf8')) as WelfareBudgetDocument;
const artifact = generateWelfareBudgetArtifact(document);
const output = resolve(outputIndex < 0 ? 'output/analysis/welfare-budget' : args[outputIndex + 1]!);
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'budget.json'), `${JSON.stringify(artifact, null, 2)}\n`);
writeFileSync(resolve(output, 'budget.md'), renderWelfareBudgetMarkdown(artifact));
console.log(`Allocated ${artifact.result.allocatedBudgetUsd} of ${artifact.result.totalBudgetUsd} ${artifact.currency}. JSON and Markdown: ${output}`);
