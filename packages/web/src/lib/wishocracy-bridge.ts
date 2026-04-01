/**
 * Bridge between OBG budget analysis and Wishocratic items.
 *
 * Enriches Wishocratic items with OBG efficiency data (overspend ratios,
 * optimal spending, best-in-class countries) by mapping items
 * to their parent fiscal categories via fiscalCategoryMappings.
 */

import type { Item } from '@optimitron/wishocracy';
import type { WishocraticItemDefinition } from '@optimitron/data';
import { WISHOCRATIC_ITEMS, type WishocraticItemId } from '@/lib/wishocracy-data';
import budgetAnalysisData from '@/data/us-budget-analysis.json';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EfficiencyContext {
  /** Ratio of current spending to efficient floor (>1 = overspending) */
  overspendRatio: number;
  /** Potential savings in billions USD */
  potentialSavingsBillions: number;
  /** Efficiency rank among OECD countries (e.g., "23/28") */
  efficiencyRank: string;
  /** Country achieving best outcomes per dollar */
  bestCountryName: string;
  /** Best country's per-capita spending */
  bestCountrySpendingPerCapita: number;
  /** US per-capita spending for this fiscal category */
  usSpendingPerCapita: number;
  /** Outcome name (e.g., "Life Expectancy", "PISA Math Score") */
  outcomeName: string;
}

export interface EnrichedWishocraticItem extends Item {
  /** Stable lowercase slug for URLs, aliases, and display integration. */
  slug: string;
  /** OBG efficiency data (null if no OECD mapping for this item's fiscal categories) */
  efficiencyContext: EfficiencyContext | null;
  /** ROI ratio from source data (e.g., "45:1", "Negative ROI") */
  roiRatio: string | null;
  /** Annual spending in billions USD */
  annualBudgetBillions: number;
  /** Fiscal category IDs this item maps to */
  fiscalCategoryIds: string[];
  /** Whether this is existing spending or proposed */
  priorityType: 'existing' | 'proposed';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface BudgetAnalysisCategory {
  id?: string;
  name: string;
  efficiency: {
    rank: number;
    totalCountries: number;
    spendingPerCapita: number;
    outcome: number;
    outcomeName: string;
    bestCountry: {
      name: string;
      spendingPerCapita: number;
    };
    floorSpendingPerCapita: number;
    overspendRatio: number;
    potentialSavingsTotal: number;
  } | null;
}

function getAnalysisCategories(): BudgetAnalysisCategory[] {
  const data = budgetAnalysisData as { categories: BudgetAnalysisCategory[] };
  return data.categories;
}

function findFiscalCategoryAnalysis(fiscalCategoryId: string): BudgetAnalysisCategory | undefined {
  // Match by id (preferred) or fall back to slugified name for pre-regeneration JSON
  return getAnalysisCategories().find(c =>
    c.id === fiscalCategoryId ||
    c.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '') === fiscalCategoryId
  );
}

/**
 * Compute weighted efficiency context for a Wishocratic item from its fiscal category mappings.
 * If the item maps to multiple fiscal categories, uses the primary one (highest share).
 */
function computeEfficiencyContext(item: WishocraticItemDefinition): EfficiencyContext | null {
  if (item.fiscalCategoryMappings.length === 0) return null;

  // Use the fiscal category with the highest share as the primary
  const sorted = [...item.fiscalCategoryMappings].sort((a, b) => b.share - a.share);
  const primary = sorted[0];
  if (!primary) return null;

  const analysis = findFiscalCategoryAnalysis(primary.fiscalCategoryId);
  if (!analysis?.efficiency) return null;

  const eff = analysis.efficiency;
  return {
    overspendRatio: eff.overspendRatio,
    potentialSavingsBillions: eff.potentialSavingsTotal / 1e9,
    efficiencyRank: `${eff.rank}/${eff.totalCountries}`,
    bestCountryName: eff.bestCountry.name,
    bestCountrySpendingPerCapita: eff.bestCountry.spendingPerCapita,
    usSpendingPerCapita: eff.spendingPerCapita,
    outcomeName: eff.outcomeName,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Build enriched Wishocratic items with OBG efficiency data.
 * Returns items suitable for display in the pairwise allocation UI.
 */
export function buildEnrichedWishocraticItems(): Record<WishocraticItemId, EnrichedWishocraticItem> {
  const result: Record<string, EnrichedWishocraticItem> = {};

  for (const [key, _item] of Object.entries(WISHOCRATIC_ITEMS)) {
    const item = _item as WishocraticItemDefinition;
    result[key] = {
      id: key,
      slug: item.slug,
      name: item.name,
      description: item.description,
      currentAllocationUsd: item.annualBudgetBillions * 1e9,
      currentAllocationPct: undefined,

      efficiencyContext: computeEfficiencyContext(item),
      roiRatio: item.roiData?.ratio ?? null,
      annualBudgetBillions: item.annualBudgetBillions,
      fiscalCategoryIds: item.fiscalCategoryMappings.map((m: { fiscalCategoryId: string }) => m.fiscalCategoryId),
      priorityType: item.type,
    };
  }

  return result as Record<WishocraticItemId, EnrichedWishocraticItem>;
}

/**
 * Get enriched data for a single Wishocratic item.
 */
export function getEnrichedWishocraticItem(id: WishocraticItemId): EnrichedWishocraticItem | undefined {
  return buildEnrichedWishocraticItems()[id];
}
