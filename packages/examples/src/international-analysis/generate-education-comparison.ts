/**
 * International Education System Comparison Analysis
 *
 * Loads education data for all 20 countries, calculates spending
 * efficiency (PISA scores per % GDP spent), ranks countries, and
 * generates JSON + markdown output.
 *
 * @see https://opg.warondisease.org
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EDUCATION_COMPARISON,
  type CountryEducationData,
} from '@optimitron/data';

import { getExemplarsByCategory } from '@optimitron/data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EducationEfficiency {
  country: string;
  iso3: string;
  /** Average PISA score (math + reading + science) / 3 */
  avgPisaScore: number;
  educationSpendingPctGDP: number;
  /** PISA points per % GDP spent on education */
  efficiencyScore: number;
  teacherSalaryRelativeToGDP: number;
  studentTeacherRatio: number;
  universalPreK: boolean;
}

export interface EducationRanking {
  rank: number;
  country: string;
  iso3: string;
  efficiencyScore: number;
  avgPisaScore: number;
  spendingPctGDP: number;
  teacherSalaryRatio: number;
}

export interface EducationInsight {
  key: string;
  title: string;
  description: string;
  supportingData: Record<string, number | string | boolean>;
}

export interface EducationExemplar {
  country: string;
  keyStrength: string;
  rank: number;
  policyRecommendation: string;
}

export interface EducationComparisonOutput {
  generatedAt: string;
  dataSource: string;
  countryCount: number;
  rankings: EducationRanking[];
  top5: EducationRanking[];
  bottom5: EducationRanking[];
  usPosition: EducationRanking;
  insights: EducationInsight[];
  exemplars: EducationExemplar[];
  efficiencies: EducationEfficiency[];
  /** Rankings by raw PISA score (not efficiency) */
  pisaRankings: EducationRanking[];
}

// ---------------------------------------------------------------------------
// Core Calculations
// ---------------------------------------------------------------------------

function calculateEfficiencies(): EducationEfficiency[] {
  return EDUCATION_COMPARISON.map((c) => {
    const avgPisa = Number(
      ((c.pisaScoreMath + c.pisaScoreReading + c.pisaScoreScience) / 3).toFixed(1),
    );
    return {
      country: c.country,
      iso3: c.iso3,
      avgPisaScore: avgPisa,
      educationSpendingPctGDP: c.educationSpendingPctGDP,
      efficiencyScore: Number((avgPisa / c.educationSpendingPctGDP).toFixed(1)),
      teacherSalaryRelativeToGDP: c.teacherSalaryRelativeToGDP,
      studentTeacherRatio: c.studentTeacherRatio,
      universalPreK: c.universalPreK,
    };
  }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
}

function buildRankings(efficiencies: EducationEfficiency[]): EducationRanking[] {
  return efficiencies.map((e, i) => ({
    rank: i + 1,
    country: e.country,
    iso3: e.iso3,
    efficiencyScore: e.efficiencyScore,
    avgPisaScore: e.avgPisaScore,
    spendingPctGDP: e.educationSpendingPctGDP,
    teacherSalaryRatio: e.teacherSalaryRelativeToGDP,
  }));
}

function buildPisaRankings(efficiencies: EducationEfficiency[]): EducationRanking[] {
  const sorted = [...efficiencies].sort((a, b) => b.avgPisaScore - a.avgPisaScore);
  return sorted.map((e, i) => ({
    rank: i + 1,
    country: e.country,
    iso3: e.iso3,
    efficiencyScore: e.efficiencyScore,
    avgPisaScore: e.avgPisaScore,
    spendingPctGDP: e.educationSpendingPctGDP,
    teacherSalaryRatio: e.teacherSalaryRelativeToGDP,
  }));
}

function generateInsights(
  rankings: EducationRanking[],
  efficiencies: EducationEfficiency[],
): EducationInsight[] {
  const sg = efficiencies.find((e) => e.iso3 === 'SGP')!;
  const fi = efficiencies.find((e) => e.iso3 === 'FIN')!;
  const us = efficiencies.find((e) => e.iso3 === 'USA')!;
  const ie = efficiencies.find((e) => e.iso3 === 'IRL')!;
  const jp = efficiencies.find((e) => e.iso3 === 'JPN')!;

  const usRank = rankings.find((r) => r.iso3 === 'USA')!.rank;

  const highTeacherPay = efficiencies
    .filter((e) => e.teacherSalaryRelativeToGDP >= 1.05)
    .sort((a, b) => b.avgPisaScore - a.avgPisaScore);

  const avgPisaHighPay =
    highTeacherPay.reduce((s, e) => s + e.avgPisaScore, 0) / highTeacherPay.length;
  const lowTeacherPay = efficiencies.filter((e) => e.teacherSalaryRelativeToGDP < 0.9);
  const avgPisaLowPay =
    lowTeacherPay.reduce((s, e) => s + e.avgPisaScore, 0) / lowTeacherPay.length;

  return [
    {
      key: 'singapore-efficiency',
      title: 'Singapore: #1 in PISA scores while spending the least on education',
      description:
        `Singapore tops global PISA rankings with an average score of ${sg.avgPisaScore} ` +
        `while spending only ${sg.educationSpendingPctGDP}% of GDP on education — the lowest ` +
        `among all 20 countries analyzed. This makes Singapore the most education-efficient ` +
        `country by a significant margin, achieving ${sg.efficiencyScore} PISA points per % GDP.`,
      supportingData: {
        singaporePisa: sg.avgPisaScore,
        singaporeSpending: sg.educationSpendingPctGDP,
        singaporeEfficiency: sg.efficiencyScore,
        singaporeTeacherPay: sg.teacherSalaryRelativeToGDP,
      },
    },
    {
      key: 'finland-equity-model',
      title: 'Finland prioritizes equity over competition — with strong results',
      description:
        `Finland's education model emphasizes teacher autonomy (master's degree required), ` +
        `minimal testing, equalized school funding, and a ${fi.studentTeacherRatio}:1 student-teacher ratio. ` +
        `While PISA scores have declined from their 2006 peak, Finland maintains one of the ` +
        `smallest achievement gaps between top and bottom students globally. ` +
        `Average PISA: ${fi.avgPisaScore}, spending: ${fi.educationSpendingPctGDP}% GDP.`,
      supportingData: {
        finlandPisa: fi.avgPisaScore,
        finlandSpending: fi.educationSpendingPctGDP,
        finlandSTR: fi.studentTeacherRatio,
        finlandTeacherPay: fi.teacherSalaryRelativeToGDP,
        finlandPreK: fi.universalPreK ? 'yes' : 'no',
      },
    },
    {
      key: 'us-mediocre-outcomes',
      title: `US ranks #${usRank} in education efficiency despite above-average spending`,
      description:
        `The United States spends ${us.educationSpendingPctGDP}% of GDP on education but achieves ` +
        `an average PISA score of only ${us.avgPisaScore} — efficiency rank #${usRank} out of ` +
        `${rankings.length} countries. Critically, US teacher salaries are only ${us.teacherSalaryRelativeToGDP}x ` +
        `GDP per capita — among the lowest relative teacher pay in the OECD. ` +
        `The US also lacks universal pre-K.`,
      supportingData: {
        usPisa: us.avgPisaScore,
        usSpending: us.educationSpendingPctGDP,
        usEfficiency: us.efficiencyScore,
        usTeacherPay: us.teacherSalaryRelativeToGDP,
        usRank: usRank,
        usPreK: us.universalPreK ? 'yes' : 'no',
      },
    },
    {
      key: 'teacher-pay-correlation',
      title: 'Higher relative teacher pay correlates with better student outcomes',
      description:
        `Countries paying teachers ≥1.05x GDP per capita average ${avgPisaHighPay.toFixed(0)} on PISA, ` +
        `while those paying <0.9x average ${avgPisaLowPay.toFixed(0)} — a ${(avgPisaHighPay - avgPisaLowPay).toFixed(0)}-point gap. ` +
        `Singapore (${sg.teacherSalaryRelativeToGDP}x), South Korea (1.34x), and Japan (1.05x) — all top PISA performers — ` +
        `pay teachers competitively. The US (${us.teacherSalaryRelativeToGDP}x) does not.`,
      supportingData: {
        avgPisaHighPay: Number(avgPisaHighPay.toFixed(0)),
        avgPisaLowPay: Number(avgPisaLowPay.toFixed(0)),
        gap: Number((avgPisaHighPay - avgPisaLowPay).toFixed(0)),
        usTeacherPay: us.teacherSalaryRelativeToGDP,
        singaporeTeacherPay: sg.teacherSalaryRelativeToGDP,
      },
    },
    {
      key: 'ireland-efficiency',
      title: 'Ireland achieves top-tier outcomes with modest spending',
      description:
        `Ireland spends only ${ie.educationSpendingPctGDP}% of GDP on education — one of the lowest ` +
        `rates — yet achieves an average PISA of ${ie.avgPisaScore}, ranking among the top performers. ` +
        `Its efficiency score of ${ie.efficiencyScore} is second only to Singapore. ` +
        `Key factors: competitive teacher pay (${ie.teacherSalaryRelativeToGDP}x GDP/capita), ` +
        `universal pre-K, and strong emphasis on reading instruction.`,
      supportingData: {
        irelandPisa: ie.avgPisaScore,
        irelandSpending: ie.educationSpendingPctGDP,
        irelandEfficiency: ie.efficiencyScore,
        irelandTeacherPay: ie.teacherSalaryRelativeToGDP,
      },
    },
  ];
}

function identifyExemplars(rankings: EducationRanking[]): EducationExemplar[] {
  return [
    {
      country: 'Singapore',
      keyStrength:
        'Highest PISA scores globally with lowest education spending as % GDP. ' +
        'Competitive teacher salaries (1.22x GDP/capita), rigorous teacher selection, ' +
        'and emphasis on problem-solving over rote learning.',
      rank: rankings.find((r) => r.iso3 === 'SGP')!.rank,
      policyRecommendation:
        'Invest in teacher quality over quantity. Make teaching a competitive, prestigious ' +
        'profession with salaries at or above GDP per capita. Focus curriculum on ' +
        'problem-solving and critical thinking.',
    },
    {
      country: 'Finland',
      keyStrength:
        'Smallest achievement gap between top and bottom students. ' +
        'Master\'s degree required for teachers (10% acceptance rate). ' +
        'Minimal standardized testing. High teacher autonomy.',
      rank: rankings.find((r) => r.iso3 === 'FIN')!.rank,
      policyRecommendation:
        'Prioritize teacher training and autonomy. Reduce standardized testing. ' +
        'Equalize funding across schools to close achievement gaps.',
    },
    {
      country: 'Japan',
      keyStrength:
        'Consistently high PISA scores with moderate spending. ' +
        'Strong focus on effort-based mindset (ganbaru culture), lesson study for ' +
        'continuous teacher improvement, and comprehensive school activities.',
      rank: rankings.find((r) => r.iso3 === 'JPN')!.rank,
      policyRecommendation:
        'Implement lesson study (jugyō kenkyū) for collaborative teacher improvement. ' +
        'Cultivate growth mindset in students. Balance academic rigor with well-being.',
    },
    {
      country: 'Estonia',
      keyStrength:
        'Top EU performer on PISA despite modest per-capita income. ' +
        'Digital-first education (e-Estonia), universal pre-K, and equitable school funding.',
      rank: rankings.find((r) => r.iso3 === 'EST')!.rank,
      policyRecommendation:
        'Invest in digital education infrastructure. Provide universal pre-K ' +
        'and ensure equitable funding regardless of school location.',
    },
    {
      country: 'Ireland',
      keyStrength:
        'Exceptional efficiency — high PISA outcomes at low spending. ' +
        'Strong teacher pay relative to GDP, universal pre-K, ' +
        'and emphasis on literacy and reading instruction.',
      rank: rankings.find((r) => r.iso3 === 'IRL')!.rank,
      policyRecommendation:
        'Focus spending on high-impact areas: competitive teacher salaries, ' +
        'early childhood education, and strong reading instruction foundations.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function generateEducationComparison(): EducationComparisonOutput {
  const efficiencies = calculateEfficiencies();
  const rankings = buildRankings(efficiencies);
  const pisaRankings = buildPisaRankings(efficiencies);
  const insights = generateInsights(rankings, efficiencies);
  const exemplars = identifyExemplars(rankings);

  const usPosition = rankings.find((r) => r.iso3 === 'USA')!;
  const top5 = rankings.slice(0, 5);
  const bottom5 = rankings.slice(-5);

  return {
    generatedAt: new Date().toISOString(),
    dataSource: 'OECD PISA 2022; OECD Education at a Glance 2023; UNESCO UIS',
    countryCount: EDUCATION_COMPARISON.length,
    rankings,
    top5,
    bottom5,
    usPosition,
    insights,
    exemplars,
    efficiencies,
    pisaRankings,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main(): void {
  console.log('📚 Generating international education comparison...\n');

  const output = generateEducationComparison();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const jsonPath = path.join(OUTPUT_DIR, 'education-comparison.json');
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`  ✅ JSON:     ${jsonPath}`);

  console.log(`\n📊 ${output.countryCount} countries analyzed`);
  console.log(`   Top performer: ${output.top5[0]!.country} (efficiency: ${output.top5[0]!.efficiencyScore})`);
  console.log(`   US position:   #${output.usPosition.rank} (efficiency: ${output.usPosition.efficiencyScore})`);
}

const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('generate-education') || process.argv[1].includes('tsx'));

if (isMainModule) {
  main();
}
