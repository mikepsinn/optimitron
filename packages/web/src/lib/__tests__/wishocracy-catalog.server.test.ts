import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WISHOCRACY_JURISDICTION,
  getActualGovernmentAllocations,
} from "@/lib/wishocracy-data";

const mocks = vi.hoisted(() => ({
  upsertJurisdiction: vi.fn(),
  upsertWishocraticItem: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    jurisdiction: {
      upsert: mocks.upsertJurisdiction,
    },
    wishocraticItem: {
      upsert: mocks.upsertWishocraticItem,
    },
  },
}));

import {
  buildWishocraticCatalogRecord,
  ensureWishocraticItemsExist,
} from "../wishocracy-catalog.server";

describe("wishocracy catalog sync", () => {
  beforeEach(() => {
    mocks.upsertJurisdiction.mockReset();
    mocks.upsertWishocraticItem.mockReset();
    mocks.upsertJurisdiction.mockResolvedValue({ id: "jurisdiction_usa" });
    mocks.upsertWishocraticItem.mockResolvedValue({});
  });

  it("builds catalog records from the default Wishocratic items registry", () => {
    const allocations = getActualGovernmentAllocations();
    const record = buildWishocraticCatalogRecord("PRAGMATIC_CLINICAL_TRIALS");

    expect(record).toEqual({
      id: "PRAGMATIC_CLINICAL_TRIALS",
      jurisdictionCode: "US",
      name: "Pragmatic Clinical Trials",
      description: expect.any(String),
      currentAllocationUsd: 1e9,
      currentAllocationPct: allocations.PRAGMATIC_CLINICAL_TRIALS,
      sourceUrl: expect.any(String),
    });
  });

  it("upserts each requested item into the default wishocracy jurisdiction", async () => {
    await ensureWishocraticItemsExist([
      "PRAGMATIC_CLINICAL_TRIALS",
      "MILITARY_OPERATIONS",
      "PRAGMATIC_CLINICAL_TRIALS",
    ]);

    expect(mocks.upsertJurisdiction).toHaveBeenCalledWith({
      where: { code: "US" },
      update: {},
      create: {
        name: DEFAULT_WISHOCRACY_JURISDICTION.name,
        type: DEFAULT_WISHOCRACY_JURISDICTION.type,
        code: "US",
      },
      select: { id: true },
    });
    expect(mocks.upsertWishocraticItem).toHaveBeenCalledTimes(2);
    expect(mocks.upsertWishocraticItem).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "PRAGMATIC_CLINICAL_TRIALS" },
        create: expect.objectContaining({
          id: "PRAGMATIC_CLINICAL_TRIALS",
          jurisdictionId: "jurisdiction_usa",
          active: true,
        }),
        update: expect.objectContaining({
          name: "Pragmatic Clinical Trials",
          deletedAt: null,
        }),
      }),
    );
  });

  it("returns early when no item ids are requested", async () => {
    await ensureWishocraticItemsExist([]);

    expect(mocks.upsertJurisdiction).not.toHaveBeenCalled();
    expect(mocks.upsertWishocraticItem).not.toHaveBeenCalled();
  });
});
