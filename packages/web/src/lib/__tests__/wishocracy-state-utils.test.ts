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

import {
  buildSelectedPairQueue,
  getInitialGuestState,
  getRejectedCategories,
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
    const rejected = getRejectedCategories([
      {
        categoryA: "PRAGMATIC_CLINICAL_TRIALS",
        categoryB: "MILITARY_OPERATIONS",
        allocationA: 0,
        allocationB: 0,
      },
      {
        categoryA: "ADDICTION_TREATMENT",
        categoryB: "EARLY_CHILDHOOD_EDUCATION",
        allocationA: 70,
        allocationB: 30,
      },
    ]);

    expect(rejected).toEqual(
      new Set(["PRAGMATIC_CLINICAL_TRIALS", "MILITARY_OPERATIONS"]),
    );
  });

  it("builds selected queues without completed or rejected pairs", () => {
    const selectedCategories = new Set([
      "PRAGMATIC_CLINICAL_TRIALS",
      "ADDICTION_TREATMENT",
      "EARLY_CHILDHOOD_EDUCATION",
      "MILITARY_OPERATIONS",
    ] as const);

    const queue = buildSelectedPairQueue(
      selectedCategories,
      [
        {
          categoryA: "PRAGMATIC_CLINICAL_TRIALS",
          categoryB: "ADDICTION_TREATMENT",
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
      comparisons: [
        {
          categoryA: "PRAGMATIC_CLINICAL_TRIALS",
          categoryB: "ADDICTION_TREATMENT",
          allocationA: 60,
          allocationB: 40,
          timestamp: "2026-03-11T00:00:00.000Z",
        },
        {
          categoryA: "ADDICTION_TREATMENT",
          categoryB: "MILITARY_OPERATIONS",
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
      selectedCategories: [
        "PRAGMATIC_CLINICAL_TRIALS",
        "ADDICTION_TREATMENT",
        "EARLY_CHILDHOOD_EDUCATION",
        "MILITARY_OPERATIONS",
      ],
    });

    const state = hydrateGuestState();

    expect(state.comparisons).toHaveLength(2);
    expect(state.selectedCategories).toEqual(
      new Set([
        "PRAGMATIC_CLINICAL_TRIALS",
        "ADDICTION_TREATMENT",
        "EARLY_CHILDHOOD_EDUCATION",
        "MILITARY_OPERATIONS",
      ]),
    );
    expect(state.rejectedCategories).toEqual(
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
            categoryA: "PRAGMATIC_CLINICAL_TRIALS",
            categoryB: "ADDICTION_TREATMENT",
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

    expect(state.comparisons).toEqual([]);
    expect(state.selectedCategories.size).toBe(0);
    expect(state.rejectedCategories.size).toBe(0);
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
              categoryA: "PRAGMATIC_CLINICAL_TRIALS",
              categoryB: "ADDICTION_TREATMENT",
              allocationA: 60,
              allocationB: 40,
            },
            {
              categoryA: "NOT_REAL_CATEGORY",
              categoryB: "ADDICTION_TREATMENT",
              allocationA: 20,
              allocationB: 80,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          selections: [
            {
              categoryId: "PRAGMATIC_CLINICAL_TRIALS",
              selected: true,
            },
            {
              categoryId: "ADDICTION_TREATMENT",
              selected: true,
            },
            {
              categoryId: "EARLY_CHILDHOOD_EDUCATION",
              selected: true,
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
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/wishocracy/allocations");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/wishocracy/category-selections");
    expect(state.selectedCategories).toEqual(
      new Set([
        "PRAGMATIC_CLINICAL_TRIALS",
        "ADDICTION_TREATMENT",
        "EARLY_CHILDHOOD_EDUCATION",
      ]),
    );
    expect(state.comparisons).toEqual([
      {
        categoryA: "PRAGMATIC_CLINICAL_TRIALS",
        categoryB: "ADDICTION_TREATMENT",
        allocationA: 60,
        allocationB: 40,
      },
    ]);
    expect(state.rejectedCategories.size).toBe(0);
    expect(state.shuffledPairs).toEqual([
      ["PRAGMATIC_CLINICAL_TRIALS", "EARLY_CHILDHOOD_EDUCATION"],
      ["ADDICTION_TREATMENT", "EARLY_CHILDHOOD_EDUCATION"],
    ]);
    expect(state.showIntro).toBe(false);
  });
});
