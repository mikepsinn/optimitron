import { OPTIMAL_BUDGET_DATA as data } from '@optimitron/data/datasets/optimal-budget';
import { generateOptimalBudget } from '@optimitron/obg';
import { HEALTHCARE_REFERENCE_POLICIES } from '@optimitron/data/datasets/healthcare-reference-policies';
import { HEALTHCARE_COFOG_DATA } from '@optimitron/data/datasets/healthcare-cofog';

export function getOptimalBudgetReport(population = 1) {
  const result = generateOptimalBudget({ ...data, healthcareBudgets: HEALTHCARE_COFOG_DATA.countries, population });
  const countryName = (id: string, name: string) => id === 'KOR' ? 'South Korea' : name;
  return {
    generatedAt: [data.generatedAt, HEALTHCARE_COFOG_DATA.generatedAt].sort().at(-1)!, period: data.period, costUnit: data.costUnit,
    incomeUnit: data.incomeUnit, countryCount: data.countries.length,
    method: {
      selection: 'Healthcare: minimum total current cost within the selected healthy-year gap of the best observed outcome worldwide. Other categories: minimum public cost meeting outcome quantiles. Linear population scaling.',
      scope: `Ten disjoint COFOG public-spending categories, all levels of government. Non-health references: ${data.countries.length} European countries. Healthcare selection: global current-cost comparisons, with a separately sourced COFOG public budget.`,
      assumptions: ['Reference systems can be transferred and combined.', 'Costs scale linearly with population.'],
      outcomeInterpretation: 'Observed reference outcomes, not predicted combined gains. HALE is a population average, not median healthspan.',
      ranges: 'Up to three cheapest qualifying alternatives per category; not confidence intervals.',
    },
    populationCountries: data.populationCountries.map(country => ({ ...country, name: countryName(country.id, country.name) })).sort((a, b) => a.name.localeCompare(b.name)),
    healthcare: {
      ...result.healthcare,
      policies: HEALTHCARE_REFERENCE_POLICIES,
      governmentBudgets: HEALTHCARE_COFOG_DATA,
    },
    defaultQuantile: result.defaultQuantile, outcomeDefinitions: result.outcomeDefinitions,
    scenarios: result.scenarios,
    sources: data.sources, healthSource: data.healthSource, educationSource: data.educationSource,
    healthcareSource: data.healthcareSource, healthcareDataIssues: data.healthcareDataIssues, populationSource: data.populationSource,
  };
}

export type OptimalBudgetReport = ReturnType<typeof getOptimalBudgetReport>;

export function renderOptimalBudgetMarkdown(report: OptimalBudgetReport): string {
  const money = (value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const content = [
    '# Optimal Budget Generator', '',
    `Reference population: ${report.scenarios[0]!.population.toLocaleString('en-US')}. Healthcare: ${report.healthcare.countries.length} countries worldwide. Other public spending: ${report.countryCount} European countries.`,
    `Annual public spending: ${report.period.join(', ')} average, in ${report.costUnit}. Includes national and local government.`,
    '', '## Method', '',
    'Healthcare: find the observed cost/health Pareto frontier. Select the minimum TOTAL current healthcare cost among countries within the chosen number of healthy years of the best observed HALE, with reported public financing. The default gap is one year, an explicit preference rather than a fitted optimum. The public budget line uses the selected country’s COFOG government health expenditure, including health research and investment. The separate care-cost comparison shows WHO domestic public, domestic private and external current costs; these amounts are not added to the budget.',
    'For every other category, select the lowest public-cost observed country meeting every listed outcome target. Multiply annual public cost per resident by population. Changing country changes population, not the ideal system or inherited spending constraints.',
    'Healthcare uses WHO healthy life expectancy; education uses PISA mathematics proficiency. The remaining eight categories use national healthy life expectancy and median disposable income as a general success screen, not sector-specific evidence of effectiveness.',
    'Non-health targets are unweighted country quantiles. The default is the highest of the 80th, 90th and 95th percentiles with at least three countries meeting both national outcomes. Healthcare uses an absolute healthy-year gap, so adding countries with poor outcomes cannot weaken its target. Missing financing never lowers that target.',
    'Assumptions: selected systems can be transferred and combined; annual costs scale linearly with population. These assumptions do not establish the combined country’s future health or income.',
    'WHO HALE is average expected healthy years, not median individual healthspan. Income is 2019 Eurostat equivalised disposable income in PPS (survey-year label; income usually refers to the prior year). It is neither GDP nor household income divided by household size.',
    'All ten budget categories use COFOG government accounts and retain the selected country’s reported service breakdown where available. Children are components of the parent, never additional allocations. R&D and pensions are already included; research investment scenarios are not added again. Government, research and debt includes basic research, foreign aid, administration and debt transactions. This benchmark has no current-budget constraint or inherited military spending floor.',
    'SHA current health and COFOG health have different accounting boundaries, not merely different capital coverage. No capital amount is inferred by subtracting the two series. The COFOG ledger prevents adding SHA healthcare on top of overlapping COFOG social care.',
    'Costs = Eurostat spending in million euros / same-year GDP in million euros × World Bank GDP per capita in constant 2021 international dollars, averaged across 2017–2019. This uses GDP purchasing power parity for all categories, not sector-specific PPPs.',
    'Alternative ranges use up to three cheapest qualifying countries per category, not sampling confidence intervals. The public-health cost range can include lower amounts from systems with larger private bills. Missing observations never become zero spending.',
    report.healthcareSource.conversion,
    report.healthcareSource.uncertainty,
    report.populationSource.note,
    report.healthcare.governmentBudgets.method,
    '',
  ];
  content.push('## Global healthcare frontier', '', 'The care columns show WHO recurring costs. The final column is the whole public COFOG budget at the default non-health outcome target.', '', '| Maximum healthy-year gap | Reference | HALE | Public care / resident | Private care / resident | Total care / resident | Whole public budget / resident |', '| ---: | --- | ---: | ---: | ---: | ---: | ---: |');
  for (const option of report.healthcare.scenarios) {
    const reference = option.selected;
    const budget = report.scenarios.find(scenario => scenario.outcomeQuantile === report.defaultQuantile && scenario.maxHealthyYearGap === option.maxHealthyYearGap)!;
    content.push(`| ${option.maxHealthyYearGap} | ${reference?.name ?? 'Unavailable'} | ${reference?.hale.toFixed(2) ?? 'Unavailable'} | ${reference?.publicPerCapita != null ? money(reference.publicPerCapita) : 'Unavailable'} | ${reference?.privatePerCapita != null ? money(reference.privatePerCapita) : 'Unavailable'} | ${reference ? money(reference.totalPerCapita) : 'Unavailable'} | ${budget.totalPerCapita === null ? 'Unavailable' : money(budget.totalPerCapita)} |`);
  }
  content.push('', 'The frontier removes countries for which another observed country is no more expensive and no worse in health, with at least one strict improvement. This is an observed comparison, not a causal estimate of healthcare policy effects. National HALE also reflects conditions outside healthcare.', '');
  for (const option of report.healthcare.scenarios) {
    content.push(`Year sensitivity at gap ${option.maxHealthyYearGap}: ${option.selectionByYear.map(year => `${year.year}: ${report.healthcare.countries.find(country => country.id === year.selectedId)?.name ?? 'unavailable'} (${year.countryCount} countries)`).join('; ')}.`, '');
  }
  for (const system of report.healthcare.policies) {
    content.push(`### ${system.countryName} policies`, '', ...system.policies.map(policy => `- [${policy.name}](${policy.url}): ${policy.description} ${policy.periodNote}`), '');
  }
  for (const scenario of report.scenarios) {
    content.push(`## Top ${Math.round((1 - scenario.outcomeQuantile) * 100)}% non-health targets; healthcare within ${scenario.maxHealthyYearGap} healthy years${scenario.outcomeQuantile === report.defaultQuantile && scenario.maxHealthyYearGap === report.healthcare.defaultMaxHealthyYearGap ? ' (default)' : ''}`, '',
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
      }), line.selectionCost === 'totalHealthPerCapita'
        ? `- Qualifying alternatives, ordered by total care cost: ${line.alternatives.map(peer => `${peer.name} (${money(peer.selectionCostPerCapita)} total care; ${money(peer.publicCostPerCapita)} public budget per resident)`).join('; ') || 'None'}.`
        : `- Cheapest qualifying alternatives: ${line.alternatives.map(peer => `${peer.name} (${money(peer.publicCostPerCapita)} public per resident)`).join('; ') || 'None'}.`, '');
      if (line.breakdown.length) {
        content.push('| Service | Annual cost per resident |', '| --- | ---: |', ...line.breakdown.map(child => `| ${child.name} | ${child.perCapita === null ? 'Unavailable' : money(child.perCapita)} |`));
        if (line.breakdownRemainder !== null && Math.abs(line.breakdownRemainder) > 0.005) content.push(`| Unallocated / source rounding | ${money(line.breakdownRemainder)} |`);
        content.push('');
      }
    }
  }
  content.push('## Sources', '', `Snapshot generated ${report.generatedAt}.`, '',
    ...report.sources.map(source => `- [Source API](${source.url}); retrieved ${source.retrievedAt}; SHA-256 \`${source.sha256}\`.`),
    `- [WHO HALE](${report.healthSource.url}); both-sex observations retrieved ${report.healthSource.snapshotGeneratedAt}.`,
    `- [PISA mathematics proficiency](${report.educationSource.url}).`, '');
  content.push(`- [WHO health expenditure definitions](${report.healthcareSource.url}).`, `- [World Bank population](${report.populationSource.url}).`, '', '### Data quality exclusions', '', ...report.healthcareDataIssues.map(issue => `- ${issue.countryId} ${issue.year}: ${issue.issue}`), '');
  content.push('### Government healthcare budget sources', '', ...report.healthcare.governmentBudgets.countries.map(country => `- ${country.name}: ${country.accountingBasis}`), '', ...report.healthcare.governmentBudgets.sources.map(source => `- [COFOG or GDP source](${source.url}); retrieved ${source.retrievedAt}; SHA-256 \`${source.sha256}\`.`), '');
  return content.join('\n');
}
