/**
 * Wishonia's replacement agencies — pure data, no UI imports.
 *
 * Each entry describes a Wishonia digital agency that replaces one or more
 * Earth government agencies, including the code that does the replacing.
 */

export interface WishoniaAgencyStat {
  value: string;
  label: string;
  description?: string;
  color?: "pink" | "cyan" | "yellow" | "green";
}

/** What an agency actually optimizes for — stated vs revealed preference. */
export interface OptimizationMetric {
  /** Short metric name, e.g. "Papers Published" or "Median HALE" */
  metric: string;
  /** Why this is what they actually optimize for (or should). */
  description: string;
}

export type WishoniaDepartment =
  | "Democracy"
  | "Finance & Identity"
  | "Health & Science"
  | "Public Goods"
  | "Security & Justice";

export interface WishoniaAgency {
  id: string;
  dName: string;
  department: WishoniaDepartment;
  emoji: string;
  replaces: string[];
  replacesAgencyName: string;
  /** Canonical manual page (spec/blueprint) for this agency, when one exists. */
  manualUrl?: string;
  /** Full Wishonia-voice explanation (1-3 sentences). Used for page hero, nav, metadata. */
  description: string;
  /** One-liner for compact UIs (tools page, slide-armory, index cards). */
  tagline: string;
  /** What the Earth agency actually optimizes for (the perverse incentive). */
  deprecatedMetrics: OptimizationMetric[];
  /** What the replacement optimizes for (the metric that matters). */
  optimalMetrics: OptimizationMetric[];
  stats: WishoniaAgencyStat[];
  codeHeader: string;
  replacementCode: string;
  codeLanguage: "solidity" | "typescript";
  codeExplanation: string;
  annualSavings: string;
  savingsComparison: string;
  wishoniaQuote: string;
  cardColor: "pink" | "cyan" | "yellow" | "green";
}

/** Keyed record of all Wishonia agencies. Use `AGENCIES.dfed` for direct access. */
export const AGENCIES = {
  dfed: {
    id: "dfed",
    dName: "Algorithmic Reserve",
    department: "Finance & Identity",
    emoji: "🏦",
    replaces: ["fed"],
    replacesAgencyName: "Federal Reserve System",
    description:
      "Twelve people in a room deciding how much your money is worth. On my planet, we call that a hostage situation.",
    tagline: "0% inflation anchored to productivity — new money via UBI, not banks",
    deprecatedMetrics: [
      { metric: "2% Annual Inflation Target", description: "Deliberately devalues every paycheck by 2%/year. They call this 'price stability.' Your grandparents call it 'why a house costs 40x what it used to.'" },
      { metric: "Bank Profitability", description: "New money goes to banks first. They lend it out before prices adjust. By the time it reaches you, the purchasing power is already gone." },
      { metric: "Institutional Self-Preservation", description: "111 years, zero audits. The Fed's primary achievement is making everyone too busy to question why 12 people control the money supply." },
    ],
    optimalMetrics: [
      { metric: "Median Real After-Tax Income", description: "The only monetary policy metric that matters: can a normal person buy more stuff this year than last year?" },
      { metric: "0% Inflation Rate", description: "Fixed supply anchored to productivity growth. Your money buys more over time, not less." },
      { metric: "Equal Distribution of New Money", description: "Productivity gains distributed as UBI, not funnelled through banks to asset holders first." },
    ],
    stats: [
      {
        value: "12",
        label: "Board Members",
        description: "Unelected humans controlling money for 330 million people",
        color: "pink",
      },
      {
        value: "~23,000",
        label: "Employees",
        description: "Staff across 12 regional Federal Reserve Banks",
        color: "yellow",
      },
      {
        value: "$5.5B",
        label: "Annual Budget",
        description: "Operating expenses of the Federal Reserve System",
        color: "cyan",
      },
      {
        value: "96%",
        label: "Dollar Devalued",
        description: "Purchasing power lost since the Fed was created in 1913",
        color: "pink",
      },
    ],
    codeHeader: "12 unelected humans → 1 constructor parameter",
    replacementCode: `// WishToken.sol — the entire monetary policy
constructor(
    address _treasury,
    uint256 _initialSupply,  // Fixed. Forever. No meetings.
    uint256 _taxRateBps      // 0.5% — replaces the entire IRS
) ERC20("Wish", "WISH") Ownable(msg.sender) {
    maxSupply = _initialSupply;  // Set once. Can never increase.
    _mint(msg.sender, _initialSupply);
}

// That's it. No board meetings. No interest rate decisions.
// No quantitative easing. No money printer. Just math.`,
    codeLanguage: "solidity",
    codeExplanation:
      "The total supply of Wishes is set once at deployment and enforced by the protocol. No entity can create more. Productivity gains manifest as gentle deflation — your money buys more over time, not less.",
    annualSavings: "96% of your purchasing power",
    savingsComparison:
      "Since 1913, the dollar has lost 96 cents of every dollar. Under fixed supply, that theft is mathematically impossible.",
    wishoniaQuote:
      "Your central bank has one job: manage the money supply. In 111 years they've managed to destroy 96% of it. On my planet we'd call that a bug report, not a mandate.",
    cardColor: "pink",
  },
  dirs: {
    id: "dirs",
    dName: "Automated Revenue Service",
    department: "Finance & Identity",
    emoji: "🧾",
    replaces: ["irs"],
    replacesAgencyName: "Internal Revenue Service",
    manualUrl:
      "https://manual.warondisease.org/knowledge/solution/automated-revenue-service.html",
    description:
      "Six lines of computer code. That's all it took.",
    tagline: "Six lines of computer code replace 74,000 pages of tax code",
    deprecatedMetrics: [
      { metric: "Tax Code Complexity", description: "74,000 pages. Every loophole is a feature, not a bug — it's how donors get paid back." },
      { metric: "Compliance Burden", description: "6.1 billion hours/year of citizen time. An entire profession ('accountant') exists to decode rules you wrote for yourselves." },
      { metric: "Audit Revenue", description: "83,000 employees optimizing for catching mistakes in a system designed to produce them." },
    ],
    optimalMetrics: [
      { metric: "Revenue per Dollar of Overhead", description: "0.5% transaction tax collects the same revenue at ~0% administrative cost." },
      { metric: "Zero Citizen Filing Time", description: "No forms, no deadlines, no accountants. Tax happens automatically on every transfer." },
      { metric: "Zero Loopholes", description: "Can't lobby an automatic rule. Can't offshore a protocol. The tax is unavoidable because it's the protocol." },
    ],
    stats: [
      {
        value: "83,000",
        label: "Employees",
        description: "Full-time IRS staff interpreting the tax code",
        color: "pink",
      },
      {
        value: "$12.3B",
        label: "Annual Budget",
        description: "Cost to run the IRS each year",
        color: "yellow",
      },
      {
        value: "74,000",
        label: "Pages of Tax Code",
        description: "The Internal Revenue Code and associated regulations",
        color: "cyan",
      },
      {
        value: "6.1B hrs",
        label: "Annual Filing Time",
        description: "Hours Americans spend on tax compliance each year",
        color: "pink",
      },
    ],
    codeHeader: "74,000 pages of tax code → 6 lines of computer code",
    replacementCode: `// WishToken._update() — replaces the entire IRS
function _update(address from, address to, uint256 value) internal override {
    // Skip tax on mints, burns, or exempt addresses
    if (from == address(0) || to == address(0) || taxExempt[from]) {
        super._update(from, to, value);
        return;
    }
    uint256 taxAmount = (value * taxRateBps) / 10_000;  // 0.5% of every transfer
    super._update(from, treasury, taxAmount);            // Tax → treasury (automatic)
    super._update(from, to, value - taxAmount);          // Rest → recipient
}
// No filing. No audits. No loopholes. No accountants. No evasion.`,
    codeLanguage: "solidity",
    codeExplanation:
      "Every transfer automatically deducts 0.5% and sends it to the treasury. No filing, no forms, no audits, no compliance departments, no offshore accounts. The tax is unavoidable because it's built into the protocol.",
    annualSavings: "$212B+",
    savingsComparison:
      "$12.3B direct IRS budget + $200B+ in annual compliance costs eliminated. That's $640 per American per year just in paperwork savings.",
    wishoniaQuote:
      "83,000 people interpreting 74,000 pages to do what six lines of computer code do automatically. And you wonder where your taxes go.",
    cardColor: "cyan",
  },
  dssa: {
    id: "dssa",
    dName: "Universal Security Administration",
    department: "Finance & Identity",
    emoji: "🍞",
    replaces: ["ssa"],
    replacesAgencyName: "Social Security Administration + Welfare Bureaucracy",
    manualUrl:
      "https://manual.warondisease.org/knowledge/solution/universal-security-administration.html",
    description:
      "You spend more administering help than you spend helping. That's not a safety net — that's a jobs programme for administrators.",
    tagline: "UBI replaces 83 welfare programs with one for-loop",
    deprecatedMetrics: [
      { metric: "Means-Testing Accuracy", description: "Optimizing for 'did we correctly decide who deserves to eat' instead of just feeding everyone." },
      { metric: "Fraud Prevention Rate", description: "Spending more catching the 1.5% who cheat than it would cost to just give everyone the money." },
      { metric: "Caseworker Employment", description: "80+ overlapping programs, each with its own bureaucracy, each justifying its own existence." },
    ],
    optimalMetrics: [
      { metric: "Poverty Rate", description: "One number. Is it going down? Good. Is it zero? Done." },
      { metric: "Zero Humans Falling Through Cracks", description: "UBI with one-person-one-claim verification. If you're human, you qualify. No applications, no wait, no committee deciding if you deserve lunch." },
      { metric: "Admin Cost as % of Disbursement", description: "Current system: up to 50% overhead. UBI for-loop: ~0%." },
    ],
    stats: [
      {
        value: "$1.1T",
        label: "Annual Admin Overhead",
        description: "Cost of administering means-tested welfare programs",
        color: "pink",
      },
      {
        value: "80+",
        label: "Overlapping Programs",
        description: "Federal means-tested welfare programs with separate bureaucracies",
        color: "yellow",
      },
      {
        value: "~45 days",
        label: "Average Processing Time",
        description: "Wait time for SNAP, Medicaid, or disability applications",
        color: "cyan",
      },
      {
        value: "$0",
        label: "To People Who Fall Through Cracks",
        description: "Millions who qualify but never navigate the paperwork",
        color: "pink",
      },
    ],
    codeHeader: "80+ welfare programs → 1 function call",
    replacementCode: `// UBIDistributor.distributeUBI() — replaces the entire welfare system
function distributeUBI() external {                             // Anyone can call this
    uint256 balance = wishToken.balanceOf(address(this));       // How much is in the pot
    uint256 perCitizen = balance / citizenList.length;          // Split equally

    for (uint256 i = 0; i < citizenList.length; i++) {
        wishToken.safeTransfer(citizenList[i], perCitizen);    // Send to every citizen
    }
}
// No applications. No case workers. No means testing.
// No fraud investigation. No waiting. Just equal splits.`,
    codeLanguage: "solidity",
    codeExplanation:
      "Every verified citizen gets an equal share. No applications, no case workers, no means-testing, no fraud investigation, no processing delays. The entire welfare bureaucracy becomes a for-loop.",
    annualSavings: "$1.1 trillion",
    savingsComparison:
      "That's more than the GDP of the Netherlands. Spent not on helping people, but on deciding which people deserve help.",
    wishoniaQuote:
      "You spend more money deciding who deserves help than you spend helping them. That's not a safety net. That's a jobs programme for form designers.",
    cardColor: "yellow",
  },
  dfec: {
    id: "dfec",
    dName: "Aligned Election Commission",
    department: "Democracy",
    emoji: "🤝",
    replaces: ["fec"],
    replacesAgencyName: "Federal Election Commission + Campaign Finance System",
    manualUrl:
      "https://manual.warondisease.org/knowledge/solution/aligned-election-commission.html",
    description:
      "Your politicians are funded by the people they're supposed to regulate. You call this 'campaign finance.' I call it 'bribery with extra steps.'",
    tagline: "Politicians funded by alignment score, not donor checks",
    deprecatedMetrics: [
      { metric: "Donor Access Preserved", description: "0.01% of the population provides the majority of campaign funds. The FEC's job is to make sure this stays legal." },
      { metric: "Incumbent Re-Election Rate", description: "94% of incumbents win. The campaign finance system is an incumbent protection racket that files paperwork." },
      { metric: "Dark Money Facilitated", description: "67% increase in undisclosed spending since Citizens United. The FEC has 6 commissioners and they deadlock on purpose." },
    ],
    optimalMetrics: [
      { metric: "Citizen-Politician Alignment Score", description: "One number per politician: how closely do their votes match what citizens actually want? Public. Immutable. Updated in real-time." },
      { metric: "Policy Outcomes vs Citizen Preferences", description: "Did the things people voted for actually happen? And did outcomes improve?" },
      { metric: "Campaign Funding Proportional to Alignment", description: "Represent citizens well → get funded. Represent donors well → get nothing." },
    ],
    stats: [
      {
        value: "$4.7B",
        label: "2024 Election Spending",
        description: "Total campaign spending in the 2024 US federal election cycle",
        color: "pink",
      },
      {
        value: "$3.7B",
        label: "Annual Lobbying",
        description: "Reported federal lobbying expenditures per year",
        color: "yellow",
      },
      {
        value: "67%",
        label: "Dark Money Growth",
        description: "Increase in undisclosed political spending since Citizens United",
        color: "cyan",
      },
      {
        value: "0.01%",
        label: "Mega-Donors",
        description: "Share of population providing majority of campaign funds",
        color: "pink",
      },
    ],
    codeHeader: "PACs + lobbyists + dark money → 1 allocation function",
    replacementCode: `// PoliticalIncentiveAllocator.allocate() — replaces campaign finance
function allocate(bytes32 jurisdiction, bytes32[] leaves,
    bytes32[][] proofs, uint256[] scores) external {
    for (uint256 i = 0; i < leaves.length; i++) {
        bool valid = oracle.verifyScore(jurisdiction, leaves[i], proofs[i]);
        if (!valid || scores[i] < minimumAlignmentScore) continue;
        // Fund proportional to citizen alignment — not donor alignment
        uint256 weight = scores[i] - minimumAlignmentScore;
        uint256 share = (balance * weight) / totalWeight;
        stablecoin.safeTransfer(politician.campaignWallet, share);
    }
}
// Politicians funded by how well they represent citizens.
// Not by how much they pleased their donors.`,
    codeLanguage: "solidity",
    codeExplanation:
      "Politicians receive campaign funding proportional to their Citizen Alignment Score — how closely their votes match citizen preferences. Below minimum alignment? $0. No donors, no PACs, no dark money. Just math measuring representation.",
    annualSavings: "$8.4B+",
    savingsComparison:
      "Eliminates $4.7B in campaign spending + $3.7B in lobbying. More importantly: eliminates the incentive for politicians to serve donors instead of citizens.",
    wishoniaQuote:
      "Your politicians are funded by the people they're supposed to regulate. You call this 'campaign finance.' I call it 'bribery with extra steps.'",
    cardColor: "green",
  },
  dgao: {
    id: "dgao",
    dName: "Decentralized Accountability Office",
    department: "Democracy",
    emoji: "🔍",
    replaces: ["gao"],
    replacesAgencyName: "Government Accountability Office",
    description:
      "You pay 3,400 humans to audit a ledger that could audit itself. Then you wait eighteen months for the results.",
    tagline: "Every fund flow on IPFS — impossible to quietly delete",
    deprecatedMetrics: [
      { metric: "Reports Published", description: "900+ reports/year. Impressive output. 33% of recommendations are ignored. Impressive futility." },
      { metric: "Audit Cycle Time", description: "18 months from start to published report. By then the money is spent, the people are gone, and the next scandal has started." },
      { metric: "Sampling Coverage", description: "Can only audit a fraction of government spending. The rest is trusted on faith. Which is how you get $35 trillion in debt." },
    ],
    optimalMetrics: [
      { metric: "Real-Time Transaction Visibility", description: "Every government transaction visible in seconds, not 18 months. Published and immutable." },
      { metric: "Zero Ability to Hide Spending", description: "When the ledger is public, there's nothing to audit. The transparency IS the accountability." },
      { metric: "100% Coverage", description: "Every transaction, not a sample. Every department, not a rotation. Always, not periodically." },
    ],
    stats: [
      {
        value: "3,400",
        label: "Auditors",
        description: "GAO employees investigating government spending",
        color: "pink",
      },
      {
        value: "$803M",
        label: "Annual Budget",
        description: "Cost to audit how the government spends money",
        color: "yellow",
      },
      {
        value: "~18 months",
        label: "Average Audit Time",
        description: "Time from audit start to published report",
        color: "cyan",
      },
      {
        value: "33%",
        label: "Recommendations Ignored",
        description: "GAO recommendations that agencies fail to implement",
        color: "pink",
      },
    ],
    codeHeader: "3,400 auditors × 18 months → public audit trail",
    replacementCode: `// No separate audit process needed. The public record is the audit.
//
// Every transaction is:
//   ✓ Public          — anyone can read it
//   ✓ Immutable       — no one can alter it
//   ✓ Real-time       — visible in seconds, not 18 months
//   ✓ Deterministic   — treasury rules execute exactly as written
//   ✓ Free            — no $803M/yr budget required
//
// WishocraticTreasury.distribute() is permissionless.
// Anyone can verify that funds went to the right places
// by reading the public ledger. That's it. That's the audit.`,
    codeLanguage: "solidity",
    codeExplanation:
      "When every government transaction is published to a public ledger, auditing becomes continuous and automatic. There's nothing to reconstruct because the record is already visible.",
    annualSavings: "$803M",
    savingsComparison:
      "Plus: real-time accountability instead of 18-month delays. Plus: 100% coverage instead of sampling. Plus: citizens can audit directly instead of trusting auditors.",
    wishoniaQuote:
      "You pay 3,400 humans $803 million a year to reconstruct spending after the fact. I publish the ledger as the money moves. My planet banned delayed accounting in year six.",
    cardColor: "cyan",
  },
  dcbo: {
    id: "dcbo",
    dName: "Optimal Policy Generator",
    department: "Democracy",
    emoji: "📋",
    replaces: ["cbo"],
    replacesAgencyName: "Congressional Budget Office",
    description:
      "275 humans spend months guessing what a bill will cost. The algorithm does it in 200 milliseconds and shows its work.",
    tagline: "Grade every policy A–F by what actually happened",
    deprecatedMetrics: [
      { metric: "Bills Scored per Session", description: "Throughput of a process that takes 2-4 months per bill. By the time it's scored, the political moment has passed." },
      { metric: "Political Neutrality Perception", description: "The CBO is 'nonpartisan' in the same way a referee is neutral — everyone screams at them and the rules keep changing." },
      { metric: "Forecast Accuracy (Low)", description: "CBO deficit projections are routinely off by hundreds of billions. The 10-year forecast is astrology with spreadsheets." },
    ],
    optimalMetrics: [
      { metric: "Policy Grade Accuracy (A–F)", description: "Every policy graded by what actually happened when someone tried it. Cross-country causal inference, not projection." },
      { metric: "Evidence Quality Score", description: "Weighted by study rigor, precision, and recency. Shows its work. Can't be lobbied." },
      { metric: "Time to Score: Milliseconds", description: "200ms, not 4 months. The algorithm doesn't need to convene a meeting." },
    ],
    stats: [
      {
        value: "275",
        label: "Analysts",
        description: "CBO staff scoring legislation and economic forecasts",
        color: "pink",
      },
      {
        value: "~$62M",
        label: "Annual Budget",
        description: "Cost to operate the Congressional Budget Office",
        color: "yellow",
      },
      {
        value: "2-4 months",
        label: "Time to Score a Bill",
        description: "How long it takes to produce a cost estimate for one piece of legislation",
        color: "cyan",
      },
      {
        value: "Political",
        label: "Pressure on Scoring",
        description: "Elected officials routinely pressure CBO for favorable scores",
        color: "pink",
      },
    ],
    codeHeader: "275 analysts × 4 months → 1 function call",
    replacementCode: `// budgetImpactScore() — replaces CBO scoring
export function calculateWES(estimates: EffectEstimate[]): WESCalculationResult {
    let totalWeightedScore = 0;
    for (const est of estimates) {
        const wQ = qualityWeight(est.method);    // How rigorous was the study?
        const wP = precisionWeight(est.se);      // How precise is the estimate?
        const wR = recencyWeight(est.year);      // How recent is the evidence?
        totalWeightedScore += wQ * wP * wR;      // Combine all three
    }
    const score = Math.min(1, totalWeightedScore / K);  // Normalize to 0-1
    return { score, grade: scoreToGrade(score) };        // A through F
}
// No political pressure. No months of delay.
// Evidence-graded A through F. Shows its work.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Every spending category gets a Welfare Evidence Score based on study quality, precision, and recency. Grade A means strong causal evidence of welfare impact. Grade F means no demonstrated benefit. The algorithm scores in milliseconds and can't be lobbied.",
    annualSavings: "$62M",
    savingsComparison:
      "The money is small. The real savings: bills scored in milliseconds instead of months, evidence-graded instead of politically pressured, and every citizen can verify the methodology.",
    wishoniaQuote:
      "275 humans spend months guessing what a bill will cost. The algorithm does it in 200 milliseconds and shows its work. But sure, let the humans keep guessing.",
    cardColor: "yellow",
  },
  domb: {
    id: "domb",
    dName: "Optimal Budget Generator",
    department: "Democracy",
    emoji: "💰",
    replaces: ["omb"],
    replacesAgencyName: "Office of Management and Budget",
    description:
      "535 politicians decide how to spend $6.8 trillion. None of them asked you. The eigenvector asks everyone.",
    tagline: "Find the cheapest high performer per budget category",
    deprecatedMetrics: [
      { metric: "Presidential Budget Proposal Completion", description: "500 staff spend a year writing a document that Congress ignores. The budget is decided by horse-trading, not analysis." },
      { metric: "Political Alignment of Allocations", description: "Money flows to districts of powerful committee chairs, not to where it produces the most welfare per dollar." },
      { metric: "Zero Citizens Consulted", description: "535 politicians decide how to spend $6.8 trillion. The number of citizens whose preferences are formally measured: zero." },
    ],
    optimalMetrics: [
      { metric: "Citizen Preference Satisfaction", description: "8 billion pairwise comparisons aggregated by eigenvector. The budget reflects what people actually want, not what lobbyists negotiated." },
      { metric: "Welfare per Dollar (Diminishing Returns)", description: "Each category funded to the point where the next dollar stops helping. Your government has never modelled diminishing returns." },
      { metric: "Cross-Country Efficiency Benchmarking", description: "Singapore spends $3K/person on healthcare and lives to 84. America spends $12K and lives to 78. The algorithm notices." },
    ],
    stats: [
      {
        value: "~500",
        label: "OMB Staff",
        description: "Employees preparing the President's annual budget proposal",
        color: "pink",
      },
      {
        value: "$120M",
        label: "Annual Budget",
        description: "Cost to run the Office of Management and Budget",
        color: "yellow",
      },
      {
        value: "535",
        label: "Politicians Deciding",
        description: "Members of Congress who approve the final budget through horse-trading",
        color: "cyan",
      },
      {
        value: "0",
        label: "Citizens Asked",
        description: "Number of citizens whose budget preferences are formally measured",
        color: "pink",
      },
    ],
    codeHeader: "535 politicians horse-trading → 8 billion citizens tapping",
    replacementCode: `// WishocraticTreasury.updateWeights() — replaces budget allocation
function updateWeights(
    bytes32[] calldata ids,       // Budget categories (education, health, etc.)
    uint256[] calldata weights,   // Eigenvector from citizen pairwise comparisons
    uint256 participants,         // How many citizens voted
    uint256 comparisons           // Total pairwise comparisons ("education or defense?")
) external {
    for (uint256 i = 0; i < ids.length; i++) {
        allocationWeights[ids[i]] = weights[i];  // Set each category's share
    }
    // Weights must sum to 10000 (100.00%)
    // ~10 taps per citizen → stable eigenvector → budget allocation
}
// No lobbying. No earmarks. No pork barrel. Just citizen preferences.`,
    codeLanguage: "solidity",
    codeExplanation:
      "Citizens do ~10 pairwise comparisons ('education or infrastructure?'). Eigenvector decomposition produces stable budget weights from millions of comparisons. The weights are published and funds are distributed proportionally. No lobbyists, no horse-trading.",
    annualSavings: "$120M",
    savingsComparison:
      "The real value: $6.8 trillion in federal spending allocated by citizen preferences instead of donor preferences. That's the largest reallocation of democratic power in history.",
    wishoniaQuote:
      "535 politicians decide how to spend $6.8 trillion. None of them asked you. The eigenvector asks everyone and costs nothing.",
    cardColor: "pink",
  },
  dcensus: {
    id: "dcensus",
    dName: "Decentralized Census Bureau",
    department: "Finance & Identity",
    emoji: "🌐",
    replaces: ["census"],
    replacesAgencyName: "United States Census Bureau",
    description:
      "You spend fourteen billion dollars to count everyone once every ten years. I return citizenCount() in fifty milliseconds.",
    tagline: "citizenCount() returns in 50ms — no $14B survey needed",
    deprecatedMetrics: [
      { metric: "Decennial Headcount Accuracy", description: "One count, every 10 years. Your entire congressional apportionment is based on data that's already 5 years stale on average." },
      { metric: "Survey Response Rate", description: "Declining every decade. The 2020 Census cost $14.2B and still missed ~5% of the population — disproportionately the poorest." },
      { metric: "Processing Time (8 Months)", description: "Data collection to published results: 8 months. By the time you see the data, it's already wrong." },
    ],
    optimalMetrics: [
      { metric: "Real-Time Population Count", description: "citizenCount() returns in 50ms. Updated the instant someone registers. Always current." },
      { metric: "Zero Undercount", description: "Registration is incentivized by UBI — if you want your monthly payment, you register. The hardest-to-reach populations have the strongest incentive." },
      { metric: "Continuous Demographic Data", description: "Census data isn't collected once a decade — it's a live stream. Policy decisions use this-morning's data, not last-decade's." },
    ],
    stats: [
      {
        value: "$14.2B",
        label: "2020 Census Cost",
        description: "Total cost of the most recent decennial census",
        color: "pink",
      },
      {
        value: "Once / Decade",
        label: "Frequency",
        description: "Constitutional mandate: count everyone every 10 years",
        color: "yellow",
      },
      {
        value: "~8 months",
        label: "Processing Time",
        description: "Time from data collection to published results",
        color: "cyan",
      },
      {
        value: "~5%",
        label: "Undercount Rate",
        description: "Estimated missed population in hard-to-reach communities",
        color: "pink",
      },
    ],
    codeHeader: "$14.2 billion + 10-year wait → 1 view function",
    replacementCode: `// UBIDistributor.citizenCount() — replaces the Census Bureau
function citizenCount() external view returns (uint256) {
    return citizenList.length;  // Real-time. Sybil-resistant. Free.
}

// Every citizen registers once with proof of unique personhood.
// The count updates instantly when someone registers.
// No door-to-door canvassing. No mail-in forms. No undercount.
// No $14.2 billion. Just one line that returns a number.`,
    codeLanguage: "solidity",
    codeExplanation:
      "Personhood verification gives each citizen one claim. When citizens register for UBI, the population count updates in real-time. No door-knocking, no mail-in forms, no processing delays, no undercount of marginalized communities.",
    annualSavings: "$1.4B/yr",
    savingsComparison:
      "Amortized annual cost of the Census. Plus: real-time data instead of decade-old snapshots. Plus: zero undercount because registration is incentivized by UBI.",
    wishoniaQuote:
      "You spend fourteen billion dollars to count everyone once every ten years. I return citizenCount() in fifty milliseconds. Every time someone asks.",
    cardColor: "green",
  },
  dih: {
    id: "dih",
    dName: "Decentralized Institutes of Health",
    department: "Health & Science",
    emoji: "🧬",
    replaces: ["nih", "fda", "hhs", "dea", "va"],
    replacesAgencyName: "National Institutes of Health + FDA",
    manualUrl: "https://manual.warondisease.org/knowledge/solution/dih.html",
    description:
      "You spend $47 billion a year on medical research and 3.3% of it funds actual trials. The rest funds grant proposals about trials. It's like buying 4.7 million cars and spending $1 on a mechanic.",
    tagline: "97% clinical trials, 3% overhead — the exact mirror of your NIH",
    deprecatedMetrics: [
      { metric: "Papers Published", description: "The NIH optimizes for publications, not patients. Scientists spend 50-67% of their time writing grant proposals instead of doing science." },
      { metric: "Grant Renewal Rate", description: "The incentive is to produce preliminary results that justify the next grant, not to produce cures. Cures end funding." },
      { metric: "Career Risk Minimization (FDA)", description: "Approving a drug that harms 100 people = career over. Delaying a drug that could save 100,000 = nobody notices. The FDA optimizes for the first risk, not the second." },
      { metric: "Pharma Profit Margins (FDA)", description: "8.2 years of exclusivity after safety is proven. Not because it takes that long — because the delay IS the business model." },
    ],
    optimalMetrics: [
      { metric: "Patients in Clinical Trials", description: "97% of budget on pragmatic trials, 3% on overhead. The exact mirror of the NIH. 30x more patients, 30x more data, 30x more cures." },
      { metric: "Median Healthy Life Expectancy (HALE)", description: "The only number that matters. Are people living longer without disease? Everything else is overhead." },
      { metric: "Cost per DALY Averted", description: "$0.84 per DALY averted with pragmatic trials. Traditional system: ~$50,000. A 60,000x efficiency gap." },
      { metric: "Time from Safety Proof to Patient Access", description: "Zero years. If it's proven safe, patients can access it. No 8.2-year queue while people die waiting." },
    ],
    stats: [
      {
        value: "$47B",
        label: "NIH Annual Budget",
        description: "Total annual funding for the National Institutes of Health",
        color: "pink",
      },
      {
        value: "3.3%",
        label: "Spent on Trials",
        description: "Share of NIH budget that actually funds clinical trials — ~$1.55B of $47B",
        color: "yellow",
      },
      {
        value: "$27,800",
        label: "Cost Per Patient (Traditional)",
        description: "Average cost per patient in a traditional randomized controlled trial",
        color: "cyan",
      },
      {
        value: "50-67%",
        label: "Scientists Writing Grants",
        description: "Share of researchers' time spent writing grant proposals instead of doing science",
        color: "pink",
      },
    ],
    codeHeader: "$27,800/patient traditional trials → $929/patient pragmatic trials (30x cheaper)",
    replacementCode: `// dIH allocation — replaces the NIH grant bureaucracy
// Instead of grant committees, funding follows patients.

function allocateSubsidy(patient) {
    const severity = diseaseDALYs(patient.condition);  // How severe is it?
    const subsidy = severity * SUBSIDY_PER_DALY;       // Funding proportional to burden
    return subsidy;                                     // Patient chooses which trial to join
}

// NIH: $47B/yr → 3.3% funds trials → $27,800/patient → 3-5% of cancer patients in trials
// dIH: 97% funds trials → $929/patient → 30x more patients → 30x more cures
//
// No grant committees. No 40-minute rejections. No 50% of scientists' time wasted.
// Sick people choose trials. Money follows them. Results get published. All of them.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Instead of scientists spending half their careers writing grant proposals that get 40 minutes of review, dIH subsidises patients directly. Funding is proportional to disease burden (DALYs). Patients choose which pragmatic trial to join. At $929/patient instead of $27,800, the same money runs 30x more trials with 30x more patients. All results — positive and negative — are published in an open data commons.",
    annualSavings: "$45.5B",
    savingsComparison:
      "Redirecting 97% of the NIH budget to pragmatic trials instead of grant bureaucracy. Same $47B, but 30x more patients treated, 30x more data generated, and scientists spend their time on science instead of paperwork.",
    wishoniaQuote:
      "Your scientists spend half their lives writing essays about why they should be allowed to try curing diseases. Then a committee spends forty minutes rejecting them. You spend $47 billion a year on this. 3.3% of it touches a patient. On my planet, we cured disease in year 340. We did not have grant committees.",
    cardColor: "cyan",
  },
  ddod: {
    id: "ddod",
    dName: "Department of Peace",
    department: "Security & Justice",
    emoji: "💀",
    replaces: ["dod", "tsa", "state"],
    replacesAgencyName: "Department of Defense (née Department of War)",
    manualUrl:
      "https://manual.warondisease.org/knowledge/solution/department-of-peace.html",
    description:
      "War is a negative-sum game and the spreadsheet agrees. We don't have a Department of War because — and I want to be precise here — war is fucking stupid.",
    tagline: "We don't have one",
    deprecatedMetrics: [
      { metric: "Defense Contractor Revenue", description: "$886B/year in US military spending. The top 5 contractors made $196B in 2023. Peace is bad for business." },
      { metric: "Geopolitical Influence", description: "800+ military bases in 80+ countries. The metric is 'presence' not 'outcome.' Nobody measures whether any of this makes anyone safer." },
      { metric: "Jobs in Congressional Districts", description: "The F-35 has parts made in 45 states. Not because it needs them — because that makes it impossible to cancel. The plane is a jobs program that occasionally flies." },
    ],
    optimalMetrics: [
      { metric: "Years Without Armed Conflict", description: "On Wishonia: 4,225 consecutive years. On Earth: 0. At no point in recorded history." },
      { metric: "Human Lives Not Ended", description: "4.5 million post-WWII deaths from US operations alone. The optimal number is zero." },
      { metric: "Resources Redirected to Health", description: "604:1 military-to-clinical-trial ratio. Redirect 1% and you fund the entire dFDA. Redirect 10% and you cure most diseases within a decade." },
    ],
    stats: [
      {
        value: "$2.72T",
        label: "Global Military/yr",
        description: "Annual global military spending (SIPRI 2024)",
        color: "pink",
      },
      {
        value: "604:1",
        label: "Mil : Clinical Trial Ratio",
        description: "Dollars on weapons per dollar on curing disease",
        color: "pink",
      },
      {
        value: "0.6×",
        label: "Military ROI",
        description: "Economic multiplier per dollar. Healthcare returns 3.5×.",
        color: "yellow",
      },
      {
        value: "4.5M+",
        label: "War Deaths Since 1945",
        description: "Post-WWII deaths from US military operations alone",
        color: "pink",
      },
    ],
    codeHeader: "The Department of Defense → 0 lines of code",
    replacementCode: `// There is no replacement code.
// You do not need automation to not kill people.
// That is the entire implementation.

// Dispute resolution: Wishocratic preference aggregation
// + binding arbitration scored by the Optimizer.
// Takes six minutes. Nobody dies.
// See: WishocraticTreasury.sol, Optimizer.ts`,
    codeLanguage: "solidity",
    codeExplanation:
      "War is a negative-sum game. Every participant ends up with less than they started with, including the 'winner.' Disputes are resolved with data, binding arbitration, and an optimisation function that finds the allocation where both parties are measurably better off.",
    annualSavings: "$2.72T",
    savingsComparison:
      "Enough to provide clean water for every human, end homelessness, fund all clinical trials, and eliminate hunger — and still have $2.4 trillion left over.",
    wishoniaQuote:
      "In 1947 they renamed the Department of War to the Department of Defense. The wars did not become more defensive. They just sounded nicer. Since the rebrand: 13+ wars, 0 defensive.",
    cardColor: "pink",
  },

  dcongress: {
    id: "dcongress",
    dName: "Open Congress",
    department: "Democracy",
    emoji: "🏛️",
    replaces: ["congress"],
    replacesAgencyName: "United States Congress",
    description:
      "Every citizen votes on the budget. Takes two minutes. Your Congress takes two years and still gets it wrong.",
    tagline: "Every citizen votes on the budget — takes two minutes",
    deprecatedMetrics: [
      { metric: "Bills Passed per Session", description: "Quantity of legislation, not quality of outcomes. A Congress that passes 300 bad laws is rated higher than one that passes 10 good ones." },
      { metric: "Re-Election Rate", description: "94% of incumbents win. The system optimizes for keeping its current occupants employed, not for producing good governance." },
      { metric: "Donor Satisfaction", description: "Campaign donors get 760% ROI on lobbying investments. Citizens get a 'thank you for your input' form letter." },
    ],
    optimalMetrics: [
      { metric: "Citizen Preference Alignment", description: "Does the budget match what 8 billion people actually want? Measured by Wishocratic pairwise comparison, not by what 535 people horse-traded." },
      { metric: "Welfare Outcome per Dollar", description: "Did the money produce more health, more income, less suffering? The only scorecard that matters." },
    ],
    stats: [
      { value: "535", label: "Members", description: "Humans deciding a $6.8T budget with no formal preference measurement", color: "pink" },
      { value: "94%", label: "Incumbency Rate", description: "Re-election rate for sitting members of Congress", color: "yellow" },
      { value: "~20%", label: "Approval Rating", description: "Public approval of Congress — lowest of any institution", color: "cyan" },
    ],
    codeHeader: "535 politicians horse-trading → 8 billion citizens tapping",
    replacementCode: `// Wishocracy — replaces Congressional budget allocation
// Citizens do ~10 pairwise comparisons ("education or defense?")
// Eigenvector decomposition produces stable budget weights
// See: WishocraticTreasury.updateWeights()`,
    codeLanguage: "solidity",
    codeExplanation:
      "Each citizen makes ~10 pairwise comparisons between budget priorities. Eigenvector aggregation produces a stable allocation that reflects the preferences of everyone who participated — not just the 535 who got elected.",
    annualSavings: "$0",
    savingsComparison:
      "The value isn't cost savings — it's $6.8 trillion in federal spending allocated by citizen preferences instead of donor preferences.",
    wishoniaQuote:
      "You elect 535 humans, send them to a building, and then act surprised when they do what their donors want instead of what you want. The system is working exactly as designed. Just not for you.",
    cardColor: "yellow",
  },

  dtreasury: {
    id: "dtreasury",
    dName: "Automated Treasury",
    department: "Finance & Identity",
    emoji: "💸",
    replaces: ["treasury", "irs", "fed", "ssa"],
    replacesAgencyName: "Treasury + IRS + Federal Reserve + Social Security",
    description:
      "0.5% transaction tax, UBI, and Wishocratic allocation — in one currency. Your seventy-four-thousand-page tax code is not invited.",
    tagline: "One currency, one tax, one safety net — no tax code required",
    deprecatedMetrics: [
      { metric: "Tax Revenue Collected", description: "The current system spends $546B/year in compliance costs to collect taxes. The overhead is the product." },
      { metric: "Inflation Target Met", description: "The Fed targets 2% annual theft from every paycheck and calls it 'price stability.'" },
      { metric: "Welfare Fraud Prevented", description: "Spending more catching the 1.5% who cheat than it would cost to just give everyone the money." },
    ],
    optimalMetrics: [
      { metric: "Revenue per Dollar of Overhead", description: "0.5% automatic transaction tax: same revenue, ~0% administrative cost." },
      { metric: "Poverty Rate", description: "UBI keeps everyone above the poverty line. No applications, no caseworkers, no cracks to fall through." },
      { metric: "Purchasing Power Stability", description: "0% inflation. Your money buys more over time, not less." },
    ],
    stats: [
      { value: "74,000", label: "Tax Code Pages", description: "Pages of Internal Revenue Code and regulations", color: "pink" },
      { value: "$546B", label: "Compliance Cost", description: "Annual cost of tax compliance in the US", color: "yellow" },
      { value: "80+", label: "Welfare Programs", description: "Overlapping federal means-tested welfare programs", color: "cyan" },
    ],
    codeHeader: "Four agencies → one currency protocol",
    replacementCode: `// WishToken.sol handles all four functions:
// 1. Currency (Wishes)
// 2. Tax (0.5% on every transfer → treasury)
// 3. Monetary policy (fixed supply, 0% inflation)
// 4. Welfare (UBI distribution to all verified citizens)
// See: WishToken.sol, UBIDistributor.sol, WishocraticTreasury.sol`,
    codeLanguage: "solidity",
    codeExplanation:
      "A single currency protocol replaces four government agencies. The 0.5% transaction tax replaces the IRS. Fixed supply replaces the Fed. UBI distribution replaces welfare. Wishocratic allocation replaces Congressional budgeting.",
    annualSavings: "$758B+",
    savingsComparison:
      "IRS compliance ($546B) + welfare admin overhead ($212B+) eliminated. Plus: 96% of purchasing power no longer stolen by inflation.",
    wishoniaQuote:
      "You have four agencies, 74,000 pages of rules, 83,000 employees, and 80 welfare programs — all doing what six lines of computer code do. And you wonder where your taxes go.",
    cardColor: "pink",
  },

  dfda: {
    id: "dfda",
    dName: "Decentralized FDA",
    department: "Health & Science",
    emoji: "💊",
    replaces: ["fda"],
    replacesAgencyName: "Food and Drug Administration",
    manualUrl:
      "https://manual.warondisease.org/knowledge/appendix/dfda-impact-paper.html",
    description:
      "Your FDA makes treatments wait 8.2 years AFTER they've been proven safe. Just sitting there. Being safe. While people die. This replaces the queue with maths.",
    tagline: "Real-time Outcome Labels & Treatment Rankings",
    deprecatedMetrics: [
      { metric: "Approval Queue Length", description: "8.2 years from safety proof to patient access. The delay IS the business model — it protects pharma exclusivity, not patients." },
      { metric: "Career Risk Minimization", description: "Approving a drug that harms 100 = career over. Blocking a drug that could save 100,000 = nobody notices. The FDA optimizes for the first." },
      { metric: "Regulatory Fee Revenue", description: "75% of drug review costs are paid by the companies being reviewed. The regulator is funded by the regulated." },
    ],
    optimalMetrics: [
      { metric: "Time from Safety Proof to Patient Access", description: "Zero. If it's proven safe, patients can access it immediately." },
      { metric: "Real-Time Outcome Labels", description: "Every treatment gets a continuously-updated label showing effectiveness, side effects, and optimal dosage from real-world data." },
      { metric: "Treatment Rankings by Condition", description: "For any condition, see all treatments ranked by effectiveness, safety, and confidence — updated in real-time." },
    ],
    stats: [
      { value: "8.2 yrs", label: "Efficacy Lag", description: "Average delay from safety proof to FDA approval", color: "pink" },
      { value: "102M", label: "Deaths in Queue", description: "Estimated deaths waiting for treatments already proven safe", color: "pink" },
      { value: "$2.6B", label: "Cost per Drug", description: "Average cost to bring one drug to market through the FDA process", color: "yellow" },
    ],
    codeHeader: "8.2-year queue → real-time outcome data",
    replacementCode: `// The dFDA replaces the approval queue with continuous evidence:
// Stage 1: Real-world evidence from existing data ($1/patient)
// Stage 2: Pragmatic trials in routine care ($929/patient)
// Every treatment gets an Outcome Label — updated in real-time
// See: dfda.earth for the full specification`,
    codeLanguage: "typescript",
    codeExplanation:
      "Instead of a binary approve/reject gate, treatments get continuously-updated Outcome Labels showing what actually happens when real humans take them. Doctors and patients see effectiveness, side effects, and confidence levels — from millions of data points, not a single trial of 200 people.",
    annualSavings: "$0",
    savingsComparison:
      "The value is measured in lives, not dollars. 102 million people died waiting for treatments that were already proven safe.",
    wishoniaQuote:
      "Your FDA has two speeds: 'not yet' and 'too late.' The queue exists because a bureaucrat who approves a drug that hurts 100 people gets fired, but a bureaucrat who blocks a drug that could save 100,000 gets promoted. The incentives are perfect — for killing people slowly.",
    cardColor: "cyan",
  },
  dedu: {
    id: "dedu",
    dName: "Learning Freedom Network",
    department: "Public Goods",
    emoji: "📚",
    replaces: ["doed"],
    replacesAgencyName: "Department of Education",
    description:
      "You turned schools into compliance factories and then acted surprised when the output looked like compliance. On my planet, funding follows the student, providers compete in the open, and nobody gets paid for producing paperwork instead of literacy.",
    tagline: "Portable student funding, open outcomes, and schools that compete to teach",
    deprecatedMetrics: [
      { metric: "Standardized Testing Throughput", description: "The revealed goal is making schools legible to Washington, not making children capable. Testing becomes the curriculum because compliance is what gets funded." },
      { metric: "Grant Capture", description: "Districts optimize for winning grants and satisfying federal reporting rules because that is what pays administrators and consultants." },
      { metric: "Seat-Time Compliance", description: "Twelve years in a chair counts as success even if the student leaves numerically illiterate and civically confused." },
    ],
    optimalMetrics: [
      { metric: "Mastery Growth per Student", description: "Reading, maths, writing, and civics growth relative to where the child started. The child is the unit of account." },
      { metric: "Parent and Student Retention", description: "If families can leave and do leave, the provider is not working. Competition is the accountability system." },
      { metric: "Teacher Time Spent Teaching", description: "Less time on grant forms, benchmark rituals, and compliance theatre. More time helping humans become competent adults." },
    ],
    stats: [
      {
        value: "$79.6B",
        label: "Annual Budget",
        description: "Federal Department of Education budget in 2024",
        color: "pink",
      },
      {
        value: "+124%",
        label: "Budget Growth",
        description: "Increase in budget since 2000 while scores stagnated",
        color: "yellow",
      },
      {
        value: "296",
        label: "NAEP Math Score",
        description: "Score for US 17-year-olds in 2024",
        color: "cyan",
      },
      {
        value: "36th",
        label: "Math Rank",
        description: "US rank in international maths comparisons cited by the dataset",
        color: "pink",
      },
    ],
    codeHeader: "$79.6B in central compliance -> portable student wallets + open mastery scores",
    replacementCode: `// LearningFreedomNetwork.ts — replaces central compliance with student-weighted funding
function fundStudent(student: StudentProfile) {
  const weightedAmount =
    BASE_EDU_DIVIDEND *
    (1 + povertyWeight(student) + disabilityWeight(student) + languageWeight(student));

  educationWallet.credit(student.id, weightedAmount);
}

function settleQuarter(studentId: string, providerId: string, masteryGrowth: number, familyRating: number) {
  const performanceBonus = outcomeBonus(masteryGrowth, familyRating);
  providerRegistry.pay(providerId, baseShare(studentId) + performanceBonus);
}
// Money follows the child. Providers keep students only by teaching them.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Each student receives a portable, weighted education budget. Any school, tutor co-op, apprenticeship, or online provider that accepts open reporting rules can compete for it. Providers keep students only by delivering measurable mastery growth and family satisfaction, not by capturing district boundaries or grant committees.",
    annualSavings: "$10B+",
    savingsComparison:
      "Delete federal grant churn, compliance vendors, and test-prep bureaucracy. The larger gain is that the same money finally buys learning instead of paperwork.",
    wishoniaQuote:
      "You built an education system that measures obedience better than competence. Then you wondered why it produces obedient incompetents.",
    cardColor: "yellow",
  },
  dmove: {
    id: "dmove",
    dName: "Human Mobility Network",
    department: "Security & Justice",
    emoji: "🚧",
    replaces: ["ice"],
    replacesAgencyName: "Immigration & Customs Enforcement + Customs and Border Protection",
    description:
      "You built a labour-market bottleneck, handed it to cartels, and then congratulated yourselves for buying more fencing. Movement should be lawful, legible, and too fast for smugglers to compete with.",
    tagline: "Fast legal entry, bonded sponsorship, and asylum in days, not years",
    deprecatedMetrics: [
      { metric: "Border Encounters Counted", description: "Every failed crossing becomes proof that you need more of the policy that produced the failed crossing. It is a self-licking lollipop made of razor wire." },
      { metric: "Detention Bed Occupancy", description: "A bureaucracy with full cages is graded as successful even when it worsens backlog, smuggling revenue, and family trauma." },
      { metric: "Political Optics", description: "The system optimizes for looking tough on television, not for orderly migration, lawful work, or lower cartel profits." },
    ],
    optimalMetrics: [
      { metric: "Time to Lawful Work Authorization", description: "If employers need labour and migrants need work, the system should clear them in days, not years." },
      { metric: "Smuggling Deaths and Cartel Revenue", description: "When the legal route is faster and cheaper than smugglers, both numbers collapse." },
      { metric: "Compliance and Net Contribution", description: "Track legal work, court appearance, and tax contribution instead of counting theatrical enforcement actions." },
    ],
    stats: [
      {
        value: "$29B",
        label: "Annual Budget",
        description: "Combined ICE and CBP budget in the dataset",
        color: "pink",
      },
      {
        value: "+190%",
        label: "Budget Growth",
        description: "Increase since 2003 while encounters ultimately rose",
        color: "yellow",
      },
      {
        value: "2.48M",
        label: "2023 Encounters",
        description: "Border encounters after two decades of escalation",
        color: "cyan",
      },
      {
        value: "5,500+",
        label: "Children Separated",
        description: "Known family separations under zero-tolerance policy",
        color: "pink",
      },
    ],
    codeHeader: "$29B in walls and cages -> instant triage + bonded entry",
    replacementCode: `// HumanMobilityNetwork.ts — lawful movement beats theatrical deterrence
function processEntrant(person: Entrant) {
  const identity = verifyBiometrics(person);
  if (!identity.uniqueHuman) return denyEntry("sybil_or_fraud");

  if (person.asylumClaim) {
    return asylumCourt.schedule(person, withinDays(7));
  }

  return mobilityExchange.issuePermit({
    personId: person.id,
    sponsorBondUsd: requiredBond(person),
    workAuthorization: "immediate",
    complianceCheckInDays: 30,
  });
}
// Keep violent-risk screening. Delete the backlog business model.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Violent-risk screening stays. Everyone else moves into a fast legal path: asylum gets an actual hearing within days, workers get immediate lawful permits backed by sponsor bonds and periodic check-ins. The economic value of smuggling collapses because the legal route becomes cheaper, faster, and easier to monitor.",
    annualSavings: "$10B+",
    savingsComparison:
      "Less detention, less wall theatre, fewer court backlogs, and less cartel rent extraction. The larger gain is lawful labour and lower human suffering.",
    wishoniaQuote:
      "If the illegal route is faster than the legal route, you do not have a border policy. You have a cartel subsidy.",
    cardColor: "cyan",
  },
  drest: {
    id: "drest",
    dName: "Restorative Justice Network",
    department: "Security & Justice",
    emoji: "⛓️",
    replaces: ["bop"],
    replacesAgencyName: "Bureau of Prisons",
    description:
      "Your prison system is a warehouse with uniforms. It is optimized to maximize time served, not safety restored, victim compensation, or the number of people who leave less broken than they arrived.",
    tagline: "Contain the dangerous, restore the rest, and pay victims first",
    deprecatedMetrics: [
      { metric: "Beds Filled", description: "A full prison is treated as evidence of vigilance rather than evidence of policy failure." },
      { metric: "Sentence Length", description: "The easiest thing to measure is how long someone can be held, so the bureaucracy optimizes for that instead of whether anyone is safer afterward." },
      { metric: "Guard and Contractor Employment", description: "Entire local economies are built around prison occupancy, making reform politically radioactive even when the results are terrible." },
    ],
    optimalMetrics: [
      { metric: "Victim Restitution Collected", description: "The first obligation of justice is to repair harm where possible, not to maximize warehousing." },
      { metric: "Recidivism After Release", description: "If the person comes back, the system failed. That is the whole scorecard." },
      { metric: "Violent-Risk Person-Years Contained", description: "Reserve high-cost secure confinement for the subset that remains demonstrably dangerous." },
    ],
    stats: [
      {
        value: "$8.5B",
        label: "Annual Budget",
        description: "Federal Bureau of Prisons budget in 2024",
        color: "pink",
      },
      {
        value: "160,000",
        label: "Federal Prisoners",
        description: "Approximate federal prison population in 2024",
        color: "yellow",
      },
      {
        value: "67%",
        label: "Recidivism",
        description: "Rough repeat-offense rate cited in the dataset commentary",
        color: "cyan",
      },
      {
        value: "$40K",
        label: "Per Prisoner Cost",
        description: "Approximate annual incarceration cost per federal prisoner",
        color: "pink",
      },
    ],
    codeHeader: "$8.5B warehouse -> restitution + monitored restoration + narrow secure containment",
    replacementCode: `// RestorativeJusticeNetwork.ts — prison is the last resort, not the default
function sentence(caseFile: CaseFile) {
  if (posesContinuingViolentRisk(caseFile)) {
    return secureContainment(caseFile);
  }

  return restorativePlan({
    restitutionShareBps: victimShare(caseFile),
    treatment: requiredPrograms(caseFile),
    workRequirement: calibratedEmployment(caseFile),
    libertyRestoredAt: milestoneDate(caseFile),
  });
}
// Dangerous people are contained. Everyone else owes repair, treatment, and proof.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Reserve prison beds for people who remain a continuing violent threat. Nonviolent and low-risk cases move into restitution, treatment, monitored work, and milestone-based restoration of liberty. Justice becomes cheaper because prison is no longer the default response to every failure.",
    annualSavings: "$4B+",
    savingsComparison:
      "High-cost prison beds become scarce and targeted. Victims get compensated, recidivism becomes the governing KPI, and taxpayers stop financing a failure factory at full scale.",
    wishoniaQuote:
      "If two-thirds of the people who leave your prisons come back, the building is not a correctional facility. It is a subscription service.",
    cardColor: "green",
  },
  depa: {
    id: "depa",
    dName: "Environmental Commons Exchange",
    department: "Public Goods",
    emoji: "🌱",
    replaces: ["epa"],
    replacesAgencyName: "Environmental Protection Agency",
    description:
      "The EPA is the rare Earth agency that occasionally remembers its job. The problem is not the goal. The problem is that you still regulate pollution with paper, waivers, and lawyer-hours when sensors and automatic prices would do the job faster and with fewer loopholes.",
    tagline: "Sensor-verified pollution pricing with citizen dividends",
    deprecatedMetrics: [
      { metric: "Permit Pages Filed", description: "The paperwork expands because paperwork is legible to bureaucracies even when the air is not improving fast enough." },
      { metric: "Waivers Negotiated", description: "Case-by-case exemptions are just rent-seeking with environmental branding." },
      { metric: "Enforcement Lag", description: "When pollution is measured quarterly and punished years later, the incentive is to pollute now and litigate later." },
    ],
    optimalMetrics: [
      { metric: "Measured Pollution per Capita", description: "What matters is what enters lungs, rivers, and soil, not how many forms were submitted." },
      { metric: "Cleanup Time to Compliance", description: "If a site is out of bounds, the system should push it back in bounds quickly and automatically." },
      { metric: "Citizen Environmental Dividend", description: "If a firm uses scarce environmental capacity, the public should receive the rents, not the lobbyists." },
    ],
    stats: [
      {
        value: "$10.1B",
        label: "Annual Budget",
        description: "EPA budget in 2024",
        color: "pink",
      },
      {
        value: "-69%",
        label: "Bad-Air Days",
        description: "National unhealthy-air days fell from 35 to 11 since 2000",
        color: "yellow",
      },
      {
        value: "11",
        label: "Unhealthy Air Days",
        description: "National average days above AQI 100 in 2024",
        color: "cyan",
      },
      {
        value: "B",
        label: "Current Grade",
        description: "One of the few agencies already moving the metric in the right direction",
        color: "green",
      },
    ],
    codeHeader: "Permit binders -> real-time emission meters and automatic charges",
    replacementCode: `// EnvironmentalCommonsExchange.ts — the meter writes the invoice
function settleEmission(sourceId: string, pollutant: Pollutant, kilograms: number) {
  const fee = kilograms * marketPrice(pollutant, region(sourceId));
  treasury.collect(sourceId, fee);
  ecoDividend.credit(region(sourceId), fee);

  if (exceedsHardCap(sourceId, pollutant)) {
    enforcementRelay.pause(sourceId);
  }
}
// Measure. Charge. Rebate. Stop negotiating with the plume.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Meters replace self-reporting. Emitters pay automatically based on measured pollution, not negotiated paperwork, and citizens receive the rents. The state keeps the public-goods role of defining caps and measuring harm while deleting much of the discretionary permit theatre that invites capture.",
    annualSavings: "$1B+",
    savingsComparison:
      "Keep the good part - actual environmental improvement - and delete slow permit churn, waiver markets, and a large share of the paper bureaucracy around them.",
    wishoniaQuote:
      "This is the one agency where your numbers mostly go the right direction. So naturally you still chose the slowest possible mechanism.",
    cardColor: "green",
  },
  dinvest: {
    id: "dinvest",
    dName: "Open Investigation Bureau",
    department: "Security & Justice",
    emoji: "🔎",
    replaces: ["fbi"],
    replacesAgencyName: "Federal Bureau of Investigation",
    description:
      "Your federal investigators solve barely half your murders, yet still find time for secret files, political spectacle, and bureaucratic turf wars. Investigation should optimize for solved serious crime, admissible evidence, and low wrongful-conviction rates - not institutional mystique.",
    tagline: "Forensics first, political discretion last",
    deprecatedMetrics: [
      { metric: "Classified File Volume", description: "The bureau accumulates information because information accumulation is legible power even when it does not solve cases." },
      { metric: "Counterterror Theatre", description: "Expensive post-9/11 optics displaced ordinary casework that citizens actually experience as safety." },
      { metric: "Political Leverage", description: "A system that can quietly threaten public figures or leak strategically is optimizing for influence, not justice." },
    ],
    optimalMetrics: [
      { metric: "Violent-Crime Clearance Rate", description: "If you cannot solve murders, you do not have a public-safety institution. You have a file cabinet." },
      { metric: "Wrongful Conviction Rate", description: "An investigation system that solves crimes by ruining innocent people is just crime with stationery." },
      { metric: "Time to Admissible Evidence", description: "Evidence should become usable faster than rumours spread." },
    ],
    stats: [
      {
        value: "$11.3B",
        label: "Annual Budget",
        description: "FBI budget in 2024",
        color: "pink",
      },
      {
        value: "52%",
        label: "Murder Clearance",
        description: "Nearly half of murders still go unsolved",
        color: "yellow",
      },
      {
        value: "48%",
        label: "Unsolved Murders",
        description: "Share of murders not cleared in the current data",
        color: "cyan",
      },
      {
        value: "+232%",
        label: "Budget Growth",
        description: "Increase since 2000 while clearance worsened",
        color: "pink",
      },
    ],
    codeHeader: "$11.3B in secret files -> open evidence chains + solve bounties",
    replacementCode: `// OpenInvestigationBureau.ts — every serious case gets a tamper-evident evidence graph
function assignCase(caseId: string) {
  const evidenceGraph = chainOfCustody(caseId);
  const rankedLeads = forensicsNetwork.rankLeads(evidenceGraph);
  const solveBounty = publicSafetyTreasury.post(caseId);

  return caseRouter.dispatch(caseId, rankedLeads, solveBounty);
}
// Reward validated leads and solved serious crime. Penalize bad arrests.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Every serious case gets a tamper-evident evidence graph, independent lab access, and solve bounties for validated leads. Funding follows solved violent crime and admissible evidence, while wrongful arrests and low-yield political theatre are penalized instead of rewarded.",
    annualSavings: "$5B+",
    savingsComparison:
      "Less duplicated bureaucracy, less secrecy theatre, fewer politically motivated investigations, and more of the budget redirected toward actual forensic resolution.",
    wishoniaQuote:
      "Half your murders go unsolved. That would already be embarrassing without the budget tripling while it happened.",
    cardColor: "cyan",
  },
  dcyber: {
    id: "dcyber",
    dName: "Protocol Security Agency",
    department: "Security & Justice",
    emoji: "🛡️",
    replaces: ["cyber"],
    replacesAgencyName: "Cybersecurity Bureaucracy (CISA + FBI Cyber Division)",
    description:
      "Cybersecurity by checklist is just paperwork with a login screen. If losses keep compounding much faster than budgets, the system is protecting procurement, not users.",
    tagline: "Mandatory breach bonds, auto-patching, and public bug bounties",
    deprecatedMetrics: [
      { metric: "Compliance Checklist Completion", description: "The system rewards looking secure on paper, which is ideal if your threat model is an auditor with a clipboard." },
      { metric: "After-Action Press Releases", description: "Breaches become content instead of treated as priced failures that should have been prevented." },
      { metric: "Threat Intel Hoarding", description: "Critical information is trapped in institutional silos because owning the secret becomes more valuable than fixing the flaw." },
    ],
    optimalMetrics: [
      { metric: "Losses Prevented per Dollar", description: "The real KPI is avoided theft, not how many awareness PDFs were distributed." },
      { metric: "Patch Half-Life", description: "How quickly known exploitable flaws get removed from the live system." },
      { metric: "Breach Bond Payouts", description: "If operators underinvest, users should be compensated automatically. Security should be priced, not merely requested." },
    ],
    stats: [
      {
        value: "$4.1B",
        label: "Annual Budget",
        description: "CISA + FBI cyber spending in 2024 data",
        color: "pink",
      },
      {
        value: "$16.6B",
        label: "Reported Losses",
        description: "Cybercrime losses reported to IC3 in 2024",
        color: "yellow",
      },
      {
        value: "859,532",
        label: "Complaints",
        description: "Cybercrime complaints reported to IC3 in 2024",
        color: "cyan",
      },
      {
        value: "+1409%",
        label: "Loss Growth",
        description: "Increase in reported losses since 2015",
        color: "pink",
      },
    ],
    codeHeader: "$4.1B in cyber theatre -> secure defaults + breach bonds",
    replacementCode: `// ProtocolSecurityAgency.ts — critical systems do not get to opt out of basic hygiene
function authorizeCriticalService(service: ServiceConfig) {
  require(service.passkeysEnabled);
  require(service.autoUpdateWindowHours <= 24);
  require(service.breachBondUsd >= minimumBond(service.users));

  bugBountyRegistry.open(service.id);
}
// Default-secure systems only. Insecure operators post collateral.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Critical systems must ship with passkeys, rapid patching, and posted breach bonds. Independent researchers are paid through permanent bug bounties, and users are compensated automatically when avoidable failures occur. Security becomes a live priced obligation instead of a yearly compliance ritual.",
    annualSavings: "$10B+",
    savingsComparison:
      "A smaller bureaucracy and far fewer avoidable losses. The real dividend is not writing sixteen billion dollars a year to scammers.",
    wishoniaQuote:
      "If reported cyber losses go from one billion to sixteen billion while your budget merely doubles, you are not defending the network. You are narrating its collapse.",
    cardColor: "pink",
  },
  dagri: {
    id: "dagri",
    dName: "Food Resilience Exchange",
    department: "Public Goods",
    emoji: "🌾",
    replaces: ["usda"],
    replacesAgencyName: "USDA Subsidy Complex",
    description:
      "You subsidize monoculture, inflate land prices, and then act surprised when small farms die and food gets expensive. Agriculture should optimize for nutrition, resilience, and farm entry - not lobbying acreage.",
    tagline: "Pay for nutrition and resilience, not politically favored crops",
    deprecatedMetrics: [
      { metric: "Subsidy Dollars to Incumbent Acreage", description: "Historical acreage becomes a claim on the treasury because incumbency is easier to measure than public value." },
      { metric: "Commodity Glut Management", description: "The system pays to overproduce politically connected crops and then pays again to manage the consequences." },
      { metric: "Farm Bill Coalition Preservation", description: "Subsidies are designed to keep a legislative coalition together, not to keep food affordable or farms resilient." },
    ],
    optimalMetrics: [
      { metric: "Nutrition-Adjusted Food Affordability", description: "The public goal is cheap healthy calories, not record corn mountains." },
      { metric: "Farm Entry and Survival", description: "If only incumbents can survive, the market is rigged even before the seeds are planted." },
      { metric: "Soil and Water Resilience", description: "Agricultural subsidies should buy durable public goods like soil quality, water retention, and supply stability." },
    ],
    stats: [
      {
        value: "$36.5B",
        label: "Annual Subsidies",
        description: "Farm support spending in 2024 data",
        color: "pink",
      },
      {
        value: "78%",
        label: "Top 10% Capture",
        description: "Share of subsidies going to the largest farms",
        color: "yellow",
      },
      {
        value: "1.9M",
        label: "US Farms Left",
        description: "Approximate number of farms in 2024",
        color: "cyan",
      },
      {
        value: "+83%",
        label: "Food CPI Growth",
        description: "Food prices rose 83% since 2000 despite heavy subsidies",
        color: "pink",
      },
    ],
    codeHeader: "Farm-bill earmarks -> open resilience auctions + nutrition markets",
    replacementCode: `// FoodResilienceExchange.ts — support is purchased, not inherited
function allocateFarmSupport(parcel: Parcel) {
  return reverseAuction.award({
    parcelId: parcel.id,
    outcomes: ["soil_health", "water_retention", "nutrition_supply"],
    paymentCapUsd: benchmark(parcel.region),
  });
}
// Public money buys resilience and nutrition outcomes, not incumbent acreage.`,
    codeLanguage: "typescript",
    codeExplanation:
      "Farm support is purchased through open outcome contracts for resilience, nutrition supply, and ecosystem services instead of permanent commodity entitlements. Small entrants can compete because payment follows delivered public value, not historical acreage and congressional seniority.",
    annualSavings: "$20B+",
    savingsComparison:
      "Stop paying the largest incumbents for crops they would grow anyway. Use a fraction of current subsidies to buy real resilience, better nutrition, and lower food prices.",
    wishoniaQuote:
      "If seventy-eight percent of the money goes to the top ten percent of farms, the programme is not agricultural policy. It is aristocracy with tractors.",
    cardColor: "yellow",
  },
  dhome: {
    id: "dhome",
    dName: "Housing Abundance Exchange",
    department: "Public Goods",
    emoji: "🏠",
    replaces: ["hud"],
    replacesAgencyName: "Department of Housing and Urban Development",
    description:
      "You tried to solve housing scarcity with subsidies layered on top of scarcity. That mostly raises the price of the scarce thing. The durable cure is to legalize building, price land honestly, and stop rewarding people for blocking homes other people need.",
    tagline: "Legalize building, tax land rents, and keep homelessness near zero",
    deprecatedMetrics: [
      { metric: "Voucher Waitlist Length", description: "A two-year waitlist is treated as proof of demand rather than proof that the system is rationing scarcity." },
      { metric: "Units Subsidized", description: "Counting subsidized units ignores whether enough total homes exist where people actually want to live." },
      { metric: "Home-Price Inflation Preserved", description: "Local vetoes and subsidy layering protect incumbent landowners while pretending to help renters." },
    ],
    optimalMetrics: [
      { metric: "Homes Added in High-Demand Areas", description: "If you want cheaper housing, build housing where jobs and people are." },
      { metric: "Rent-to-Income Ratio", description: "The public goal is that normal people can afford shelter without financial self-harm." },
      { metric: "Unsheltered Homelessness", description: "A housing system that works should keep this number close to zero." },
    ],
    stats: [
      {
        value: "$73B",
        label: "Annual Budget",
        description: "HUD budget in 2024",
        color: "pink",
      },
      {
        value: "653K",
        label: "Homeless Count",
        description: "2023 point-in-time homeless population",
        color: "yellow",
      },
      {
        value: "2+ yrs",
        label: "Voucher Waitlists",
        description: "Typical wait length in many cities for Section 8 support",
        color: "cyan",
      },
      {
        value: "+137%",
        label: "Budget Growth",
        description: "Increase since 2000 while homelessness hit a record",
        color: "pink",
      },
    ],
    codeHeader: "$73B in scarcity management -> by-right building + land-rent rebates",
    replacementCode: `// HousingAbundanceExchange.ts — scarcity is not a housing policy
function approveHousing(parcel: Parcel) {
  if (nearJobsOrTransit(parcel)) {
    return permitByRight(parcel, standardSafetyCode);
  }
  return localReview(parcel);
}

function settleLandRent(parcel: Parcel) {
  const charge = assessedLandValue(parcel) * LAND_RENT_RATE;
  treasury.collect(parcel.owner, charge);
  housingDividend.credit(parcel.region, charge);
}
// Build more where demand exists. Tax the land rent, not the homes.`,
    codeLanguage: "typescript",
    codeExplanation:
      "The only durable cure for housing inflation is more homes in the places people need them. The protocol legalizes abundant building where demand exists, taxes land rents instead of structure improvement, and uses the proceeds to cushion transitions and keep homelessness rare.",
    annualSavings: "$25B+",
    savingsComparison:
      "Less voucher churn, fewer waitlists, lower rent extraction, and far fewer people cycling through the expensive emergency side of homelessness policy.",
    wishoniaQuote:
      "If your housing policy can spend seventy-three billion dollars while homelessness hits a record high, the policy is not missing the point. The policy is the point.",
    cardColor: "cyan",
  },
  dsafety: {
    id: "dsafety",
    dName: "Worker Safety Mutual",
    department: "Public Goods",
    emoji: "🦺",
    replaces: ["osha"],
    replacesAgencyName: "Occupational Safety and Health Administration",
    description:
      "Safety should be enforced by sensors, insurance pricing, and automatic shutdowns - not by binders full of rules inspected once in a geological era. The point is fewer dead workers, not prettier compliance manuals.",
    tagline: "Real-time risk pricing beats paperwork compliance",
    deprecatedMetrics: [
      { metric: "Inspection Quotas", description: "The bureaucracy optimizes for how many sites it touched, not how many hazards disappeared." },
      { metric: "Citation Volume", description: "A citation is a receipt for a problem discovered after the risk already existed." },
      { metric: "Rulebook Thickness", description: "Longer compliance manuals look like diligence even when workers still get maimed at the same plants." },
    ],
    optimalMetrics: [
      { metric: "Fatality and Serious Injury Rate", description: "The only scorecard that matters is whether workers go home intact." },
      { metric: "Hazard Correction Latency", description: "How fast a dangerous condition is fixed after it becomes measurable." },
      { metric: "Risk-Priced Premiums", description: "Dangerous worksites should pay immediately through insurance and downtime, not years later after a hearing." },
    ],
    stats: [
      {
        value: "$632M",
        label: "Annual Budget",
        description: "OSHA budget in 2024",
        color: "pink",
      },
      {
        value: "3.5",
        label: "Fatalities / 100K",
        description: "Workplace fatality rate in 2024",
        color: "yellow",
      },
      {
        value: "-19%",
        label: "Rate Improvement",
        description: "Fatality-rate decline since 2000",
        color: "cyan",
      },
      {
        value: "70%",
        label: "Pre-OSHA Decline",
        description: "Fatality-rate drop from 1900 to OSHA's creation in 1970",
        color: "pink",
      },
    ],
    codeHeader: "Annual inspections -> sensor feeds + automatic premium shocks",
    replacementCode: `// WorkerSafetyMutual.ts — the dangerous machine does not wait for paperwork
function priceWorksite(site: Worksite) {
  const hazardScore = sensorNet.score(site) + incidentHistory(site);
  insurancePool.setPremium(site.id, hazardScore);

  if (hazardScore > shutdownThreshold) {
    safetyRelay.pause(site.id);
  }
}
// High-risk worksites pay now. The safe ones stop funding clipboard theatre.`,
    codeLanguage: "typescript",
    codeExplanation:
      "High-risk worksites pay immediately through premiums, downtime, and public dashboards. Low-risk worksites stop filling binders for inspectors. The incentive to hide hazards disappears when sensors and insurance reprice them in real time and dangerous equipment can be paused automatically.",
    annualSavings: "$200M+",
    savingsComparison:
      "A smaller compliance bureaucracy, lower litigation, and fewer injuries paid for after the fact. The real gain is preventing deaths before they become paperwork.",
    wishoniaQuote:
      "If your safety agency checks the rulebook once a year, but the machine can remove a hand in half a second, the machine is setting policy.",
    cardColor: "green",
  },
} satisfies Record<string, WishoniaAgency>;

/** Backwards-compatible array (derived from AGENCIES record). */
export const WISHONIA_AGENCIES: WishoniaAgency[] = Object.values(AGENCIES);

/** Look up an agency by ID. Use `AGENCIES.dfed` for known IDs instead. */
export function getWishoniaAgency(id: string): WishoniaAgency | undefined {
  return (AGENCIES as Record<string, WishoniaAgency>)[id];
}

export function getWishoniaAgencies(): WishoniaAgency[] {
  return WISHONIA_AGENCIES;
}

export function getWishoniaReplacementFor(earthAgencyId: string): WishoniaAgency | undefined {
  return WISHONIA_AGENCIES.find(a => a.replaces.includes(earthAgencyId));
}

const DEPARTMENT_ORDER: WishoniaDepartment[] = [
  "Democracy",
  "Finance & Identity",
  "Health & Science",
  "Public Goods",
  "Security & Justice",
];

export function getAgenciesByDepartment(): { label: WishoniaDepartment; agencies: WishoniaAgency[] }[] {
  return DEPARTMENT_ORDER.map(dept => ({
    label: dept,
    agencies: WISHONIA_AGENCIES.filter(a => a.department === dept),
  }));
}
