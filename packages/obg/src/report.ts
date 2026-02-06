/**
 * Markdown Report Generator for Budget Optimization
 *
 * Produces a human-readable markdown report from budget analysis results.
 *
 * @see https://obg.warondisease.org
 */

import type { SpendingGap, SpendingCategory, OSLEstimate } from './budget.js';
import type { DiminishingReturnsModel } from './diminishing-returns.js';
import type { BISCalculationResult } from './budget-impact-score.js';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface CategoryAnalysis {
  category: SpendingCategory;
  oslEstimate: OSLEstimate;
  gap: SpendingGap;
  diminishingReturnsModel?: DiminishingReturnsModel;
  marginalReturn?: number;
  bisResult?: BISCalculationResult;
}

export interface BudgetOptimizationResult {
  jurisdictionName: string;
  jurisdictionId: string;
  fiscalYear: number;
  totalBudgetUsd: number;
  totalOptimalUsd: number;
  welfareImprovementPct: number;
  categories: CategoryAnalysis[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a USD amount into a human-readable string.
 * Uses B for billions, M for millions, K for thousands.
 */
export function formatUsd(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000;
    return `${sign}$${formatNum(val)}B`;
  }
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${sign}$${formatNum(val)}M`;
  }
  if (abs >= 1_000) {
    const val = abs / 1_000;
    return `${sign}$${formatNum(val)}K`;
  }
  return `${sign}$${formatNum(abs)}`;
}

/**
 * Format a signed USD amount with +/- prefix.
 */
function formatGapUsd(amount: number): string {
  if (amount === 0) return '$0';
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${formatUsd(amount)}`;
}

/**
 * Format a number to remove unnecessary trailing zeros.
 */
function formatNum(value: number, decimals: number = 1): string {
  if (!isFinite(value)) return 'N/A';
  const fixed = value.toFixed(decimals);
  // Remove trailing zeros after decimal point
  return fixed.replace(/\.?0+$/, '') || '0';
}

/**
 * Format a percentage with sign.
 */
function formatPct(value: number, decimals: number = 1): string {
  if (!isFinite(value)) return 'N/A';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(decimals)}%`;
}

/**
 * Describe the investment status of a category based on the gap.
 */
function investmentStatus(gapPct: number): string {
  if (gapPct > 10) return 'Under-invested';
  if (gapPct < -10) return 'Over-invested';
  return 'Near optimal';
}

/**
 * Describe the recommended action in human terms.
 */
function describeAction(action: string, categoryName: string, gapUsd: number, gapPct: number): string {
  switch (action) {
    case 'scale_up':
      return `Scale up ${categoryName} spending by ${formatUsd(Math.abs(gapUsd))} (${formatPct(gapPct)}) — massive underinvestment`;
    case 'increase':
      return `Increase ${categoryName} spending by ${formatUsd(Math.abs(gapUsd))} (${formatPct(gapPct)}) — high marginal return`;
    case 'maintain':
      return `Maintain ${categoryName} spending — near optimal level`;
    case 'decrease':
      return `Decrease ${categoryName} spending by ${formatUsd(Math.abs(gapUsd))} (${formatPct(gapPct)}) — below diminishing returns threshold`;
    case 'eliminate':
      return `Eliminate ${categoryName} spending (${formatUsd(Math.abs(gapUsd))}) — negative welfare impact`;
    default:
      return `Adjust ${categoryName} by ${formatGapUsd(gapUsd)}`;
  }
}

/**
 * Describe the evidence grade.
 */
function describeGrade(grade: string): string {
  switch (grade) {
    case 'A': return 'Strong evidence';
    case 'B': return 'Good evidence';
    case 'C': return 'Moderate evidence';
    case 'D': return 'Weak evidence';
    case 'F': return 'Insufficient evidence';
    default: return 'Unknown';
  }
}

/**
 * Describe diminishing returns model type.
 */
function describeModelType(type: string): string {
  switch (type) {
    case 'log': return 'Log-linear';
    case 'saturation': return 'Saturation (Michaelis-Menten)';
    default: return type;
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable markdown report from a BudgetOptimizationResult.
 *
 * The report includes:
 * - Summary with total budget and welfare improvement
 * - Current vs Optimal Allocation table
 * - Diminishing Returns Analysis
 * - Top Recommendations sorted by priority
 * - Budget Impact Scores ranked by BIS
 *
 * @param analysis - Complete budget optimization result
 * @returns Markdown-formatted report string
 */
export function generateBudgetReport(analysis: BudgetOptimizationResult): string {
  const lines: string[] = [];

  // --- Title ---
  lines.push(`# Budget Optimization Report: ${analysis.jurisdictionName}`);
  lines.push('');

  // --- Summary ---
  lines.push('## Summary');
  lines.push('');
  lines.push(
    `Optimizing the ${formatUsd(analysis.totalBudgetUsd)} budget across ` +
    `${analysis.categories.length} categories could improve welfare by ` +
    `${formatNum(analysis.welfareImprovementPct)}%.`
  );
  lines.push('');
  lines.push(`- **Jurisdiction:** ${analysis.jurisdictionName} (${analysis.jurisdictionId})`);
  lines.push(`- **Fiscal Year:** ${analysis.fiscalYear}`);
  lines.push(`- **Total Current Budget:** ${formatUsd(analysis.totalBudgetUsd)}`);
  lines.push(`- **Total Optimal Budget:** ${formatUsd(analysis.totalOptimalUsd)}`);
  lines.push('');

  // --- Current vs Optimal Allocation ---
  if (analysis.categories.length > 0) {
    lines.push('## Current vs Optimal Allocation');
    lines.push('');
    lines.push('| Category | Current ($) | Current (%) | Optimal ($) | Optimal (%) | Gap |');
    lines.push('|----------|------------|-------------|------------|-------------|-----|');

    const sortedByGap = [...analysis.categories].sort(
      (a, b) => Math.abs(b.gap.gapUsd) - Math.abs(a.gap.gapUsd)
    );

    for (const cat of sortedByGap) {
      const currentPct = analysis.totalBudgetUsd > 0
        ? (cat.category.currentSpendingUsd / analysis.totalBudgetUsd * 100)
        : 0;
      const optimalPct = analysis.totalOptimalUsd > 0
        ? (cat.oslEstimate.oslUsd / analysis.totalOptimalUsd * 100)
        : 0;

      lines.push(
        `| ${cat.category.name} ` +
        `| ${formatUsd(cat.category.currentSpendingUsd)} ` +
        `| ${formatNum(currentPct)}% ` +
        `| ${formatUsd(cat.oslEstimate.oslUsd)} ` +
        `| ${formatNum(optimalPct)}% ` +
        `| ${formatGapUsd(cat.gap.gapUsd)} |`
      );
    }
    lines.push('');
  }

  // --- Diminishing Returns Analysis ---
  const catsWithDR = analysis.categories.filter(c => c.diminishingReturnsModel);
  if (catsWithDR.length > 0) {
    lines.push('## Diminishing Returns Analysis');
    lines.push('');

    for (const cat of catsWithDR) {
      const model = cat.diminishingReturnsModel!;
      const status = investmentStatus(cat.gap.gapPct);
      lines.push(`### ${cat.category.name}`);
      lines.push('');
      lines.push(`- **Current Spending:** ${formatUsd(cat.category.currentSpendingUsd)}`);
      lines.push(`- **Optimal Spending Level:** ${formatUsd(cat.oslEstimate.oslUsd)}`);
      if (cat.marginalReturn !== undefined) {
        lines.push(`- **Marginal Return:** ${cat.marginalReturn.toFixed(4)}`);
      }
      lines.push(`- **Model:** ${describeModelType(model.type)} (R² = ${formatNum(model.r2, 2)})`);
      lines.push(`- **Status:** ${status}`);
      lines.push('');
    }
  } else {
    lines.push('## Diminishing Returns Analysis');
    lines.push('');
    lines.push('No diminishing returns models available for this analysis.');
    lines.push('');
  }

  // --- Top Recommendations ---
  lines.push('## Top Recommendations');
  lines.push('');

  if (analysis.categories.length === 0) {
    lines.push('No categories to analyze.');
    lines.push('');
  } else {
    // Sort by priority score (highest first), exclude 'maintain'
    const actionable = [...analysis.categories]
      .filter(c => c.gap.recommendedAction !== 'maintain')
      .sort((a, b) => b.gap.priorityScore - a.gap.priorityScore);

    const maintained = analysis.categories.filter(c => c.gap.recommendedAction === 'maintain');

    if (actionable.length === 0) {
      lines.push('All categories are at or near optimal spending levels.');
      lines.push('');
    } else {
      for (let i = 0; i < actionable.length; i++) {
        const cat = actionable[i]!;
        const desc = describeAction(
          cat.gap.recommendedAction,
          cat.gap.categoryName,
          cat.gap.gapUsd,
          cat.gap.gapPct
        );
        lines.push(`${i + 1}. ${desc}`);
      }
      lines.push('');
    }

    if (maintained.length > 0) {
      lines.push('**Already near optimal:**');
      for (const cat of maintained) {
        lines.push(`- ${cat.gap.categoryName}`);
      }
      lines.push('');
    }
  }

  // --- Budget Impact Scores ---
  lines.push('## Budget Impact Scores');
  lines.push('');

  if (analysis.categories.length === 0) {
    lines.push('No categories to score.');
    lines.push('');
  } else {
    lines.push('| Category | BIS | Grade | Quality Weight | Precision Weight | Evidence |');
    lines.push('|----------|-----|-------|----------------|------------------|----------|');

    const sortedByBIS = [...analysis.categories].sort(
      (a, b) => b.oslEstimate.budgetImpactScore - a.oslEstimate.budgetImpactScore
    );

    for (const cat of sortedByBIS) {
      const bis = cat.oslEstimate.budgetImpactScore;
      const grade = cat.oslEstimate.evidenceGrade;
      const qw = cat.bisResult?.qualityWeight;
      const pw = cat.bisResult?.precisionWeight;

      lines.push(
        `| ${cat.category.name} ` +
        `| ${formatNum(bis, 2)} ` +
        `| ${grade} ` +
        `| ${qw !== undefined ? formatNum(qw, 2) : '—'} ` +
        `| ${pw !== undefined ? formatNum(pw, 2) : '—'} ` +
        `| ${describeGrade(grade)} |`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}
