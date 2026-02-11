/**
 * Markdown Report Generator for Budget Optimization
 *
 * Produces a human-readable markdown report from budget analysis results.
 *
 * @see https://obg.warondisease.org
 */

import type { SpendingGap, SpendingCategory, OSLEstimate } from './budget.js';
import type { DiminishingReturnsModel } from './diminishing-returns.js';
import type { WESCalculationResult } from './budget-impact-score.js';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface CategoryAnalysis {
  category: SpendingCategory;
  oslEstimate: OSLEstimate;
  gap: SpendingGap;
  diminishingReturnsModel?: DiminishingReturnsModel;
  marginalReturn?: number;
  wesResult?: WESCalculationResult;
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
    case 'major_decrease':
      return `Major decrease in ${categoryName} spending by ${formatUsd(Math.abs(gapUsd))} (${formatPct(gapPct)}) — significant overinvestment`;
    default:
      return `Adjust ${categoryName} by ${formatGapUsd(gapUsd)}`;
  }
}

/**
 * Map recommendation actions to concise labels.
 */
function actionLabel(action: string): string {
  switch (action) {
    case 'scale_up': return 'Scale up';
    case 'increase': return 'Increase';
    case 'maintain': return 'Maintain';
    case 'decrease': return 'Decrease';
    case 'major_decrease': return 'Major decrease';
    default: return 'Adjust';
  }
}

/**
 * Derive action label from the constrained reallocation percentage.
 * This ensures the action matches the actual direction of the constrained move,
 * not the unconstrained recommendation which may differ.
 */
function constrainedActionLabel(reallocationPct: number, isMaintain: boolean): string {
  if (isMaintain) return 'Maintain';
  if (reallocationPct > 50) return 'Major increase';
  if (reallocationPct > 20) return 'Increase';
  if (reallocationPct > 5) return 'Modest increase';
  if (reallocationPct >= -5) return 'Maintain';
  if (reallocationPct >= -20) return 'Modest decrease';
  if (reallocationPct >= -50) return 'Decrease';
  return 'Major decrease';
}

/**
 * Describe the evidence grade.
 */
function describeGrade(grade: string): string {
  switch (grade) {
    case 'A': return 'Strong evidence of welfare benefit';
    case 'B': return 'Probable welfare benefit';
    case 'C': return 'Possible welfare benefit';
    case 'D': return 'Weak evidence of welfare benefit';
    case 'F': return 'No demonstrated welfare benefit';
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
 * - Welfare Evidence Scores ranked by WES
 *
 * @param analysis - Complete budget optimization result
 * @returns Markdown-formatted report string
 */
export interface BudgetReportOptions {
  /**
   * When true, scale optimal values so they sum to totalBudgetUsd
   * instead of showing unconstrained optimal values.
   */
  constrainToCurrentBudget?: boolean;
}

export function generateBudgetReport(
  analysis: BudgetOptimizationResult,
  options?: BudgetReportOptions,
): string {
  const { constrainToCurrentBudget = false } = options ?? {};
  const lines: string[] = [];

  // Compute max priority score for normalization to 0-100 scale
  const maxPriorityScore = Math.max(
    ...analysis.categories.map(c => Math.abs(c.gap.priorityScore)),
    1, // Avoid division by zero
  );
  const normalizePriority = (score: number): number =>
    (Math.abs(score) / maxPriorityScore) * 100;

  // --- Title ---
  lines.push(`# Budget Optimization Report: ${analysis.jurisdictionName}`);
  lines.push('');

  // --- Constrained Reallocation ---
  if (constrainToCurrentBudget && analysis.totalOptimalUsd > 0) {
    lines.push('## Constrained Reallocation');
    lines.push('');
    lines.push(
      `Reallocation within the current ${formatUsd(analysis.totalBudgetUsd)} budget ` +
      `could improve welfare by ${formatNum(analysis.welfareImprovementPct)}%.`
    );
    lines.push('');

    // Separate categories into groups for constrained reallocation:
    // - Non-discretionary: excluded entirely
    // - Maintain: held at current spending (model can't guide reallocation)
    // - Actionable: scaled proportionally to fill remaining budget
    const discretionary = analysis.categories.filter(c => c.category.discretionary !== false);
    const nonDisc = analysis.categories.filter(c => c.category.discretionary === false);
    const maintainCats = discretionary.filter(c => c.gap.recommendedAction === 'maintain');
    const actionableCats = discretionary.filter(c => c.gap.recommendedAction !== 'maintain');

    // Budget available for actionable categories = total - non-discretionary - maintain (held fixed)
    const nonDiscSpending = nonDisc.reduce((s, c) => s + c.category.currentSpendingUsd, 0);
    const maintainSpending = maintainCats.reduce((s, c) => s + c.category.currentSpendingUsd, 0);
    const actionableBudget = analysis.totalBudgetUsd - nonDiscSpending - maintainSpending;
    const actionableOptimalTotal = actionableCats.reduce((s, c) => s + c.oslEstimate.oslUsd, 0);
    const actionableScalingFactor = actionableOptimalTotal > 0
      ? actionableBudget / actionableOptimalTotal
      : 1;

    // Compute constrained optimal for each discretionary category
    const constrainedRows = discretionary.map(cat => {
      const isMaintain = cat.gap.recommendedAction === 'maintain';
      const constrainedOptimal = isMaintain
        ? cat.category.currentSpendingUsd
        : cat.oslEstimate.oslUsd * actionableScalingFactor;
      const reallocation = constrainedOptimal - cat.category.currentSpendingUsd;
      const reallocationPct = cat.category.currentSpendingUsd > 0
        ? (reallocation / cat.category.currentSpendingUsd) * 100
        : 0;
      // Derive action label from the constrained reallocation direction
      const constrainedAction = constrainedActionLabel(reallocationPct, isMaintain);
      return { cat, constrainedOptimal, reallocation, reallocationPct, constrainedAction };
    });

    // Sort by absolute reallocation size
    constrainedRows.sort((a, b) => Math.abs(b.reallocation) - Math.abs(a.reallocation));

    lines.push('| Category | Current | Constrained Optimal | Reallocation | Action |');
    lines.push('|----------|---------|--------------------:|-------------:|--------|');

    for (const row of constrainedRows) {
      lines.push(
        `| ${row.cat.category.name} ` +
        `| ${formatUsd(row.cat.category.currentSpendingUsd)} ` +
        `| ${formatUsd(row.constrainedOptimal)} ` +
        `| ${formatGapUsd(row.reallocation)} (${formatPct(row.reallocationPct)}) ` +
        `| ${row.constrainedAction} |`,
      );
    }
    lines.push('');

    // Show non-discretionary items as informational
    if (nonDisc.length > 0) {
      lines.push('**Non-discretionary (excluded from reallocation):**');
      for (const cat of nonDisc) {
        lines.push(`- ${cat.category.name}: ${formatUsd(cat.category.currentSpendingUsd)}`);
      }
      lines.push('');
    }
  }

  // --- Summary ---
  lines.push('## Summary');
  lines.push('');
  if (constrainToCurrentBudget) {
    lines.push(
      `Reallocation within the ${formatUsd(analysis.totalBudgetUsd)} budget across ` +
      `${analysis.categories.length} categories could improve welfare by ` +
      `${formatNum(analysis.welfareImprovementPct)}%.`
    );
  } else {
    lines.push(
      `Optimizing the ${formatUsd(analysis.totalBudgetUsd)} budget across ` +
      `${analysis.categories.length} categories could improve welfare by ` +
      `${formatNum(analysis.welfareImprovementPct)}%.`
    );
  }
  lines.push('');
  lines.push(`- **Jurisdiction:** ${analysis.jurisdictionName} (${analysis.jurisdictionId})`);
      lines.push(`- **Fiscal Year:** ${analysis.fiscalYear}`);
      lines.push(`- **Total Current Budget:** ${formatUsd(analysis.totalBudgetUsd)}`);
  if (constrainToCurrentBudget) {
    lines.push(`- **Constrained Budget:** ${formatUsd(analysis.totalBudgetUsd)} (held fixed)`);
  } else {
    lines.push(`- **Total Optimal Budget:** ${formatUsd(analysis.totalOptimalUsd)}`);
  }
      lines.push(`- **Budget Delta (Optimal - Current):** ${formatGapUsd(analysis.totalOptimalUsd - analysis.totalBudgetUsd)}`);
      lines.push('');

  // --- Current vs Optimal Allocation ---
  if (analysis.categories.length > 0) {
    lines.push('## Current vs Optimal Allocation');
    lines.push('');
    lines.push('| Category | Current ($) | Current (%) | Optimal ($) | Optimal (%) | Gap ($) | Gap (%) | Action | Evidence |');
    lines.push('|----------|------------|-------------|------------|-------------|---------|---------|--------|----------|');

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

      const nonDiscNote = cat.category.discretionary === false ? ' *(non-discretionary)*' : '';

      lines.push(
        `| ${cat.category.name}${nonDiscNote} ` +
        `| ${formatUsd(cat.category.currentSpendingUsd)} ` +
        `| ${formatNum(currentPct)}% ` +
        `| ${formatUsd(cat.oslEstimate.oslUsd)} ` +
        `| ${formatNum(optimalPct)}% ` +
        `| ${formatGapUsd(cat.gap.gapUsd)} ` +
        `| ${formatPct(cat.gap.gapPct)} ` +
        `| ${actionLabel(cat.gap.recommendedAction)} ` +
        `| ${cat.oslEstimate.evidenceGrade} (${describeGrade(cat.oslEstimate.evidenceGrade)}) |`
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
        const rawMR = cat.marginalReturn;
        const displayMR = Math.min(Math.abs(rawMR), 1.0);
        const mrSign = rawMR < 0 ? '-' : '';
        const mrNote = Math.abs(rawMR) > 1.0 ? ` (raw: ${formatNum(rawMR, 2)} — likely model overfitting)` : '';
        lines.push(`- **Marginal Return:** ${mrSign}${displayMR.toFixed(4)}${mrNote}`);
      }
      const modelFitWarning = model.r2 < 0.3 ? ' ⚠️ Low fit — treat with caution' : '';
      lines.push(`- **Model:** ${describeModelType(model.type)} (R² = ${formatNum(model.r2, 2)})${modelFitWarning}`);
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
    // Sort by priority score (highest first), exclude 'maintain' and non-discretionary
    const actionable = [...analysis.categories]
      .filter(c => c.gap.recommendedAction !== 'maintain' && c.category.discretionary !== false)
      .sort((a, b) => b.gap.priorityScore - a.gap.priorityScore);

    const maintained = analysis.categories.filter(
      c => c.gap.recommendedAction === 'maintain' || c.category.discretionary === false,
    );

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
        lines.push(
          `   - Priority: ${formatNum(normalizePriority(cat.gap.priorityScore), 1)}/100; ` +
          `WES: ${formatNum(cat.oslEstimate.welfareEvidenceScore, 2)}; ` +
          `Evidence: ${cat.oslEstimate.evidenceGrade} (${describeGrade(cat.oslEstimate.evidenceGrade)})`
        );
        if (cat.marginalReturn !== undefined) {
          const rawMR = cat.marginalReturn;
          const displayMR = Math.min(Math.abs(rawMR), 1.0);
          const mrSign = rawMR < 0 ? '-' : '';
          const mrNote = Math.abs(rawMR) > 1.0 ? ` (raw: ${formatNum(rawMR, 2)} — likely model overfitting)` : '';
          lines.push(`   - Marginal return: ${mrSign}${displayMR.toFixed(4)}${mrNote}`);
        }
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

  // --- Efficient Frontier ---
  lines.push('## Efficient Frontier (Reallocation Priority)');
  lines.push('');

  if (analysis.categories.length === 0) {
    lines.push('No categories available for frontier ranking.');
    lines.push('');
  } else {
    const frontier = [...analysis.categories]
      .filter((c) => c.gap.recommendedAction !== 'maintain' && c.category.discretionary !== false)
      .sort((a, b) => b.gap.priorityScore - a.gap.priorityScore);

    if (frontier.length === 0) {
      lines.push('Current allocation is already near the efficient frontier.');
      lines.push('');
    } else {
      lines.push('| Rank | Category | Reallocation Move | Priority | Gap ($) | WES | Evidence |');
      lines.push('|------|----------|-------------------|----------|---------|-----|----------|');
      for (let i = 0; i < frontier.length; i++) {
        const cat = frontier[i]!;
        lines.push(
          `| ${i + 1} ` +
          `| ${cat.category.name} ` +
          `| ${actionLabel(cat.gap.recommendedAction)} ` +
          `| ${formatNum(normalizePriority(cat.gap.priorityScore), 1)}/100 ` +
          `| ${formatGapUsd(cat.gap.gapUsd)} ` +
          `| ${formatNum(cat.oslEstimate.welfareEvidenceScore, 2)} ` +
          `| ${cat.oslEstimate.evidenceGrade} (${describeGrade(cat.oslEstimate.evidenceGrade)}) |`
        );
      }
      lines.push('');
    }
  }

  // --- Welfare Evidence Scores ---
  lines.push('## Welfare Evidence Scores');
  lines.push('');

  if (analysis.categories.length === 0) {
    lines.push('No categories to score.');
    lines.push('');
  } else {
    lines.push('| Category | WES | Grade | Quality Weight | Precision Weight | Evidence |');
    lines.push('|----------|-----|-------|----------------|------------------|----------|');

    const sortedByWES = [...analysis.categories].sort(
      (a, b) => b.oslEstimate.welfareEvidenceScore - a.oslEstimate.welfareEvidenceScore
    );

    for (const cat of sortedByWES) {
      const wes = cat.oslEstimate.welfareEvidenceScore;
      const grade = cat.oslEstimate.evidenceGrade;
      const qw = cat.wesResult?.qualityWeight;
      const pw = cat.wesResult?.precisionWeight;

      lines.push(
        `| ${cat.category.name} ` +
        `| ${formatNum(wes, 2)} ` +
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
