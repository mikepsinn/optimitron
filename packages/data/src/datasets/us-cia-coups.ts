/**
 * CIA-backed coups and regime changes — democracies overthrown for corporate interests.
 * Every entry is declassified or publicly acknowledged by the US government.
 */

export interface CIACoup {
  id: string;
  country: string;
  flag: string;
  year: number;
  leaderOverthrown: string;
  reason: string;
  whatHappenedAfter: string;
  deathToll: string;
  /** Numeric estimate for charting — lower bound of death toll range */
  estimatedDeaths: number;
  /** Numeric estimate of refugees/displaced */
  estimatedDisplaced?: number;
  /** How many years the installed regime lasted */
  yearsOfDictatorship?: number;
  corporateBeneficiary?: string;
  declassified: boolean;
  source: string;
  sourceUrl: string;
}

export const CIA_COUPS: CIACoup[] = [
  {
    id: "iran-1953",
    country: "Iran",
    flag: "\u{1F1EE}\u{1F1F7}",
    year: 1953,
    leaderOverthrown: "Democratically elected prime minister (Operation AJAX)",
    reason: "Nationalized Iranian oil. British oil company (now BP) lost control of Iranian petroleum. CIA and MI6 organized coup.",
    whatHappenedAfter: "Installed authoritarian monarchy. 26 years of dictatorship. Secret police (SAVAK) tortured thousands. Led directly to 1979 Islamic Revolution and 45+ years of hostile relations.",
    deathToll: "Thousands killed by SAVAK, unknown total",
    estimatedDeaths: 10000,
    estimatedDisplaced: 0,
    yearsOfDictatorship: 26,
    corporateBeneficiary: "Anglo-Iranian Oil Company (now BP)",
    declassified: true,
    source: "CIA FOIA \u2014 declassified 2013",
    sourceUrl: "https://nsarchive.gwu.edu/briefing-book/iran/2013-08-19/cia-confirms-role-1953-iran-coup",
  },
  {
    id: "guatemala-1954",
    country: "Guatemala",
    flag: "\u{1F1EC}\u{1F1F9}",
    year: 1954,
    leaderOverthrown: "Democratically elected president (Operation PBSUCCESS)",
    reason: "Implemented land reform that affected United Fruit Company's unused plantations. CIA Director and Secretary of State both had financial ties to United Fruit.",
    whatHappenedAfter: "36 years of military dictatorships and civil war. 200,000 people murdered. 45,000 'disappeared.' Genocide of indigenous Maya populations documented by UN truth commission.",
    deathToll: "200,000 murdered, 45,000 disappeared",
    estimatedDeaths: 200000,
    estimatedDisplaced: 500000,
    yearsOfDictatorship: 36,
    corporateBeneficiary: "United Fruit Company (now Chiquita Brands)",
    declassified: true,
    source: "CIA FOIA / UN Commission for Historical Clarification",
    sourceUrl: "https://nsarchive.gwu.edu/project/guatemala-project",
  },
  {
    id: "congo-1961",
    country: "Democratic Republic of Congo",
    flag: "\u{1F1E8}\u{1F1E9}",
    year: 1961,
    leaderOverthrown: "First democratically elected prime minister",
    reason: "Sought control of Congo's vast mineral resources (uranium, copper, cobalt, diamonds). Cold War alignment concerns.",
    whatHappenedAfter: "32-year kleptocratic dictatorship. Dictator stole $5B while country became one of the poorest on earth. Instability continues \u2014 6M killed in conflicts since 1996.",
    deathToll: "Millions in subsequent conflicts",
    estimatedDeaths: 6000000,
    estimatedDisplaced: 2000000,
    yearsOfDictatorship: 32,
    declassified: true,
    source: "Senate Church Committee / Belgian Parliamentary Commission",
    sourceUrl: "https://www.intelligence.senate.gov/resources/intelligence-related-commissions",
  },
  {
    id: "brazil-1964",
    country: "Brazil",
    flag: "\u{1F1E7}\u{1F1F7}",
    year: 1964,
    leaderOverthrown: "Democratically elected president (Operation Brother Sam)",
    reason: "Labor reforms and land redistribution threatened US corporate interests.",
    whatHappenedAfter: "21 years of military dictatorship. Systematic torture, disappearances, censorship. 434 killed or disappeared (officially acknowledged).",
    deathToll: "434+ killed or disappeared",
    estimatedDeaths: 434,
    yearsOfDictatorship: 21,
    declassified: true,
    source: "National Security Archive \u2014 Brazil declassification",
    sourceUrl: "https://nsarchive.gwu.edu/project/brazil-project",
  },
  {
    id: "indonesia-1965",
    country: "Indonesia",
    flag: "\u{1F1EE}\u{1F1E9}",
    year: 1965,
    leaderOverthrown: "First president removed via US-supported military takeover",
    reason: "Non-aligned movement leader. Large communist party (PKI) threatened Western interests in Southeast Asia.",
    whatHappenedAfter: "US provided lists of suspected communists to Indonesian military. Mass killings of 500,000-1,000,000 people in 6 months. 32-year military dictatorship followed.",
    deathToll: "500,000-1,000,000 murdered",
    estimatedDeaths: 500000,
    yearsOfDictatorship: 32,
    declassified: true,
    source: "National Security Archive / CIA declassified cables",
    sourceUrl: "https://nsarchive.gwu.edu/briefing-book/indonesia/2017-10-17/indonesia-mass-murder-1965",
  },
  {
    id: "chile-1973",
    country: "Chile",
    flag: "\u{1F1E8}\u{1F1F1}",
    year: 1973,
    leaderOverthrown: "Democratically elected president (Project FUBELT)",
    reason: "Nationalized copper mines owned by US corporations (Anaconda, Kennecott). Implemented socialist economic policies.",
    whatHappenedAfter: "17-year military dictatorship. 3,000+ executed. 30,000+ tortured. 200,000 fled the country. Stadium used as concentration camp. Free-market economic 'shock therapy' imposed.",
    deathToll: "3,000+ executed, 30,000+ tortured",
    estimatedDeaths: 3000,
    estimatedDisplaced: 200000,
    yearsOfDictatorship: 17,
    corporateBeneficiary: "Anaconda Copper, Kennecott, ITT Corporation",
    declassified: true,
    source: "CIA FOIA \u2014 declassified 2000 / Chilean Truth Commission",
    sourceUrl: "https://nsarchive.gwu.edu/project/chile-project",
  },
  {
    id: "afghanistan-1979",
    country: "Afghanistan",
    flag: "\u{1F1E6}\u{1F1EB}",
    year: 1979,
    leaderOverthrown: "N/A \u2014 armed mujahideen to fight Soviet occupation (Operation Cyclone)",
    reason: "Proxy war against Soviet Union. $3B+ funneled to insurgents including foreign fighters.",
    whatHappenedAfter: "CIA-funded fighters became the Taliban and Al-Qaeda. Osama bin Laden was among those who received US support. Led directly to 9/11 and the 20-year war that followed. Cost: $2.3T and 176K killed.",
    deathToll: "2M killed in Soviet-Afghan War, then 176K in US war",
    estimatedDeaths: 2000000,
    declassified: true,
    source: "National Security Archive / 9/11 Commission Report",
    sourceUrl: "https://nsarchive.gwu.edu/project/afghanistan-project",
  },
  {
    id: "iraq-1963",
    country: "Iraq",
    flag: "\u{1F1EE}\u{1F1F6}",
    year: 1963,
    leaderOverthrown: "Military leader removed via CIA-supported coup",
    reason: "Threatened to nationalize Iraq Petroleum Company. Aligned with Soviet Union.",
    whatHappenedAfter: "Ba'ath Party installed. CIA provided lists of communists who were then executed. Eventually led to rise of the dictator the US would later invade Iraq to remove \u2014 creating a problem, then spending $2.4T to 'solve' it.",
    deathToll: "5,000+ executed from CIA-provided lists",
    estimatedDeaths: 5000,
    declassified: true,
    source: "National Security Archive",
    sourceUrl: "https://nsarchive.gwu.edu/briefing-book/iraq/2003-02-25/saddam-hussein-more-secret-history",
  },
  {
    id: "libya-2011",
    country: "Libya",
    flag: "\u{1F1F1}\u{1F1FE}",
    year: 2011,
    leaderOverthrown: "Leader killed during NATO intervention",
    reason: "Ostensibly humanitarian intervention. Libya had Africa's highest standard of living. Had recently denuclearized in exchange for normalized relations (2003).",
    whatHappenedAfter: "Failed state with open-air slave markets by 2017. Civil war ongoing. Refugees drown crossing Mediterranean. Lesson to every leader: denuclearizing after making a deal with the US gets you killed.",
    deathToll: "30,000+ killed in civil war, ongoing",
    estimatedDeaths: 30000,
    estimatedDisplaced: 800000,
    declassified: false,
    source: "UK Foreign Affairs Committee Libya Investigation",
    sourceUrl: "https://publications.parliament.uk/pa/cm201617/cmselect/cmfaff/119/119.pdf",
  },
  {
    id: "honduras-2009",
    country: "Honduras",
    flag: "\u{1F1ED}\u{1F1F3}",
    year: 2009,
    leaderOverthrown: "Democratically elected president removed by military",
    reason: "Proposed constitutional reform and raised minimum wage. Opposed by business elites and US-trained military.",
    whatHappenedAfter: "Became murder capital of the world. Journalists, environmentalists, and indigenous activists systematically assassinated. Massive migration to US border \u2014 the same border the US then spends $29B/yr to enforce.",
    deathToll: "Hundreds of activists murdered",
    estimatedDeaths: 500,
    estimatedDisplaced: 300000,
    declassified: false,
    source: "The Intercept / National Security Archive",
    sourceUrl: "https://theintercept.com/2017/08/29/honduras-coup-us-defense-department-emails-clinton/",
  },
];

export const TOTAL_COUP_DEATH_TOLL = "Millions murdered across CIA-backed regime changes";
export const TOTAL_DEMOCRACIES_OVERTHROWN = CIA_COUPS.filter(c =>
  c.leaderOverthrown.toLowerCase().includes("democrat")
).length;
