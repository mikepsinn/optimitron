/**
 * Leader activity dataset for the public employee review ledger.
 *
 * Each activity becomes a VERIFIED task assigned to the leader's Person record
 * with impact metrics reflecting the actual cost/harm/benefit.
 *
 * Three tiers:
 *   Tier 1 — Pure cost/harm: negative expectedEconomicValueUsdBase
 *   Tier 2 — Measured outcomes: positive expectedEconomicValueUsdBase from real data
 *   Tier 3 — Unmeasured spending: null expectedEconomicValueUsdBase, only cost known
 */

export type ActivityImpactTier = "harm" | "measured-benefit" | "unmeasured";

export interface LeaderActivityRecord {
  /** ISO-2 country code matching TreatySignerSlot.countryCode */
  countryCode: string;
  /** URL-safe slug, unique within country (produces taskKey: accountability:{cc}:{slug}) */
  activitySlug: string;
  activityType: "leisure" | "military" | "spending" | "ceremony" | "legislation" | "other";
  impactTier: ActivityImpactTier;
  title: string;
  /** Factual, sourced description */
  description: string;
  /** Wishonia voice editorial */
  wishoniaComment: string;
  /** What the money/time could have accomplished instead */
  alternativeUse: string;
  /** ISO date string of when this happened or was completed */
  completedAt: string;
  /** Direct taxpayer cost (always positive — the sign is determined by impactTier) */
  taxpayerCostUsd: number | null;
  /** Lives lost or harmed (positive number — negated in impact frame for Tier 1) */
  casualtiesEstimate: number | null;
  /** DALYs caused (positive number — negated in impact frame for Tier 1) */
  dalysInflicted: number | null;
  /** For Tier 2 only: measured positive economic value produced */
  measuredEconomicValueUsd: number | null;
  /** For Tier 2 only: measured lives saved */
  measuredLivesSaved: number | null;
  /** For Tier 3: what politicians claimed it would do */
  claimedBenefit: string | null;
  /** For Tier 3: measured outcome if any, otherwise null */
  measuredOutcome: string | null;
  /** For Tier 3: cost efficiency comparison */
  costEfficiencyNote: string | null;
  /** Primary citation URL */
  sourceUrl: string;
  /** Additional citations */
  additionalSourceUrls: string[];
}

export type LeaderActivityDraft = LeaderActivityRecord;

// ---------------------------------------------------------------------------
// Activity Data
// ---------------------------------------------------------------------------

export const LEADER_ACTIVITIES: LeaderActivityRecord[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // UNITED STATES (US)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "US",
    activitySlug: "golf-cumulative-term-2",
    activityType: "leisure",
    impactTier: "harm",
    title: "Spent ~$300M on presidential golf trips (second term)",
    description:
      "The President has taken over 80 golf trips since January 2025, primarily to Mar-a-Lago and Trump-branded courses. Each trip requires Air Force One transport, Secret Service advance teams, Coast Guard maritime security, and local law enforcement coordination. GAO estimates put the per-trip cost at $3-4M.",
    wishoniaComment:
      "Your employee spent three hundred million dollars hitting a small ball into a slightly smaller hole. Meanwhile, signing a piece of paper that redirects 1% of military spending to clinical trials takes thirty seconds and costs nothing. But sure, the golf is probably more important.",
    alternativeUse:
      "Could have funded 12,000 phase III clinical trials at $25K each, or provided a year of healthcare for 60,000 uninsured Americans.",
    completedAt: "2026-04-01",
    taxpayerCostUsd: 300_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: null,
    measuredOutcome: null,
    costEfficiencyNote: null,
    sourceUrl: "https://trumpgolfcount.com/",
    additionalSourceUrls: [
      "https://www.gao.gov/products/gao-19-178",
    ],
  },
  {
    countryCode: "US",
    activitySlug: "fy2025-defense-budget",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Signed $997B FY2025 defense budget",
    description:
      "Signed the National Defense Authorization Act for FY2025, authorizing $997 billion in military spending. This represents 36.7% of global military expenditure. The authorization covers weapons procurement, force structure, military construction, and overseas operations. No corresponding authorization for redirecting 1% to pragmatic clinical trials.",
    wishoniaComment:
      "Nine hundred and ninety-seven billion dollars for the department that kills people. Zero dollars redirected to the department that could save them. Your employee had one job. Well, technically two jobs — but he only did the one that involves explosions.",
    alternativeUse:
      "1% of $997B = $9.97B/year. The entire NIH budget is $47B. This single redirect would increase clinical trial funding by 21% overnight.",
    completedAt: "2024-12-23",
    taxpayerCostUsd: 997_000_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "National security and military readiness",
    measuredOutcome: null,
    costEfficiencyNote:
      "The US spends more on military than the next 10 countries combined. Life expectancy has declined for 3 consecutive years.",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/8070",
    additionalSourceUrls: [
      "https://www.sipri.org/sites/default/files/2025-04/2504_fs_milex_2024.pdf",
    ],
  },
  {
    countryCode: "US",
    activitySlug: "iran-strikes-2025",
    activityType: "military",
    impactTier: "harm",
    title: "Authorized airstrikes on Iran (2025)",
    description:
      "Authorized a series of military strikes against Iranian nuclear facilities and military targets in June 2025. The operation involved cruise missiles, stealth bombers, and naval assets. Estimated direct casualties range from 200-500. Regional destabilization costs and long-term health impacts from depleted uranium munitions are not included in casualty estimates.",
    wishoniaComment:
      "Your employee spent several billion dollars making a country he has never visited slightly more radioactive. The 1% Treaty would have cost him thirty seconds and a pen. But I suppose pens are harder to aim.",
    alternativeUse:
      "The operational cost of one cruise missile ($2M) could fund 80 clinical trials. The full operation cost could have funded pragmatic trials for every major disease in the Middle East.",
    completedAt: "2025-06-15",
    taxpayerCostUsd: 5_000_000_000,
    casualtiesEstimate: 350,
    dalysInflicted: 15_000,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: null,
    measuredOutcome: null,
    costEfficiencyNote: null,
    sourceUrl: "https://www.defense.gov/",
    additionalSourceUrls: [],
  },
  {
    countryCode: "US",
    activitySlug: "operation-warp-speed",
    activityType: "spending",
    impactTier: "measured-benefit",
    title: "Operation Warp Speed delivered COVID vaccines",
    description:
      "Operation Warp Speed, initiated in 2020 and continuing through distribution, invested $18B in accelerated COVID-19 vaccine development and distribution. The program funded multiple vaccine candidates simultaneously and pre-purchased doses. Peer-reviewed estimates suggest the US vaccination campaign prevented 2-3 million deaths in the first two years.",
    wishoniaComment:
      "See? This is what happens when your government accidentally does its job. $18 billion spent, 2.4 million lives saved. That is a cost of $7,500 per life. Your military spends $2 million per cruise missile. I will leave the arithmetic as an exercise for the reader.",
    alternativeUse: "N/A — this was the alternative use. This IS what the money should look like.",
    completedAt: "2021-12-31",
    taxpayerCostUsd: 18_000_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: 4_800_000_000_000,
    measuredLivesSaved: 2_400_000,
    claimedBenefit: null,
    measuredOutcome: "~2.4M US deaths prevented (Lancet estimate). $4.8T in economic value from avoided mortality and reduced healthcare burden.",
    costEfficiencyNote:
      "$7,500 per life saved. Compare: one F-35 costs $80M and saves zero lives.",
    sourceUrl: "https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(22)00320-6/fulltext",
    additionalSourceUrls: [
      "https://www.gao.gov/products/gao-21-319",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHINA (CN)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "CN",
    activitySlug: "fy2024-military-budget",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Approved $314B military budget for 2024",
    description:
      "The National People's Congress approved a defense budget of approximately $314 billion for 2024, a 7.2% increase from the prior year. Independent estimates (SIPRI, IISS) suggest actual spending may be 40-50% higher when off-budget items are included. The budget funds the largest navy in the world by vessel count, nuclear modernization, and military AI development.",
    wishoniaComment:
      "Three hundred and fourteen billion dollars on things that sink, fly, and explode. Funny how there is always enough money for a new aircraft carrier but never enough for a new hospital. On my planet, we stopped building weapons in year twelve. We are now on year 4,237.",
    alternativeUse:
      "1% redirect ($3.14B/year) would exceed China's entire rare disease research budget and fund pragmatic trials for the diseases killing 10 million Chinese citizens annually.",
    completedAt: "2024-03-11",
    taxpayerCostUsd: 314_000_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "National sovereignty and territorial integrity",
    measuredOutcome: null,
    costEfficiencyNote:
      "China's military spending has grown 600% since 2000 while rural healthcare coverage gaps persist for 200M+ citizens.",
    sourceUrl: "https://www.sipri.org/databases/milex",
    additionalSourceUrls: [],
  },
  {
    countryCode: "CN",
    activitySlug: "south-china-sea-militarization",
    activityType: "military",
    impactTier: "harm",
    title: "Continued South China Sea island militarization",
    description:
      "Ongoing construction and militarization of artificial islands in the South China Sea, including runway extensions, radar installations, and anti-ship missile deployments. The program has cost an estimated $30-50B since 2013 and has escalated regional tensions, disrupted fishing communities affecting millions of livelihoods, and diverted resources from domestic healthcare.",
    wishoniaComment:
      "Your employee spent forty billion dollars building military bases on artificial islands in the middle of the ocean. To be fair, the fish living there probably feel very secure now.",
    alternativeUse:
      "Could have funded universal rural healthcare coverage for 200 million Chinese citizens for three years.",
    completedAt: "2025-12-31",
    taxpayerCostUsd: 40_000_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: null,
    measuredOutcome: null,
    costEfficiencyNote: null,
    sourceUrl: "https://amti.csis.org/",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RUSSIA (RU)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "RU",
    activitySlug: "ukraine-invasion-ongoing",
    activityType: "military",
    impactTier: "harm",
    title: "Continued invasion of Ukraine (2022-present)",
    description:
      "The full-scale invasion of Ukraine, initiated February 2022, has resulted in an estimated 300,000+ military casualties on the Russian side alone, 10,000+ Ukrainian civilian deaths (UN-verified), millions of displaced persons, and an estimated $1 trillion in total economic damage. Russia's direct military expenditure on the war exceeds $200B.",
    wishoniaComment:
      "Three hundred thousand of your employee's own citizens sent to die in a neighbouring country. Ten thousand civilians killed. One trillion dollars in damage. Time to sign the 1% Treaty: thirty seconds. But I suppose that would have been too easy, and your species does seem to prefer the hard way.",
    alternativeUse:
      "The war's cost could have funded universal healthcare for all of Russia for 15 years, or eradicated malaria globally three times over.",
    completedAt: "2026-04-01",
    taxpayerCostUsd: 200_000_000_000,
    casualtiesEstimate: 310_000,
    dalysInflicted: 12_000_000,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: null,
    measuredOutcome: null,
    costEfficiencyNote: null,
    sourceUrl: "https://www.ohchr.org/en/news/2024/02/ukraine-civilian-casualty-update",
    additionalSourceUrls: [
      "https://www.iiss.org/",
    ],
  },
  {
    countryCode: "RU",
    activitySlug: "fy2024-military-budget",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Approved $149B military budget for 2024",
    description:
      "Russia's 2024 military budget reached approximately $149 billion (SIPRI estimate), representing roughly 6% of GDP — the highest share since the Soviet era. The budget has tripled since 2021, driven by the Ukraine war. Meanwhile, Russian healthcare spending per capita remains below the OECD average and life expectancy for Russian men is 66 years.",
    wishoniaComment:
      "Your employee tripled the military budget while Russian men die at sixty-six. On my planet, a leader who spends three times more on killing and watches life expectancy drop would be considered defective. But then, on my planet, we test our leaders before installing them.",
    alternativeUse:
      "1% redirect ($1.49B) could fund pragmatic clinical trials for the cardiovascular diseases killing 1.2 million Russians annually.",
    completedAt: "2024-01-01",
    taxpayerCostUsd: 149_000_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "Defense against NATO expansion",
    measuredOutcome: null,
    costEfficiencyNote:
      "Russia spends 6% of GDP on military, 3.5% on healthcare. Male life expectancy: 66 years (vs 78 OECD average).",
    sourceUrl: "https://www.sipri.org/databases/milex",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GERMANY (DE)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "DE",
    activitySlug: "zeitenwende-100b-fund",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Created $100B special military fund (Zeitenwende)",
    description:
      "In response to the Ukraine invasion, Germany created a special fund of 100 billion euros ($108B) for military modernization. The fund is financed through new government debt. Procurement has been slow — by mid-2025, less than 40% of the fund had been committed to contracts, and delivery timelines stretch to 2030+.",
    wishoniaComment:
      "Your employee created a hundred-billion-dollar military shopping fund and then forgot to buy anything with it. Sixty billion dollars is sitting in an account doing nothing while German hospitals close due to underfunding. Your species has a remarkable talent for creating urgency around things that kill people and apathy around things that save them.",
    alternativeUse:
      "The uncommitted $60B+ could fund Germany's entire hospital modernization backlog, which the German Hospital Federation estimates at $50B.",
    completedAt: "2022-06-03",
    taxpayerCostUsd: 108_000_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "Modernize the Bundeswehr to meet NATO obligations",
    measuredOutcome: "Less than 40% committed to contracts by mid-2025. Major systems delivery expected 2030+.",
    costEfficiencyNote:
      "100B created, <40% spent, 0% redirected to clinical trials. Meanwhile 68 German hospitals closed in 2024 due to underfunding.",
    sourceUrl: "https://www.bmvg.de/en/topics/security-policy/bundeswehr-special-fund",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIA (IN)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "IN",
    activitySlug: "fy2025-defense-budget",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Approved $86.1B defense budget for FY2025",
    description:
      "India's defense budget for FY2025 reached $86.1 billion, a 4.7% increase. India is now the world's 4th largest military spender. The budget prioritizes fighter jet procurement, naval expansion, and border infrastructure. India's public healthcare spending remains at 1.3% of GDP — among the lowest for major economies.",
    wishoniaComment:
      "Eighty-six billion on the military. One-point-three percent of GDP on healthcare. Your employee represents a country where 55 million people fall into poverty each year from medical bills, and his response was to buy more fighter jets. The math is not mathing, as your children say.",
    alternativeUse:
      "1% redirect ($861M) could double India's annual expenditure on the National Health Mission's free drugs program, which currently covers 500M+ people.",
    completedAt: "2024-07-23",
    taxpayerCostUsd: 86_100_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "National security and border defense",
    measuredOutcome: null,
    costEfficiencyNote:
      "India: $86B on military, $24B on public healthcare. 55M people/year pushed into poverty by medical costs.",
    sourceUrl: "https://www.sipri.org/databases/milex",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UNITED KINGDOM (GB)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "GB",
    activitySlug: "fy2025-defense-budget",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Approved $81.8B defense budget for 2024-25",
    description:
      "The UK defense budget reached $81.8 billion, with a commitment to increase to 2.5% of GDP. This comes while the NHS faces its worst staffing crisis in history, with 7.6 million people on waiting lists for treatment — the highest ever recorded.",
    wishoniaComment:
      "Seven-point-six million people on NHS waiting lists. Eighty-two billion on the military. Your employee's voters are literally queuing to die while he buys submarines. It is like watching someone bleed out in a hospital car park while the hospital board votes to build a nicer car park.",
    alternativeUse:
      "1% redirect ($818M) could hire 16,000 NHS nurses at average salary, reducing waiting lists by an estimated 1.2M patients/year.",
    completedAt: "2024-10-30",
    taxpayerCostUsd: 81_800_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "NATO commitments and nuclear deterrent renewal",
    measuredOutcome: null,
    costEfficiencyNote:
      "UK: 7.6M on NHS waiting lists (record high). $82B on defense. Waiting list was 4.4M pre-COVID.",
    sourceUrl: "https://www.sipri.org/databases/milex",
    additionalSourceUrls: [
      "https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SAUDI ARABIA (SA)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "SA",
    activitySlug: "yemen-war-continued",
    activityType: "military",
    impactTier: "harm",
    title: "Continued military intervention in Yemen",
    description:
      "Saudi Arabia's military intervention in Yemen, ongoing since 2015, has contributed to what the UN calls the world's worst humanitarian crisis. The conflict has killed an estimated 377,000 people (including 150,000+ from indirect causes like starvation and disease), displaced 4 million, and cost Saudi Arabia an estimated $100B+.",
    wishoniaComment:
      "Three hundred and seventy-seven thousand dead. Four million displaced. A hundred billion dollars spent. And your employee still has not signed a piece of paper that costs nothing. The piece of paper would redirect one percent. One percent. Of the money currently being used to create the worst humanitarian crisis on the planet.",
    alternativeUse:
      "The war's cost could have made Yemen the best-funded healthcare system in the Middle East for 50 years.",
    completedAt: "2026-01-01",
    taxpayerCostUsd: 100_000_000_000,
    casualtiesEstimate: 377_000,
    dalysInflicted: 20_000_000,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: null,
    measuredOutcome: null,
    costEfficiencyNote: null,
    sourceUrl: "https://www.undp.org/yemen",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UKRAINE (UA)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "UA",
    activitySlug: "fy2024-defense-budget",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Allocated $64.7B to defense (2024, wartime)",
    description:
      "Ukraine's defense spending reached $64.7B in 2024, consuming over 50% of GDP — an existential necessity given the ongoing Russian invasion. This is included for completeness and context, not as criticism. Ukraine is defending its existence.",
    wishoniaComment:
      "I will note that spending sixty-five billion on defense when someone is actively invading you is the one scenario where I cannot fault the math. Your employee's situation is the direct result of another employee's catastrophic performance review. See: Russia.",
    alternativeUse:
      "In a world without the invasion, this money would have funded Ukraine's entire healthcare, education, and infrastructure budgets combined.",
    completedAt: "2024-12-31",
    taxpayerCostUsd: 64_700_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "National survival against Russian invasion",
    measuredOutcome: null,
    costEfficiencyNote:
      "Ukraine spending >50% of GDP on defense is a direct consequence of Russia's invasion. Context matters.",
    sourceUrl: "https://www.sipri.org/databases/milex",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FRANCE (FR)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "FR",
    activitySlug: "pension-reform-cost",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Forced through pension reform over mass protests",
    description:
      "President Macron used Article 49.3 to bypass parliament and force through pension reform raising the retirement age from 62 to 64. The reform triggered the largest protests in France in decades (3.5 million people), cost an estimated $3-5B in economic disruption from strikes, and required 13,000 police deployed per protest day.",
    wishoniaComment:
      "Your employee spent five billion dollars on riot police to force three-point-five million of his own citizens to work two extra years. The 1% Treaty would redirect six hundred million dollars per year to clinical trials. He chose the riots.",
    alternativeUse:
      "The $5B in strike/policing costs could have funded France's entire annual cancer research budget twice over.",
    completedAt: "2023-04-14",
    taxpayerCostUsd: 5_000_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "Long-term pension system sustainability",
    measuredOutcome: null,
    costEfficiencyNote:
      "Reform saves est. $18B/year by 2030. Cost of forcing it: $5B+ in economic disruption, record-low public trust in government.",
    sourceUrl: "https://www.reuters.com/world/europe/french-government-survives-no-confidence-vote-pension-reform-2023-03-20/",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // JAPAN (JP)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "JP",
    activitySlug: "defense-budget-doubling",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Committed to doubling defense budget to 2% GDP ($110B by 2027)",
    description:
      "Japan committed to doubling its defense spending to 2% of GDP by 2027, reaching approximately $110B — the largest military buildup since WWII. The 2024 budget reached $55.3B. This occurs while Japan's healthcare system faces critical strain from the world's oldest population (29% over 65).",
    wishoniaComment:
      "The country with the oldest population on Earth decided what it really needs is more missile defense systems. Twenty-nine percent of your citizens are over sixty-five. They do not need missiles. They need nurses.",
    alternativeUse:
      "1% of the doubled budget ($1.1B) would fund Japan's entire dementia research program for 10 years.",
    completedAt: "2024-12-20",
    taxpayerCostUsd: 55_300_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "Regional security against China and North Korea threats",
    measuredOutcome: null,
    costEfficiencyNote:
      "Japan: oldest population in the world, doubling military budget. Nursing home wait lists: 290,000 people.",
    sourceUrl: "https://www.sipri.org/databases/milex",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH KOREA (KR)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "KR",
    activitySlug: "fy2024-defense-budget",
    activityType: "legislation",
    impactTier: "unmeasured",
    title: "Approved $47.6B defense budget for 2024",
    description:
      "South Korea's defense budget reached $47.6B for 2024, focused on missile defense, K-9 howitzer production, and KF-21 fighter jet development. This occurs while South Korea has the lowest birth rate in the world (0.72) and an accelerating demographic crisis that threatens economic collapse within decades.",
    wishoniaComment:
      "The country with the lowest birth rate on the planet is building fighter jets instead of childcare centers. Your species will go extinct not from war but from forgetting to have children because you spent all the money on weapons. Darwin would be fascinated.",
    alternativeUse:
      "1% redirect ($476M) could triple South Korea's annual fertility/childcare support budget.",
    completedAt: "2024-01-01",
    taxpayerCostUsd: 47_600_000_000,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "Deterrence against North Korea",
    measuredOutcome: null,
    costEfficiencyNote:
      "South Korea: birth rate 0.72 (world's lowest), $47.6B on defense, $16B on childcare/family support.",
    sourceUrl: "https://www.sipri.org/databases/milex",
    additionalSourceUrls: [],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ISRAEL (IL)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    countryCode: "IL",
    activitySlug: "gaza-operations-2024",
    activityType: "military",
    impactTier: "harm",
    title: "Military operations in Gaza (2023-2025)",
    description:
      "Following the October 7, 2023 Hamas attack (1,200 killed), Israel launched large-scale military operations in Gaza. As of early 2026, the Gaza Health Ministry and UN agencies report over 40,000 Palestinian deaths, including 15,000+ children. The operations have cost Israel an estimated $60-80B and displaced 1.9 million people — nearly the entire population.",
    wishoniaComment:
      "Forty thousand dead, including fifteen thousand children. Sixty billion dollars spent. One-point-nine million displaced. Every number in that sentence is a person your species failed. The 1% Treaty costs nothing and kills no one. I understand that sounds suspicious to a civilisation that has spent ten thousand years believing expensive solutions that kill people are more serious than cheap ones that save them.",
    alternativeUse:
      "The $60-80B operational cost could have funded the entire UNRWA budget for 40 years.",
    completedAt: "2026-01-01",
    taxpayerCostUsd: 70_000_000_000,
    casualtiesEstimate: 40_000,
    dalysInflicted: 3_000_000,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: null,
    measuredOutcome: null,
    costEfficiencyNote: null,
    sourceUrl: "https://www.ochaopt.org/",
    additionalSourceUrls: [
      "https://www.un.org/unispal/",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Remaining leaders get military budget entries (Tier 3: unmeasured)
  // These follow the same pattern — cost known, benefit unmeasured.
  // ═══════════════════════════════════════════════════════════════════════════
  ...([
    { cc: "PL", name: "Poland", budget: 38_000_000_000, leader: "Prime Minister of Poland", note: "Poland tripled military spending since 2020, now at 4.2% GDP — highest in NATO. Healthcare system ranked 32nd in Europe.", date: "2024-01-01" },
    { cc: "IT", name: "Italy", budget: 38_000_000_000, leader: "Prime Minister of Italy", note: "Italy spends $38B on defense while the national health service faces a $15B funding gap and 20,000 doctor shortage.", date: "2024-01-01" },
    { cc: "AU", name: "Australia", budget: 33_800_000_000, leader: "Prime Minister of Australia", note: "AUKUS submarine deal: $368B over 30 years. Meanwhile, Indigenous Australians have 8 years shorter life expectancy.", date: "2024-01-01" },
    { cc: "CA", name: "Canada", budget: 29_300_000_000, leader: "Prime Minister of Canada", note: "Canada pledged to reach 2% GDP on defense ($50B+). Current wait time for specialist care: 27.7 weeks (record high).", date: "2024-01-01" },
    { cc: "TR", name: "Türkiye", budget: 25_000_000_000, leader: "President of Türkiye", note: "Türkiye spends $25B on military while inflation hit 85% in 2022 and healthcare workers emigrate in record numbers.", date: "2024-01-01" },
    { cc: "ES", name: "Spain", budget: 24_600_000_000, leader: "Prime Minister of Spain", note: "Spain's defense budget rose 26% in 2023. Mental health wait times: 3-6 months. Psychiatrist ratio: half the EU average.", date: "2024-01-01" },
    { cc: "NL", name: "Netherlands", budget: 23_200_000_000, leader: "Prime Minister of the Netherlands", note: "Netherlands defense budget grew 14% in 2024. 10,000+ nursing home beds eliminated since 2015 due to austerity.", date: "2024-01-01" },
    { cc: "DZ", name: "Algeria", budget: 21_800_000_000, leader: "President of Algeria", note: "Algeria: $21.8B on military (largest in Africa). Youth unemployment: 29.1%. Public hospital occupancy: 150%+ in major cities.", date: "2024-01-01" },
  ] as const).map((entry) => ({
    countryCode: entry.cc,
    activitySlug: "fy2024-military-budget",
    activityType: "legislation" as const,
    impactTier: "unmeasured" as const,
    title: `Approved $${Math.round(entry.budget / 1_000_000_000)}B defense budget for 2024`,
    description: `${entry.name}'s defense budget reached $${(entry.budget / 1_000_000_000).toFixed(1)}B in 2024. ${entry.note}`,
    wishoniaComment: `Your employee approved ${(entry.budget / 1_000_000_000).toFixed(0)} billion dollars for the military. The 1% Treaty would redirect ${(entry.budget * 0.01 / 1_000_000).toFixed(0)} million to pragmatic clinical trials. Thirty seconds. One signature. Still waiting.`,
    alternativeUse: `1% redirect ($${(entry.budget * 0.01 / 1_000_000).toFixed(0)}M/year) into clinical trials for diseases most affecting ${entry.name}'s population.`,
    completedAt: entry.date,
    taxpayerCostUsd: entry.budget,
    casualtiesEstimate: null,
    dalysInflicted: null,
    measuredEconomicValueUsd: null,
    measuredLivesSaved: null,
    claimedBenefit: "National security",
    measuredOutcome: null,
    costEfficiencyNote: entry.note,
    sourceUrl: "https://www.sipri.org/databases/milex",
    additionalSourceUrls: [],
  })),
];
