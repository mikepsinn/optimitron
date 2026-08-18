import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPendingWishocracy: vi.fn(),
  syncPendingWishocracy: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  storage: {
    getPendingWishocracy: mocks.getPendingWishocracy,
  },
}));

vi.mock("@/lib/wishocracy-utils", async () => {
  const actual = await vi.importActual<typeof import("../wishocracy-utils")>(
    "../wishocracy-utils",
  );

  return {
    ...actual,
    syncPendingWishocracy: mocks.syncPendingWishocracy,
  };
});

import { API_ROUTES } from "../api-routes";
import {
  buildSelectedPairQueue,
  getInitialGuestState,
  getExcludedItemIds,
  hydrateAuthenticatedState,
  hydrateGuestState,
  shouldShowIntro,
} from "../wishocracy-state-utils";

describe("wishocracy state utils", () => {
  beforeEach(() => {
    mocks.getPendingWishocracy.mockReset();
    mocks.syncPendingWishocracy.mockReset();
    vi.unstubAllGlobals();
  });

  it("marks both categories as rejected for 0/0 comparisons", () => {
    const rejected = getExcludedItemIds([
      {
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 0,
        allocationB: 0,
      },
      {
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "EARLY_CHILDHOOD_EDUCATION",
        allocationA: 70,
        allocationB: 30,
      },
    ]);

    expect(rejected).toEqual(
      new Set(["PRAGMATIC_CLINICAL_TRIALS", "MILITARY_OPERATIONS"]),
    );
  });

  it("builds selected queues without completed or rejected pairs", () => {
    const selectedItemIds = new Set([
      "PRAGMATIC_CLINICAL_TRIALS",
      "ADDICTION_TREATMENT",
      "EARLY_CHILDHOOD_EDUCATION",
      "MILITARY_OPERATIONS",
    ] as const);

    const queue = buildSelectedPairQueue(
      selectedItemIds,
      [
        {
          itemAId: "PRAGMATIC_CLINICAL_TRIALS",
          itemBId: "ADDICTION_TREATMENT",
          allocationA: 60,
          allocationB: 40,
        },
      ],
      new Set(["MILITARY_OPERATIONS"]),
    );

    expect(queue).toEqual([
      ["PRAGMATIC_CLINICAL_TRIALS", "EARLY_CHILDHOOD_EDUCATION"],
      ["ADDICTION_TREATMENT", "EARLY_CHILDHOOD_EDUCATION"],
    ]);
  });

  it("hydrates guest progress from local storage and filters invalid pairs", () => {
    mocks.getPendingWishocracy.mockReturnValue({
      allocations: [
        {
          itemAId: "PRAGMATIC_CLINICAL_TRIALS",
          itemBId: "ADDICTION_TREATMENT",
          allocationA: 60,
          allocationB: 40,
          timestamp: "2026-03-11T00:00:00.000Z",
        },
        {
          itemAId: "ADDICTION_TREATMENT",
          itemBId: "MILITARY_OPERATIONS",
          allocationA: 0,
          allocationB: 0,
          timestamp: "2026-03-11T00:01:00.000Z",
        },
      ],
      currentPairIndex: 0,
      shuffledPairs: [
        ["PRAGMATIC_CLINICAL_TRIALS", "EARLY_CHILDHOOD_EDUCATION"],
        ["MILITARY_OPERATIONS", "EARLY_CHILDHOOD_EDUCATION"],
        ["PRAGMATIC_CLINICAL_TRIALS", "NOT_REAL_CATEGORY"],
      ],
      includedItemIds: [
        "PRAGMATIC_CLINICAL_TRIALS",
        "ADDICTION_TREATMENT",
        "EARLY_CHILDHOOD_EDUCATION",
        "MILITARY_OPERATIONS",
      ],
    });

    const state = hydrateGuestState();

    expect(state.allocations).toHaveLength(2);
    expect(state.selectedItemIds).toEqual(
      new Set([
        "PRAGMATIC_CLINICAL_TRIALS",
        "ADDICTION_TREATMENT",
        "EARLY_CHILDHOOD_EDUCATION",
        "MILITARY_OPERATIONS",
      ]),
    );
    expect(state.rejectedItemIds).toEqual(
      new Set(["ADDICTION_TREATMENT", "MILITARY_OPERATIONS"]),
    );
    expect(state.shuffledPairs).toEqual([["PRAGMATIC_CLINICAL_TRIALS", "EARLY_CHILDHOOD_EDUCATION"]]);
    expect(state.showIntro).toBe(false);
  });

  it("shows the intro only for empty runs with no category selection", () => {
    expect(shouldShowIntro([], new Set())).toBe(true);
    expect(shouldShowIntro([], new Set(["PRAGMATIC_CLINICAL_TRIALS"]))).toBe(false);
    expect(
      shouldShowIntro(
        [
          {
            itemAId: "PRAGMATIC_CLINICAL_TRIALS",
            itemBId: "ADDICTION_TREATMENT",
            allocationA: 50,
            allocationB: 50,
          },
        ],
        new Set(),
      ),
    ).toBe(false);
  });

  it("creates the initial guest state with a random batch and intro enabled", () => {
    const state = getInitialGuestState();

    expect(state.allocations).toEqual([]);
    expect(state.selectedItemIds.size).toBe(0);
    expect(state.rejectedItemIds.size).toBe(0);
    expect(state.shuffledPairs).toHaveLength(25);
    expect(state.showIntro).toBe(true);
  });

  it("hydrates authenticated state from synced server data", async () => {
    mocks.syncPendingWishocracy.mockResolvedValue(true);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({
          allocations: [
            {
              itemAId: "PRAGMATIC_CLINICAL_TRIALS",
              itemBId: "ADDICTION_TREATMENT",
              allocationA: 60,
              allocationB: 40,
            },
            {
              itemAId: "NOT_REAL_CATEGORY",
              itemBId: "ADDICTION_TREATMENT",
              allocationA: 20,
              allocationB: 80,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          inclusions: [
            {
              itemId: "PRAGMATIC_CLINICAL_TRIALS",
              included: true,
            },
            {
              itemId: "ADDICTION_TREATMENT",
              included: true,
            },
            {
              itemId: "EARLY_CHILDHOOD_EDUCATION",
              included: true,
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const state = await hydrateAuthenticatedState({
      user: {
        id: "user_1",
      },
    } as never);

    expect(mocks.syncPendingWishocracy).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenNthCalledWith(1, API_ROUTES.wishocracy.allocations);
    expect(fetchMock).toHaveBeenNthCalledWith(2, API_ROUTES.wishocracy.itemInclusions);
    expect(state.selectedItemIds).toEqual(
      new Set([
        "PRAGMATIC_CLINICAL_TRIALS",
        "ADDICTION_TREATMENT",
        "EARLY_CHILDHOOD_EDUCATION",
      ]),
    );
    expect(state.allocations).toEqual([
      {
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "ADDICTION_TREATMENT",
        allocationA: 60,
        allocationB: 40,
      },
    ]);
    expect(state.rejectedItemIds.size).toBe(0);
    expect(state.shuffledPairs).toEqual([
      ["PRAGMATIC_CLINICAL_TRIALS", "EARLY_CHILDHOOD_EDUCATION"],
      ["ADDICTION_TREATMENT", "EARLY_CHILDHOOD_EDUCATION"],
    ]);
    expect(state.showIntro).toBe(false);
  });
});
