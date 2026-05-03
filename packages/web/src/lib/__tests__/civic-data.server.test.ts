import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@optimitron/data/fetchers", () => ({
  fetchMembers: vi.fn(),
}));

import * as fetchers from "@optimitron/data/fetchers";

import { lookupRepresentatives, zipToStateDistrict } from "../civic-data.server";

describe("civic-data.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns senators plus the matching house member for a state district", async () => {
    vi.mocked(fetchers.fetchMembers).mockResolvedValue([
      {
        bioguideId: "S1",
        name: "Senator One",
        party: "I",
        state: "CA",
        chamber: "Senate",
      },
      {
        bioguideId: "S2",
        name: "Senator Two",
        party: "D",
        state: "CA",
        chamber: "Senate",
      },
      {
        bioguideId: "H1",
        name: "Representative One",
        party: "D",
        state: "CA",
        district: 12,
        chamber: "House of Representatives",
      },
      {
        bioguideId: "H2",
        name: "Representative Other",
        party: "R",
        state: "CA",
        district: 11,
        chamber: "House of Representatives",
      },
      {
        bioguideId: "TX1",
        name: "Texas Senator",
        party: "R",
        state: "TX",
        chamber: "Senate",
      },
    ] as Awaited<ReturnType<typeof fetchers.fetchMembers>>);

    const representatives = await lookupRepresentatives("ca", 12);

    expect(fetchers.fetchMembers).toHaveBeenCalledWith();
    expect(representatives).toEqual([
      expect.objectContaining({
        bioguideId: "S1",
        title: "Senator",
        state: "CA",
      }),
      expect.objectContaining({
        bioguideId: "S2",
        title: "Senator",
        state: "CA",
      }),
      expect.objectContaining({
        bioguideId: "H1",
        title: "Representative",
        district: 12,
      }),
    ]);
  });

  it("resolves a ZIP code into state and district", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          addressMatches: [
            {
              geographies: {
                "Congressional Districts": [{ STATE: "06", CD119: "12" }],
                States: [{ STUSAB: "CA" }],
              },
            },
          ],
        },
      }),
    }) as typeof fetch;

    await expect(zipToStateDistrict("94107")).resolves.toEqual({
      state: "CA",
      district: 12,
    });
  });
});
