"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useWishPoints } from "@/components/wishes/WishPointProvider";
import { API_ROUTES } from "@/lib/api-routes";
import { createLogger } from "@/lib/logger";
import { storage } from "@/lib/storage";
import {
  ALL_WISHOCRATIC_ITEM_IDS,
  AUTH_PROMPT_MILESTONES,
  PendingWishocraticAllocation,
  buildRandomPairQueue,
  buildSelectedPairQueue,
  getInitialGuestState,
  getExcludedItemIds,
  hydrateAuthenticatedState,
  hydrateGuestState,
} from "@/lib/wishocracy-state-utils";
import { calculateTotalPairs, generateAllPairs, shufflePairs } from "@/lib/wishocracy-utils";
import { WishocraticItemId } from "@/lib/wishocracy-data";
const logger = createLogger("useWishocracyState");
export function useWishocracyState() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const { showWishReward } = useWishPoints();
  const authCardRef = useRef<HTMLDivElement>(null);
  const initializationKey = `${status}:${session?.user?.id ?? "guest"}`;
  const initializedKeyRef = useRef<string | null>(null);

  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [allocations, setAllocations] = useState<PendingWishocraticAllocation[]>([]);
  const [shuffledPairs, setShuffledPairs] = useState<Array<[WishocraticItemId, WishocraticItemId]>>([]);
  const [showIntro, setShowIntro] = useState(false);
  const [showItemInclusion, setShowItemInclusion] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemIds, setIncludedItemIds] = useState<Set<WishocraticItemId>>(new Set());
  const [rejectedItemIds, setExcludedItemIds] = useState<Set<WishocraticItemId>>(new Set());

  const totalPossiblePairs = useMemo(() => {
    const itemCount = selectedItemIds.size || ALL_WISHOCRATIC_ITEM_IDS.length;
    return calculateTotalPairs(itemCount);
  }, [selectedItemIds]);

  useEffect(() => {
    if (status === "loading" || initializedKeyRef.current === initializationKey) {
      return;
    }

    initializedKeyRef.current = initializationKey;
    let isActive = true;

    async function initialize() {
      setIsLoading(true);
      setShowAuthPrompt(false);
      setShowItemInclusion(false);

      try {
        const nextState =
          status === "authenticated" && session?.user?.id
            ? await hydrateAuthenticatedState(session)
            : hydrateGuestState();

        if (!isActive) {
          return;
        }

        setAllocations(nextState.allocations);
        setIncludedItemIds(nextState.selectedItemIds);
        setExcludedItemIds(nextState.rejectedItemIds);
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
        setAllocations(initialState.allocations);
        setIncludedItemIds(initialState.selectedItemIds);
        setExcludedItemIds(initialState.rejectedItemIds);
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

    const nextAllocation: PendingWishocraticAllocation = {
      itemAId: currentPair[0],
      itemBId: currentPair[1],
      allocationA,
      allocationB,
      timestamp: new Date().toISOString(),
    };
    const nextAllocations = [...allocations, nextAllocation];
    const nextExcludedItemIds = new Set(rejectedItemIds);

    if (allocationA === 0 && allocationB === 0) {
      nextExcludedItemIds.add(currentPair[0]);
      nextExcludedItemIds.add(currentPair[1]);
    }

    let nextPairs = shuffledPairs
      .slice(currentPairIndex + 1)
      .filter((pair) => !nextExcludedItemIds.has(pair[0]) && !nextExcludedItemIds.has(pair[1]));

    if (!nextPairs.length && !selectedItemIds.size) {
      nextPairs = buildRandomPairQueue(nextAllocations, nextExcludedItemIds);
    }

    if (status === "authenticated" && session?.user?.id) {
      try {
        const response = await fetch(API_ROUTES.wishocracy.allocations, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextAllocation),
        });

        if (!response.ok) {
          logger.error("Failed to save allocation", await response.json());
        } else {
          const data = (await response.json().catch(() => null)) as { wishesEarned?: number } | null;
          if (data?.wishesEarned) {
            try { showWishReward(data.wishesEarned, "Budget Allocation"); } catch { /* noop */ }
          }
        }
      } catch (error) {
        logger.error("Failed to save allocation", error);
      }
    } else {
      storage.setPendingWishocracy({
        allocations: nextAllocations.map((allocation) => ({
          ...allocation,
          timestamp: allocation.timestamp ?? new Date().toISOString(),
        })),
        currentPairIndex: 0,
        shuffledPairs: nextPairs,
        includedItemIds: selectedItemIds.size ? Array.from(selectedItemIds) : undefined,
      });

      if (AUTH_PROMPT_MILESTONES.has(nextAllocations.length)) {
        setShowAuthPrompt(true);
        window.setTimeout(() => {
          authCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 500);
      }
    }

    setAllocations(nextAllocations);
    setExcludedItemIds(nextExcludedItemIds);
    setShuffledPairs(nextPairs);
    setCurrentPairIndex(0);
  }

  async function handleReset() {
    storage.removePendingWishocracy();

    if (status === "authenticated" && session?.user?.id) {
      await Promise.allSettled([
        fetch(API_ROUTES.wishocracy.itemInclusions, { method: "DELETE" }),
        fetch(API_ROUTES.wishocracy.allocations, { method: "DELETE" }),
      ]);
    }

    const initialState = getInitialGuestState();
    setAllocations(initialState.allocations);
    setIncludedItemIds(initialState.selectedItemIds);
    setExcludedItemIds(initialState.rejectedItemIds);
    setShuffledPairs(initialState.shuffledPairs);
    setCurrentPairIndex(0);
    setShowIntro(true);
    setShowItemInclusion(false);
    setShowAuthPrompt(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleItemInclusionComplete(selected: Set<WishocraticItemId>) {
    const nextPairs = shufflePairs(generateAllPairs(selected));
    setAllocations([]);
    setIncludedItemIds(selected);
    setExcludedItemIds(new Set());
    setShuffledPairs(nextPairs);
    setCurrentPairIndex(0);
    setShowIntro(false);
    setShowItemInclusion(false);

    if (status === "authenticated" && session?.user?.id) {
      await fetch(API_ROUTES.wishocracy.itemInclusions, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inclusions: ALL_WISHOCRATIC_ITEM_IDS.map((itemId) => ({
            itemId,
            included: selected.has(itemId),
          })),
        }),
      });
      return;
    }

    storage.setPendingWishocracy({
      allocations: [],
      currentPairIndex: 0,
      shuffledPairs: nextPairs,
      includedItemIds: Array.from(selected),
      startedAt: new Date().toISOString(),
    });
  }

  function handleItemRemove(itemId: WishocraticItemId) {
    const nextSelected = new Set(selectedItemIds);
    nextSelected.delete(itemId);
    const nextRejected = new Set(rejectedItemIds);
    nextRejected.add(itemId);

    const nextAllocations = allocations.filter(
      (a) => a.itemAId !== itemId && a.itemBId !== itemId,
    );
    const nextPairs = shuffledPairs.filter(
      (p) => p[0] !== itemId && p[1] !== itemId,
    );

    setIncludedItemIds(nextSelected);
    setExcludedItemIds(nextRejected);
    setAllocations(nextAllocations);
    setShuffledPairs(nextPairs);
    setCurrentPairIndex(0);

    if (status === "authenticated" && session?.user?.id) {
      void fetch(API_ROUTES.wishocracy.itemInclusions, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inclusions: [{ itemId, included: false }],
        }),
      });
    } else {
      storage.setPendingWishocracy({
        allocations: nextAllocations.map((a) => ({
          ...a,
          timestamp: a.timestamp ?? new Date().toISOString(),
        })),
        currentPairIndex: 0,
        shuffledPairs: nextPairs,
        includedItemIds: Array.from(nextSelected),
      });
    }
  }

  async function handleEditSave(
    updatedAllocations: Array<{
      itemAId: string;
      itemBId: string;
      allocationA: number;
      allocationB: number;
    }>,
    updatedItemIds: Set<WishocraticItemId>,
    deletedItemIds: Set<WishocraticItemId>,
  ) {
    if (status !== "authenticated" || !session?.user?.id) {
      logger.warn("Skipping edit save for unauthenticated user");
      return;
    }

    const updatedExcludedItemIds = getExcludedItemIds(updatedAllocations);

    await fetch(API_ROUTES.wishocracy.allocations, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updatedAllocations,
        deletedItemIds: Array.from(deletedItemIds),
      }),
    });

    await fetch(API_ROUTES.wishocracy.itemInclusions, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inclusions: ALL_WISHOCRATIC_ITEM_IDS.map((itemId) => ({
          itemId,
          included: updatedItemIds.has(itemId),
        })),
      }),
    });

    setAllocations(updatedAllocations);
    setIncludedItemIds(updatedItemIds);
    setExcludedItemIds(updatedExcludedItemIds);
    setShuffledPairs(
      updatedItemIds.size
        ? buildSelectedPairQueue(updatedItemIds, updatedAllocations, updatedExcludedItemIds)
        : buildRandomPairQueue(updatedAllocations, updatedExcludedItemIds),
    );
    setCurrentPairIndex(0);
  }

  return {
    state: {
      currentPairIndex,
      allocations,
      shuffledPairs,
      showIntro,
      showItemInclusion,
      showAuthPrompt,
      isLoading,
      selectedItemIds,
      rejectedItemIds,
      totalPossiblePairs,
      session,
      status,
      searchParams,
      authCardRef,
    },
    handlers: {
      handlePairSubmit,
      handleReset,
      handleItemInclusionComplete,
      handleEditSave,
      handleItemRemove,
      setShowIntro,
      setShowItemInclusion,
      setShowAuthPrompt,
    },
  };
}
