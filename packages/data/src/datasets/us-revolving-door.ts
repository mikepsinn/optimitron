/**
 * The revolving door — regulators become the regulated.
 * Source: OpenSecrets, POGO (Project on Government Oversight)
 */

export interface RevolvingDoorStat {
  metric: string;
  value: string;
  description: string;
  source: string;
  sourceUrl: string;
}

export const REVOLVING_DOOR_STATS: RevolvingDoorStat[] = [
  {
    metric: "Former Congress members now lobbying",
    value: "65%",
    description:
      "65% of retiring members of Congress become lobbyists within 2 years of leaving office. They earn 1,452% more than their congressional salary on average.",
    source: "OpenSecrets Revolving Door Data",
    sourceUrl: "https://www.opensecrets.org/revolving/",
  },
  {
    metric: "Former regulators at regulated companies",
    value: "340+",
    description:
      "Over 340 former FDA, SEC, EPA, and DOJ officials have taken positions at the companies they previously regulated (2010-2024).",
    source: "POGO Revolving Door Database",
    sourceUrl: "https://www.pogo.org/database/revolving-door",
  },
  {
    metric: "FDA-to-pharma pipeline",
    value: "3 of last 5 FDA commissioners",
    description:
      "3 of the last 5 FDA commissioners went to work for pharmaceutical companies or their boards after leaving office.",
    source: "Science Magazine / BMJ Investigation",
    sourceUrl: "https://www.bmj.com/content/378/bmj.o1538",
  },
  {
    metric: "Pentagon-to-defense contractor pipeline",
    value: "645 former officials",
    description:
      "645 former senior Pentagon officials became executives, consultants, or board members at defense contractors (2008-2018). The average 4-star general earns $500K-$2M/yr from defense contractors.",
    source: "POGO Pentagon Revolving Door Report",
    sourceUrl: "https://www.pogo.org/analysis/brass-parachutes",
  },
  {
    metric: "Lobbying salary premium",
    value: "1,452%",
    description:
      "Former members of Congress earn an average of 1,452% more as lobbyists than their congressional salary ($174K \u2192 $2.7M).",
    source: "LegiStorm / OpenSecrets",
    sourceUrl: "https://www.opensecrets.org/revolving/departing.php",
  },
];
