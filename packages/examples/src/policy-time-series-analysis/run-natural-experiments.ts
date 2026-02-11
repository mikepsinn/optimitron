/**
 * Run all natural experiment datasets through the causal inference pipeline
 *
 * For each policy intervention:
 * 1. Split data into pre/post intervention periods
 * 2. Create TimeSeries with time index as predictor (0=intervention year)
 * 3. Run runFullAnalysis() to compute correlations, Bradford Hill, baseline/followup
 * 4. Compare pre-period trend vs post-period outcomes
 *
 * Usage: npx tsx packages/examples/src/policy-time-series-analysis/run-natural-experiments.ts
 */

import { runFullAnalysis } from '@optomitron/optimizer';
import type { TimeSeries, AnalysisConfig } from '@optomitron/optimizer';
import { NATURAL_EXPERIMENTS } from '@optomitron/data';
import * as fs from 'fs';
import * as path from 'path';

function yearToMs(year: number): number {
  return new Date(`${year}-07-01T00:00:00Z`).getTime();
}

interface NaturalExperimentResult {
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
    // Pre-intervention stats
    preMean: number;
    preSlope: number; // trend per year before intervention
    // Post-intervention stats
    postMean: number;
    postSlope: number; // trend per year after intervention
    // Change
    absoluteChange: number;
    percentChange: number;
    // Was the change in the desired direction?
    directionCorrect: boolean;
    // Full analysis from optimizer
    correlation: number; // time → outcome correlation (full period)
    pValue: number;
    bradfordHillAverage: number;
    predictorImpactScore: number;
    effectSizePercent: number;
    // Pre vs Post analysis
    prePostCorrelation: number; // binary pre/post → outcome
    interpretation: string;
  }>;
}

/**
 * Compute slope (change per year) using simple linear regression
 */
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

function main() {
  const results: NaturalExperimentResult[] = [];

  console.log('=== Natural Experiment Analysis ===');
  console.log(`Processing ${NATURAL_EXPERIMENTS.length} policy interventions...\n`);

  for (const exp of NATURAL_EXPERIMENTS) {
    const result: NaturalExperimentResult = {
      policy: exp.policy,
      jurisdiction: exp.jurisdiction,
      jurisdictionCode: exp.jurisdictionCode,
      interventionYear: exp.interventionYear,
      description: exp.description,
      outcomes: [],
    };

    for (const outcome of exp.outcomes) {
      try {
        const sortedData = [...outcome.data].sort((a, b) => a.year - b.year);
        const preData = sortedData.filter(d => d.year < exp.interventionYear);
        const postData = sortedData.filter(d => d.year >= exp.interventionYear);

        if (sortedData.length < 3) {
          console.warn(`  ⚠️ ${outcome.metric}: Only ${sortedData.length} points, skipping`);
          continue;
        }

        // Compute pre and post statistics
        const preMean = preData.length > 0
          ? preData.reduce((s, d) => s + d.value, 0) / preData.length
          : sortedData[0]!.value;
        const postMean = postData.length > 0
          ? postData.reduce((s, d) => s + d.value, 0) / postData.length
          : sortedData[sortedData.length - 1]!.value;

        const preSlope = computeSlope(preData);
        const postSlope = computeSlope(postData);

        const absoluteChange = postMean - preMean;
        const percentChange = preMean !== 0 ? (absoluteChange / preMean) * 100 : 0;

        // Direction check: did the outcome improve?
        const improved = outcome.direction === 'lower'
          ? postMean < preMean
          : postMean > preMean;

        // Run full analysis: time (year) as predictor, outcome value as outcome
        // This measures whether the outcome is trending over time
        const timeSeries: TimeSeries = {
          variableId: 'time-index',
          name: 'Year',
          measurements: sortedData.map(d => ({
            timestamp: yearToMs(d.year),
            value: d.year,
          })),
        };

        const outcomeSeries: TimeSeries = {
          variableId: `${exp.jurisdictionCode}-${outcome.metric}`,
          name: `${outcome.metric} (${exp.jurisdiction})`,
          measurements: sortedData.map(d => ({
            timestamp: yearToMs(d.year),
            value: d.value,
          })),
        };

        const config: AnalysisConfig = {
          onsetDelaySeconds: 0,
          durationOfActionSeconds: 365 * 24 * 3600,
          fillingType: 'none',
          subjectCount: 1,
          plausibilityScore: 0.7,
          coherenceScore: 0.6,
          analogyScore: 0.5,
          specificityScore: 0.4,
        };

        const analysis = runFullAnalysis(timeSeries, outcomeSeries, config);

        // Also run binary pre/post analysis
        // Predictor: 0 for pre, 1 for post
        const binarySeries: TimeSeries = {
          variableId: 'pre-post',
          name: 'Pre/Post Intervention',
          measurements: sortedData.map(d => ({
            timestamp: yearToMs(d.year),
            value: d.year >= exp.interventionYear ? 1 : 0,
          })),
        };

        let prePostCorr = 0;
        try {
          const prePostAnalysis = runFullAnalysis(binarySeries, outcomeSeries, config);
          prePostCorr = prePostAnalysis.forwardPearson;
        } catch {
          // May fail if all pre or all post
        }

        const bhValues = Object.values(analysis.bradfordHill) as number[];
        const bhAvg = bhValues.reduce((a, b) => a + b, 0) / bhValues.length;

        // Interpretation
        let interpretation: string;
        if (improved && Math.abs(percentChange) > 20) {
          interpretation = `LARGE CHANGE: ${outcome.metric} ${outcome.direction === 'lower' ? 'decreased' : 'increased'} by ${Math.abs(percentChange).toFixed(0)}% after ${exp.policy}`;
        } else if (improved && Math.abs(percentChange) > 5) {
          interpretation = `MODERATE CHANGE: ${outcome.metric} moved ${Math.abs(percentChange).toFixed(0)}% in the desired direction`;
        } else if (!improved && Math.abs(percentChange) > 10) {
          interpretation = `UNEXPECTED DIRECTION: ${outcome.metric} moved ${Math.abs(percentChange).toFixed(0)}% in the WRONG direction after intervention`;
        } else {
          interpretation = `MINIMAL CHANGE: ${outcome.metric} changed only ${Math.abs(percentChange).toFixed(0)}%`;
        }

        result.outcomes.push({
          metric: outcome.metric,
          unit: outcome.unit,
          direction: outcome.direction,
          yearRange: `${sortedData[0]!.year}-${sortedData[sortedData.length - 1]!.year}`,
          totalDataPoints: sortedData.length,
          preDataPoints: preData.length,
          postDataPoints: postData.length,
          preMean: Math.round(preMean * 100) / 100,
          preSlope: Math.round(preSlope * 1000) / 1000,
          postMean: Math.round(postMean * 100) / 100,
          postSlope: Math.round(postSlope * 1000) / 1000,
          absoluteChange: Math.round(absoluteChange * 100) / 100,
          percentChange: Math.round(percentChange * 10) / 10,
          directionCorrect: improved,
          correlation: analysis.forwardPearson,
          pValue: analysis.pValue,
          bradfordHillAverage: Math.round(bhAvg * 1000) / 1000,
          predictorImpactScore: analysis.pis.score,
          effectSizePercent: analysis.effectSize.percentChange,
          prePostCorrelation: prePostCorr,
          interpretation,
        });

      } catch (err: any) {
        console.error(`  ❌ ${outcome.metric}: ${err.message}`);
      }
    }

    results.push(result);
    const emoji = result.outcomes.every(o => o.directionCorrect) ? '✅' :
                  result.outcomes.some(o => o.directionCorrect) ? '🟡' : '🔴';
    console.log(`${emoji} ${exp.policy} (${exp.jurisdiction}, ${exp.interventionYear})`);
    for (const o of result.outcomes) {
      const arrow = o.directionCorrect ? '↓' : '↑';
      console.log(`   ${o.metric}: ${o.preMean} → ${o.postMean} (${o.percentChange > 0 ? '+' : ''}${o.percentChange}%) ${arrow}`);
    }
    console.log();
  }

  // Summary
  const totalOutcomes = results.flatMap(r => r.outcomes);
  const correct = totalOutcomes.filter(o => o.directionCorrect).length;
  console.log(`\n📊 Overall: ${correct}/${totalOutcomes.length} outcomes moved in the expected direction`);

  // Write JSON
  const output = {
    generatedAt: new Date().toISOString(),
    engine: '@optomitron/optimizer runFullAnalysis()',
    description: 'Natural experiment analyses: before/after policy interventions across jurisdictions',
    totalExperiments: results.length,
    totalOutcomes: totalOutcomes.length,
    outcomesInExpectedDirection: correct,
    successRate: `${((correct / totalOutcomes.length) * 100).toFixed(0)}%`,
    experiments: results,
  };

  const outPath = path.join(process.cwd(), 'packages/web/public/data/natural-experiments.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n📊 Results written to ${outPath}`);

  // Write markdown report
  let md = `# Natural Experiment Analysis\n\n`;
  md += `> Generated ${new Date().toISOString()} by @optomitron/optimizer\n\n`;
  md += `**${results.length} policy interventions** across ${new Set(results.map(r => r.jurisdictionCode)).size} countries.\n`;
  md += `**${correct}/${totalOutcomes.length}** outcome metrics moved in the expected direction.\n\n`;

  for (const r of results) {
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
