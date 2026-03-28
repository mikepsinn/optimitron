import { describe, expect, it } from "vitest";

import {
  GOVERNMENT_LEADERBOARD_COLUMN_META,
  GOVERNMENT_LEADERBOARD_DEFAULT_SORT_ASC,
  GOVERNMENT_LEADERBOARD_DEFAULT_SORT_KEY,
  type GovernmentLeaderboardSortKey,
} from "./governmentLeaderboardColumns";

describe("government leaderboard column metadata", () => {
  it("defines help text for every sortable metric column", () => {
    const keys = Object.keys(
      GOVERNMENT_LEADERBOARD_COLUMN_META,
    ) as GovernmentLeaderboardSortKey[];

    expect(keys.sort()).toEqual([
      "country",
      "gdpPerCapita",
      "hale",
      "healthSpending",
      "killed",
      "lifeExpectancy",
      "militarySpending",
      "rank",
      "researchRatio",
      "trialRatio",
    ]);
  });

  it("distinguishes clinical trials from broader medical research", () => {
    expect(
      GOVERNMENT_LEADERBOARD_COLUMN_META.trialRatio.description,
    ).toContain("government clinical trial spending");
    expect(
      GOVERNMENT_LEADERBOARD_COLUMN_META.researchRatio.description,
    ).toContain("total government medical research spending");
  });

  it("explains HALE as healthy life expectancy rather than total lifespan", () => {
    expect(GOVERNMENT_LEADERBOARD_COLUMN_META.hale.description).toContain(
      "Healthy life expectancy",
    );
    expect(
      GOVERNMENT_LEADERBOARD_COLUMN_META.lifeExpectancy.description,
    ).toContain("Total life expectancy");
  });

  it("defaults to sorting by clinical trial misalignment descending", () => {
    expect(GOVERNMENT_LEADERBOARD_DEFAULT_SORT_KEY).toBe("trialRatio");
    expect(GOVERNMENT_LEADERBOARD_DEFAULT_SORT_ASC).toBe(false);
  });
});
