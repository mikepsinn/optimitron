/**
 * Federal Budget Demo — Full RAPPA Pipeline
 *
 * Simulates ~20 US federal budget categories with 4 voter archetypes
 * (progressive, conservative, moderate, libertarian). Runs the complete
 * RAPPA pipeline: pairwise comparisons → aggregation → eigenvector weights
 * → preference gap analysis.
 *
 * Output: a markdown report comparing citizen-desired allocation to the
 * actual FY 2025 federal budget.
 *
 * @see Wishocracy paper: "Core Mechanism" and "Citizen Alignment Scores"
 */

import {
  type PairwiseComparison,
  type Item,
  aggregateComparisons,
  buildComparisonMatrix,
  principalEigenvector,
  consistencyRatio,
  calculatePreferenceGaps,
} from '@optomitron/wishocracy';

// ─── Budget categories (real FY 2025 approximate %) ──────────────────

interface BudgetCategory extends Item {
  currentAllocationPct: number;
}

const TOTAL_BUDGET_USD = 6_750_000_000_000; // ~$6.75T FY 2025

const categories: BudgetCategory[] = [
  { id: 'social_security',    name: 'Social Security',               currentAllocationPct: 21.0 },
  { id: 'medicare',           name: 'Medicare',                      currentAllocationPct: 13.0 },
  { id: 'medicaid',           name: 'Medicaid & CHIP',               currentAllocationPct: 8.5 },
  { id: 'defense',            name: 'Defense',                       currentAllocationPct: 13.0 },
  { id: 'net_interest',       name: 'Net Interest on Debt',          currentAllocationPct: 13.0 },
  { id: 'income_security',    name: 'Income Security (SNAP, Housing)', currentAllocationPct: 4.5 },
  { id: 'veterans',           name: 'Veterans Benefits',             currentAllocationPct: 4.0 },
  { id: 'education',          name: 'Education',                     currentAllocationPct: 3.5 },
  { id: 'transportation',     name: 'Transportation & Infrastructure', currentAllocationPct: 2.5 },
  { id: 'health_research',    name: 'Health Research (NIH, CDC)',    currentAllocationPct: 1.5 },
  { id: 'science_space',      name: 'Science & Space (NASA, NSF)',   currentAllocationPct: 1.2 },
  { id: 'environment',        name: 'Environment & EPA',             currentAllocationPct: 1.0 },
  { id: 'agriculture',        name: 'Agriculture & Food Safety',     currentAllocationPct: 1.0 },
  { id: 'justice',            name: 'Justice & Law Enforcement',     currentAllocationPct: 1.0 },
  { id: 'foreign_aid',        name: 'International Affairs & Aid',   currentAllocationPct: 1.0 },
  { id: 'energy',             name: 'Energy Programs',               currentAllocationPct: 0.8 },
  { id: 'housing',            name: 'Community & Regional Development', currentAllocationPct: 0.6 },
  { id: 'diplomacy',          name: 'Diplomacy & State Department',  currentAllocationPct: 0.5 },
  { id: 'general_govt',       name: 'General Government',            currentAllocationPct: 0.5 },
  { id: 'other',              name: 'Other Mandatory & Discretionary', currentAllocationPct: 8.4 },
];

// ─── Voter archetypes ────────────────────────────────────────────────

/**
 * Each archetype has an "ideal allocation" (how they'd split a $100 budget
 * across all 20 categories). These drive pairwise comparisons.
 */
interface VoterArchetype {
  name: string;
  count: number; // number of simulated voters
  ideals: Record<string, number>; // itemId → ideal % (must sum to 100)
}

const archetypes: VoterArchetype[] = [
  {
    name: 'Progressive',
    count: 25,
    ideals: {
      social_security: 18, medicare: 14, medicaid: 12, defense: 5,
      net_interest: 5, income_security: 8, veterans: 3, education: 10,
      transportation: 3, health_research: 5, science_space: 3,
      environment: 4, agriculture: 1.5, justice: 0.5, foreign_aid: 2.5,
      energy: 2, housing: 1, diplomacy: 1, general_govt: 0.5, other: 0.5,
    },
  },
  {
    name: 'Conservative',
    count: 25,
    ideals: {
      social_security: 16, medicare: 12, medicaid: 5, defense: 22,
      net_interest: 8, income_security: 2, veterans: 7, education: 2,
      transportation: 3, health_research: 1.5, science_space: 1.5,
      environment: 0.5, agriculture: 2, justice: 3.5, foreign_aid: 0.5,
      energy: 2, housing: 0.5, diplomacy: 1.5, general_govt: 1, other: 8.5,
    },
  },
  {
    name: 'Moderate',
    count: 35,
    ideals: {
      social_security: 19, medicare: 13, medicaid: 8, defense: 10,
      net_interest: 8, income_security: 5, veterans: 5, education: 6,
      transportation: 4, health_research: 3, science_space: 2,
      environment: 2, agriculture: 1.5, justice: 2, foreign_aid: 1.5,
      energy: 1.5, housing: 1, diplomacy: 1, general_govt: 0.5, other: 5.5,
    },
  },
  {
    name: 'Libertarian',
    count: 15,
    ideals: {
      social_security: 10, medicare: 8, medicaid: 3, defense: 8,
      net_interest: 15, income_security: 1, veterans: 4, education: 1,
      transportation: 5, health_research: 1, science_space: 2,
      environment: 0.5, agriculture: 0.5, justice: 4, foreign_aid: 0.5,
      energy: 0.5, housing: 0.5, diplomacy: 0.5, general_govt: 0.5, other: 35,
    },
  },
];

// ─── Simulate pairwise comparisons ──────────────────────────────────

/** Deterministic RNG seeded for reproducibility */
function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

/**
 * Generate pairwise comparisons for one voter.
 * Each comparison is "$100 split between A and B", driven by the voter's
 * ideal allocations + Gaussian noise.
 */
function generateComparisons(
  participantId: string,
  ideals: Record<string, number>,
  rng: () => number,
  pairsPerVoter: number = 30,
): PairwiseComparison[] {
  const itemIds = categories.map(c => c.id);
  const comparisons: PairwiseComparison[] = [];

  // Pick random pairs
  for (let p = 0; p < pairsPerVoter; p++) {
    const iA = Math.floor(rng() * itemIds.length);
    let iB = Math.floor(rng() * (itemIds.length - 1));
    if (iB >= iA) iB++;

    const idA = itemIds[iA]!;
    const idB = itemIds[iB]!;

    const idealA = ideals[idA] ?? 5;
    const idealB = ideals[idB] ?? 5;

    // Convert ideals to $100 split + noise
    const totalIdeal = idealA + idealB;
    const rawSplit = totalIdeal > 0 ? (idealA / totalIdeal) * 100 : 50;

    // Add noise (Box-Muller)
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 5;

    const allocationA = Math.max(1, Math.min(99, Math.round(rawSplit + noise)));

    comparisons.push({
      id: `comp-${participantId}-${p}`,
      participantId,
      itemAId: idA,
      itemBId: idB,
      allocationA,
      timestamp: Date.now(),
    });
  }

  return comparisons;
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
  const rng = seededRng(42);

  // 1. Generate all comparisons
  const allComparisons: PairwiseComparison[] = [];
  let voterId = 0;

  for (const archetype of archetypes) {
    for (let v = 0; v < archetype.count; v++) {
      voterId++;
      const pid = `voter-${voterId}`;
      const comps = generateComparisons(pid, archetype.ideals, rng);
      allComparisons.push(...comps);
    }
  }

  // 2. Aggregate into comparison matrix
  const entries = aggregateComparisons(allComparisons);
  const itemIds = categories.map(c => c.id);
  const matrix = buildComparisonMatrix(itemIds, entries);

  // 3. Extract eigenvector weights
  const weights = principalEigenvector(matrix);

  // 4. Consistency check
  const cr = consistencyRatio(matrix);

  // 5. Build PreferenceWeight array for gap analysis
  const indexed = weights.map((w, i) => ({ itemId: itemIds[i]!, weight: w }));
  indexed.sort((a, b) => b.weight - a.weight);
  const preferenceWeights = indexed.map((pw, rank) => ({
    itemId: pw.itemId,
    weight: pw.weight,
    rank: rank + 1,
  }));

  // 6. Preference gaps
  const gaps = calculatePreferenceGaps(preferenceWeights, categories, TOTAL_BUDGET_USD);

  // ─── Markdown report ──────────────────────────────────────────────

  const lines: string[] = [];
  const add = (s: string) => lines.push(s);

  add('# 🇺🇸 Federal Budget RAPPA Analysis');
  add('');
  add(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  add(`**Participants:** ${voterId} simulated voters (4 archetypes)`);
  add(`**Comparisons:** ${allComparisons.length.toLocaleString()}`);
  add(`**Total Budget:** $${(TOTAL_BUDGET_USD / 1e12).toFixed(2)}T (FY 2025 est.)`);
  add(`**Consistency Ratio:** ${cr.toFixed(4)} ${cr < 0.1 ? '✅ (< 0.10 threshold)' : '⚠️ (> 0.10 — inconsistent)'}`);
  add('');

  // Archetype summary
  add('## Voter Archetypes');
  add('');
  add('| Archetype | Voters | Share |');
  add('|-----------|-------:|------:|');
  for (const a of archetypes) {
    const share = ((a.count / voterId) * 100).toFixed(1);
    add(`| ${a.name} | ${a.count} | ${share}% |`);
  }
  add('');

  // Weights table
  add('## Preference Weights (Eigenvector)');
  add('');
  add('| Rank | Category | Weight | Desired % |');
  add('|-----:|----------|-------:|----------:|');
  for (const pw of preferenceWeights) {
    const cat = categories.find(c => c.id === pw.itemId);
    add(`| ${pw.rank} | ${cat?.name ?? pw.itemId} | ${pw.weight.toFixed(4)} | ${(pw.weight * 100).toFixed(1)}% |`);
  }
  add('');

  // Gap analysis
  add('## Preference Gap Analysis (Citizen Desired vs Actual)');
  add('');
  add('| Category | Desired % | Actual % | Gap (pp) | Gap ($B) | Direction |');
  add('|----------|----------:|---------:|---------:|---------:|-----------|');
  for (const gap of gaps) {
    const direction = gap.gapPct > 0.5 ? '📈 Underfunded' : gap.gapPct < -0.5 ? '📉 Overfunded' : '≈ Aligned';
    const gapUsd = gap.gapUsd ? (gap.gapUsd / 1e9).toFixed(1) : '—';
    add(`| ${gap.itemName} | ${gap.preferredPct.toFixed(1)}% | ${gap.actualPct.toFixed(1)}% | ${gap.gapPct > 0 ? '+' : ''}${gap.gapPct.toFixed(1)} | ${gap.gapPct > 0 ? '+' : ''}${gapUsd} | ${direction} |`);
  }
  add('');

  // Top 5 preference gaps
  const topGaps = gaps.slice(0, 5);
  add('## Top 5 Largest Preference Gaps');
  add('');
  for (let i = 0; i < topGaps.length; i++) {
    const g = topGaps[i]!;
    const dir = g.gapPct > 0 ? 'underfunded' : 'overfunded';
    const absGap = Math.abs(g.gapPct).toFixed(1);
    const absUsd = g.gapUsd ? `$${Math.abs(g.gapUsd / 1e9).toFixed(1)}B` : '';
    add(`${i + 1}. **${g.itemName}** — ${absGap} pp ${dir} ${absUsd}`);
  }
  add('');

  add('---');
  add('');
  add('*Generated by `@optomitron/examples` using `@optomitron/wishocracy` eigenvector preference aggregation.*');

  const report = lines.join('\n');
  console.log(report);
}

main();
