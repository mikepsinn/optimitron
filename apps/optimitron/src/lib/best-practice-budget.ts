import { BEST_PRACTICE_BUDGET_DATA as data } from '@optimitron/data/datasets/best-practice-budget';
import { calculateBestPracticeBudget, chooseSupportedOutcomeQuantile } from '@optimitron/obg';
import type { BestPracticeCategory } from '@optimitron/obg';

export const BEST_PRACTICE_OUTCOMES: Record<string, { label: string; unit: string }> = {
  hale: { label: 'Healthy life expectancy', unit: 'years (WHO HALE, population average)' },
  income: { label: 'Median disposable income', unit: data.incomeUnit },
  mathProficiency: { label: 'Students reaching basic maths proficiency', unit: '% of 15-year-olds (PISA 2018, Level 2+)' },
};

const categories: BestPracticeCategory[] = data.categories.map(category => ({
  ...category,
  outcomeMetrics: category.id === 'GF07' ? ['hale'] : category.id === 'GF09' ? ['mathProficiency'] : ['hale', 'income'],
  ...(category.id === 'GF07' ? { selectionCost: 'totalHealthPerCapita' as const } : {}),
}));

export function getBestPracticeBudget(population = 1) {
  const defaultQuantile = chooseSupportedOutcomeQuantile(data.countries);
  return {
    generatedAt: data.generatedAt, period: data.period, costUnit: data.costUnit,
    incomeUnit: data.incomeUnit, countryCount: data.countries.length,
    method: {
      selection: 'Minimum observed cost meeting all category outcome quantiles; linear population scaling.',
      scope: `Ten disjoint COFOG categories, all levels of government; ${data.countries.length} European countries.`,
      assumptions: ['Reference systems can be transferred and combined.', 'Costs scale linearly with population.'],
      outcomeInterpretation: 'Observed reference outcomes, not predicted combined gains. HALE is a population average, not median healthspan.',
      ranges: 'Up to three cheapest qualifying alternatives per category; not confidence intervals.',
    },
    defaultQuantile, outcomeDefinitions: BEST_PRACTICE_OUTCOMES,
    scenarios: [0.8, 0.9, 0.95].map(outcomeQuantile => calculateBestPracticeBudget({ countries: data.countries, categories, population, outcomeQuantile })),
    sources: data.sources, healthSource: data.healthSource, educationSource: data.educationSource,
  };
}

export type BestPracticeBudgetReport = ReturnType<typeof getBestPracticeBudget>;

export function renderBestPracticeBudgetMarkdown(report: BestPracticeBudgetReport): string {
  const money = (value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const content = [
    '# Best-practice population budget', '',
    `Reference population: ${report.scenarios[0]!.population.toLocaleString('en-US')}. ${report.countryCount} European countries.`,
    `Annual public spending: ${report.period.join(', ')} average, in ${report.costUnit}. Includes national and local government.`,
    '', '## Method', '',
    'For each category, select the lowest-cost observed country meeting every listed outcome target. Multiply its annual public cost per resident by population. Health selects on total public and private current healthcare costs; the budget line retains the selected country’s COFOG public health expenditure.',
    'Healthcare uses WHO healthy life expectancy; education uses PISA mathematics proficiency. The remaining eight categories use national healthy life expectancy and median disposable income as a general success screen, not sector-specific evidence of effectiveness.',
    'Targets are unweighted country quantiles. The default is the highest of the 80th, 90th and 95th percentiles with at least three countries meeting both national outcomes. Stricter targets stay visible even when infeasible.',
    'Assumptions: selected systems can be transferred and combined; annual costs scale linearly with population. These assumptions do not establish the combined country’s future health or income.',
    'WHO HALE is average expected healthy years, not median individual healthspan. Income is 2019 Eurostat equivalised disposable income in PPS (survey-year label; income usually refers to the prior year). It is neither GDP nor household income divided by household size.',
    'The ten COFOG categories are disjoint. R&D and pensions are already included; existing research investment scenarios are not added again. General public services includes debt transactions. This benchmark has no current-budget constraint or inherited military spending floor.',
    'Costs = Eurostat spending in million euros / same-year GDP in million euros × World Bank GDP per capita in constant 2021 international dollars, averaged across 2017–2019. This uses GDP purchasing power parity for all categories, not sector-specific PPPs.',
    'Alternative ranges use up to three cheapest qualifying countries per category, not sampling confidence intervals. The public-health cost range can include lower amounts from systems with larger private bills. Missing observations never become zero spending.',
    '',
  ];
  for (const scenario of report.scenarios) {
    content.push(`## Top ${Math.round((1 - scenario.outcomeQuantile) * 100)}% outcomes${scenario.outcomeQuantile === report.defaultQuantile ? ' (default)' : ''}`, '',
      scenario.complete ? `Annual public budget: **${money(scenario.annualBudget!)}**; **${money(scenario.totalPerCapita!)} per resident**.` : 'No complete budget: one or more categories have no qualifying country. Targets were not relaxed.', '',
      '| Category | Per resident | Annual public budget | Reference | Eligible countries |', '| --- | ---: | ---: | --- | ---: |');
    for (const line of scenario.lines) {
      content.push(`| ${line.name} | ${line.peer ? money(line.peer.publicCostPerCapita) : 'Unavailable'} | ${line.annualBudget !== null ? money(line.annualBudget) : 'Unavailable'} | ${line.peer?.name ?? 'None'} | ${line.eligibleCountryCount} |`);
    }
    content.push('', '### Reference outcomes and alternatives', '');
    for (const line of scenario.lines) {
      content.push(`**${line.name}**`, '', ...line.outcomeMetrics.map(metric => {
        const definition = report.outcomeDefinitions[metric]!;
        return `- ${definition.label}: target ${line.targets[metric]?.toFixed(2) ?? 'unavailable'}; selected reference ${line.peer?.outcomes[metric]?.toFixed(2) ?? 'unavailable'} ${definition.unit}.`;
      }), `- Cheapest qualifying alternatives: ${line.alternatives.map(peer => `${peer.name} (${money(peer.publicCostPerCapita)} public per resident)`).join('; ') || 'None'}.`, '');
    }
  }
  content.push('## Sources', '', `Snapshot generated ${report.generatedAt}.`, '',
    ...report.sources.map(source => `- [Source API](${source.url}); retrieved ${source.retrievedAt}; SHA-256 \`${source.sha256}\`.`),
    `- [WHO HALE](${report.healthSource.url}); both-sex observations retrieved ${report.healthSource.snapshotGeneratedAt}.`,
    `- [PISA mathematics proficiency](${report.educationSource.url}).`, '');
  return content.join('\n');
}
