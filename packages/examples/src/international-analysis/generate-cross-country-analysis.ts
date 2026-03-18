/**
 * Combined Cross-Country Analysis
 *
 * Generates a unified JSON file combining health, drug policy, education,
 * and criminal justice comparisons for website consumption.
 *
 * @see https://opg.warondisease.org
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CRIMINAL_JUSTICE_COMPARISON,
  POLICY_EXEMPLARS,
  type CountryCriminalJustice,
  type PolicyExemplar,
} from '@optimitron/data';

import { generateHealthComparison } from './generate-health-comparison.js';
import { generateDrugPolicyComparison } from './generate-drug-policy-comparison.js';
import { generateEducationComparison } from './generate-education-comparison.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

// ---------------------------------------------------------------------------
// Criminal Justice Types & Analysis
// ---------------------------------------------------------------------------

export interface CriminalJusticeRanking {
  rank: number;
  country: string;
  iso3: string;
  outcomeScore: number;
  incarcerationRate: number;
  homicideRate: number;
  recidivismRate: number;
  approach: string;
}

export interface CriminalJusticeInsight {
  key: string;
  title: string;
  description: string;
  supportingData: Record<string, number | string>;
}

export interface CriminalJusticeExemplar {
  country: string;
  approach: string;
  rank: number;
  keyStrength: string;
  policyRecommendation: string;
}

export interface CriminalJusticeAnalysis {
  rankings: CriminalJusticeRanking[];
  insights: CriminalJusticeInsight[];
  exemplars: CriminalJusticeExemplar[];
}

export interface CrossCountryAnalysis {
  health: {
    rankings: any[];
    insights: any[];
    exemplars: any[];
  };
  drugPolicy: {
    rankings: any[];
    insights: any[];
    exemplars: any[];
  };
  education: {
    rankings: any[];
    insights: any[];
    exemplars: any[];
  };
  criminalJustice: {
    rankings: CriminalJusticeRanking[];
    insights: CriminalJusticeInsight[];
    exemplars: CriminalJusticeExemplar[];
  };
  policyExemplars: PolicyExemplar[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Criminal Justice Analysis
// ---------------------------------------------------------------------------

function normalizeInverse(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Number((((max - value) / (max - min)) * 100).toFixed(1));
}

/**
 * Score criminal justice outcomes.
 * Better = lower incarceration + lower homicide + lower recidivism + lower spending
 */
function analyzeCriminalJustice(): CriminalJusticeAnalysis {
  const data = CRIMINAL_JUSTICE_COMPARISON;

  const incarc = data.map((d) => d.incarcerationRatePer100K);
  const hom = data.map((d) => d.homicideRatePer100K);
  const recid = data.map((d) => d.recidivismRate);

  const minI = Math.min(...incarc), maxI = Math.max(...incarc);
  const minH = Math.min(...hom), maxH = Math.max(...hom);
  const minR = Math.min(...recid), maxR = Math.max(...recid);

  const scored = data
    .map((c) => {
      const incarcScore = normalizeInverse(c.incarcerationRatePer100K, minI, maxI);
      const homScore = normalizeInverse(c.homicideRatePer100K, minH, maxH);
      const recidScore = normalizeInverse(c.recidivismRate, minR, maxR);

      // Weighted: safety (homicide) 40%, rehabilitation (recidivism) 35%, liberty (low incarceration) 25%
      const outcomeScore = Number(
        (homScore * 0.4 + recidScore * 0.35 + incarcScore * 0.25).toFixed(1),
      );

      return {
        country: c.country,
        iso3: c.iso3,
        outcomeScore,
        incarcerationRate: c.incarcerationRatePer100K,
        homicideRate: c.homicideRatePer100K,
        recidivismRate: c.recidivismRate,
        approach: c.approach,
      };
    })
    .sort((a, b) => b.outcomeScore - a.outcomeScore);

  const rankings: CriminalJusticeRanking[] = scored.map((s, i) => ({
    rank: i + 1,
    ...s,
  }));

  const us = data.find((c) => c.iso3 === 'USA')!;
  const no = data.find((c) => c.iso3 === 'NOR')!;
  const jp = data.find((c) => c.iso3 === 'JPN')!;
  const usRank = rankings.find((r) => r.iso3 === 'USA')!.rank;

  const rehabCountries = data.filter(
    (c) => c.approach.toLowerCase().includes('rehabilitat'),
  );
  const avgRecidRehab =
    rehabCountries.reduce((s, c) => s + c.recidivismRate, 0) / rehabCountries.length;

  const insights: CriminalJusticeInsight[] = [
    {
      key: 'us-mass-incarceration',
      title: 'US incarcerates more people than any other developed nation — with the worst outcomes',
      description:
        `The US has an incarceration rate of ${us.incarcerationRatePer100K}/100K — ` +
        `${Math.round(us.incarcerationRatePer100K / no.incarcerationRatePer100K)}× Norway's rate — ` +
        `yet has a ${us.recidivismRate}% recidivism rate (vs Norway's ${no.recidivismRate}%) ` +
        `and a homicide rate of ${us.homicideRatePer100K}/100K (vs Norway's ${no.homicideRatePer100K}). ` +
        `The US spends ${us.justiceSpendingPctGDP}% of GDP on criminal justice — the highest in this analysis.`,
      supportingData: {
        usIncarceration: us.incarcerationRatePer100K,
        norwayIncarceration: no.incarcerationRatePer100K,
        usRecidivism: us.recidivismRate,
        norwayRecidivism: no.recidivismRate,
        usHomicide: us.homicideRatePer100K,
        norwegHomicide: no.homicideRatePer100K,
        usRank: usRank,
      },
    },
    {
      key: 'rehabilitation-works',
      title: 'Rehabilitative justice systems have 50-65% lower recidivism',
      description:
        `Countries with rehabilitative approaches (Norway, Finland, Netherlands, Germany) ` +
        `average ${avgRecidRehab.toFixed(0)}% recidivism vs ${us.recidivismRate}% in the US — ` +
        `a ${(us.recidivismRate - avgRecidRehab).toFixed(0)} percentage point difference. ` +
        `Norway's Halden model, with its focus on normality and reintegration, achieves ` +
        `just ${no.recidivismRate}% recidivism despite higher per-prisoner costs.`,
      supportingData: {
        avgRecidivismRehab: Number(avgRecidRehab.toFixed(0)),
        usRecidivism: us.recidivismRate,
        norwayRecidivism: no.recidivismRate,
        gap: Number((us.recidivismRate - avgRecidRehab).toFixed(0)),
      },
    },
    {
      key: 'japan-safety-low-incarceration',
      title: 'Japan achieves the lowest homicide and incarceration rates simultaneously',
      description:
        `Japan's homicide rate (${jp.homicideRatePer100K}/100K) and incarceration rate ` +
        `(${jp.incarcerationRatePer100K}/100K) are both the lowest in this analysis. ` +
        `Its community policing model (koban system) and strong social cohesion ` +
        `demonstrate that safety and liberty are not zero-sum.`,
      supportingData: {
        japanHomicide: jp.homicideRatePer100K,
        japanIncarceration: jp.incarcerationRatePer100K,
        usHomicide: us.homicideRatePer100K,
        usIncarceration: us.incarcerationRatePer100K,
      },
    },
    {
      key: 'cost-of-incarceration',
      title: 'Mass incarceration is economically inefficient',
      description:
        `The US spends ${us.justiceSpendingPctGDP}% of GDP on criminal justice while ` +
        `Norway spends ${no.justiceSpendingPctGDP}%. Despite spending 2× more as a share of GDP, ` +
        `the US has dramatically worse outcomes across every metric: higher crime, ` +
        `higher recidivism, and higher incarceration. Investing in rehabilitation ` +
        `is both more humane and more cost-effective.`,
      supportingData: {
        usJusticeSpending: us.justiceSpendingPctGDP,
        norwayJusticeSpending: no.justiceSpendingPctGDP,
        usRecidivism: us.recidivismRate,
        norwayRecidivism: no.recidivismRate,
      },
    },
  ];

  const exemplars: CriminalJusticeExemplar[] = [
    {
      country: 'Norway',
      approach: 'Rehabilitative / restorative',
      rank: rankings.find((r) => r.iso3 === 'NOR')!.rank,
      keyStrength:
        'Halden model: humane conditions, 2-year guard training, vocational education in prison. ' +
        'Only 20% recidivism. Maximum 21-year sentences.',
      policyRecommendation:
        'Shift prison systems toward rehabilitation: invest in education and job training, ' +
        'train guards as social workers, and reduce maximum sentences.',
    },
    {
      country: 'Japan',
      approach: 'Community-based prevention',
      rank: rankings.find((r) => r.iso3 === 'JPN')!.rank,
      keyStrength:
        'Koban (community police box) system embedded in neighborhoods. ' +
        'Strong social cohesion and community-based crime prevention.',
      policyRecommendation:
        'Invest in community policing and neighborhood-embedded law enforcement. ' +
        'Strengthen social safety nets to address root causes of crime.',
    },
    {
      country: 'Finland',
      approach: 'Open prisons / rehabilitative',
      rank: rankings.find((r) => r.iso3 === 'FIN')!.rank,
      keyStrength:
        '30% of prisoners in open institutions. Focus on normality principle — ' +
        'prison life should resemble outside life as much as possible.',
      policyRecommendation:
        'Implement open prison programs for low-risk offenders. ' +
        'Expand alternatives to incarceration: electronic monitoring, community service.',
    },
    {
      country: 'South Korea',
      approach: 'Deterrence with rehabilitation',
      rank: rankings.find((r) => r.iso3 === 'KOR')!.rank,
      keyStrength:
        'Low recidivism (23%), low homicide rate, widespread electronic monitoring. ' +
        'Restorative justice pilot programs showing promise.',
      policyRecommendation:
        'Expand electronic monitoring and restorative justice programs as alternatives ' +
        'to incarceration for non-violent offenses.',
    },
  ];

  return { rankings, insights, exemplars };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function generateCrossCountryAnalysis(): CrossCountryAnalysis {
  const health = generateHealthComparison();
  const drugPolicy = generateDrugPolicyComparison();
  const education = generateEducationComparison();
  const criminalJustice = analyzeCriminalJustice();

  return {
    health: {
      rankings: health.rankings,
      insights: health.insights,
      exemplars: health.exemplars,
    },
    drugPolicy: {
      rankings: drugPolicy.rankings,
      insights: drugPolicy.insights,
      exemplars: drugPolicy.exemplars,
    },
    education: {
      rankings: education.rankings,
      insights: education.insights,
      exemplars: education.exemplars,
    },
    criminalJustice: {
      rankings: criminalJustice.rankings,
      insights: criminalJustice.insights,
      exemplars: criminalJustice.exemplars,
    },
    policyExemplars: POLICY_EXEMPLARS,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main(): void {
  console.log('🌍 Generating cross-country analysis...\n');

  const output = generateCrossCountryAnalysis();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const jsonPath = path.join(OUTPUT_DIR, 'cross-country-analysis.json');
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`  ✅ Combined JSON: ${jsonPath}`);

  console.log('\n📊 Summary:');
  console.log(`   Health:           ${output.health.rankings.length} countries`);
  console.log(`   Drug policy:      ${output.drugPolicy.rankings.length} countries`);
  console.log(`   Education:        ${output.education.rankings.length} countries`);
  console.log(`   Criminal justice: ${output.criminalJustice.rankings.length} countries`);
  console.log(`   Policy exemplars: ${output.policyExemplars.length}`);
}

const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('generate-cross-country') || process.argv[1].includes('tsx'));

if (isMainModule) {
  main();
}
