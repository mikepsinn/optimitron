"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BudgetCategoryId, BUDGET_CATEGORIES } from "@/lib/wishocracy-data";
import { createLogger } from "@/lib/logger";
import { storage } from "@/lib/storage";
import {
  calculateTotalPairs,
  filterCompletedPairs,
  filterRejectedPairs,
  filterValidComparisons,
  filterValidPairs,
  generateAllPairsFromCategories,
  generateRandomPairs,
  shufflePairs,
  syncPendingWishocracy,
} from "@/lib/wishocracy-utils";

const logger = createLogger("useWishocracyState");
const RANDOM_PAIR_BATCH_SIZE = 25;
const AUTH_PROMPT_MILESTONES = new Set([5, 10, 15]);
const ALL_CATEGORY_IDS = Object.keys(BUDGET_CATEGORIES) as BudgetCategoryId[];

type PendingComparison = {
  categoryA: string;
  categoryB: string;
  allocationA: number;
  allocationB: number;
  timestamp?: string;
};

type SelectionRecord = {
  categoryId: string;
  selected: boolean;
};

function getRejectedCategories(
  comparisons: PendingComparison[],
): Set<BudgetCategoryId> {
  return comparisons.reduce((rejected, comparison) => {
    if (comparison.allocationA === 0 && comparison.allocationB === 0) {
      rejected.add(comparison.categoryA as BudgetCategoryId);
      rejected.add(comparison.categoryB as BudgetCategoryId);
    }
    return rejected;
  }, new Set<BudgetCategoryId>());
}

function buildSelectedPairQueue(
  selectedCategories: Set<BudgetCategoryId>,
  comparisons: PendingComparison[],
  rejectedCategories: Set<BudgetCategoryId>,
) {
  const allPairs = generateAllPairsFromCategories(selectedCategories);
  const uncompletedPairs = filterCompletedPairs(allPairs, comparisons);
  return filterRejectedPairs(uncompletedPairs, rejectedCategories);
}

function buildRandomPairQueue(
  comparisons: PendingComparison[],
  rejectedCategories: Set<BudgetCategoryId>,
) {
  const remainingPairs = filterRejectedPairs(
    filterCompletedPairs(generateAllPairsFromCategories(ALL_CATEGORY_IDS), comparisons),
    rejectedCategories,
  );

  if (remainingPairs.length === 0) {
    return [];
  }

  return shufflePairs(remainingPairs).slice(0, RANDOM_PAIR_BATCH_SIZE);
}

function getSelectedCategorySet(
  selections: SelectionRecord[] | string[] | undefined,
) {
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
    (selections as SelectionRecord[])
      .filter((selection) => selection.selected)
      .map((selection) => selection.categoryId)
      .filter(
        (categoryId): categoryId is BudgetCategoryId =>
          BUDGET_CATEGORIES[categoryId as BudgetCategoryId] !== undefined,
      ),
  );
}

function getInitialGuestState() {
  return {
    comparisons: [] as PendingComparison[],
    selectedCategories: new Set<BudgetCategoryId>(),
    rejectedCategories: new Set<BudgetCategoryId>(),
    shuffledPairs: generateRandomPairs(RANDOM_PAIR_BATCH_SIZE),
    showIntro: true,
  };
}

export function useWishocracyState() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const authCardRef = useRef<HTMLDivElement>(null);
  const initializationKey = `${status}:${session?.user?.id ?? "guest"}`;
  const initializedKeyRef = useRef<string | null>(null);

  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [comparisons, setComparisons] = useState<PendingComparison[]>([]);
  const [shuffledPairs, setShuffledPairs] = useState<Array<[BudgetCategoryId, BudgetCategoryId]>>([]);
  const [showIntro, setShowIntro] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<BudgetCategoryId>>(new Set());
  const [rejectedCategories, setRejectedCategories] = useState<Set<BudgetCategoryId>>(new Set());

  const totalPossiblePairs = useMemo(() => {
    const categoryCount = selectedCategories.size || ALL_CATEGORY_IDS.length;
    return calculateTotalPairs(categoryCount);
  }, [selectedCategories]);

  useEffect(() => {
    if (status === "loading" || initializedKeyRef.current === initializationKey) {
      return;
    }

    initializedKeyRef.current = initializationKey;
    let isActive = true;

    async function initialize() {
      setIsLoading(true);
      setShowAuthPrompt(false);
      setShowCategorySelection(false);

      try {
        if (status === "authenticated" && session?.user?.id) {
          await syncPendingWishocracy(session);

          const [allocationsResponse, selectionsResponse] = await Promise.all([
            fetch("/api/wishocracy/allocations"),
            fetch("/api/wishocracy/category-selections"),
          ]);

          const allocationsPayload = (await allocationsResponse.json()) as {
            allocations?: PendingComparison[];
          };
          const selectionsPayload = (await selectionsResponse.json()) as {
            selections?: SelectionRecord[];
          };

          const nextSelectedCategories = getSelectedCategorySet(selectionsPayload.selections);
          const nextComparisons = filterValidComparisons(
            allocationsPayload.allocations ?? [],
            nextSelectedCategories.size ? nextSelectedCategories : undefined,
          );
          const nextRejectedCategories = getRejectedCategories(nextComparisons);
          const nextPairs = nextSelectedCategories.size
            ? buildSelectedPairQueue(nextSelectedCategories, nextComparisons, nextRejectedCategories)
            : buildRandomPairQueue(nextComparisons, nextRejectedCategories);

          if (!isActive) {
            return;
          }

          setComparisons(nextComparisons);
          setSelectedCategories(nextSelectedCategories);
          setRejectedCategories(nextRejectedCategories);
          setShuffledPairs(nextPairs);
          setCurrentPairIndex(0);
          setShowIntro(
            nextComparisons.length === 0 &&
              nextPairs.length === 0 &&
              nextSelectedCategories.size === 0,
          );
          return;
        }

        const pending = storage.getPendingWishocracy();
        if (!pending) {
          const initialState = getInitialGuestState();
          if (!isActive) {
            return;
          }

          setComparisons(initialState.comparisons);
          setSelectedCategories(initialState.selectedCategories);
          setRejectedCategories(initialState.rejectedCategories);
          setShuffledPairs(initialState.shuffledPairs);
          setCurrentPairIndex(0);
          setShowIntro(initialState.showIntro);
          return;
        }

        const nextSelectedCategories = getSelectedCategorySet(pending.selectedCategories);
        const nextComparisons = filterValidComparisons(
          pending.comparisons ?? [],
          nextSelectedCategories.size ? nextSelectedCategories : undefined,
        );
        const nextRejectedCategories = getRejectedCategories(nextComparisons);
        const savedPairs = filterRejectedPairs(
          filterValidPairs(pending.shuffledPairs ?? []),
          nextRejectedCategories,
        );
        const nextPairs = savedPairs.length
          ? savedPairs
          : nextSelectedCategories.size
            ? buildSelectedPairQueue(nextSelectedCategories, nextComparisons, nextRejectedCategories)
            : buildRandomPairQueue(nextComparisons, nextRejectedCategories);

        if (!isActive) {
          return;
        }

        setComparisons(nextComparisons);
        setSelectedCategories(nextSelectedCategories);
        setRejectedCategories(nextRejectedCategories);
        setShuffledPairs(nextPairs);
        setCurrentPairIndex(0);
        setShowIntro(
          nextComparisons.length === 0 &&
            nextPairs.length === 0 &&
            nextSelectedCategories.size === 0,
        );
      } catch (error) {
        logger.error("Failed to initialize wishocracy state", error);
        storage.removePendingWishocracy();

        if (!isActive) {
          return;
        }

        const initialState = getInitialGuestState();
        setComparisons(initialState.comparisons);
        setSelectedCategories(initialState.selectedCategories);
        setRejectedCategories(initialState.rejectedCategories);
        setShuffledPairs(initialState.shuffledPairs);
        setCurrentPairIndex(0);
        setShowIntro(true);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isActive = false;
    };
  }, [initializationKey, session, status]);

  async function handlePairSubmit(allocationA: number, allocationB: number) {
    const currentPair = shuffledPairs[currentPairIndex];
    if (!currentPair) {
      return;
    }

    const nextComparison: PendingComparison = {
      categoryA: currentPair[0],
      categoryB: currentPair[1],
      allocationA,
      allocationB,
      timestamp: new Date().toISOString(),
    };
    const nextComparisons = [...comparisons, nextComparison];
    const nextRejectedCategories = new Set(rejectedCategories);

    if (allocationA === 0 && allocationB === 0) {
      nextRejectedCategories.add(currentPair[0]);
      nextRejectedCategories.add(currentPair[1]);
    }

    let nextPairs = filterRejectedPairs(
      shuffledPairs.slice(currentPairIndex + 1),
      nextRejectedCategories,
    );

    if (!nextPairs.length && !selectedCategories.size) {
      nextPairs = buildRandomPairQueue(nextComparisons, nextRejectedCategories);
    }

    if (status === "authenticated" && session?.user?.id) {
      try {
        const response = await fetch("/api/wishocracy/allocation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextComparison),
        });

        if (!response.ok) {
          logger.error("Failed to save allocation", await response.json());
        }
      } catch (error) {
        logger.error("Failed to save allocation", error);
      }
    } else {
      storage.setPendingWishocracy({
        comparisons: nextComparisons.map((comparison) => ({
          ...comparison,
          timestamp: comparison.timestamp ?? new Date().toISOString(),
        })),
        currentPairIndex: 0,
        shuffledPairs: nextPairs,
        selectedCategories: selectedCategories.size ? Array.from(selectedCategories) : undefined,
      });

      if (AUTH_PROMPT_MILESTONES.has(nextComparisons.length)) {
        setShowAuthPrompt(true);
        window.setTimeout(() => {
          authCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 500);
      }
    }

    setComparisons(nextComparisons);
    setRejectedCategories(nextRejectedCategories);
    setShuffledPairs(nextPairs);
    setCurrentPairIndex(0);
  }

  async function handleReset() {
    storage.removePendingWishocracy();

    if (status === "authenticated" && session?.user?.id) {
      await Promise.allSettled([
        fetch("/api/wishocracy/category-selections", { method: "DELETE" }),
        fetch("/api/wishocracy/allocations", { method: "DELETE" }),
      ]);
    }

    const initialState = getInitialGuestState();
    setComparisons(initialState.comparisons);
    setSelectedCategories(initialState.selectedCategories);
    setRejectedCategories(initialState.rejectedCategories);
    setShuffledPairs(initialState.shuffledPairs);
    setCurrentPairIndex(0);
    setShowIntro(true);
    setShowCategorySelection(false);
    setShowAuthPrompt(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCategorySelectionComplete(selected: Set<BudgetCategoryId>) {
    const nextPairs = shufflePairs(generateAllPairsFromCategories(selected));
    setComparisons([]);
    setSelectedCategories(selected);
    setRejectedCategories(new Set());
    setShuffledPairs(nextPairs);
    setCurrentPairIndex(0);
    setShowIntro(false);
    setShowCategorySelection(false);

    if (status === "authenticated" && session?.user?.id) {
      const selections = ALL_CATEGORY_IDS.map((categoryId) => ({
        categoryId,
        selected: selected.has(categoryId),
      }));

      await fetch("/api/wishocracy/category-selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      return;
    }

    storage.setPendingWishocracy({
      comparisons: [],
      currentPairIndex: 0,
      shuffledPairs: nextPairs,
      selectedCategories: Array.from(selected),
      startedAt: new Date().toISOString(),
    });
  }

  async function handleEditSave(
    updatedComparisons: Array<{
      categoryA: string;
      categoryB: string;
      allocationA: number;
      allocationB: number;
    }>,
    updatedCategories: Set<BudgetCategoryId>,
    deletedCategories: Set<BudgetCategoryId>,
  ) {
    if (status !== "authenticated" || !session?.user?.id) {
      logger.warn("Skipping edit save for unauthenticated user");
      return;
    }

    const updatedRejectedCategories = getRejectedCategories(updatedComparisons);

    await fetch("/api/wishocracy/allocations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updatedComparisons,
        deletedCategories: Array.from(deletedCategories),
      }),
    });

    await fetch("/api/wishocracy/category-selections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selections: ALL_CATEGORY_IDS.map((categoryId) => ({
          categoryId,
          selected: updatedCategories.has(categoryId),
        })),
      }),
    });

    setComparisons(updatedComparisons);
    setSelectedCategories(updatedCategories);
    setRejectedCategories(updatedRejectedCategories);
    setShuffledPairs(
      updatedCategories.size
        ? buildSelectedPairQueue(updatedCategories, updatedComparisons, updatedRejectedCategories)
        : buildRandomPairQueue(updatedComparisons, updatedRejectedCategories),
    );
    setCurrentPairIndex(0);
  }

  return {
    state: {
      currentPairIndex,
      comparisons,
      shuffledPairs,
      showIntro,
      showCategorySelection,
      showAuthPrompt,
      isLoading,
      selectedCategories,
      rejectedCategories,
      totalPossiblePairs,
      session,
      status,
      searchParams,
      authCardRef,
    },
    handlers: {
      handlePairSubmit,
      handleReset,
      handleCategorySelectionComplete,
      handleEditSave,
      setShowIntro,
      setShowCategorySelection,
      setShowAuthPrompt,
    },
  };
}
