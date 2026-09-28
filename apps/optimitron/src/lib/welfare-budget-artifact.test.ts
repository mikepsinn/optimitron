import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { generateWelfareBudgetArtifact, renderWelfareBudgetMarkdown } from '../../scripts/analysis/welfare-budget-artifact.js';
import type { WelfareBudgetDocument } from '../../scripts/analysis/welfare-budget-artifact.js';

// Analytic fixture only; never used as national evidence or published app data.
function fixture(): WelfareBudgetDocument {
  const curve = (beta: number) => ({ type: 'log' as const, alpha: 0, beta, r2: 1, n: 20 });
  return {
    jurisdiction: 'Synthetic test jurisdiction', fiscalYear: 2025, currency: 'USD', effectHorizonYears: 10,
    endpoints: { income: 'median_real_after_tax_income_growth_pp_per_year', health: 'median_healthy_life_years' },
    categorySources: { a: ['Analytic fixture: log response'], b: ['Analytic fixture: log response'] },
    model: {
      totalBudgetUsd: 300,
      welfareConfig: { alpha: 0.5 },
      categories: [
        { id: 'a', currentSpendingUsd: 150, minSpendingUsd: 1, maxSpendingUsd: 299, response: { incomeGrowthPpYear: curve(2), medianHealthyLifeYears: curve(0) } },
        { id: 'b', currentSpendingUsd: 150, minSpendingUsd: 1, maxSpendingUsd: 299, response: { incomeGrowthPpYear: curve(0), medianHealthyLifeYears: curve(1) } },
      ],
    },
  };
}

describe('welfare budget generation boundary', () => {
  it('writes the conserved allocation and both endpoint effects into the same report', () => {
    const artifact = generateWelfareBudgetArtifact(fixture());
    expect(artifact.result.allocations[0]!.spendingUsd).toBeCloseTo(200, 5);
    expect(artifact.result.allocations[1]!.spendingUsd).toBeCloseTo(100, 5);
    expect(artifact.result.allocations.reduce((sum, row) => sum + row.spendingUsd, 0)).toBeCloseTo(300, 8);
    expect(artifact.result.expectedEffect.incomeGrowthPpYearChange).toBeCloseTo(2 * Math.log(200 / 150));
    expect(artifact.result.expectedEffect.medianHealthyLifeYearsChange).toBeCloseTo(Math.log(100 / 150));
    const markdown = renderWelfareBudgetMarkdown(artifact);
    expect(markdown).toContain('| a | 150 | 200 | 50 |');
    expect(markdown).toContain('| b | 150 | 100 | -50 |');
    expect(markdown).toContain('No uncertainty draws supplied');
    expect(markdown).toContain('Median healthy years change');
  });

  it('rejects proxy endpoints and unsourced response curves instead of relabeling them', () => {
    const wrongEndpoint = fixture();
    Object.assign(wrongEndpoint.endpoints, { health: 'HALE' });
    expect(() => generateWelfareBudgetArtifact(wrongEndpoint)).toThrow('exact median endpoints');
    const unsourced = fixture();
    unsourced.categorySources.a = [];
    expect(() => generateWelfareBudgetArtifact(unsourced)).toThrow('Missing response-curve source for a');
  });

  it('runs the CLI from a supplied model through JSON and Markdown output', () => {
    const directory = mkdtempSync(join(tmpdir(), 'optimitron-welfare-budget-'));
    try {
      const input = join(directory, 'input.json');
      const output = join(directory, 'result');
      writeFileSync(input, JSON.stringify(fixture()));
      const require = createRequire(import.meta.url);
      execFileSync(process.execPath, [require.resolve('tsx/cli'), resolve('scripts/generate-welfare-budget.ts'), '--input', input, '--output', output], { cwd: resolve('.'), encoding: 'utf8', timeout: 30_000 });
      const artifact = JSON.parse(readFileSync(join(output, 'budget.json'), 'utf8'));
      expect(artifact.result.allocations.reduce((sum: number, row: { spendingUsd: number }) => sum + row.spendingUsd, 0)).toBeCloseTo(300, 8);
      expect(readFileSync(join(output, 'budget.md'), 'utf8')).toBe(renderWelfareBudgetMarkdown(artifact));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }, 35_000);
});
