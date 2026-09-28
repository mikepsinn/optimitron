#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getOptimalBudgetReport, renderOptimalBudgetMarkdown } from '../src/lib/optimal-budget-generator.js';

const args = process.argv.slice(2).filter(arg => arg !== '--');
const index = args.indexOf('--population');
const population = index < 0 ? 1_000_000 : Number(args[index + 1]);
const report = getOptimalBudgetReport(population);
const output = resolve('public/data');
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'optimal-budget.json'), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(output, 'optimal-budget.md'), renderOptimalBudgetMarkdown(report));
for (const scenario of report.scenarios) console.log(JSON.stringify({ population, quantile: scenario.outcomeQuantile, perResident: scenario.totalPerCapita, annualBudget: scenario.annualBudget, references: scenario.lines.map(line => [line.name, line.peer?.name, line.peer?.publicCostPerCapita]) }));
