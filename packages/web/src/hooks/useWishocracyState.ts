"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { API_ROUTES } from "@/lib/api-routes";
import { createLogger } from "@/lib/logger";
import { storage } from "@/lib/storage";
import {
  ALL_CATEGORY_IDS,
  AUTH_PROMPT_MILESTONES,
  PendingComparison,
  buildRandomPairQueue,
  buildSelectedPairQueue,
  getInitialGuestState,
  getRejectedCategories,
  hydrateAuthenticatedState,
  hydrateGuestState,
} from "@/lib/wishocracy-state-utils";
import { calculateTotalPairs, generateAllPairsFromCategories, shufflePairs } from "@/lib/wishocracy-utils";
import { BudgetCategoryId } from "@/lib/wishocracy-data";
const logger = createLogger("useWishocracyState");
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
        const nextState =
          status === "authenticated" && session?.user?.id
            ? await hydrateAuthenticatedState(session)
            : hydrateGuestState();

        if (!isActive) {
          return;
        }

        setComparisons(nextState.comparisons);
        setSelectedCategories(nextState.selectedCategories);
        setRejectedCategories(nextState.rejectedCategories);
        setShuffledPairs(nextState.shuffledPairs);
        setCurrentPairIndex(0);
        setShowIntro(nextState.showIntro);
      } catch (error) {
        logger.error("Failed to initialize wishocracy state", error);
        if (status !== "authenticated") storage.removePendingWishocracy();

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
      itemAId: currentPair[0],
      itemBId: currentPair[1],
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

    let nextPairs = shuffledPairs
      .slice(currentPairIndex + 1)
      .filter((pair) => !nextRejectedCategories.has(pair[0]) && !nextRejectedCategories.has(pair[1]));

    if (!nextPairs.length && !selectedCategories.size) {
      nextPairs = buildRandomPairQueue(nextComparisons, nextRejectedCategories);
    }

    if (status === "authenticated" && session?.user?.id) {
      try {
        const response = await fetch(API_ROUTES.wishocracy.allocations, {
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
        fetch(API_ROUTES.wishocracy.categorySelections, { method: "DELETE" }),
        fetch(API_ROUTES.wishocracy.allocations, { method: "DELETE" }),
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
      await fetch(API_ROUTES.wishocracy.categorySelections, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: ALL_CATEGORY_IDS.map((categoryId) => ({
            itemId: categoryId,
            selected: selected.has(categoryId),
          })),
        }),
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
      itemAId: string;
      itemBId: string;
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

    await fetch(API_ROUTES.wishocracy.allocations, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updatedComparisons,
        deletedCategories: Array.from(deletedCategories),
      }),
    });

    await fetch(API_ROUTES.wishocracy.categorySelections, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selections: ALL_CATEGORY_IDS.map((categoryId) => ({
          itemId: categoryId,
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
