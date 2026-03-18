/**
 * Run all natural experiment datasets through the causal inference pipeline
 *
 * Uses runNaturalExperiment() from @optimitron/opg for core analysis,
 * then generates JSON + markdown reports.
 *
 * Usage: npx tsx packages/examples/src/policy-time-series-analysis/run-natural-experiments.ts
 */

import { convertNaturalExperimentData, runNaturalExperiment } from '@optimitron/opg';
import type { NaturalExperimentResult } from '@optimitron/opg';
import { NATURAL_EXPERIMENTS } from '@optimitron/data';
import * as fs from 'fs';
import * as path from 'path';

/** Compute slope (change per year) using simple linear regression */
function computeSlope(data: Array<{ year: number; value: number }>): number {
  if (data.length < 2) return 0;
  const n = data.length;
  const meanX = data.reduce((s, d) => s + d.year, 0) / n;
  const meanY = data.reduce((s, d) => s + d.value, 0) / n;
  let num = 0, den = 0;
  for (const d of data) {
    num += (d.year - meanX) * (d.value - meanY);
    den += (d.year - meanX) ** 2;
  }
  return den !== 0 ? num / den : 0;
}

/** Script-specific output format that enriches library results with slopes and interpretation */
interface ScriptExperimentOutput {
  policy: string;
  jurisdiction: string;
  jurisdictionCode: string;
  interventionYear: number;
  description: string;
  outcomes: Array<{
    metric: string;
    unit: string;
    direction: 'higher' | 'lower';
    yearRange: string;
    totalDataPoints: number;
    preDataPoints: number;
    postDataPoints: number;
    preMean: number;
    preSlope: number;
    postMean: number;
    postSlope: number;
    absoluteChange: number;
    percentChange: number;
    directionCorrect: boolean;
    correlation: number;
    pValue: number;
    bradfordHillAverage: number;
    predictorImpactScore: number;
    effectSizePercent: number;
    interpretation: string;
  }>;
}

function main() {
  const scriptResults: ScriptExperimentOutput[] = [];

  console.log('=== Natural Experiment Analysis ===');
  console.log(`Processing ${NATURAL_EXPERIMENTS.length} policy interventions...\n`);

  for (const exp of NATURAL_EXPERIMENTS) {
    // Convert data format and run analysis via library
    const def = convertNaturalExperimentData(exp);
    const libraryResults: NaturalExperimentResult[] = runNaturalExperiment(def);

    const scriptResult: ScriptExperimentOutput = {
      policy: exp.policy,
      jurisdiction: exp.jurisdiction,
      jurisdictionCode: exp.jurisdictionCode,
      interventionYear: exp.interventionYear,
      description: exp.description,
      outcomes: [],
    };

    // Enrich each library result with script-specific fields (slopes, interpretation)
    for (const lr of libraryResults) {
      const rawOutcome = exp.outcomes.find(o => o.metric === lr.outcomeMetric.name);
      if (!rawOutcome) continue;

      const sortedData = [...rawOutcome.data].sort((a, b) => a.year - b.year);
      const preData = sortedData.filter(d => d.year < exp.interventionYear);
      const postData = sortedData.filter(d => d.year >= exp.interventionYear);

      const directionCorrect = lr.outcomeMetric.direction === 'lower'
        ? lr.postMean < lr.preMean
        : lr.postMean > lr.preMean;

      const bhValues = Object.values(lr.analysisResult.bradfordHill) as number[];
      const bhAvg = bhValues.reduce((a, b) => a + b, 0) / bhValues.length;

      let interpretation: string;
      if (directionCorrect && Math.abs(lr.percentChange) > 20) {
        interpretation = `LARGE CHANGE: ${lr.outcomeMetric.name} ${lr.outcomeMetric.direction === 'lower' ? 'decreased' : 'increased'} by ${Math.abs(lr.percentChange).toFixed(0)}% after ${exp.policy}`;
      } else if (directionCorrect && Math.abs(lr.percentChange) > 5) {
        interpretation = `MODERATE CHANGE: ${lr.outcomeMetric.name} moved ${Math.abs(lr.percentChange).toFixed(0)}% in the desired direction`;
      } else if (!directionCorrect && Math.abs(lr.percentChange) > 10) {
        interpretation = `UNEXPECTED DIRECTION: ${lr.outcomeMetric.name} moved ${Math.abs(lr.percentChange).toFixed(0)}% in the WRONG direction after intervention`;
      } else {
        interpretation = `MINIMAL CHANGE: ${lr.outcomeMetric.name} changed only ${Math.abs(lr.percentChange).toFixed(0)}%`;
      }

      scriptResult.outcomes.push({
        metric: lr.outcomeMetric.name,
        unit: lr.outcomeMetric.unit,
        direction: lr.outcomeMetric.direction,
        yearRange: lr.yearRange,
        totalDataPoints: lr.preDataPoints + lr.postDataPoints,
        preDataPoints: lr.preDataPoints,
        postDataPoints: lr.postDataPoints,
        preMean: Math.round(lr.preMean * 100) / 100,
        preSlope: Math.round(computeSlope(preData) * 1000) / 1000,
        postMean: Math.round(lr.postMean * 100) / 100,
        postSlope: Math.round(computeSlope(postData) * 1000) / 1000,
        absoluteChange: Math.round(lr.absoluteChange * 100) / 100,
        percentChange: Math.round(lr.percentChange * 10) / 10,
        directionCorrect,
        correlation: lr.analysisResult.forwardPearson,
        pValue: lr.analysisResult.pValue,
        bradfordHillAverage: Math.round(bhAvg * 1000) / 1000,
        predictorImpactScore: lr.analysisResult.pis.score,
        effectSizePercent: lr.analysisResult.effectSize.percentChange,
        interpretation,
      });
    }

    scriptResults.push(scriptResult);
    const emoji = scriptResult.outcomes.every(o => o.directionCorrect) ? '✅' :
                  scriptResult.outcomes.some(o => o.directionCorrect) ? '🟡' : '🔴';
    console.log(`${emoji} ${exp.policy} (${exp.jurisdiction}, ${exp.interventionYear})`);
    for (const o of scriptResult.outcomes) {
      const arrow = o.directionCorrect ? '↓' : '↑';
      console.log(`   ${o.metric}: ${o.preMean} → ${o.postMean} (${o.percentChange > 0 ? '+' : ''}${o.percentChange}%) ${arrow}`);
    }
    console.log();
  }

  // Summary
  const totalOutcomes = scriptResults.flatMap(r => r.outcomes);
  const correct = totalOutcomes.filter(o => o.directionCorrect).length;
  console.log(`\n📊 Overall: ${correct}/${totalOutcomes.length} outcomes moved in the expected direction`);

  // Write JSON
  const output = {
    generatedAt: new Date().toISOString(),
    engine: '@optimitron/opg runNaturalExperiment()',
    description: 'Natural experiment analyses: before/after policy interventions across jurisdictions',
    totalExperiments: scriptResults.length,
    totalOutcomes: totalOutcomes.length,
    outcomesInExpectedDirection: correct,
    successRate: `${((correct / totalOutcomes.length) * 100).toFixed(0)}%`,
    experiments: scriptResults,
  };

  const outPath = path.join(process.cwd(), 'packages/web/public/data/natural-experiments.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n📊 Results written to ${outPath}`);

  // Write markdown report
  let md = `# Natural Experiment Analysis\n\n`;
  md += `> Generated ${new Date().toISOString()} by @optimitron/opg\n\n`;
  md += `**${scriptResults.length} policy interventions** across ${new Set(scriptResults.map(r => r.jurisdictionCode)).size} countries.\n`;
  md += `**${correct}/${totalOutcomes.length}** outcome metrics moved in the expected direction.\n\n`;

  for (const r of scriptResults) {
    md += `## ${r.policy} — ${r.jurisdiction} (${r.interventionYear})\n\n`;
    md += `${r.description}\n\n`;
    md += `| Metric | Pre-Mean | Post-Mean | Change | Direction | Correlation |\n`;
    md += `|--------|----------|-----------|--------|-----------|-------------|\n`;
    for (const o of r.outcomes) {
      const dir = o.directionCorrect ? '✅ Correct' : '❌ Wrong';
      md += `| ${o.metric} | ${o.preMean} | ${o.postMean} | ${o.percentChange > 0 ? '+' : ''}${o.percentChange}% | ${dir} | r=${o.correlation.toFixed(3)} |\n`;
    }
    md += `\n`;
    for (const o of r.outcomes) {
      md += `> **${o.metric}:** ${o.interpretation}\n\n`;
    }
    md += `---\n\n`;
  }

  const mdPath = path.join(process.cwd(), 'reports/natural-experiments.md');
  fs.writeFileSync(mdPath, md);
  console.log(`📝 Report written to ${mdPath}`);
}

main();
