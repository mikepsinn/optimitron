/**
 * Tests for International Comparison Analysis outputs.
 *
 * Validates the generated JSON/Markdown files have the expected
 * structure, content, and data integrity for website consumption.
 *
 * Tests cover:
 * - Combined cross-country JSON structure
 * - Individual domain analysis (health, drug policy, education, criminal justice)
 * - Efficiency calculations and ranking consistency
 * - Policy exemplar data completeness
 * - Markdown report content
 * - Data integrity (rankings sorted, no duplicates, values in range)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateCrossCountryAnalysis, type CrossCountryAnalysis } from '../generate-cross-country-analysis.js';
import { generateHealthComparison } from '../generate-health-comparison.js';
import { generateDrugPolicyComparison } from '../generate-drug-policy-comparison.js';
import { generateEducationComparison } from '../generate-education-comparison.js';
import { runComparisons, generateCombinedMarkdownReport } from '../generate-comparisons.js';

import {
  HEALTH_SYSTEM_COMPARISON,
  DRUG_POLICY_COMPARISON,
  EDUCATION_COMPARISON,
  CRIMINAL_JUSTICE_COMPARISON,
  rankCountries,
  getTopPerformers,
  getCountryComparison,
  getFullCountryComparison,
} from '@optomitron/data';

import {
  POLICY_EXEMPLARS,
  getExemplarsByCategory,
  getExemplarsByTransferability,
  getExemplarCategories,
  getTotalOutcomeCount,
} from '@optomitron/data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../../output');

// ---------------------------------------------------------------------------
// Load outputs once
// ---------------------------------------------------------------------------

let crossCountryJson: CrossCountryAnalysis;
let crossCountryMarkdown: string;

beforeAll(() => {
  const jsonPath = path.join(OUTPUT_DIR, 'cross-country-analysis.json');
  const mdPath = path.join(OUTPUT_DIR, 'cross-country-report.md');

  crossCountryJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  crossCountryMarkdown = fs.readFileSync(mdPath, 'utf-8');
});

// =========================================================================
// 1. Combined Cross-Country JSON — Top-Level Structure
// =========================================================================

describe('Cross-Country Analysis JSON — Top-Level Structure', () => {
  it('should have all required top-level keys', () => {
    expect(crossCountryJson).toHaveProperty('health');
    expect(crossCountryJson).toHaveProperty('drugPolicy');
    expect(crossCountryJson).toHaveProperty('education');
    expect(crossCountryJson).toHaveProperty('criminalJustice');
    expect(crossCountryJson).toHaveProperty('policyExemplars');
    expect(crossCountryJson).toHaveProperty('generatedAt');
  });

  it('should have a valid ISO timestamp for generatedAt', () => {
    const date = new Date(crossCountryJson.generatedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  it('each domain should have rankings, insights, and exemplars arrays', () => {
    for (const domain of ['health', 'drugPolicy', 'education', 'criminalJustice'] as const) {
      const section = crossCountryJson[domain];
      expect(Array.isArray(section.rankings)).toBe(true);
      expect(section.rankings.length).toBeGreaterThan(0);
      expect(Array.isArray(section.insights)).toBe(true);
      expect(section.insights.length).toBeGreaterThan(0);
      expect(Array.isArray(section.exemplars)).toBe(true);
      expect(section.exemplars.length).toBeGreaterThan(0);
    }
  });

  it('policyExemplars should be a non-empty array', () => {
    expect(Array.isArray(crossCountryJson.policyExemplars)).toBe(true);
    expect(crossCountryJson.policyExemplars.length).toBeGreaterThanOrEqual(10);
  });
});

// =========================================================================
// 2. Health Analysis
// =========================================================================

describe('Health Analysis', () => {
  it('should rank all 20 health system countries', () => {
    expect(crossCountryJson.health.rankings.length).toBe(HEALTH_SYSTEM_COMPARISON.length);
  });

  it('each health ranking should have required fields', () => {
    for (const r of crossCountryJson.health.rankings) {
      expect(typeof r.rank).toBe('number');
      expect(typeof r.country).toBe('string');
      expect(typeof r.iso3).toBe('string');
      expect(typeof r.efficiencyScore).toBe('number');
      expect(typeof r.lifeExpectancy).toBe('number');
      expect(typeof r.spendingPerCapita).toBe('number');
      expect(typeof r.systemType).toBe('string');
    }
  });

  it('health rankings should be sorted by efficiency score (descending)', () => {
    const rankings = crossCountryJson.health.rankings;
    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i].efficiencyScore).toBeLessThanOrEqual(rankings[i - 1].efficiencyScore);
    }
  });

  it('health rank numbers should be sequential 1..N', () => {
    const rankings = crossCountryJson.health.rankings;
    for (let i = 0; i < rankings.length; i++) {
      expect(rankings[i].rank).toBe(i + 1);
    }
  });

  it('no duplicate countries in health rankings', () => {
    const countries = crossCountryJson.health.rankings.map((r: any) => r.country);
    expect(new Set(countries).size).toBe(countries.length);
  });

  it('health efficiency score should equal lifeExpectancy / spending * 1000', () => {
    for (const r of crossCountryJson.health.rankings) {
      const expected = (r.lifeExpectancy / r.spendingPerCapita) * 1000;
      expect(r.efficiencyScore).toBeCloseTo(expected, 2);
    }
  });

  it('US should be in the bottom 5 for health efficiency', () => {
    const rankings = crossCountryJson.health.rankings;
    const usRank = rankings.find((r: any) => r.iso3 === 'USA');
    expect(usRank).toBeDefined();
    expect(usRank!.rank).toBeGreaterThan(rankings.length - 5);
  });

  it('should have at least 4 health insights', () => {
    expect(crossCountryJson.health.insights.length).toBeGreaterThanOrEqual(4);
  });

  it('each health insight should have key, title, description, supportingData', () => {
    for (const insight of crossCountryJson.health.insights) {
      expect(typeof insight.key).toBe('string');
      expect(typeof insight.title).toBe('string');
      expect(typeof insight.description).toBe('string');
      expect(insight.description.length).toBeGreaterThan(50);
      expect(typeof insight.supportingData).toBe('object');
    }
  });

  it('health exemplars should include Singapore and Japan', () => {
    const exemplarCountries = crossCountryJson.health.exemplars.map((e: any) => e.country);
    expect(exemplarCountries).toContain('Singapore');
    expect(exemplarCountries).toContain('Japan');
  });
});

// =========================================================================
// 3. Drug Policy Analysis
// =========================================================================

describe('Drug Policy Analysis', () => {
  it('should rank all drug policy countries', () => {
    expect(crossCountryJson.drugPolicy.rankings.length).toBe(DRUG_POLICY_COMPARISON.length);
  });

  it('each drug policy ranking should have required fields', () => {
    for (const r of crossCountryJson.drugPolicy.rankings) {
      expect(typeof r.rank).toBe('number');
      expect(typeof r.country).toBe('string');
      expect(typeof r.iso3).toBe('string');
      expect(typeof r.approach).toBe('string');
      expect(typeof r.outcomeScore).toBe('number');
      expect(r.outcomeScore).toBeGreaterThanOrEqual(0);
      expect(r.outcomeScore).toBeLessThanOrEqual(100);
    }
  });

  it('drug policy rankings should be sorted by outcome score (descending)', () => {
    const rankings = crossCountryJson.drugPolicy.rankings;
    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i].outcomeScore).toBeLessThanOrEqual(rankings[i - 1].outcomeScore);
    }
  });

  it('US should rank near the bottom for drug policy outcomes', () => {
    const rankings = crossCountryJson.drugPolicy.rankings;
    const usRank = rankings.find((r: any) => r.iso3 === 'USA');
    expect(usRank).toBeDefined();
    // US should be in bottom third
    expect(usRank!.rank).toBeGreaterThan(Math.floor(rankings.length * 0.66));
  });

  it('Portugal should rank in the top 5 for drug policy outcomes', () => {
    const ptRank = crossCountryJson.drugPolicy.rankings.find((r: any) => r.iso3 === 'PRT');
    expect(ptRank).toBeDefined();
    expect(ptRank!.rank).toBeLessThanOrEqual(5);
  });

  it('drug policy insights should reference Portugal and the US', () => {
    const allDescriptions = crossCountryJson.drugPolicy.insights
      .map((i: any) => i.description)
      .join(' ');
    expect(allDescriptions).toContain('Portugal');
    expect(allDescriptions).toContain('United States');
  });
});

// =========================================================================
// 4. Education Analysis
// =========================================================================

describe('Education Analysis', () => {
  it('should rank all education countries', () => {
    expect(crossCountryJson.education.rankings.length).toBe(EDUCATION_COMPARISON.length);
  });

  it('each education ranking should have efficiency and PISA scores', () => {
    for (const r of crossCountryJson.education.rankings) {
      expect(typeof r.rank).toBe('number');
      expect(typeof r.country).toBe('string');
      expect(typeof r.efficiencyScore).toBe('number');
      expect(typeof r.avgPisaScore).toBe('number');
      expect(r.avgPisaScore).toBeGreaterThan(300);
      expect(r.avgPisaScore).toBeLessThan(700);
      expect(typeof r.spendingPctGDP).toBe('number');
    }
  });

  it('Singapore should be #1 in education efficiency', () => {
    const sgRank = crossCountryJson.education.rankings.find((r: any) => r.iso3 === 'SGP');
    expect(sgRank).toBeDefined();
    expect(sgRank!.rank).toBe(1);
  });

  it('Singapore should have the highest average PISA score', () => {
    const sgPisa = crossCountryJson.education.rankings.find((r: any) => r.iso3 === 'SGP')!.avgPisaScore;
    for (const r of crossCountryJson.education.rankings) {
      expect(sgPisa).toBeGreaterThanOrEqual(r.avgPisaScore);
    }
  });

  it('education efficiency should equal avgPISA / spendingPctGDP', () => {
    for (const r of crossCountryJson.education.rankings) {
      const expected = r.avgPisaScore / r.spendingPctGDP;
      expect(r.efficiencyScore).toBeCloseTo(expected, 0);
    }
  });
});

// =========================================================================
// 5. Criminal Justice Analysis
// =========================================================================

describe('Criminal Justice Analysis', () => {
  it('should rank all criminal justice countries', () => {
    expect(crossCountryJson.criminalJustice.rankings.length).toBe(
      CRIMINAL_JUSTICE_COMPARISON.length,
    );
  });

  it('each CJ ranking should have outcome score between 0 and 100', () => {
    for (const r of crossCountryJson.criminalJustice.rankings) {
      expect(r.outcomeScore).toBeGreaterThanOrEqual(0);
      expect(r.outcomeScore).toBeLessThanOrEqual(100);
    }
  });

  it('US should have the highest incarceration rate in the dataset', () => {
    const usEntry = crossCountryJson.criminalJustice.rankings.find(
      (r: any) => r.iso3 === 'USA',
    );
    expect(usEntry).toBeDefined();
    for (const r of crossCountryJson.criminalJustice.rankings) {
      expect(usEntry!.incarcerationRate).toBeGreaterThanOrEqual(r.incarcerationRate);
    }
  });

  it('Norway should have recidivism rate of 20%', () => {
    const no = crossCountryJson.criminalJustice.rankings.find((r: any) => r.iso3 === 'NOR');
    expect(no).toBeDefined();
    expect(no!.recidivismRate).toBe(20);
  });

  it('criminal justice insights should discuss mass incarceration', () => {
    const insightKeys = crossCountryJson.criminalJustice.insights.map((i: any) => i.key);
    expect(insightKeys).toContain('us-mass-incarceration');
  });
});

// =========================================================================
// 6. Policy Exemplars
// =========================================================================

describe('Policy Exemplars', () => {
  it('should have at least 10 policy exemplars', () => {
    expect(crossCountryJson.policyExemplars.length).toBeGreaterThanOrEqual(10);
  });

  it('each exemplar should have all required fields', () => {
    for (const ex of crossCountryJson.policyExemplars) {
      expect(typeof ex.name).toBe('string');
      expect(typeof ex.originCountry).toBe('string');
      expect(typeof ex.category).toBe('string');
      expect(typeof ex.description).toBe('string');
      expect(typeof ex.yearImplemented).toBe('number');
      expect(Array.isArray(ex.outcomes)).toBe(true);
      expect(ex.outcomes.length).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(ex.estimatedTransferability);
      expect(typeof ex.adaptationNotes).toBe('string');
      expect(Array.isArray(ex.sources)).toBe(true);
      expect(ex.sources.length).toBeGreaterThan(0);
    }
  });

  it('each outcome should have metric, beforeValue, afterValue, changePercent', () => {
    for (const ex of crossCountryJson.policyExemplars) {
      for (const outcome of ex.outcomes) {
        expect(typeof outcome.metric).toBe('string');
        expect(typeof outcome.beforeValue).toBe('number');
        expect(typeof outcome.afterValue).toBe('number');
        expect(typeof outcome.changePercent).toBe('number');
      }
    }
  });

  it('should include Portugal drug decriminalization exemplar', () => {
    const portugal = crossCountryJson.policyExemplars.find(
      (e: any) => e.originCountry === 'Portugal' && e.category === 'Drug Policy',
    );
    expect(portugal).toBeDefined();
    expect(portugal!.yearImplemented).toBe(2001);
  });

  it('should include Norway Halden prison model exemplar', () => {
    const norway = crossCountryJson.policyExemplars.find(
      (e: any) => e.originCountry === 'Norway' && e.category === 'Criminal Justice',
    );
    expect(norway).toBeDefined();
  });

  it('should span at least 5 different categories', () => {
    const categories = new Set(
      crossCountryJson.policyExemplars.map((e: any) => e.category),
    );
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });
});

// =========================================================================
// 7. Combined Markdown Report
// =========================================================================

describe('Cross-Country Markdown Report', () => {
  it('should have a main title', () => {
    expect(crossCountryMarkdown).toContain('# International Cross-Country Comparison Report');
  });

  it('should have a table of contents', () => {
    expect(crossCountryMarkdown).toContain('## Table of Contents');
  });

  it('should have sections for all four domains', () => {
    expect(crossCountryMarkdown).toContain('## Health Systems');
    expect(crossCountryMarkdown).toContain('## Drug Policy');
    expect(crossCountryMarkdown).toContain('## Education');
    expect(crossCountryMarkdown).toContain('## Criminal Justice');
  });

  it('should have a Policy Exemplars section', () => {
    expect(crossCountryMarkdown).toContain('## Policy Exemplars');
  });

  it('should have Cross-Domain Findings section', () => {
    expect(crossCountryMarkdown).toContain('## Cross-Domain Findings');
  });

  it('should have a Methodology section', () => {
    expect(crossCountryMarkdown).toContain('## Methodology');
    expect(crossCountryMarkdown).toContain('Data Sources');
  });

  it('should contain ranking tables with markdown table syntax', () => {
    // At least 4 tables (one per domain)
    const tableHeaderMatches = crossCountryMarkdown.match(/\| Rank \|/g);
    expect(tableHeaderMatches).not.toBeNull();
    expect(tableHeaderMatches!.length).toBeGreaterThanOrEqual(4);
  });

  it('should be at least 10KB in size', () => {
    expect(crossCountryMarkdown.length).toBeGreaterThan(10_000);
  });

  it('should mention key countries: Singapore, Portugal, Norway, Finland, US', () => {
    expect(crossCountryMarkdown).toContain('Singapore');
    expect(crossCountryMarkdown).toContain('Portugal');
    expect(crossCountryMarkdown).toContain('Norway');
    expect(crossCountryMarkdown).toContain('Finland');
    expect(crossCountryMarkdown).toContain('United States');
  });
});

// =========================================================================
// 8. Data Utility Functions
// =========================================================================

describe('Data utility functions (from @optomitron/data)', () => {
  it('rankCountries should rank health data by life expectancy', () => {
    const ranked = rankCountries(HEALTH_SYSTEM_COMPARISON, 'lifeExpectancy', false);
    expect(ranked.length).toBe(HEALTH_SYSTEM_COMPARISON.length);
    expect(ranked[0].rank).toBe(1);
    // Japan should be #1 in life expectancy
    expect(ranked[0].country).toBe('Japan');
  });

  it('getTopPerformers should return exactly N results', () => {
    const top3 = getTopPerformers(HEALTH_SYSTEM_COMPARISON, 'infantMortality', 3, true);
    expect(top3.length).toBe(3);
    // Lowest infant mortality countries
    for (const t of top3) {
      expect(t.value).toBeLessThan(3);
    }
  });

  it('getCountryComparison should compute differences correctly', () => {
    const comp = getCountryComparison('United States', 'Japan', HEALTH_SYSTEM_COMPARISON, 'health');
    expect(comp).not.toBeNull();
    expect(comp!.differences.lifeExpectancy).toBeCloseTo(77.5 - 84.8, 1);
    expect(comp!.differences.healthSpendingPerCapita).toBeCloseTo(12555 - 4691, 0);
  });

  it('getFullCountryComparison should return all 4 domain comparisons', () => {
    const full = getFullCountryComparison('United States', 'Japan');
    expect(full).toHaveProperty('health');
    expect(full).toHaveProperty('drugPolicy');
    expect(full).toHaveProperty('education');
    expect(full).toHaveProperty('criminalJustice');
    expect(full.health).not.toBeNull();
    expect(full.education).not.toBeNull();
  });

  it('getExemplarsByCategory should filter correctly', () => {
    const healthExemplars = getExemplarsByCategory('Health');
    expect(healthExemplars.length).toBeGreaterThanOrEqual(3);
    for (const ex of healthExemplars) {
      expect(ex.category.toLowerCase()).toContain('health');
    }
  });

  it('getExemplarsByTransferability should filter by rating', () => {
    const highTransfer = getExemplarsByTransferability('high');
    expect(highTransfer.length).toBeGreaterThanOrEqual(3);
    for (const ex of highTransfer) {
      expect(ex.estimatedTransferability).toBe('high');
    }
  });

  it('getExemplarCategories should return unique categories', () => {
    const categories = getExemplarCategories();
    expect(categories.length).toBeGreaterThanOrEqual(5);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it('getTotalOutcomeCount should match sum of all outcomes', () => {
    const total = getTotalOutcomeCount();
    const manual = POLICY_EXEMPLARS.reduce((sum, p) => sum + p.outcomes.length, 0);
    expect(total).toBe(manual);
  });
});

// =========================================================================
// 9. Programmatic Generation (not from files)
// =========================================================================

describe('Programmatic generation functions', () => {
  it('generateCrossCountryAnalysis should produce valid output', () => {
    const output = generateCrossCountryAnalysis();
    expect(output.health.rankings.length).toBeGreaterThan(0);
    expect(output.drugPolicy.rankings.length).toBeGreaterThan(0);
    expect(output.education.rankings.length).toBeGreaterThan(0);
    expect(output.criminalJustice.rankings.length).toBeGreaterThan(0);
    expect(output.policyExemplars.length).toBe(POLICY_EXEMPLARS.length);
  });

  it('generateHealthComparison should produce rankings and insights', () => {
    const output = generateHealthComparison();
    expect(output.rankings.length).toBe(HEALTH_SYSTEM_COMPARISON.length);
    expect(output.insights.length).toBeGreaterThanOrEqual(4);
    expect(output.exemplars.length).toBeGreaterThanOrEqual(3);
    expect(output.usPosition).toBeDefined();
    expect(output.usPosition.iso3).toBe('USA');
  });

  it('generateDrugPolicyComparison should include approach summaries', () => {
    const output = generateDrugPolicyComparison();
    expect(output.approachSummaries.length).toBeGreaterThanOrEqual(3);
    const approaches = output.approachSummaries.map((s) => s.approach);
    expect(approaches).toContain('decriminalization');
    expect(approaches).toContain('harm-reduction');
    expect(approaches).toContain('prohibitionist');
  });

  it('generateEducationComparison should include PISA rankings', () => {
    const output = generateEducationComparison();
    expect(output.pisaRankings.length).toBe(EDUCATION_COMPARISON.length);
    // PISA rankings should be sorted by PISA score descending
    for (let i = 1; i < output.pisaRankings.length; i++) {
      expect(output.pisaRankings[i].avgPisaScore).toBeLessThanOrEqual(
        output.pisaRankings[i - 1].avgPisaScore,
      );
    }
  });

  it('runComparisons should produce both analysis and markdown', () => {
    const { analysis, markdownReport } = runComparisons();
    expect(analysis.generatedAt).toBeTruthy();
    expect(markdownReport.length).toBeGreaterThan(10_000);
    expect(markdownReport).toContain('# International Cross-Country Comparison Report');
  });

  it('generateCombinedMarkdownReport should include all sections', () => {
    const analysis = generateCrossCountryAnalysis();
    const md = generateCombinedMarkdownReport(analysis);
    expect(md).toContain('## Health Systems');
    expect(md).toContain('## Drug Policy');
    expect(md).toContain('## Education');
    expect(md).toContain('## Criminal Justice');
    expect(md).toContain('## Policy Exemplars');
    expect(md).toContain('## Methodology');
  });
});

// =========================================================================
// 10. Data Integrity
// =========================================================================

describe('Data integrity checks', () => {
  it('all health countries should have positive spending and life expectancy', () => {
    for (const c of HEALTH_SYSTEM_COMPARISON) {
      expect(c.healthSpendingPerCapita).toBeGreaterThan(0);
      expect(c.lifeExpectancy).toBeGreaterThan(50);
      expect(c.lifeExpectancy).toBeLessThan(100);
    }
  });

  it('all education PISA scores should be between 300 and 700', () => {
    for (const c of EDUCATION_COMPARISON) {
      expect(c.pisaScoreMath).toBeGreaterThan(300);
      expect(c.pisaScoreMath).toBeLessThan(700);
      expect(c.pisaScoreReading).toBeGreaterThan(300);
      expect(c.pisaScoreScience).toBeGreaterThan(300);
    }
  });

  it('all criminal justice incarceration rates should be positive', () => {
    for (const c of CRIMINAL_JUSTICE_COMPARISON) {
      expect(c.incarcerationRatePer100K).toBeGreaterThan(0);
      expect(c.homicideRatePer100K).toBeGreaterThanOrEqual(0);
      expect(c.recidivismRate).toBeGreaterThan(0);
      expect(c.recidivismRate).toBeLessThan(100);
    }
  });

  it('all drug policy treatment access rates should be 0-100%', () => {
    for (const c of DRUG_POLICY_COMPARISON) {
      expect(c.treatmentAccessRate).toBeGreaterThanOrEqual(0);
      expect(c.treatmentAccessRate).toBeLessThanOrEqual(100);
    }
  });

  it('ISO3 codes should all be 3 characters', () => {
    const allDatasets = [
      ...HEALTH_SYSTEM_COMPARISON,
      ...DRUG_POLICY_COMPARISON,
      ...EDUCATION_COMPARISON,
      ...CRIMINAL_JUSTICE_COMPARISON,
    ];
    for (const c of allDatasets) {
      expect(c.iso3).toMatch(/^[A-Z]{3}$/);
    }
  });
});
