/**
 * Run all US policy datasets through the causal inference pipeline
 * 
 * Takes each existing time-series dataset, converts to TimeSeries format,
 * runs through runFullAnalysis(), and outputs computed Bradford Hill scores,
 * correlations, and baseline/followup analysis.
 * 
 * Usage: npx tsx packages/examples/src/policy-time-series-analysis/run-all-policies.ts
 */

import { runFullAnalysis } from '@optomitron/optimizer';
import type { TimeSeries, Measurement } from '@optomitron/optimizer';
import type { AnalysisConfig, FullAnalysisResult } from '@optomitron/optimizer';
import { US_HEALTHCARE_SPENDING_DATA } from '@optomitron/data';
import { US_DRUG_WAR_DATA } from '@optomitron/data';
import { US_INCARCERATION_DATA } from '@optomitron/data';
import { US_POLICE_SPENDING_DATA } from '@optomitron/data';
import { US_GUN_DATA } from '@optomitron/data';
import { US_DEATH_PENALTY_DATA } from '@optomitron/data';
import { US_CLIMATE_SPENDING_DATA } from '@optomitron/data';
import { US_MINIMUM_WAGE_DATA } from '@optomitron/data';
import { US_FOREIGN_AID_DATA } from '@optomitron/data';
import { US_IMMIGRATION_DATA, US_TARIFF_DATA } from '@optomitron/data';
import { US_LAFFER_CURVE_DATA } from '@optomitron/data';
import { US_ABSTINENCE_EDUCATION_DATA } from '@optomitron/data';
import { US_REGULATION_DATA } from '@optomitron/data';
import * as fs from 'fs';
import * as path from 'path';

// Helper: year to unix ms (July 1 of that year)
function yearToMs(year: number): number {
  return new Date(`${year}-07-01T00:00:00Z`).getTime();
}

// Helper: convert array of {year, ...} to TimeSeries
function toTimeSeries(
  id: string,
  name: string,
  data: Array<Record<string, any>>,
  valueField: string,
  unit?: string,
): TimeSeries {
  return {
    variableId: id,
    name,
    measurements: data
      .filter(d => d[valueField] != null && !isNaN(d[valueField]))
      .map(d => ({
        timestamp: yearToMs(d['year']),
        value: d[valueField],
        unit,
      })),
  };
}

/**
 * Compute lagged correlation: does predictor change in year T predict
 * outcome change in year T+lag?
 */
function computeLaggedYoYCorrelation(
  data: Array<Record<string, any>>,
  predictorField: string,
  outcomeField: string,
  lagYears: number,
): { correlation: number; n: number } {
  const sorted = [...data]
    .filter(d => d[predictorField] != null && d[outcomeField] != null &&
                 !isNaN(d[predictorField]) && !isNaN(d[outcomeField]))
    .sort((a, b) => a['year'] - b['year']);

  if (sorted.length < 3 + lagYears) return { correlation: 0, n: 0 };

  // Build year-indexed map
  const byYear = new Map<number, Record<string, any>>();
  for (const d of sorted) byYear.set(d['year'], d);

  const pairs: Array<{ dx: number; dy: number }> = [];
  for (let i = 1; i < sorted.length; i++) {
    const year = sorted[i]!['year'];
    const prevYear = sorted[i - 1]!['year'];
    const laggedYear = year + lagYears;
    const laggedPrevYear = prevYear + lagYears;

    const prevX = sorted[i - 1]![predictorField];
    const currX = sorted[i]![predictorField];
    const laggedPrev = byYear.get(laggedPrevYear);
    const laggedCurr = byYear.get(laggedYear);
    
    if (prevX !== 0 && laggedPrev && laggedCurr) {
      const prevY = laggedPrev[outcomeField];
      const currY = laggedCurr[outcomeField];
      if (prevY != null && currY != null && prevY !== 0) {
        pairs.push({
          dx: (currX - prevX) / Math.abs(prevX),
          dy: (currY - prevY) / Math.abs(prevY),
        });
      }
    }
  }

  if (pairs.length < 3) return { correlation: 0, n: 0 };

  const n = pairs.length;
  const meanDx = pairs.reduce((s, p) => s + p.dx, 0) / n;
  const meanDy = pairs.reduce((s, p) => s + p.dy, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (const p of pairs) {
    num += (p.dx - meanDx) * (p.dy - meanDy);
    denX += (p.dx - meanDx) ** 2;
    denY += (p.dy - meanDy) ** 2;
  }
  const den = Math.sqrt(denX * denY);
  return { correlation: den > 0 ? Math.round((num / den) * 1000) / 1000 : 0, n };
}

/**
 * Compute first-differenced (YoY % change) correlation.
 * This controls for shared time trends — the #1 methodological fix.
 * If both variables just "go up over time", levels will correlate spuriously.
 * First differences ask: "when spending CHANGES, do outcomes CHANGE?"
 */
function computeYoYCorrelation(
  data: Array<Record<string, any>>,
  predictorField: string,
  outcomeField: string,
): { yoyCorrelation: number; yoyN: number } {
  // Sort by year, filter valid rows
  const sorted = [...data]
    .filter(d => d[predictorField] != null && d[outcomeField] != null &&
                 !isNaN(d[predictorField]) && !isNaN(d[outcomeField]))
    .sort((a, b) => a['year'] - b['year']);

  if (sorted.length < 3) return { yoyCorrelation: 0, yoyN: 0 };

  // Compute year-over-year % changes
  const changes: Array<{ dx: number; dy: number }> = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevX = sorted[i - 1]![predictorField];
    const prevY = sorted[i - 1]![outcomeField];
    const currX = sorted[i]![predictorField];
    const currY = sorted[i]![outcomeField];
    if (prevX !== 0 && prevY !== 0) {
      changes.push({
        dx: (currX - prevX) / Math.abs(prevX),
        dy: (currY - prevY) / Math.abs(prevY),
      });
    }
  }

  if (changes.length < 2) return { yoyCorrelation: 0, yoyN: 0 };

  // Pearson on changes
  const n = changes.length;
  const meanDx = changes.reduce((s, c) => s + c.dx, 0) / n;
  const meanDy = changes.reduce((s, c) => s + c.dy, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (const c of changes) {
    num += (c.dx - meanDx) * (c.dy - meanDy);
    denX += (c.dx - meanDx) ** 2;
    denY += (c.dy - meanDy) ** 2;
  }
  const den = Math.sqrt(denX * denY);
  const r = den > 0 ? num / den : 0;
  return { yoyCorrelation: Math.round(r * 1000) / 1000, yoyN: n };
}

// Each policy analysis definition
interface PolicyAnalysisDef {
  name: string;
  category: string;
  predictor: TimeSeries;
  outcome: TimeSeries;
  /** "higher" = higher outcome is better, "lower" = lower outcome is better */
  outcomeDirection: 'higher' | 'lower';
  /** What policy change is being evaluated */
  policyDescription: string;
  /** Raw data array + field names for YoY computation */
  rawData?: Array<Record<string, any>>;
  predictorField?: string;
  outcomeField?: string;
  config?: Partial<AnalysisConfig>;
}

function definePolicies(): PolicyAnalysisDef[] {
  return [
    // 1. Healthcare spending vs life expectancy
    {
      name: 'Healthcare Spending vs Life Expectancy',
      category: 'health',
      predictor: toTimeSeries('us-health-spending', 'US Health Spending per Capita (PPP)', 
        US_HEALTHCARE_SPENDING_DATA, 'usHealthSpendingPerCapita', 'USD'),
      outcome: toTimeSeries('us-life-expectancy', 'US Life Expectancy', 
        US_HEALTHCARE_SPENDING_DATA, 'usLifeExpectancy', 'years'),
      outcomeDirection: 'higher',
      policyDescription: 'Singapore-style universal healthcare with market competition',
      rawData: US_HEALTHCARE_SPENDING_DATA as any[], predictorField: 'usHealthSpendingPerCapita', outcomeField: 'usLifeExpectancy',
    },
    // 2. Healthcare spending vs infant mortality
    {
      name: 'Healthcare Spending vs Infant Mortality',
      category: 'health',
      predictor: toTimeSeries('us-health-spending', 'US Health Spending per Capita (PPP)', 
        US_HEALTHCARE_SPENDING_DATA, 'usHealthSpendingPerCapita', 'USD'),
      outcome: toTimeSeries('us-infant-mortality', 'US Infant Mortality Rate', 
        US_HEALTHCARE_SPENDING_DATA, 'usInfantMortalityRate', 'per 1000 live births'),
      outcomeDirection: 'lower',
      policyDescription: 'Healthcare restructuring toward efficiency',
      rawData: US_HEALTHCARE_SPENDING_DATA as any[], predictorField: 'usHealthSpendingPerCapita', outcomeField: 'usInfantMortalityRate',
    },
    // 3. Drug war spending vs overdose deaths
    {
      name: 'Drug Control Spending vs Overdose Deaths',
      category: 'health',
      predictor: toTimeSeries('drug-control-spending', 'Federal Drug Control Spending (Billions)', 
        US_DRUG_WAR_DATA, 'drugControlSpendingBillions', 'USD billions'),
      outcome: toTimeSeries('overdose-deaths', 'Drug Overdose Deaths', 
        US_DRUG_WAR_DATA, 'overdoseDeaths', 'deaths'),
      outcomeDirection: 'lower',
      policyDescription: 'Shift drug policy from criminal to health approach (Portugal model)',
      rawData: US_DRUG_WAR_DATA as any[], predictorField: 'drugControlSpendingBillions', outcomeField: 'overdoseDeaths',
    },
    // 4. Drug war spending vs overdose death rate
    {
      name: 'Drug Control Spending vs Overdose Death Rate',
      category: 'health',
      predictor: toTimeSeries('drug-control-spending', 'Federal Drug Control Spending (Billions)', 
        US_DRUG_WAR_DATA, 'drugControlSpendingBillions', 'USD billions'),
      outcome: toTimeSeries('overdose-death-rate', 'Overdose Death Rate per 100K', 
        US_DRUG_WAR_DATA, 'overdoseDeathRate', 'per 100K'),
      outcomeDirection: 'lower',
      policyDescription: 'Shift drug policy from criminal to health approach',
      rawData: US_DRUG_WAR_DATA as any[], predictorField: 'drugControlSpendingBillions', outcomeField: 'overdoseDeathRate',
    },
    // 5. Incarceration rate vs crime rate
    {
      name: 'Incarceration Rate vs Violent Crime Rate',
      category: 'justice',
      predictor: toTimeSeries('incarceration-rate', 'Incarceration Rate per 100K', 
        US_INCARCERATION_DATA, 'incarcerationRate', 'per 100K'),
      outcome: toTimeSeries('violent-crime-rate', 'Violent Crime Rate per 100K', 
        US_INCARCERATION_DATA, 'violentCrimeRate', 'per 100K'),
      outcomeDirection: 'lower',
      policyDescription: 'Criminal justice reform — reduce incarceration focus',
      rawData: US_INCARCERATION_DATA as any[], predictorField: 'incarcerationRate', outcomeField: 'violentCrimeRate',
    },
    // 6. Police spending vs violent crime
    {
      name: 'Police Spending vs Violent Crime Rate',
      category: 'justice',
      predictor: toTimeSeries('police-spending', 'Total Police Spending (Billions)', 
        US_POLICE_SPENDING_DATA, 'totalPoliceSpendingBillions', 'USD billions'),
      outcome: toTimeSeries('violent-crime', 'Violent Crime Rate per 100K', 
        US_POLICE_SPENDING_DATA, 'violentCrimeRate', 'per 100K'),
      outcomeDirection: 'lower',
      policyDescription: 'Community investment vs policing approach',
      rawData: US_POLICE_SPENDING_DATA as any[], predictorField: 'totalPoliceSpendingBillions', outcomeField: 'violentCrimeRate',
    },
    // 7. Gun prevalence vs gun homicide rate
    {
      name: 'Gun Ownership vs Gun Homicide Rate',
      category: 'safety',
      predictor: toTimeSeries('gun-ownership', 'Estimated Guns per 100 People', 
        US_GUN_DATA, 'estimatedGunsPerCapita', 'per 100'),
      outcome: toTimeSeries('gun-homicides', 'Gun Homicide Rate per 100K', 
        US_GUN_DATA, 'gunHomicideRate', 'per 100K'),
      outcomeDirection: 'lower',
      policyDescription: 'Evidence-based gun safety regulation',
      rawData: US_GUN_DATA as any[], predictorField: 'estimatedGunsPerCapita', outcomeField: 'gunHomicideRate',
    },
    // 8. Death penalty vs murder rate
    {
      name: 'Executions vs Murder Rate',
      category: 'justice',
      predictor: toTimeSeries('executions', 'Annual Executions', 
        US_DEATH_PENALTY_DATA, 'executionsCarriedOut', 'executions'),
      outcome: toTimeSeries('murder-rate', 'Homicide Rate per 100K', 
        US_DEATH_PENALTY_DATA, 'homicideRate', 'per 100K'),
      outcomeDirection: 'lower',
      policyDescription: 'Death penalty abolition (no deterrent effect)',
      rawData: US_DEATH_PENALTY_DATA as any[], predictorField: 'executionsCarriedOut', outcomeField: 'homicideRate',
    },
    // 9. Renewable energy investment vs emissions
    {
      name: 'Renewable Energy Investment vs CO2 Emissions',
      category: 'environment',
      predictor: toTimeSeries('renewable-investment', 'Renewable Energy Investment (Billions)', 
        US_CLIMATE_SPENDING_DATA, 'renewableEnergyInvestmentBillions', 'USD billions'),
      outcome: toTimeSeries('co2-emissions', 'CO2 Emissions (Million Metric Tons)', 
        US_CLIMATE_SPENDING_DATA, 'co2EmissionsMillionTons', 'MMT CO2'),
      outcomeDirection: 'lower',
      policyDescription: 'Carbon fee-and-dividend (BC model)',
      rawData: US_CLIMATE_SPENDING_DATA as any[], predictorField: 'renewableEnergyInvestmentBillions', outcomeField: 'co2EmissionsMillionTons',
    },
    // 10. Minimum wage vs unemployment
    {
      name: 'Minimum Wage vs Unemployment Rate',
      category: 'labor',
      predictor: toTimeSeries('min-wage', 'Federal Minimum Wage (Nominal)', 
        US_MINIMUM_WAGE_DATA, 'federalMinimumWage', 'USD'),
      outcome: toTimeSeries('unemployment', 'Unemployment Rate', 
        US_MINIMUM_WAGE_DATA, 'unemploymentRate', '%'),
      outcomeDirection: 'lower',
      policyDescription: 'Minimum wage indexed to median wage',
      rawData: US_MINIMUM_WAGE_DATA as any[], predictorField: 'federalMinimumWage', outcomeField: 'unemploymentRate',
    },
    // 11. Foreign aid vs global extreme poverty
    {
      name: 'Foreign Aid vs Global Extreme Poverty',
      category: 'foreign_policy',
      predictor: toTimeSeries('foreign-aid', 'Total ODA (Billions)', 
        US_FOREIGN_AID_DATA, 'totalOdaBillions', 'USD billions'),
      outcome: toTimeSeries('extreme-poverty', 'Global Extreme Poverty %', 
        US_FOREIGN_AID_DATA, 'globalExtremePovertPercent', '%'),
      outcomeDirection: 'lower',
      policyDescription: 'Strategic foreign aid investment',
      rawData: US_FOREIGN_AID_DATA as any[], predictorField: 'totalOdaBillions', outcomeField: 'globalExtremePovertPercent',
    },
    // 12. Top marginal tax rate vs GDP growth (Laffer curve)
    {
      name: 'Top Tax Rate vs GDP Growth',
      category: 'economy',
      predictor: toTimeSeries('top-tax-rate', 'Top Marginal Tax Rate', 
        US_LAFFER_CURVE_DATA, 'topMarginalTaxRate', '%'),
      outcome: toTimeSeries('gdp-growth', 'Real GDP Growth Rate', 
        US_LAFFER_CURVE_DATA, 'realGDPGrowthRate', '%'),
      outcomeDirection: 'higher',
      policyDescription: 'Optimal tax policy (evidence shows no Laffer effect at current rates)',
      rawData: US_LAFFER_CURVE_DATA as any[], predictorField: 'topMarginalTaxRate', outcomeField: 'realGDPGrowthRate',
    },
    // 13. Abstinence education vs teen pregnancy
    {
      name: 'Abstinence Education Funding vs Teen Birth Rate',
      category: 'education',
      predictor: toTimeSeries('abstinence-funding', 'Federal Abstinence Education Funding (Millions)', 
        US_ABSTINENCE_EDUCATION_DATA, 'federalAbstinenceFundingMillions', 'USD millions'),
      outcome: toTimeSeries('teen-births', 'Teen Birth Rate per 1,000', 
        US_ABSTINENCE_EDUCATION_DATA, 'teenBirthRatePer1000', 'per 1000'),
      outcomeDirection: 'lower',
      policyDescription: 'Evidence-based sex education',
      rawData: US_ABSTINENCE_EDUCATION_DATA as any[], predictorField: 'federalAbstinenceFundingMillions', outcomeField: 'teenBirthRatePer1000',
    },
    // 14. Regulation volume vs business creation
    {
      name: 'Federal Regulation Pages vs New Business Applications',
      category: 'economy',
      predictor: toTimeSeries('regulation-pages', 'Federal Register Pages', 
        US_REGULATION_DATA, 'federalRegisterPages', 'pages'),
      outcome: toTimeSeries('new-businesses', 'New Business Applications', 
        US_REGULATION_DATA, 'businessApplications', 'applications'),
      outcomeDirection: 'higher',
      policyDescription: 'NEPA & permitting reform',
      rawData: US_REGULATION_DATA as any[], predictorField: 'federalRegisterPages', outcomeField: 'businessApplications',
    },
  ];
}

// Each policy also stores the raw data refs for YoY computation
interface PolicyAnalysisDefWithData extends PolicyAnalysisDef {
  rawData: Array<Record<string, any>>;
  predictorField: string;
  outcomeField: string;
}

interface PolicyResult {
  name: string;
  category: string;
  policyDescription: string;
  outcomeDirection: 'higher' | 'lower';
  predictorName: string;
  outcomeName: string;
  dataPoints: number;
  yearRange: string;
  /** Levels correlation (potentially spurious due to shared time trends) */
  levelsCorrelation: number;
  /** First-differenced YoY % change correlation (controls for time trends) */
  yoyCorrelation: number;
  yoyN: number;
  /** Lagged YoY correlations (1-3 year lags) */
  laggedCorrelations: Array<{ lag: number; correlation: number; n: number }>;
  pValue: number | null;
  reversePearson: number;
  predictivePearson: number;
  effectSize: {
    zScore: number;
    percentChange: number;
  } | null;
  bradfordHillScores: Record<string, number>;
  bradfordHillTotal: number;
  predictorImpactScore: number;
  dataQuality: {
    sufficient: boolean;
    issues: string[];
  };
  baselineFollowup: {
    baselineMean: number;
    followupMean: number;
    change: number;
    percentChange: number;
  } | null;
  interpretation: string;
  /** Methodological notes / caveats specific to this analysis */
  caveats: string[];
}

function interpretResult(r: PolicyResult): { interpretation: string; caveats: string[] } {
  const dir = r.outcomeDirection;
  // Use YoY correlation as primary (controls for time trends), fall back to levels
  const yoy = r.yoyCorrelation;
  const levels = r.levelsCorrelation;
  const caveats: string[] = [];

  // Check for spurious correlation: high levels correlation but low YoY
  if (Math.abs(levels) > 0.7 && Math.abs(yoy) < 0.3) {
    caveats.push(`Levels correlation (r=${levels.toFixed(3)}) is likely spurious — shared time trends. ` +
                 `Year-over-year change correlation (r=${yoy.toFixed(3)}) shows no meaningful relationship.`);
  }

  // Check for disagreement between levels and YoY
  if (Math.sign(levels) !== Math.sign(yoy) && Math.abs(yoy) > 0.2) {
    caveats.push(`Levels and YoY correlations disagree in direction, suggesting confounding.`);
  }

  // Add standard caveats
  if (r.dataPoints < 20) {
    caveats.push(`Small sample (N=${r.dataPoints}). Interpret with caution.`);
  }
  caveats.push('Observational data — correlation does not establish causation.');

  // ALWAYS use YoY as primary. If YoY is near zero, verdict is NO CLEAR RELATIONSHIP
  // regardless of how impressive the levels correlation looks.
  const isCounterproductive = (dir === 'lower' && yoy > 0.2) || (dir === 'higher' && yoy < -0.2);
  const isEffective = (dir === 'lower' && yoy < -0.2) || (dir === 'higher' && yoy > 0.2);

  let interpretation: string;
  if (isCounterproductive) {
    interpretation = `COUNTERPRODUCTIVE: Increases in the predictor are associated with worse outcomes ` +
                     `(YoY r=${yoy.toFixed(3)}, levels r=${levels.toFixed(3)}).`;
  } else if (isEffective) {
    interpretation = `ASSOCIATED WITH IMPROVEMENT: Increases in the predictor are associated with better outcomes ` +
                     `(YoY r=${yoy.toFixed(3)}, levels r=${levels.toFixed(3)}).`;
  } else {
    interpretation = `NO CLEAR RELATIONSHIP: Year-over-year changes in the predictor do not predict changes in outcomes ` +
                     `(YoY r=${yoy.toFixed(3)}, levels r=${levels.toFixed(3)}).`;
  }

  return { interpretation, caveats };
}

function main() {
  const policies = definePolicies();
  const results: PolicyResult[] = [];
  
  console.log('=== US Policy Time-Series Analysis ===');
  console.log(`Running ${policies.length} analyses through the causal inference pipeline...\n`);
  
  for (const policy of policies) {
    try {
      // Configure for annual data (yearly time series)
      // Use large onset delay and duration since these are annual policy effects
      const config: AnalysisConfig = {
        onsetDelaySeconds: 0, // No delay for annual data
        durationOfActionSeconds: 365 * 24 * 3600, // 1 year
        fillingType: 'none',
        subjectCount: 1, // Single time series (US)
        plausibilityScore: 0.7,
        coherenceScore: 0.5,
        analogyScore: 0.5,
        specificityScore: 0.3,
        ...policy.config,
      };
      
      const analysis = runFullAnalysis(policy.predictor, policy.outcome, config);
      
      const years = policy.predictor.measurements.map(m => 
        new Date(m.timestamp as number).getFullYear()
      );
      
      // Compute YoY correlation (controls for shared time trends)
      const yoy = policy.rawData && policy.predictorField && policy.outcomeField
        ? computeYoYCorrelation(policy.rawData, policy.predictorField, policy.outcomeField)
        : { yoyCorrelation: 0, yoyN: 0 };

      // Compute lagged correlations (1-3 year lags)
      const laggedCorrelations = [1, 2, 3].map(lag => {
        if (!policy.rawData || !policy.predictorField || !policy.outcomeField) return { lag, correlation: 0, n: 0 };
        return { lag, ...computeLaggedYoYCorrelation(policy.rawData, policy.predictorField, policy.outcomeField, lag) };
      });

      const result: PolicyResult = {
        name: policy.name,
        category: policy.category,
        policyDescription: policy.policyDescription,
        outcomeDirection: policy.outcomeDirection,
        predictorName: policy.predictor.name,
        outcomeName: policy.outcome.name,
        dataPoints: analysis.numberOfPairs,
        yearRange: `${Math.min(...years)}-${Math.max(...years)}`,
        levelsCorrelation: analysis.forwardPearson,
        yoyCorrelation: yoy.yoyCorrelation,
        yoyN: yoy.yoyN,
        laggedCorrelations,
        pValue: analysis.pValue ?? null,
        reversePearson: analysis.reversePearson,
        predictivePearson: analysis.predictivePearson,
        effectSize: analysis.effectSize ? {
          zScore: analysis.effectSize.zScore,
          percentChange: analysis.effectSize.percentChange,
        } : null,
        bradfordHillScores: { ...analysis.bradfordHill, gradient: analysis.bradfordHill.gradient ?? 0 },
        bradfordHillTotal: Object.values(analysis.bradfordHill).reduce<number>((a, b) => a + (b ?? 0), 0) /
                          Object.values(analysis.bradfordHill).length,
        predictorImpactScore: analysis.pis.score,
        dataQuality: {
          sufficient: analysis.dataQuality.isValid,
          issues: analysis.dataQuality.failureReasons ?? [],
        },
        baselineFollowup: analysis.baselineFollowup ? {
          baselineMean: analysis.baselineFollowup.outcomeBaselineAverage,
          followupMean: analysis.baselineFollowup.outcomeFollowUpAverage,
          change: analysis.baselineFollowup.outcomeFollowUpAverage - analysis.baselineFollowup.outcomeBaselineAverage,
          percentChange: analysis.baselineFollowup.outcomeBaselineAverage !== 0
            ? ((analysis.baselineFollowup.outcomeFollowUpAverage - analysis.baselineFollowup.outcomeBaselineAverage) / 
               analysis.baselineFollowup.outcomeBaselineAverage) * 100
            : 0,
        } : null,
        interpretation: '',
        caveats: [],
      };
      
      const interp = interpretResult(result);
      result.interpretation = interp.interpretation;
      result.caveats = interp.caveats;
      results.push(result);
      
      const lagStr = result.laggedCorrelations
        .filter(l => l.n >= 3)
        .map(l => `L${l.lag}=${l.correlation.toFixed(3)}`)
        .join(' ');
      console.log(`✅ ${policy.name}`);
      console.log(`   Levels r=${result.levelsCorrelation.toFixed(3)} | YoY r=${result.yoyCorrelation.toFixed(3)} | Lags: ${lagStr || 'N/A'} | ${result.dataPoints} pts`);
      console.log(`   ${result.interpretation}`);
      if (result.caveats.length > 0) console.log(`   ⚠️  ${result.caveats[0]}`);
      console.log();
      
    } catch (err: any) {
      console.error(`❌ ${policy.name}: ${err.message}\n`);
    }
  }
  
  // Sort by absolute YoY correlation (strongest de-trended findings first)
  results.sort((a, b) => Math.abs(b.yoyCorrelation) - Math.abs(a.yoyCorrelation));
  
  // Write JSON output
  const output = {
    generatedAt: new Date().toISOString(),
    engine: '@optomitron/optimizer runFullAnalysis()',
    description: 'US policy analyses computed from real time-series data through the causal inference pipeline',
    totalAnalyses: results.length,
    summary: {
      counterproductive: results.filter(r => r.interpretation.startsWith('COUNTERPRODUCTIVE')).length,
      effective: results.filter(r => r.interpretation.startsWith('ASSOCIATED')).length,
      neutral: results.filter(r => r.interpretation.startsWith('NO CLEAR')).length,
    },
    analyses: results,
  };
  
  const outPath = path.join(process.cwd(), 'packages/web/public/data/policy-time-series-analysis.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n📊 Results written to ${outPath}`);
  
  // Also write markdown report
  let md = `# US Policy Time-Series Analysis\n\n`;
  md += `> Generated ${new Date().toISOString()} by @optomitron/optimizer\n\n`;
  md += `**Engine:** Every analysis below was computed by running real US government time-series data `;
  md += `through \`runFullAnalysis()\` — temporal alignment, Pearson/Spearman correlation, `;
  md += `reverse Pearson, baseline/followup, Bradford Hill scores, and Predictor Impact Score.\n\n`;
  md += `## Summary\n\n`;
  md += `| Verdict | Count |\n|---|---:|\n`;
  md += `| 🔴 Counterproductive | ${output.summary.counterproductive} |\n`;
  md += `| 🟢 Effective | ${output.summary.effective} |\n`;
  md += `| ⚪ Neutral | ${output.summary.neutral} |\n\n`;
  
  md += `## Results (sorted by correlation strength)\n\n`;
  
  for (const r of results) {
    const emoji = r.interpretation.startsWith('COUNTER') ? '🔴' : 
                  r.interpretation.startsWith('ASSOCIATED') ? '🟢' : '⚪';
    md += `### ${emoji} ${r.name}\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Predictor | ${r.predictorName} |\n`;
    md += `| Outcome | ${r.outcomeName} (${r.outcomeDirection} is better) |\n`;
    md += `| **YoY Change Correlation** | **${r.yoyCorrelation.toFixed(3)}** (N=${r.yoyN}) |\n`;
    md += `| Levels Correlation | ${r.levelsCorrelation.toFixed(3)} |\n`;
    md += `| Data Points | ${r.dataPoints} (${r.yearRange}) |\n`;
    md += `| Reverse Pearson | ${r.reversePearson.toFixed(3)} |\n`;
    md += `| Predictive Pearson | ${r.predictivePearson.toFixed(3)} |\n`;
    md += `| Predictor Impact Score | ${r.predictorImpactScore.toFixed(3)} |\n`;
    const validLags = r.laggedCorrelations.filter(l => l.n >= 3);
    if (validLags.length > 0) {
      md += `| Lagged YoY | ${validLags.map(l => `${l.lag}yr: r=${l.correlation.toFixed(3)} (N=${l.n})`).join(', ')} |\n`;
    }
    if (r.effectSize) {
      md += `| Effect Size (z-score) | ${r.effectSize.zScore.toFixed(3)} |\n`;
      md += `| % Change (baseline→followup) | ${r.effectSize.percentChange.toFixed(1)}% |\n`;
    }
    if (r.baselineFollowup) {
      md += `| Baseline Mean | ${r.baselineFollowup.baselineMean.toFixed(2)} |\n`;
      md += `| Followup Mean | ${r.baselineFollowup.followupMean.toFixed(2)} |\n`;
      md += `| Change | ${r.baselineFollowup.change.toFixed(2)} (${r.baselineFollowup.percentChange.toFixed(1)}%) |\n`;
    }
    md += `\n> **${r.interpretation}**\n\n`;
    if (r.caveats.length > 0) {
      md += `**Caveats:**\n`;
      for (const c of r.caveats) {
        md += `- ${c}\n`;
      }
      md += `\n`;
    }
    md += `**Policy context:** ${r.policyDescription}\n\n---\n\n`;
  }
  
  const mdPath = path.join(process.cwd(), 'reports/policy-time-series-analysis.md');
  fs.writeFileSync(mdPath, md);
  console.log(`📝 Report written to ${mdPath}`);
}

main();
