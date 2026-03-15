import type { Session } from "next-auth";
import { API_ROUTES } from "@/lib/api-routes";
import { BudgetCategoryId, BUDGET_CATEGORIES } from "@/lib/wishocracy-data";
import { storage } from "@/lib/storage";
import {
  filterCompletedPairs,
  filterRejectedPairs,
  filterValidComparisons,
  filterValidPairs,
  generateAllPairsFromCategories,
  generateRandomPairs,
  shufflePairs,
  syncPendingWishocracy,
} from "@/lib/wishocracy-utils";

export const RANDOM_PAIR_BATCH_SIZE = 25;
export const AUTH_PROMPT_MILESTONES = new Set([5, 10, 15]);
export const ALL_CATEGORY_IDS = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[];

export type PendingComparison = {
  itemAId: string;
  itemBId: string;
  allocationA: number;
  allocationB: number;
  timestamp?: string;
};

type PendingSelections = Array<{ itemId: string; selected: boolean }> | string[] | undefined;

type PersistedSelections = {
  itemId: string;
  selected: boolean;
};

export type HydratedWishocracyState = {
  comparisons: PendingComparison[];
  selectedCategories: Set<BudgetCategoryId>;
  rejectedCategories: Set<BudgetCategoryId>;
  shuffledPairs: Array<[BudgetCategoryId, BudgetCategoryId]>;
  showIntro: boolean;
};

export function getRejectedCategories(comparisons: PendingComparison[]) {
  return comparisons.reduce((rejected, comparison) => {
    if (comparison.allocationA === 0 && comparison.allocationB === 0) {
      rejected.add(comparison.itemAId as BudgetCategoryId);
      rejected.add(comparison.itemBId as BudgetCategoryId);
    }
    return rejected;
  }, new Set<BudgetCategoryId>());
}

export function buildSelectedPairQueue(
  selectedCategories: Set<BudgetCategoryId>,
  comparisons: PendingComparison[],
  rejectedCategories: Set<BudgetCategoryId>,
) {
  const allPairs = generateAllPairsFromCategories(selectedCategories);
  const uncompletedPairs = filterCompletedPairs(allPairs, comparisons);
  return filterRejectedPairs(uncompletedPairs, rejectedCategories);
}

export function buildRandomPairQueue(
  comparisons: PendingComparison[],
  rejectedCategories: Set<BudgetCategoryId>,
) {
  const remainingPairs = filterRejectedPairs(
    filterCompletedPairs(generateAllPairsFromCategories(ALL_CATEGORY_IDS), comparisons),
    rejectedCategories,
  );

  return shufflePairs(remainingPairs).slice(0, RANDOM_PAIR_BATCH_SIZE);
}

function getSelectedCategorySet(selections: PendingSelections) {
  if (!selections?.length) {
    return new Set<BudgetCategoryId>();
  }

  if (typeof selections[0] === "string") {
    return new Set(
      (selections as string[]).filter(
        (categoryId): categoryId is BudgetCategoryId =>
          BUDGET_CATEGORIES[categoryId as BudgetCategoryId] !== undefined,
      ),
    );
  }

  return new Set(
    (selections as PersistedSelections[])
      .filter((selection) => selection.selected)
      .map((selection) => selection.itemId)
      .filter(
        (categoryId): categoryId is BudgetCategoryId =>
          BUDGET_CATEGORIES[categoryId as BudgetCategoryId] !== undefined,
      ),
  );
}

export function shouldShowIntro(
  comparisons: PendingComparison[],
  selectedCategories: Set<BudgetCategoryId>,
) {
  return comparisons.length === 0 && selectedCategories.size === 0;
}

export function getInitialGuestState(): HydratedWishocracyState {
  return {
    comparisons: [],
    selectedCategories: new Set<BudgetCategoryId>(),
    rejectedCategories: new Set<BudgetCategoryId>(),
    shuffledPairs: generateRandomPairs(RANDOM_PAIR_BATCH_SIZE),
    showIntro: true,
  };
}

export async function hydrateAuthenticatedState(
  session: Session,
): Promise<HydratedWishocracyState> {
  await syncPendingWishocracy(session);

  const [allocationsResponse, selectionsResponse] = await Promise.all([
    fetch(API_ROUTES.wishocracy.allocations),
    fetch(API_ROUTES.wishocracy.categorySelections),
  ]);
  const allocationsPayload = (await allocationsResponse.json()) as {
    allocations?: PendingComparison[];
  };
  const selectionsPayload = (await selectionsResponse.json()) as {
    selections?: PersistedSelections[];
  };

  const selectedCategories = getSelectedCategorySet(selectionsPayload.selections);
  const comparisons = filterValidComparisons(
    allocationsPayload.allocations ?? [],
    selectedCategories.size ? selectedCategories : undefined,
  );
  const rejectedCategories = getRejectedCategories(comparisons);
  const shuffledPairs = selectedCategories.size
    ? buildSelectedPairQueue(selectedCategories, comparisons, rejectedCategories)
    : buildRandomPairQueue(comparisons, rejectedCategories);

  return {
    comparisons,
    selectedCategories,
    rejectedCategories,
    shuffledPairs,
    showIntro: shouldShowIntro(comparisons, selectedCategories),
  };
}

export function hydrateGuestState(): HydratedWishocracyState {
  const pending = storage.getPendingWishocracy();
  if (!pending) {
    return getInitialGuestState();
  }

  const selectedCategories = getSelectedCategorySet(pending.selectedCategories);
  const comparisons = filterValidComparisons(
    pending.comparisons ?? [],
    selectedCategories.size ? selectedCategories : undefined,
  );
  const rejectedCategories = getRejectedCategories(comparisons);
  const savedPairs = filterRejectedPairs(
    filterValidPairs(pending.shuffledPairs ?? []),
    rejectedCategories,
  );
  const shuffledPairs = savedPairs.length
    ? savedPairs
    : selectedCategories.size
      ? buildSelectedPairQueue(selectedCategories, comparisons, rejectedCategories)
      : buildRandomPairQueue(comparisons, rejectedCategories);

  return {
    comparisons,
    selectedCategories,
    rejectedCategories,
    shuffledPairs,
    showIntro: shouldShowIntro(comparisons, selectedCategories),
  };
}
