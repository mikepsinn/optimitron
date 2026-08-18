export interface FoundationContractorTarget {
  id: string;
  name: string;
  ticker: string;
  lobbyingWeight: number;
}

export const FOUNDATION_CONTRACTOR_TARGETS: readonly FoundationContractorTarget[] =
  [
    {
      id: "lockheed-martin",
      name: "Lockheed Martin",
      ticker: "LMT",
      lobbyingWeight: 10,
    },
    {
      id: "rtx",
      name: "RTX",
      ticker: "RTX",
      lobbyingWeight: 9,
    },
    {
      id: "northrop-grumman",
      name: "Northrop Grumman",
      ticker: "NOC",
      lobbyingWeight: 8,
    },
    {
      id: "general-dynamics",
      name: "General Dynamics",
      ticker: "GD",
      lobbyingWeight: 8,
    },
    {
      id: "boeing",
      name: "Boeing",
      ticker: "BA",
      lobbyingWeight: 7,
    },
    {
      id: "l3harris",
      name: "L3Harris",
      ticker: "LHX",
      lobbyingWeight: 5,
    },
    {
      id: "huntington-ingalls",
      name: "Huntington Ingalls",
      ticker: "HII",
      lobbyingWeight: 4,
    },
    {
      id: "leidos",
      name: "Leidos",
      ticker: "LDOS",
      lobbyingWeight: 4,
    },
  ] as const;
