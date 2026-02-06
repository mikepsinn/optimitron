/**
 * Alignment Scoring Demo — RAPPA Citizen Alignment
 *
 * Simulates citizen preference aggregation and compares against fictional
 * politicians' voting records. Calculates Citizen Alignment Scores,
 * ranks politicians, and shows per-category breakdowns.
 *
 * @see Wishocracy paper: "Citizen Alignment Scores" section
 */

import {
  type PairwiseComparison,
  type Item,
  type PreferenceWeight,
  aggregateComparisons,
  buildComparisonMatrix,
  principalEigenvector,
  consistencyRatio,
  calculateAlignmentScore,
  calculatePreferenceGaps,
  rankPoliticians,
} from '@optomitron/wishocracy';

// ─── Policy categories ──────────────────────────────────────────────

const categories: Item[] = [
  { id: 'healthcare',      name: 'Healthcare' },
  { id: 'education',       name: 'Education' },
  { id: 'defense',         name: 'Defense' },
  { id: 'environment',     name: 'Environment & Climate' },
  { id: 'infrastructure',  name: 'Infrastructure' },
  { id: 'social_safety',   name: 'Social Safety Net' },
  { id: 'tax_reform',      name: 'Tax Reform' },
  { id: 'criminal_justice', name: 'Criminal Justice Reform' },
  { id: 'immigration',     name: 'Immigration Policy' },
  { id: 'tech_innovation', name: 'Technology & Innovation' },
];

// ─── Citizen ideal allocations (diverse population) ──────────────────

interface CitizenProfile {
  name: string;
  count: number;
  ideals: Record<string, number>; // itemId → relative priority (sums to 100)
}

const citizenProfiles: CitizenProfile[] = [
  {
    name: 'Healthcare-focused',
    count: 20,
    ideals: {
      healthcare: 25, education: 15, defense: 5, environment: 10,
      infrastructure: 8, social_safety: 15, tax_reform: 5,
      criminal_justice: 7, immigration: 3, tech_innovation: 7,
    },
  },
  {
    name: 'Security-focused',
    count: 15,
    ideals: {
      healthcare: 8, education: 8, defense: 22, environment: 3,
      infrastructure: 10, social_safety: 5, tax_reform: 12,
      criminal_justice: 12, immigration: 15, tech_innovation: 5,
    },
  },
  {
    name: 'Education-focused',
    count: 18,
    ideals: {
      healthcare: 12, education: 25, defense: 3, environment: 12,
      infrastructure: 8, social_safety: 10, tax_reform: 5,
      criminal_justice: 8, immigration: 5, tech_innovation: 12,
    },
  },
  {
    name: 'Balanced',
    count: 25,
    ideals: {
      healthcare: 14, education: 13, defense: 10, environment: 9,
      infrastructure: 11, social_safety: 10, tax_reform: 9,
      criminal_justice: 8, immigration: 7, tech_innovation: 9,
    },
  },
  {
    name: 'Tech-forward',
    count: 12,
    ideals: {
      healthcare: 10, education: 15, defense: 5, environment: 8,
      infrastructure: 12, social_safety: 5, tax_reform: 8,
      criminal_justice: 5, immigration: 7, tech_innovation: 25,
    },
  },
  {
    name: 'Climate-focused',
    count: 10,
    ideals: {
      healthcare: 10, education: 12, defense: 3, environment: 28,
      infrastructure: 10, social_safety: 8, tax_reform: 5,
      criminal_justice: 6, immigration: 4, tech_innovation: 14,
    },
  },
];

// ─── Fictional politicians with voting records ──────────────────────

interface Politician {
  id: string;
  name: string;
  party: string;
  /** Budget allocation votes: itemId → % of budget they voted to allocate */
  votes: Record<string, number>;
}

const politicians: Politician[] = [
  {
    id: 'pol-1',
    name: 'Sen. Ada Clarke',
    party: 'Progressive Party',
    votes: {
      healthcare: 18, education: 16, defense: 5, environment: 15,
      infrastructure: 10, social_safety: 14, tax_reform: 4,
      criminal_justice: 8, immigration: 3, tech_innovation: 7,
    },
  },
  {
    id: 'pol-2',
    name: 'Sen. Marcus Stone',
    party: 'Patriot Party',
    votes: {
      healthcare: 6, education: 5, defense: 28, environment: 2,
      infrastructure: 12, social_safety: 3, tax_reform: 14,
      criminal_justice: 10, immigration: 16, tech_innovation: 4,
    },
  },
  {
    id: 'pol-3',
    name: 'Rep. Diana Reeves',
    party: 'Centrist Alliance',
    votes: {
      healthcare: 13, education: 14, defense: 10, environment: 9,
      infrastructure: 11, social_safety: 10, tax_reform: 9,
      criminal_justice: 8, immigration: 7, tech_innovation: 9,
    },
  },
  {
    id: 'pol-4',
    name: 'Rep. James Wu',
    party: 'Innovation Party',
    votes: {
      healthcare: 10, education: 16, defense: 4, environment: 8,
      infrastructure: 14, social_safety: 6, tax_reform: 8,
      criminal_justice: 4, immigration: 5, tech_innovation: 25,
    },
  },
  {
    id: 'pol-5',
    name: 'Gov. Sarah Mitchell',
    party: 'People First',
    votes: {
      healthcare: 15, education: 15, defense: 7, environment: 11,
      infrastructure: 10, social_safety: 12, tax_reform: 7,
      criminal_justice: 7, immigration: 5, tech_innovation: 11,
    },
  },
  {
    id: 'pol-6',
    name: 'Sen. Robert Hayes',
    party: 'Fiscal Conservative',
    votes: {
      healthcare: 5, education: 4, defense: 18, environment: 2,
      infrastructure: 8, social_safety: 2, tax_reform: 25,
      criminal_justice: 12, immigration: 18, tech_innovation: 6,
    },
  },
];

// ─── Simulation helpers ─────────────────────────────────────────────

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

function generateComparisons(
  participantId: string,
  ideals: Record<string, number>,
  rng: () => number,
  pairsPerVoter: number = 25,
): PairwiseComparison[] {
  const itemIds = categories.map(c => c.id);
  const comparisons: PairwiseComparison[] = [];

  for (let p = 0; p < pairsPerVoter; p++) {
    const iA = Math.floor(rng() * itemIds.length);
    let iB = Math.floor(rng() * (itemIds.length - 1));
    if (iB >= iA) iB++;

    const idA = itemIds[iA]!;
    const idB = itemIds[iB]!;

    const idealA = ideals[idA] ?? 10;
    const idealB = ideals[idB] ?? 10;

    const totalIdeal = idealA + idealB;
    const rawSplit = totalIdeal > 0 ? (idealA / totalIdeal) * 100 : 50;

    // Noise
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 6;
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
  const rng = seededRng(999);

  // 1. Generate all citizen comparisons
  const allComparisons: PairwiseComparison[] = [];
  let totalCitizens = 0;

  for (const profile of citizenProfiles) {
    for (let v = 0; v < profile.count; v++) {
      totalCitizens++;
      const pid = `citizen-${totalCitizens}`;
      allComparisons.push(...generateComparisons(pid, profile.ideals, rng));
    }
  }

  // 2. Aggregate → eigenvector weights
  const entries = aggregateComparisons(allComparisons);
  const itemIds = categories.map(c => c.id);
  const matrix = buildComparisonMatrix(itemIds, entries);
  const weights = principalEigenvector(matrix);
  const cr = consistencyRatio(matrix);

  // Build PreferenceWeight array
  const indexed = weights.map((w, i) => ({ itemId: itemIds[i]!, weight: w }));
  indexed.sort((a, b) => b.weight - a.weight);
  const preferenceWeights: PreferenceWeight[] = indexed.map((pw, rank) => ({
    itemId: pw.itemId,
    weight: pw.weight,
    rank: rank + 1,
  }));

  // 3. Calculate alignment for each politician
  const alignmentScores = politicians.map(pol => {
    const voteMap = new Map(Object.entries(pol.votes));
    return calculateAlignmentScore(preferenceWeights, voteMap, pol.id);
  });

  const ranked = rankPoliticians(alignmentScores);

  // 4. Preference gaps for each politician
  const polGaps = politicians.map(pol => {
    const itemsWithAlloc = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      currentAllocationPct: pol.votes[cat.id] ?? 0,
    }));
    return {
      politician: pol,
      gaps: calculatePreferenceGaps(preferenceWeights, itemsWithAlloc),
    };
  });

  // ─── Markdown report ──────────────────────────────────────────────

  const lines: string[] = [];
  const add = (s: string) => lines.push(s);

  add('# 🏛️ Citizen Alignment Scoring Report');
  add('');
  add(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  add(`**Citizens surveyed:** ${totalCitizens}`);
  add(`**Comparisons collected:** ${allComparisons.length.toLocaleString()}`);
  add(`**Policy categories:** ${categories.length}`);
  add(`**Politicians evaluated:** ${politicians.length}`);
  add(`**Consistency Ratio:** ${cr.toFixed(4)} ${cr < 0.1 ? '✅' : '⚠️'}`);
  add('');

  // Citizen preference weights
  add('## Aggregated Citizen Preferences');
  add('');
  add('| Rank | Category | Weight | Desired % |');
  add('|-----:|----------|-------:|----------:|');
  for (const pw of preferenceWeights) {
    const cat = categories.find(c => c.id === pw.itemId);
    add(`| ${pw.rank} | ${cat?.name ?? pw.itemId} | ${pw.weight.toFixed(4)} | ${(pw.weight * 100).toFixed(1)}% |`);
  }
  add('');

  // Alignment rankings
  add('## Politician Alignment Rankings');
  add('');
  add('| Rank | Politician | Party | Alignment Score | Votes Compared |');
  add('|-----:|------------|-------|----------------:|---------------:|');
  ranked.forEach((score, idx) => {
    const pol = politicians.find(p => p.id === score.politicianId)!;
    const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
    add(`| ${emoji} ${idx + 1} | ${pol.name} | ${pol.party} | ${score.score.toFixed(1)} | ${score.votesCompared} |`);
  });
  add('');

  // Detailed breakdown for top 3
  add('## Detailed Category Alignment (Top 3)');
  add('');

  for (let i = 0; i < 3 && i < ranked.length; i++) {
    const score = ranked[i]!;
    const pol = politicians.find(p => p.id === score.politicianId)!;
    const gapData = polGaps.find(pg => pg.politician.id === pol.id)!;

    add(`### ${i + 1}. ${pol.name} (${pol.party}) — Score: ${score.score.toFixed(1)}`);
    add('');
    add('| Category | Citizen Want | Politician Vote | Gap (pp) | Category Alignment |');
    add('|----------|------------:|----------------:|---------:|-------------------:|');

    for (const cat of categories) {
      const citizenPct = (preferenceWeights.find(pw => pw.itemId === cat.id)?.weight ?? 0) * 100;
      const polVote = pol.votes[cat.id] ?? 0;
      const gap = citizenPct - polVote;
      const catScore = score.categoryScores?.[cat.id];
      const catScoreStr = catScore !== undefined ? `${catScore.toFixed(0)}%` : '—';
      add(`| ${cat.name} | ${citizenPct.toFixed(1)}% | ${polVote}% | ${gap >= 0 ? '+' : ''}${gap.toFixed(1)} | ${catScoreStr} |`);
    }
    add('');
  }

  // Most/least aligned categories for #1 politician
  if (ranked.length > 0) {
    const topPol = ranked[0]!;
    const pol = politicians.find(p => p.id === topPol.politicianId)!;
    const gapData = polGaps.find(pg => pg.politician.id === pol.id)!;

    add(`## Preference Gaps — ${pol.name}`);
    add('');
    add('Categories sorted by absolute gap (largest misalignment first):');
    add('');

    for (const gap of gapData.gaps) {
      const direction = gap.gapPct > 0.5 ? '📈 Citizens want MORE' : gap.gapPct < -0.5 ? '📉 Citizens want LESS' : '✅ Aligned';
      add(`- **${gap.itemName}**: ${direction} (citizen ${gap.preferredPct.toFixed(1)}% vs voted ${gap.actualPct.toFixed(1)}%, gap ${gap.gapPct > 0 ? '+' : ''}${gap.gapPct.toFixed(1)} pp)`);
    }
    add('');
  }

  // Summary
  add('## Key Findings');
  add('');
  if (ranked.length >= 2) {
    const best = politicians.find(p => p.id === ranked[0]!.politicianId)!;
    const worst = politicians.find(p => p.id === ranked[ranked.length - 1]!.politicianId)!;
    add(`1. **Most aligned:** ${best.name} (${best.party}) with a score of ${ranked[0]!.score.toFixed(1)}`);
    add(`2. **Least aligned:** ${worst.name} (${worst.party}) with a score of ${ranked[ranked.length - 1]!.score.toFixed(1)}`);
    add(`3. **Alignment spread:** ${(ranked[0]!.score - ranked[ranked.length - 1]!.score).toFixed(1)} points between most and least aligned`);
  }

  const topPref = preferenceWeights[0];
  if (topPref) {
    const cat = categories.find(c => c.id === topPref.itemId);
    add(`4. **Top citizen priority:** ${cat?.name ?? topPref.itemId} (${(topPref.weight * 100).toFixed(1)}%)`);
  }
  add('');

  add('---');
  add('');
  add('*Generated by `@optomitron/examples` using `@optomitron/wishocracy` alignment scoring.*');

  const report = lines.join('\n');
  console.log(report);
}

main();
