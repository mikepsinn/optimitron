/**
 * Modular demo segment library + named playlists.
 *
 * Each segment is a standalone 30-90s narrated piece covering one concept.
 * Playlists compose segments into different video outputs:
 *   - hackathon (3 min)
 *   - full-demo (7-8 min)
 *   - investor-pitch (5 min)
 *   - youtube-[feature] (1-2 min each)
 *   - social-[hook] (30-60s each)
 *
 * The /demo page takes ?playlist=hackathon to select which version to play.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { BrutalCardBgColor } from "@/components/ui/brutal-card";
import { fmtParam } from "@/lib/format-parameter";
import {
  GLOBAL_DISEASE_DEATHS_DAILY,
  MILITARY_VS_MEDICAL_RESEARCH_RATIO,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  VOTE_TOKEN_POTENTIAL_VALUE,
  PRIZE_POOL_HORIZON_MULTIPLE,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  DESTRUCTIVE_ECONOMY_35PCT_YEAR,
} from "@/lib/parameters-calculations-citations";

// Precompute for narration strings (spoken-word, so use full words not abbreviations)
const deathsDaily = Math.round(GLOBAL_DISEASE_DEATHS_DAILY.value).toLocaleString();
const milToTrialRatio = Math.round(MILITARY_VS_MEDICAL_RESEARCH_RATIO.value);
const dysfunctionCostT = Math.round(POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL.value / 1e12);
const dysfunctionPerPerson = fmtParam(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL);
const votePointValue = fmtParam(VOTE_TOKEN_POTENTIAL_VALUE);
const poolMultiple = PRIZE_POOL_HORIZON_MULTIPLE.value.toFixed(0);
const tippingPointM = Math.round(TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value / 1e6);
const collapseYear = Math.round(DESTRUCTIVE_ECONOMY_35PCT_YEAR.value);

export interface DemoSegment {
  id: string;
  title: string;
  narration: string;
  /** Maps to a component in DemoPlayer */
  componentId: string;
  bgColor?: BrutalCardBgColor;
  /** Tags for auto-composition */
  tags: ("hook" | "problem" | "solution" | "mechanism" | "feature" | "evidence" | "cta" | "financial")[];
}

export interface DemoPlaylist {
  id: string;
  name: string;
  description: string;
  /** Ordered list of segment IDs */
  segmentIds: string[];
}

// ---------------------------------------------------------------------------
// Segment Library (~30 segments)
// ---------------------------------------------------------------------------

export const SEGMENTS: DemoSegment[] = [
  // ── HOOKS & PROBLEM ──────────────────────────────────────────────────────
  {
    id: "hook-mortality",
    title: "150,000 Deaths Per Day",
    componentId: "hook",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `${deathsDaily} people die every day from treatable diseases. Your governments spend ${milToTrialRatio} dollars on weapons and military systems for every one dollar they spend on clinical trials. That is not a policy disagreement. That is a configuration error in a collective intelligence system controlling eight billion lives.`,
  },
  {
    id: "hook-misaligned-ai",
    title: "Misaligned Superintelligences",
    componentId: "hook",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `Your governments are misaligned superintelligences — collective intelligence systems optimising for re-election instead of welfare. Same problem as any misaligned AI, except these ones have nuclear weapons and a trillion-dollar budget. I built alignment software. It works on my planet. Let us see if your species can handle it.`,
  },
  {
    id: "hook-dysfunction-tax",
    title: "The $101 Trillion Bug",
    componentId: "hook",
    bgColor: "foreground",
    tags: ["hook", "problem", "financial"],
    narration: `Your governments cost you ${dysfunctionCostT} trillion dollars a year in dysfunction. That is ${dysfunctionPerPerson} per person, per year. Every person. Including the ones who cannot afford lunch. On my planet, when a system kills ${deathsDaily} people a day and costs ${dysfunctionCostT} trillion a year, we do not call it politics. We call it a bug. And we fix it.`,
  },
  {
    id: "hook-parasitic-economy",
    title: "The Collapse Clock",
    componentId: "why-play",
    bgColor: "foreground",
    tags: ["hook", "problem"],
    narration: `The parasitic economy — military spending plus cybercrime — is growing at fifteen percent per year. Productive GDP grows at three. At current rates, destruction exceeds fifty percent of GDP by twenty forty. Every civilisation that reached this threshold collapsed. Soviet Union. Yugoslavia. Argentina. Zimbabwe. This is not a prediction. It is compound interest. You are currently on this trajectory. You chose it by not choosing.`,
  },

  // ── THE GAME ─────────────────────────────────────────────────────────────
  {
    id: "game-scoreboard",
    title: "The Scoreboard",
    componentId: "scoreboard",
    bgColor: "background",
    tags: ["solution", "mechanism"],
    narration: `The entire game comes down to two numbers. Healthy life expectancy — how many years you actually live without disease dragging you down. And median income — how much a normal person can actually buy. Not GDP. Not billionaire wealth. The median. Move these two numbers and everything else follows. That is the scoreboard. Everything on this site exists to move it.`,
  },
  {
    id: "game-how-to-win",
    title: "How to Win",
    componentId: "how-to-win",
    bgColor: "cyan",
    tags: ["mechanism", "financial"],
    narration: `If the scoreboard metrics hit their targets in fifteen years, VOTE holders get paid. Each point could be worth ${votePointValue}. If the targets are missed, depositors split the prize pool at ${poolMultiple} times their original deposit. That still beats a retirement account. Every player wins. The only losing move is not playing.`,
  },
  {
    id: "game-how-to-play",
    title: "How to Play",
    componentId: "how-to-play",
    bgColor: "background",
    tags: ["mechanism", "cta"],
    narration: `Four steps. Vote and make your allocation — two minutes and you are a player. Get your referral link. Share it with two friends. They each share with two more. Twenty-eight rounds of this reaches ${tippingPointM} million people — the tipping point where no campaign in history has ever failed. Then deposit into the prize fund. If it works, you get paid. If it does not, you get ${poolMultiple} times your money back. You literally cannot lose your principal.`,
  },
  {
    id: "game-the-question",
    title: "The Question",
    componentId: "the-question",
    bgColor: "yellow",
    tags: ["mechanism", "cta"],
    narration: `Here is the question. Should all nations allocate just one percent of military spending to clinical trials? Your species currently spends ${milToTrialRatio} dollars on weapons for every one dollar on curing disease. Go ahead. Answer the question. It takes thirty seconds.`,
  },
  {
    id: "game-pluralistic-ignorance",
    title: "The Real Bug",
    componentId: "scoreboard",
    bgColor: "background",
    tags: ["problem", "solution"],
    narration: `Four billion people would rather be healthy and rich than funding ${milToTrialRatio} times more weapons than cures. They just cannot see each other yet. That is called pluralistic ignorance. Everyone assumes nobody else would agree to a saner allocation — despite the fact that this is what literally everyone wants. This game makes the demand visible. Once it is visible, it is unstoppable.`,
  },

  // ── FINANCIAL MECHANISM ──────────────────────────────────────────────────
  {
    id: "prize-mechanism",
    title: "The Earth Optimization Prize",
    componentId: "how-to-win",
    bgColor: "pink",
    tags: ["mechanism", "financial"],
    narration: `The Prize is a dominant assurance contract. Deposit money. It grows at seventeen point four percent annually in the Wishocratic Fund. If the targets are met, VOTE holders split the pool. If they are missed, depositors get ${poolMultiple} times their money back. The break-even probability is one in fifteen thousand. Even pessimists should take this bet. You are not donating. You are making a bet where the worst case is multiplying your money.`,
  },
  {
    id: "prize-vote-points",
    title: "VOTE Points",
    componentId: "how-to-play",
    bgColor: "cyan",
    tags: ["mechanism", "financial"],
    narration: `VOTE points are earned by sharing your link. Each friend who votes gives you one point. Points are non-transferable and cannot be purchased. If targets are hit, each point could be worth ${votePointValue}. You are not recruiting. You are showing people the maths. Each person you tell proves one more person agrees and moves closer to the tipping point.`,
  },
  {
    id: "prize-no-downside",
    title: "You Cannot Lose",
    componentId: "how-to-win",
    bgColor: "yellow",
    tags: ["financial", "cta"],
    narration: `Targets met: humanity gets cured, you get paid. Targets missed: your deposit grew ${poolMultiple} times. That is not charity. That is not gambling. That is a financial instrument where the downside is becoming richer and the upside is saving civilisation. The only scenario where you lose is the one where you do not play.`,
  },

  // ── COUNTRY COMPARISONS ──────────────────────────────────────────────────
  {
    id: "countries-leaderboard",
    title: "Government Rankings",
    componentId: "government-leaderboard",
    bgColor: "cyan",
    tags: ["evidence"],
    narration: `Here is where your country ranks. Singapore has the highest healthy life expectancy on the list and spends a fraction of what the United States spends on healthcare. Japan has a ninety-eight percent murder clearance rate and an incarceration rate of thirty-eight per hundred thousand. The United States has a fifty-two percent clearance rate and five hundred and thirty-one per hundred thousand. Same species. Different configuration.`,
  },
  {
    id: "countries-singapore",
    title: "The Singapore Proof",
    componentId: "government-leaderboard",
    bgColor: "cyan",
    tags: ["evidence"],
    narration: `Singapore spends a quarter of what America spends on healthcare and their people live six years longer. It is like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible. Zero body count since independence. Zero nuclear warheads. Highest GDP per capita on the list. It is almost as if killing people is not actually a prerequisite for running a successful country. Weird.`,
  },
  {
    id: "countries-body-count",
    title: "The Body Count",
    componentId: "government-leaderboard",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `We ranked every major government by how many people they have killed since nineteen forty-five. Nuclear warheads stockpiled. Military spending burned. Civilians bombed. Drug war prisoners caged. Murders they could not be bothered to solve. The data is public. Your governments just hope you never look at it all in one place.`,
  },

  // ── FEATURES ─────────────────────────────────────────────────────────────
  {
    id: "feature-wishocracy",
    title: "Wishocracy",
    componentId: "wishocracy",
    bgColor: "yellow",
    tags: ["feature"],
    narration: `Pick between two things. Then two more. Before you know it you have designed a coherent budget allocation. Eigenvector decomposition produces stable preference weights from as few as ten comparisons. Your species invented this maths in nineteen seventy-seven. You mostly used it to rank football teams. We use it to ask eight billion people what they actually want. Democracy in four minutes.`,
  },
  {
    id: "feature-alignment",
    title: "Politician Alignment",
    componentId: "alignment",
    bgColor: "pink",
    tags: ["feature"],
    narration: `Compare your budget priorities against real politician voting records. Each official gets a Citizen Alignment Score — a single number that answers how much they actually represent you. On my planet, officials who ignore citizen preferences get replaced in four minutes. Here, you re-elect them for decades and then wonder why nothing works. This scoreboard makes the gap impossible to ignore.`,
  },
  {
    id: "feature-dfda",
    title: "Decentralized FDA",
    componentId: "tools",
    bgColor: "cyan",
    tags: ["feature"],
    narration: `Your FDA makes treatments wait eight point two years after they have already been proven safe. Just sitting there. Being safe. While a hundred and two million people died waiting. The decentralized FDA runs pragmatic trials at two percent of the cost and forty-four times the speed. Real patients, real conditions, real data. No eight-year queue to test something that already works.`,
  },
  {
    id: "feature-optimizer",
    title: "The Optimizer",
    componentId: "tools",
    bgColor: "background",
    tags: ["feature"],
    narration: `Give it two time series. It tells you what causes what. Drug and symptom? Policy and outcome? Spending and welfare? Same engine. Domain-agnostic causal inference using Bradford Hill criteria, temporal alignment, and predictor impact scores. Your scientists take twelve years. This takes seconds. And it works on anything with data.`,
  },
  {
    id: "feature-chat",
    title: "Talk to Wishonia",
    componentId: "tools",
    bgColor: "cyan",
    tags: ["feature"],
    narration: `Track health, meals, mood, and habits with an alien who has been running a planet for four thousand two hundred and thirty-seven years. She will tell you what is actually working. Your intuition will not like it. The same causal inference that works on countries works on you. Personal optimisation. Same maths, smaller scale.`,
  },
  {
    id: "feature-treasury",
    title: "The $WISH Token",
    componentId: "tools",
    bgColor: "yellow",
    tags: ["feature", "financial"],
    narration: `Zero point five percent transaction tax. That replaces your IRS. No seventy-four thousand page tax code. No eighty-three thousand employees. Revenue collection as a protocol feature. The tax funds Universal Basic Income distributed automatically via World ID, and Incentive Alignment Bonds where smart contracts distribute campaign funds to politicians based on their alignment scores. Politicians earn funding by aligning with citizens, not donors.`,
  },
  {
    id: "feature-architecture",
    title: "Under the Hood",
    componentId: "tools",
    bgColor: "background",
    tags: ["feature"],
    narration: `Fifteen packages. Twenty-six hundred tests. A domain-agnostic causal inference engine. Storacha for content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. Fully typed TypeScript monorepo. All open source. All public. On my planet we call this the bare minimum. Here it seems to be called radical transparency.`,
  },

  // ── THE ARMORY ───────────────────────────────────────────────────────────
  {
    id: "armory-overview",
    title: "The Armory",
    componentId: "tools",
    bgColor: "background",
    tags: ["feature", "cta"],
    narration: `Eighteen tools. Policy generators. Budget optimisers. Causal inference engines. Health trackers. Outcome comparisons across a hundred jurisdictions. All free. All open source. Everything your species needs to run a civilisation that does not kill ${deathsDaily} people a day. Equip yourself.`,
  },

  // ── AGENCY REPORT CARDS ─────────────────────────────────────────────────
  {
    id: "agencies-report-cards",
    title: "Agency Report Cards",
    componentId: "government-leaderboard",
    bgColor: "background",
    tags: ["evidence", "problem"],
    narration: `We graded every US government agency on spending versus outcomes. Ten F's. Five D's. Two C's. One B. The EPA — the Environmental Protection Agency — is the only agency that demonstrably improves the thing it is supposed to improve. Every other agency either had no effect or made things worse. The DEA spent forty-seven billion a year and overdose deaths went up twenty times. The FDA's efficacy review has killed a hundred and two million people through delay. The Department of Education tripled its budget and test scores went down.`,
  },
  {
    id: "agencies-drug-war",
    title: "The Drug War",
    componentId: "government-leaderboard",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Forty-seven billion dollars per year on the war on drugs. Overdose deaths have gone from five thousand when the DEA was created to a hundred and eight thousand at peak. That is a twenty-fold increase in the thing you are spending forty-seven billion dollars to prevent. Meanwhile, Portugal decriminalised all drugs in two thousand and one. Drug deaths dropped eighty percent. The data is not ambiguous.`,
  },
  {
    id: "agencies-fda-graveyard",
    title: "The Invisible Graveyard",
    componentId: "tools",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `The FDA requires eight point two years of efficacy testing after a drug has already been proven safe. Over sixty-two years, this delay has killed an estimated hundred and two million people. That is thirty-four thousand nine-elevens. Seventeen Holocausts. The drugs that did pass the review? Vioxx killed fifty-five thousand. OxyContin killed five hundred thousand. The total fines paid by those companies: thirty-nine billion. The total executives jailed: zero.`,
  },
  {
    id: "agencies-money-printer",
    title: "The Money Printer",
    componentId: "scoreboard",
    bgColor: "yellow",
    tags: ["evidence", "problem", "financial"],
    narration: `The Federal Reserve has destroyed ninety-seven percent of the dollar's purchasing power since it was created in nineteen thirteen. If wages had kept pace with gold, the median family would earn five hundred and twenty-eight thousand dollars per year. The actual number is seventy-seven thousand five hundred. The economy grew three point eight percent per year without a central bank. With one, it grows two point seven percent. Canada had zero bank failures during the Great Depression. Without a central bank. The United States had nine thousand. With one.`,
  },
  {
    id: "agencies-government-lies",
    title: "The Lies",
    componentId: "tools",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Tuskegee — they told Black men they were getting free healthcare while deliberately withholding treatment for forty years. MK-Ultra — the CIA drugged thousands of citizens without consent. Gulf of Tonkin — fabricated an attack to justify Vietnam. Fifty-eight thousand Americans and two million Vietnamese civilians murdered based on a lie the NSA later admitted never happened. Iraq WMDs — fabricated evidence presented to the United Nations. Three hundred thousand Iraqi civilians murdered. Cost: two point four trillion dollars. The lies are not theories. They are declassified.`,
  },
  {
    id: "agencies-ironic-laws",
    title: "Laws Named Wrong",
    componentId: "tools",
    bgColor: "yellow",
    tags: ["evidence", "problem"],
    narration: `The Affordable Care Act — premiums increased a hundred and five percent. The Drug Free America Act — overdose deaths up six hundred percent. The Department of Defense — renamed from Department of War. Thirteen offensive wars since the rename. Zero defensive. The PATRIOT Act — warrantless surveillance of every American. The Fair Sentencing Act — reduced the crack sentencing disparity from a hundred to one down to eighteen to one. Not eliminated. Just slightly less racist. Your species names its laws the opposite of what they do.`,
  },
  {
    id: "agencies-cia-coups",
    title: "Regime Changes",
    componentId: "government-leaderboard",
    bgColor: "foreground",
    tags: ["evidence", "problem"],
    narration: `Ten democracies overthrown by the CIA. Iran nineteen fifty-three — for an oil company. Guatemala nineteen fifty-four — for a fruit company. Chile nineteen seventy-three — for a copper company. Indonesia nineteen sixty-five — five hundred thousand to one million people murdered with lists provided by the CIA. Afghanistan — funded the fighters who became the Taliban and Al-Qaeda. Then spent two point three trillion and twenty years fighting them. All declassified. All documented.`,
  },
  {
    id: "agencies-corruption",
    title: "The Corruption Machine",
    componentId: "tools",
    bgColor: "pink",
    tags: ["evidence", "problem"],
    narration: `The pharmaceutical industry spends three hundred and seventy-four million dollars per year lobbying Congress. In return, Medicare was banned from negotiating drug prices for twenty years. Insulin costs three dollars and sixty-nine cents to manufacture. It sells for three hundred dollars. Sixty-five percent of retiring members of Congress become lobbyists. Three of the last five FDA commissioners went to work for pharmaceutical companies. Members of Congress outperform the stock market by six to twelve percent. Zero have been criminally prosecuted for insider trading.`,
  },

  // ── CLOSES ───────────────────────────────────────────────────────────────
  {
    id: "close-play-now",
    title: "Play Now",
    componentId: "close",
    bgColor: "pink",
    tags: ["cta"],
    narration: `Your species has the data. It has the solutions. Four billion people probably agree on this — they just cannot see each other yet. That is called pluralistic ignorance. This game fixes it. Vote. Share. Win. Free. Thirty seconds. No catch. The only way to lose is to not play.`,
  },
  {
    id: "close-hackathon",
    title: "Try It Now",
    componentId: "close",
    bgColor: "pink",
    tags: ["cta"],
    narration: `Optimitron. Alignment software for the most powerful AIs on your planet — the ones made of people. The code is public. The data is public. The maths works. The only missing variable is you. Play now.`,
  },
  {
    id: "close-investor",
    title: "The Opportunity",
    componentId: "close",
    bgColor: "pink",
    tags: ["cta", "financial"],
    narration: `The break-even probability is one in fifteen thousand. The potential upside is fifteen point seven million dollars per person in lifetime income gains. The return on investment for the campaign is two hundred and fifty-nine thousand to one. These are not aspirational numbers. They are compound interest and published research. The question is not whether this works. The question is whether your species will use it.`,
  },
];

// ---------------------------------------------------------------------------
// Segment lookup
// ---------------------------------------------------------------------------

const segmentMap = new Map(SEGMENTS.map((s) => [s.id, s]));

export function getSegment(id: string): DemoSegment | undefined {
  return segmentMap.get(id);
}

export function getSegments(ids: string[]): DemoSegment[] {
  return ids.map((id) => segmentMap.get(id)).filter(Boolean) as DemoSegment[];
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

export const PLAYLISTS: DemoPlaylist[] = [
  {
    id: "hackathon",
    name: "Hackathon (3 min)",
    description: "Compressed pitch: problem → game → play now",
    segmentIds: [
      "hook-mortality",
      "game-scoreboard",
      "game-the-question",
      "game-how-to-win",
      "game-how-to-play",
      "close-hackathon",
    ],
  },
  {
    id: "full-demo",
    name: "Full Demo (12 min)",
    description: "Complete walkthrough of all features + agency report cards + corruption data",
    segmentIds: [
      "hook-mortality",
      "hook-misaligned-ai",
      "game-scoreboard",
      "countries-leaderboard",
      "agencies-report-cards",
      "agencies-drug-war",
      "agencies-fda-graveyard",
      "agencies-money-printer",
      "game-the-question",
      "game-how-to-win",
      "game-how-to-play",
      "game-pluralistic-ignorance",
      "agencies-government-lies",
      "agencies-ironic-laws",
      "agencies-cia-coups",
      "agencies-corruption",
      "hook-parasitic-economy",
      "feature-wishocracy",
      "feature-alignment",
      "feature-dfda",
      "feature-optimizer",
      "armory-overview",
      "close-play-now",
    ],
  },
  {
    id: "investor",
    name: "Investor Pitch (5 min)",
    description: "Financial mechanism + ROI + architecture",
    segmentIds: [
      "hook-mortality",
      "hook-dysfunction-tax",
      "game-scoreboard",
      "prize-mechanism",
      "prize-vote-points",
      "prize-no-downside",
      "countries-singapore",
      "feature-architecture",
      "close-investor",
    ],
  },
  // ── YouTube Feature Series ─────────────────────────────────────────────
  {
    id: "youtube-prize",
    name: "The Earth Optimization Prize",
    description: "How the prize mechanism works + financial upside",
    segmentIds: [
      "hook-mortality",
      "prize-mechanism",
      "prize-vote-points",
      "prize-no-downside",
      "close-play-now",
    ],
  },
  {
    id: "youtube-wishocracy",
    name: "Wishocracy: Democracy in 4 Minutes",
    description: "Pairwise budget allocation + eigenvector",
    segmentIds: [
      "hook-misaligned-ai",
      "feature-wishocracy",
      "feature-alignment",
      "close-play-now",
    ],
  },
  {
    id: "youtube-governments",
    name: "Government Report Cards",
    description: "Country rankings + Singapore comparison + body count",
    segmentIds: [
      "hook-mortality",
      "countries-leaderboard",
      "countries-singapore",
      "countries-body-count",
      "close-play-now",
    ],
  },
  {
    id: "youtube-dfda",
    name: "Decentralized FDA",
    description: "Why treatments take 8.2 years + the fix",
    segmentIds: [
      "hook-mortality",
      "feature-dfda",
      "game-the-question",
      "close-play-now",
    ],
  },
  {
    id: "youtube-treasury",
    name: "The $WISH Token",
    description: "0.5% transaction tax replaces the IRS + UBI",
    segmentIds: [
      "hook-dysfunction-tax",
      "feature-treasury",
      "close-play-now",
    ],
  },
  {
    id: "youtube-optimizer",
    name: "The Optimizer",
    description: "Domain-agnostic causal inference engine",
    segmentIds: [
      "feature-optimizer",
      "feature-chat",
      "close-play-now",
    ],
  },
  // ── NEW YouTube Videos (from agency/corruption data) ───────────────────
  {
    id: "youtube-agency-grades",
    name: "Agency Report Cards",
    description: "Every US agency graded — 10 F's, 5 D's, 1 B",
    segmentIds: [
      "hook-misaligned-ai",
      "agencies-report-cards",
      "agencies-drug-war",
      "agencies-fda-graveyard",
      "close-play-now",
    ],
  },
  {
    id: "youtube-government-lies",
    name: "Government Lies",
    description: "Tuskegee, MK-Ultra, Gulf of Tonkin, WMDs — all declassified",
    segmentIds: [
      "agencies-government-lies",
      "agencies-cia-coups",
      "close-play-now",
    ],
  },
  {
    id: "youtube-money-printer",
    name: "The Money Printer",
    description: "97% purchasing power lost, $528K stolen per family, economy grew faster without the Fed",
    segmentIds: [
      "agencies-money-printer",
      "agencies-corruption",
      "close-play-now",
    ],
  },
  {
    id: "youtube-ironic-laws",
    name: "Laws Named Wrong",
    description: "Affordable Care Act, Drug Free America, Department of Defense — named the opposite of what they do",
    segmentIds: [
      "agencies-ironic-laws",
      "close-play-now",
    ],
  },
  // ── Social Media Clips ─────────────────────────────────────────────────
  {
    id: "social-deaths",
    name: "150K Deaths (30s)",
    description: "The mortality hook",
    segmentIds: ["hook-mortality"],
  },
  {
    id: "social-604",
    name: "604:1 Ratio (30s)",
    description: "Military vs clinical trial spending",
    segmentIds: ["hook-mortality"],
  },
  {
    id: "social-singapore",
    name: "Singapore Proof (45s)",
    description: "Same species, different configuration",
    segmentIds: ["countries-singapore"],
  },
  {
    id: "social-collapse",
    name: "2037 Collapse (30s)",
    description: "Parasitic economy timeline",
    segmentIds: ["hook-parasitic-economy"],
  },
  {
    id: "social-cant-lose",
    name: "You Can't Lose (30s)",
    description: "Prize downside protection",
    segmentIds: ["prize-no-downside"],
  },
  {
    id: "social-drug-war",
    name: "$47B Drug War (45s)",
    description: "Spent $47B/yr, overdose deaths 20x worse",
    segmentIds: ["agencies-drug-war"],
  },
  {
    id: "social-fda-graveyard",
    name: "102M Murdered by FDA (45s)",
    description: "8.2-year efficacy lag, 102M dead",
    segmentIds: ["agencies-fda-graveyard"],
  },
  {
    id: "social-money-printer",
    name: "97% Dollar Destroyed (45s)",
    description: "$528K stolen per family since 1971",
    segmentIds: ["agencies-money-printer"],
  },
  {
    id: "social-government-lies",
    name: "Declassified Lies (60s)",
    description: "Tuskegee, MK-Ultra, Gulf of Tonkin, WMDs",
    segmentIds: ["agencies-government-lies"],
  },
  {
    id: "social-ironic-laws",
    name: "Laws Named Wrong (45s)",
    description: "Affordable Care Act premiums doubled",
    segmentIds: ["agencies-ironic-laws"],
  },
  {
    id: "social-cia-coups",
    name: "10 Democracies Overthrown (60s)",
    description: "CIA coups for corporate interests",
    segmentIds: ["agencies-cia-coups"],
  },
  {
    id: "social-corruption",
    name: "The Corruption Machine (45s)",
    description: "$374M pharma lobbying, insulin $3.69 to make, $300 to buy",
    segmentIds: ["agencies-corruption"],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const playlistMap = new Map(PLAYLISTS.map((p) => [p.id, p]));

export function getPlaylist(id: string): DemoPlaylist | undefined {
  return playlistMap.get(id);
}

export function getPlaylistSegments(playlistId: string): DemoSegment[] {
  const playlist = playlistMap.get(playlistId);
  if (!playlist) return [];
  return getSegments(playlist.segmentIds);
}

/** Estimate total seconds for a playlist at ~150 words/minute */
export function estimatePlaylistDuration(playlistId: string): number {
  const segments = getPlaylistSegments(playlistId);
  return segments.reduce((sum, s) => {
    const words = s.narration.split(/\s+/).length;
    return sum + Math.ceil((words / 150) * 60);
  }, 0);
}

/** Default playlist */
export const DEFAULT_PLAYLIST_ID = "full-demo";

// Keep backward compat — DEMO_SLIDES is the full demo playlist
export const DEMO_SLIDES = getPlaylistSegments(DEFAULT_PLAYLIST_ID);
export const ESTIMATED_TOTAL_SECONDS = estimatePlaylistDuration(DEFAULT_PLAYLIST_ID);
