export type GovernmentLeaderboardSortKey =
  | "country"
  | "rank"
  | "killed"
  | "hale"
  | "lifeExpectancy"
  | "medianIncome"
  | "militaryPerCapitaPPP"
  | "militarySpending"
  | "healthSpending"
  | "trialRatio"
  | "researchRatio"
  | "memorialDeaths";

export interface GovernmentLeaderboardColumnMeta {
  label: string;
  description: string;
}

export const GOVERNMENT_LEADERBOARD_DEFAULT_SORT_KEY: GovernmentLeaderboardSortKey =
  "trialRatio";

export const GOVERNMENT_LEADERBOARD_DEFAULT_SORT_ASC = false;

export interface GovernmentLeaderboardColumnVisibilityConfig {
  /** Whether users can toggle this column on/off */
  toggleable: boolean;
  /** CSS classes applied in "default" mode (preserves existing breakpoint behavior) */
  defaultHiddenClass: string;
  /** Whether this column is hidden when compact=true */
  compactHidden: boolean;
}

export const GOVERNMENT_LEADERBOARD_COLUMN_VISIBILITY: Record<
  GovernmentLeaderboardSortKey,
  GovernmentLeaderboardColumnVisibilityConfig
> = {
  rank:                { toggleable: true,  defaultHiddenClass: "hidden md:table-cell",  compactHidden: false },
  country:             { toggleable: false, defaultHiddenClass: "",                      compactHidden: false },
  militarySpending:    { toggleable: true,  defaultHiddenClass: "hidden lg:table-cell",  compactHidden: false },
  killed:              { toggleable: true,  defaultHiddenClass: "hidden lg:table-cell",  compactHidden: false },
  trialRatio:          { toggleable: true,  defaultHiddenClass: "",                      compactHidden: false },
  hale:                { toggleable: true,  defaultHiddenClass: "hidden sm:table-cell",  compactHidden: false },
  lifeExpectancy:      { toggleable: true,  defaultHiddenClass: "hidden xl:table-cell",  compactHidden: true },
  medianIncome:        { toggleable: true,  defaultHiddenClass: "hidden sm:table-cell",  compactHidden: false },
  militaryPerCapitaPPP:{ toggleable: true,  defaultHiddenClass: "hidden xl:table-cell",  compactHidden: true },
  healthSpending:      { toggleable: true,  defaultHiddenClass: "hidden xl:table-cell",  compactHidden: true },
  researchRatio:       { toggleable: true,  defaultHiddenClass: "hidden md:table-cell",  compactHidden: false },
  memorialDeaths:      { toggleable: true,  defaultHiddenClass: "hidden md:table-cell",  compactHidden: true  },
};

export const GOVERNMENT_LEADERBOARD_COLUMN_ORDER: GovernmentLeaderboardSortKey[] = [
  "rank", "country", "militarySpending", "killed", "trialRatio",
  "memorialDeaths",
  "hale", "lifeExpectancy", "medianIncome", "militaryPerCapitaPPP",
  "healthSpending", "researchRatio",
];

export const GOVERNMENT_LEADERBOARD_COLUMN_META: Record<
  GovernmentLeaderboardSortKey,
  GovernmentLeaderboardColumnMeta
> = {
  country: {
    label: "Country",
    description: "Country name. Click to sort alphabetically.",
  },
  rank: {
    label: "#",
    description: "Current table rank. Clicking here sorts by the default Mil/Trials ranking.",
  },
  killed: {
    label: "Killed",
    description: "Estimated total people killed by that government's military actions over the period used in this dataset.",
  },
  hale: {
    label: "HALE",
    description: "Healthy life expectancy at birth: expected years lived in full health, not just total lifespan.",
  },
  lifeExpectancy: {
    label: "Life Exp",
    description: "Total life expectancy at birth, including years lived with illness or disability.",
  },
  medianIncome: {
    label: "Median Income",
    description: "After-tax median disposable income (PPP). What a typical citizen actually takes home after taxes and transfers.",
  },
  militaryPerCapitaPPP: {
    label: "Mil/cap PPP",
    description: "Military spending per person in PPP terms, derived as military share of GDP times GDP per capita PPP.",
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
  memorialDeaths: {
    label: "Memorial 👻",
    description:
      "Public memorials in the Invisible Graveyard attributed to this government — by death-country or by named responsible party. Click to sort.",
  },
};
