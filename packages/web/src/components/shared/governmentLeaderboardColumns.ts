export type GovernmentLeaderboardSortKey =
  | "hale"
  | "lifeExpectancy"
  | "gdpPerCapita"
  | "militarySpending"
  | "healthSpending"
  | "trialRatio"
  | "researchRatio";

export interface GovernmentLeaderboardColumnMeta {
  label: string;
  description: string;
}

export const GOVERNMENT_LEADERBOARD_COLUMN_META: Record<
  GovernmentLeaderboardSortKey,
  GovernmentLeaderboardColumnMeta
> = {
  hale: {
    label: "HALE",
    description: "Healthy life expectancy at birth: expected years lived in full health, not just total lifespan.",
  },
  lifeExpectancy: {
    label: "Life Exp",
    description: "Total life expectancy at birth, including years lived with illness or disability.",
  },
  gdpPerCapita: {
    label: "Income",
    description: "GDP per capita. This table uses it as a rough income proxy, not median income.",
  },
  militarySpending: {
    label: "Military",
    description: "Annual military spending in USD.",
  },
  healthSpending: {
    label: "Health/cap",
    description: "Annual health spending per person.",
  },
  trialRatio: {
    label: "Mil/Trials",
    description: "Military spending per $1 of government clinical trial spending.",
  },
  researchRatio: {
    label: "Mil/Research",
    description: "Military spending per $1 of total government medical research spending.",
  },
};
