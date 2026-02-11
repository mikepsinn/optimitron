/**
 * Golden Path Demo — Health Optimization via Causal Analysis
 *
 * THE demo script. One command shows the complete Optomitron pipeline:
 *
 *   pnpm --filter @optomitron/examples run demo:health
 *
 * Generates 180 days of synthetic health data with KNOWN causal relationships,
 * runs the full analysis pipeline (temporal alignment → Bradford Hill scoring →
 * effect size → optimal values → markdown report), and validates that the engine
 * recovers those relationships.
 *
 * Encoded causal relationships:
 *   • Vitamin D (5000 IU) → Mood: +15% improvement, 2-day onset delay
 *   • Sleep duration → Mood: positive correlation, 0-day delay
 *   • Coffee intake → Sleep: negative correlation (>3 cups = worse sleep)
 *   • Vitamin D → Sleep: weak positive (indirect via mood/wellbeing)
 *
 * Output:
 *   • Console: key findings with emoji indicators
 *   • packages/examples/output/golden-path-report.md
 *   • packages/examples/output/golden-path-results.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  type TimeSeries,
  type FullAnalysisResult,
  runFullAnalysis,
  generateMarkdownReport,
} from '@optomitron/optimizer';

// ─── Deterministic PRNG ──────────────────────────────────────────────

/** Deterministic seeded PRNG (LCG) for reproducible synthetic data. */
function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

/** Box-Muller transform for normally distributed random variates. */
function normalRandom(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

/** Clamp a value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to N decimal places. */
function round(value: number, decimals: number = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ─── Synthetic Data Generators ───────────────────────────────────────

const DAYS = 180;
const DAY_MS = 86_400_000;
const START = new Date('2025-06-01T08:00:00Z').getTime();

/**
 * Generate 180 days of Vitamin D supplementation.
 *
 * Pattern: 5000 IU most days, ~15% skip rate (realistic adherence).
 * Some days get a half-dose (2500 IU) to create gradient.
 */
function generateVitaminD(rng: () => number): TimeSeries {
  const measurements: Array<{ timestamp: number; value: number; unit: string }> = [];

  for (let day = 0; day < DAYS; day++) {
    const r = rng();
    let dose: number;
    if (r < 0.15) {
      dose = 0;          // skipped day (~15%)
    } else if (r < 0.25) {
      dose = 2500;        // half dose (~10%)
    } else {
      dose = 5000;        // full dose (~75%)
    }
    measurements.push({
      timestamp: START + day * DAY_MS,
      value: dose,
      unit: 'IU',
    });
  }

  return {
    variableId: 'vitamin_d',
    name: 'Vitamin D Supplementation',
    measurements,
    category: 'Supplements',
  };
}

/**
 * Generate 180 days of coffee intake (cups/day).
 *
 * Pattern: 0-5 cups/day, normally distributed around 2.5 cups.
 * Weekends tend to have more coffee.
 */
function generateCoffee(rng: () => number): TimeSeries {
  const measurements: Array<{ timestamp: number; value: number; unit: string }> = [];

  for (let day = 0; day < DAYS; day++) {
    const date = new Date(START + day * DAY_MS);
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const baseCups = isWeekend ? 3.2 : 2.3;
    const cups = clamp(round(normalRandom(rng, baseCups, 1.0), 1), 0, 6);
    measurements.push({
      timestamp: START + day * DAY_MS,
      value: cups,
      unit: 'cups',
    });
  }

  return {
    variableId: 'coffee',
    name: 'Coffee Intake',
    measurements,
    category: 'Foods',
  };
}

/**
 * Generate 180 days of sleep duration.
 *
 * Causal dependencies encoded:
 *   • Coffee → Sleep: negative. Each cup above 2 reduces sleep by ~0.25 hours.
 *   • Vitamin D → Sleep: weak positive. Days with vitamin D = ~+0.15 hours.
 */
function generateSleep(
  rng: () => number,
  coffee: TimeSeries,
  vitaminD: TimeSeries,
): TimeSeries {
  const measurements: Array<{ timestamp: number; value: number; unit: string }> = [];
  const coffeeDoses = coffee.measurements.map((m) => m.value);
  const vitDDoses = vitaminD.measurements.map((m) => m.value);

  for (let day = 0; day < DAYS; day++) {
    // Coffee effect: same-day. Each cup above 2 → −0.25 hours sleep.
    const coffeeToday = coffeeDoses[day] ?? 2;
    const coffeeEffect = -0.25 * Math.max(0, coffeeToday - 2);

    // Vitamin D effect: weak, delayed 1 day
    const vitDYesterday = day > 0 ? (vitDDoses[day - 1] ?? 0) : 0;
    const vitDEffect = vitDYesterday > 0 ? 0.15 : 0;

    const baseSleep = 7.2; // baseline sleep hours
    const noise = normalRandom(rng, 0, 0.5);
    const sleep = clamp(round(baseSleep + coffeeEffect + vitDEffect + noise, 1), 3, 10);

    measurements.push({
      timestamp: START + day * DAY_MS + 14 * 3600_000, // sleep logged ~10pm
      value: sleep,
      unit: 'hours',
    });
  }

  return {
    variableId: 'sleep',
    name: 'Sleep Duration',
    measurements,
    category: 'Sleep',
  };
}

/**
 * Generate 180 days of mood ratings (1-10).
 *
 * Causal dependencies encoded:
 *   • Vitamin D → Mood: positive, 2-day onset delay. 5000 IU → ~+1.2 mood points.
 *   • Sleep → Mood: positive, 0-day delay. Each hour above 7 → ~+0.5 mood.
 */
function generateMood(
  rng: () => number,
  vitaminD: TimeSeries,
  sleep: TimeSeries,
): TimeSeries {
  const measurements: Array<{ timestamp: number; value: number; unit: string }> = [];
  const vitDDoses = vitaminD.measurements.map((m) => m.value);
  const sleepHours = sleep.measurements.map((m) => m.value);

  for (let day = 0; day < DAYS; day++) {
    // Vitamin D effect: 2-day onset delay. Average of day-2 and day-3.
    let vitDRecent = 0;
    let vitDCount = 0;
    for (let lag = 2; lag <= 3; lag++) {
      if (day - lag >= 0) {
        vitDRecent += vitDDoses[day - lag] ?? 0;
        vitDCount++;
      }
    }
    vitDRecent = vitDCount > 0 ? vitDRecent / vitDCount : 0;
    const vitDEffect = (vitDRecent / 5000) * 1.2; // 5000 IU → +1.2 mood

    // Sleep effect: same-day. Each hour above 7 → +0.5 mood.
    const sleepToday = sleepHours[day] ?? 7;
    const sleepEffect = 0.5 * (sleepToday - 7);

    const baseMood = 5.8; // baseline mood
    const noise = normalRandom(rng, 0, 0.6);
    const mood = clamp(round(baseMood + vitDEffect + sleepEffect + noise, 1), 1, 10);

    measurements.push({
      timestamp: START + day * DAY_MS + 20 * 3600_000, // mood logged ~8pm
      value: mood,
      unit: '1-10',
    });
  }

  return {
    variableId: 'mood',
    name: 'Overall Mood',
    measurements,
    category: 'Mood',
  };
}

// ─── Analysis Pipeline ───────────────────────────────────────────────

interface AnalysisPair {
  predictor: TimeSeries;
  outcome: TimeSeries;
  label: string;
  onsetDelayDays: number;
  durationOfActionDays: number;
  expectedDirection: 'positive' | 'negative';
  plausibilityScore: number;
}

function defineAnalysisPairs(
  vitaminD: TimeSeries,
  coffee: TimeSeries,
  sleep: TimeSeries,
  mood: TimeSeries,
): AnalysisPair[] {
  return [
    {
      predictor: vitaminD,
      outcome: mood,
      label: 'Vitamin D → Mood',
      onsetDelayDays: 2,
      durationOfActionDays: 3,
      expectedDirection: 'positive',
      plausibilityScore: 0.8,
    },
    {
      predictor: sleep,
      outcome: mood,
      label: 'Sleep → Mood',
      onsetDelayDays: 0,
      durationOfActionDays: 1,
      expectedDirection: 'positive',
      plausibilityScore: 0.9,
    },
    {
      predictor: coffee,
      outcome: sleep,
      label: 'Coffee → Sleep',
      onsetDelayDays: 0,
      durationOfActionDays: 1,
      expectedDirection: 'negative',
      plausibilityScore: 0.85,
    },
    {
      predictor: vitaminD,
      outcome: sleep,
      label: 'Vitamin D → Sleep',
      onsetDelayDays: 1,
      durationOfActionDays: 2,
      expectedDirection: 'positive',
      plausibilityScore: 0.4,
    },
  ];
}

function runAnalysisPair(pair: AnalysisPair): FullAnalysisResult {
  return runFullAnalysis(pair.predictor, pair.outcome, {
    onsetDelaySeconds: pair.onsetDelayDays * 86400,
    durationOfActionSeconds: pair.durationOfActionDays * 86400,
    fillingType: 'zero',
    subjectCount: 1,
    plausibilityScore: pair.plausibilityScore,
    coherenceScore: 0.6,
    analogyScore: 0.5,
    specificityScore: 0.4,
    analysisMode: 'individual',
  });
}

// ─── Report Generation ───────────────────────────────────────────────

function generateGoldenPathReport(
  results: Array<{ pair: AnalysisPair; result: FullAnalysisResult }>,
): string {
  const lines: string[] = [];
  const add = (s: string) => lines.push(s);

  add('# 🏥 Optomitron — Golden Path Health Optimization Report');
  add('');
  add(`**Generated:** ${new Date().toISOString().slice(0, 10)}`);
  add(`**Data Period:** 180 days of synthetic health tracking`);
  add(`**Pipeline:** Synthetic data → Temporal alignment → Bradford Hill → PIS → Optimal values`);
  add('');

  // ── Executive Summary ──
  add('## Executive Summary');
  add('');
  add('This report demonstrates the complete Optomitron causal analysis pipeline.');
  add('Synthetic health data with *known* causal relationships was generated and');
  add('analyzed to validate that the engine correctly recovers:');
  add('');
  add('| Relationship | Expected | Found | Status |');
  add('|-------------|----------|-------|--------|');

  for (const { pair, result } of results) {
    const direction = result.forwardPearson >= 0 ? 'positive' : 'negative';
    const matchesExpected = direction === pair.expectedDirection;
    const significant = result.pValue < 0.05;
    const status = matchesExpected && significant ? '✅ Confirmed' :
      matchesExpected ? '🟡 Weak signal' : '❌ Unexpected';
    const pStr = result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(4);
    add(`| ${pair.label} | ${pair.expectedDirection} | r=${result.forwardPearson.toFixed(3)} (p=${pStr}) | ${status} |`);
  }

  add('');

  // ── Key Findings ──
  add('## Key Findings');
  add('');

  for (const { pair, result } of results) {
    const percentChange = result.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline;
    const absChange = Math.abs(percentChange);
    const direction = percentChange >= 0 ? 'improvement' : 'reduction';
    const pStr = result.pValue < 0.001 ? '< 0.001' : result.pValue.toFixed(4);
    const emoji = result.pValue < 0.05 ? '✅' : '⚠️';

    add(`### ${emoji} ${pair.label}`);
    add('');
    add(`- **Effect:** ${absChange.toFixed(1)}% ${direction} in ${result.outcomeName}`);
    add(`- **Correlation:** r = ${result.forwardPearson.toFixed(3)} (p = ${pStr})`);
    add(`- **Evidence Grade:** ${result.pis.evidenceGrade}`);
    add(`- **PIS:** ${(result.pis.score * 100).toFixed(1)}/100`);
    add(`- **Onset Delay:** ${pair.onsetDelayDays} day(s)`);
    add(`- **Optimal Value:** ${result.optimalValues.optimalDailyValue.toFixed(1)} ${pair.predictor.measurements[0]?.unit ?? ''}`);
    add('');
  }

  // ── Individual Analysis Reports ──
  add('---');
  add('');
  add('## Detailed Analysis Reports');
  add('');

  for (const { result } of results) {
    add(generateMarkdownReport(result));
    add('');
    add('---');
    add('');
  }

  // ── Recommendations ──
  add('## Recommendations');
  add('');

  for (const { pair, result } of results) {
    const rec = result.pis.recommendation;
    const emoji = rec === 'high_priority_trial' ? '🔬' :
      rec === 'moderate_priority' ? '📋' :
        rec === 'monitor' ? '👁️' : '⚠️';
    add(`- ${emoji} **${pair.label}:** ${formatRecommendation(rec)}`);
  }
  add('');

  // ── Data Quality Notes ──
  add('## Data Quality Notes');
  add('');
  add('| Relationship | Pairs | Quality | Predictor Variance | Outcome Variance |');
  add('|-------------|------:|:-------:|:------------------:|:----------------:|');

  for (const { pair, result } of results) {
    const dq = result.dataQuality;
    add(
      `| ${pair.label} | ${result.numberOfPairs} ` +
      `| ${dq.isValid ? '✅ PASS' : '❌ FAIL'} ` +
      `| ${dq.hasPredicorVariance ? '✅' : '❌'} (${dq.predictorChanges} changes) ` +
      `| ${dq.hasOutcomeVariance ? '✅' : '❌'} (${dq.outcomeChanges} changes) |`,
    );
  }
  add('');

  add('## Methodology');
  add('');
  add('This analysis uses the **Predictor Impact Score (PIS)** pipeline which combines:');
  add('');
  add('1. **Temporal Alignment** — Aligns predictor and outcome series accounting for onset delay and duration of action');
  add('2. **Forward & Reverse Correlation** — Establishes directionality (predictor drives outcome, not vice versa)');
  add('3. **Bradford Hill Criteria** — Scores 9 epidemiological criteria for causation');
  add('4. **Baseline vs Follow-up** — Compares outcome when predictor is below vs above mean');
  add('5. **Optimal Value Analysis** — Identifies the predictor dose associated with best outcomes');
  add('6. **Evidence Grading** — Assigns A/B/C/D/F grade based on aggregate evidence strength');
  add('');
  add('---');
  add('');
  add('*Generated by `@optomitron/examples` golden path demo using `@optomitron/optimizer`.*');

  return lines.join('\n');
}

function formatRecommendation(rec: string): string {
  switch (rec) {
    case 'high_priority_trial': return 'High-priority — consider controlled trial';
    case 'moderate_priority': return 'Moderate priority — continue tracking, increase data';
    case 'monitor': return 'Monitor — relationship present but needs more evidence';
    case 'insufficient_evidence': return 'Insufficient evidence — need more data points';
    default: return rec;
  }
}

// ─── Console Output ──────────────────────────────────────────────────

function printConsoleSummary(
  results: Array<{ pair: AnalysisPair; result: FullAnalysisResult }>,
): void {
  console.log('\n' + '═'.repeat(70));
  console.log('  🏥 OPTOMITRON — Golden Path Health Optimization Demo');
  console.log('═'.repeat(70));
  console.log(`\n  📊 Analyzing ${DAYS} days of synthetic health data...\n`);

  for (const { pair, result } of results) {
    const pct = result.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline;
    const absPct = Math.abs(pct);
    const direction = pct >= 0 ? 'improvement' : 'reduction';
    const pStr = result.pValue < 0.001 ? '< 0.001' : `${result.pValue.toFixed(4)}`;
    const significant = result.pValue < 0.05;
    const emoji = significant ? '✅' : '⚠️';

    const optVal = result.optimalValues.optimalDailyValue;
    const unit = pair.predictor.measurements[0]?.unit ?? '';
    const grade = result.pis.evidenceGrade;

    console.log(
      `  ${emoji} Found: ${pair.predictor.name} → ${result.outcomeName} ` +
      `${direction} of ${absPct.toFixed(1)}% (p ${pStr}, grade: ${grade})`,
    );
    console.log(
      `     r = ${result.forwardPearson.toFixed(3)}, ` +
      `PIS = ${(result.pis.score * 100).toFixed(1)}/100, ` +
      `optimal = ${optVal.toFixed(0)} ${unit}`,
    );
    console.log('');
  }

  console.log('─'.repeat(70));
}

// ─── JSON Output ─────────────────────────────────────────────────────

interface GoldenPathJsonOutput {
  generatedAt: string;
  dataDays: number;
  relationships: Array<{
    predictor: string;
    outcome: string;
    label: string;
    expectedDirection: string;
    forwardPearson: number;
    reversePearson: number;
    predictivePearson: number;
    spearmanCorrelation: number;
    pValue: number;
    effectPercentChange: number;
    effectAbsoluteChange: number;
    effectBaselineMean: number;
    effectFollowUpMean: number;
    optimalDailyValue: number;
    valuePredictingHighOutcome: number;
    valuePredictingLowOutcome: number;
    onsetDelayDays: number;
    durationOfActionDays: number;
    numberOfPairs: number;
    evidenceGrade: string;
    pisScore: number;
    recommendation: string;
    bradfordHill: {
      strength: number;
      consistency: number;
      temporality: number;
      gradient: number | null;
      experiment: number;
      plausibility: number;
      coherence: number;
      analogy: number;
      specificity: number;
    };
    dataQuality: {
      isValid: boolean;
      pairCount: number;
      predictorChanges: number;
      outcomeChanges: number;
    };
  }>;
}

function buildJsonOutput(
  results: Array<{ pair: AnalysisPair; result: FullAnalysisResult }>,
): GoldenPathJsonOutput {
  return {
    generatedAt: new Date().toISOString(),
    dataDays: DAYS,
    relationships: results.map(({ pair, result }) => ({
      predictor: result.predictorName,
      outcome: result.outcomeName,
      label: pair.label,
      expectedDirection: pair.expectedDirection,
      forwardPearson: round(result.forwardPearson, 4),
      reversePearson: round(result.reversePearson, 4),
      predictivePearson: round(result.predictivePearson, 4),
      spearmanCorrelation: round(result.spearmanCorrelation, 4),
      pValue: round(result.pValue, 6),
      effectPercentChange: round(result.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline, 2),
      effectAbsoluteChange: round(result.effectSize.absoluteChange, 4),
      effectBaselineMean: round(result.effectSize.baselineMean, 4),
      effectFollowUpMean: round(result.effectSize.followUpMean, 4),
      optimalDailyValue: round(result.optimalValues.optimalDailyValue, 2),
      valuePredictingHighOutcome: round(result.optimalValues.valuePredictingHighOutcome, 2),
      valuePredictingLowOutcome: round(result.optimalValues.valuePredictingLowOutcome, 2),
      onsetDelayDays: pair.onsetDelayDays,
      durationOfActionDays: pair.durationOfActionDays,
      numberOfPairs: result.numberOfPairs,
      evidenceGrade: result.pis.evidenceGrade,
      pisScore: round(result.pis.score, 4),
      recommendation: result.pis.recommendation,
      bradfordHill: {
        strength: round(result.bradfordHill.strength, 4),
        consistency: round(result.bradfordHill.consistency, 4),
        temporality: round(result.bradfordHill.temporality, 4),
        gradient: result.bradfordHill.gradient !== null ? round(result.bradfordHill.gradient, 4) : null,
        experiment: round(result.bradfordHill.experiment, 4),
        plausibility: round(result.bradfordHill.plausibility, 4),
        coherence: round(result.bradfordHill.coherence, 4),
        analogy: round(result.bradfordHill.analogy, 4),
        specificity: round(result.bradfordHill.specificity, 4),
      },
      dataQuality: {
        isValid: result.dataQuality.isValid,
        pairCount: result.dataQuality.pairCount,
        predictorChanges: result.dataQuality.predictorChanges,
        outcomeChanges: result.dataQuality.outcomeChanges,
      },
    })),
  };
}

// ─── File Output ─────────────────────────────────────────────────────

function ensureOutputDir(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outputDir = path.resolve(__dirname, '../../output');
  fs.mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

// ─── Main ────────────────────────────────────────────────────────────

export function runGoldenPathDemo(): {
  results: Array<{ pair: AnalysisPair; result: FullAnalysisResult }>;
  markdownReport: string;
  jsonOutput: GoldenPathJsonOutput;
} {
  const rng = seededRng(2025);

  // 1. Generate synthetic data with known causal relationships
  const vitaminD = generateVitaminD(rng);
  const coffee = generateCoffee(rng);
  const sleep = generateSleep(rng, coffee, vitaminD);
  const mood = generateMood(rng, vitaminD, sleep);

  // 2. Define analysis pairs
  const pairs = defineAnalysisPairs(vitaminD, coffee, sleep, mood);

  // 3. Run full pipeline for each pair
  const results = pairs.map((pair) => ({
    pair,
    result: runAnalysisPair(pair),
  }));

  // 4. Generate outputs
  const markdownReport = generateGoldenPathReport(results);
  const jsonOutput = buildJsonOutput(results);

  return { results, markdownReport, jsonOutput };
}

function main(): void {
  console.log('\n  ⏳ Generating synthetic health data and running analysis...\n');

  const { results, markdownReport, jsonOutput } = runGoldenPathDemo();

  // Print console summary
  printConsoleSummary(results);

  // Write files
  const outputDir = ensureOutputDir();

  const mdPath = path.join(outputDir, 'golden-path-report.md');
  fs.writeFileSync(mdPath, markdownReport, 'utf-8');

  const jsonPath = path.join(outputDir, 'golden-path-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');

  console.log(`  📄 Markdown report: ${mdPath}`);
  console.log(`  📊 JSON results:    ${jsonPath}`);
  console.log('');
  console.log('  🎉 Golden path demo complete!');
  console.log('═'.repeat(70) + '\n');
}

main();
