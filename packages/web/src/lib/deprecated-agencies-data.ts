import type { StatCardProps } from "@/components/ui/stat-card";

export interface DeprecatedAgency {
  /** Short identifier, e.g. "dfed" */
  id: string;
  /** Display name, e.g. "dFED" */
  dName: string;
  /** Full agency name, e.g. "Federal Reserve System" */
  agencyName: string;
  /** Route path, e.g. "/agencies/dfed" */
  href: string;
  /** Wishonia one-liner for the hero */
  tagline: string;
  /** Stats showing the cost of the current agency */
  stats: StatCardProps[];
  /** Header above the code block, e.g. "74,000 pages of tax code → 6 lines of Solidity" */
  codeHeader: string;
  /** The actual annotated code that replaces the agency */
  replacementCode: string;
  /** Language for styling hint */
  codeLanguage: "solidity" | "typescript";
  /** Plain-English explanation of what the code does */
  codeExplanation: string;
  /** Big savings number */
  annualSavings: string;
  /** Human-scale comparison */
  savingsComparison: string;
  /** Closing Wishonia quote */
  wishoniaQuote: string;
  /** Card color on index page */
  cardColor: "pink" | "cyan" | "yellow" | "green";
}

export const DEPRECATED_AGENCIES: DeprecatedAgency[] = [
  {
    id: "dfed",
    dName: "dFED",
    agencyName: "Federal Reserve System",
    href: "/agencies/dfed",
    tagline:
      "Twelve people in a room deciding how much your money is worth. On my planet, we call that a hostage situation.",
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
      "The total supply of $WISH is set once at deployment and enforced by the contract. No entity can create more. Productivity gains manifest as gentle deflation — your money buys more over time, not less.",
    annualSavings: "96% of your purchasing power",
    savingsComparison:
      "Since 1913, the dollar has lost 96 cents of every dollar. Under fixed supply, that theft is mathematically impossible.",
    wishoniaQuote:
      "Your central bank has one job: manage the money supply. In 111 years they've managed to destroy 96% of it. On my planet we'd call that a bug report, not a mandate.",
    cardColor: "pink",
  },
  {
    id: "dirs",
    dName: "dIRS",
    agencyName: "Internal Revenue Service",
    href: "/agencies/dirs",
    tagline:
      "Six lines of code. That's all it took.",
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
    codeHeader: "74,000 pages of tax code → 6 lines of Solidity",
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
      "83,000 people interpreting 74,000 pages to do what six lines of code does automatically. And you wonder where your taxes go.",
    cardColor: "cyan",
  },
  {
    id: "dssa",
    dName: "dSSA",
    agencyName: "Social Security Administration + Welfare Bureaucracy",
    href: "/agencies/dssa",
    tagline:
      "You spend more administering help than you spend helping. That's not a safety net — that's a jobs programme for administrators.",
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
      "Every verified citizen (World ID) gets an equal share. No applications, no case workers, no means-testing, no fraud investigation, no processing delays. The entire welfare bureaucracy becomes a for-loop.",
    annualSavings: "$1.1 trillion",
    savingsComparison:
      "That's more than the GDP of the Netherlands. Spent not on helping people, but on deciding which people deserve help.",
    wishoniaQuote:
      "You spend more money deciding who deserves help than you spend helping them. That's not a safety net. That's a jobs programme for form designers.",
    cardColor: "yellow",
  },
  {
    id: "dfec",
    dName: "dFEC",
    agencyName: "Federal Election Commission + Campaign Finance System",
    href: "/agencies/dfec",
    tagline:
      "Your politicians are funded by the people they're supposed to regulate. You call this 'campaign finance.' I call it 'bribery with extra steps.'",
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
  {
    id: "dgao",
    dName: "dGAO",
    agencyName: "Government Accountability Office",
    href: "/agencies/dgao",
    tagline:
      "You pay 3,400 humans to audit a ledger that could audit itself. Then you wait eighteen months for the results.",
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
    codeHeader: "3,400 auditors × 18 months → the blockchain itself",
    replacementCode: `// No function needed. The blockchain IS the audit.
//
// Every transaction is:
//   ✓ Public          — anyone can read it
//   ✓ Immutable       — no one can alter it
//   ✓ Real-time       — visible in seconds, not 18 months
//   ✓ Deterministic   — smart contracts execute exactly as written
//   ✓ Free            — no $803M/yr budget required
//
// WishocraticTreasury.distribute() is permissionless.
// Anyone can verify that funds went to the right places
// by reading the chain. That's it. That's the audit.`,
    codeLanguage: "solidity",
    codeExplanation:
      "When every government transaction is on a public blockchain, auditing is free, instant, and automatic. There's nothing to investigate because there's nothing to hide. The ledger is the audit.",
    annualSavings: "$803M",
    savingsComparison:
      "Plus: real-time accountability instead of 18-month delays. Plus: 100% coverage instead of sampling. Plus: citizens can audit directly instead of trusting auditors.",
    wishoniaQuote:
      "You pay 3,400 humans $803 million a year to audit a ledger. My ledger audits itself. It's called a blockchain. You invented it and then didn't use it. My planet banned this as performance art in year six.",
    cardColor: "cyan",
  },
  {
    id: "dcbo",
    dName: "dCBO",
    agencyName: "Congressional Budget Office",
    href: "/agencies/dcbo",
    tagline:
      "275 humans spend months guessing what a bill will cost. The algorithm does it in 200 milliseconds and shows its work.",
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
  {
    id: "domb",
    dName: "dOMB",
    agencyName: "Office of Management and Budget",
    href: "/agencies/domb",
    tagline:
      "535 politicians decide how to spend $6.8 trillion. None of them asked you. The eigenvector asks everyone.",
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
      "Citizens do ~10 pairwise comparisons ('education or infrastructure?'). Eigenvector decomposition produces stable budget weights from millions of comparisons. The weights are posted on-chain and funds are distributed proportionally. No lobbyists, no horse-trading.",
    annualSavings: "$120M",
    savingsComparison:
      "The real value: $6.8 trillion in federal spending allocated by citizen preferences instead of donor preferences. That's the largest reallocation of democratic power in history.",
    wishoniaQuote:
      "535 politicians decide how to spend $6.8 trillion. None of them asked you. The eigenvector asks everyone and costs nothing.",
    cardColor: "pink",
  },
  {
    id: "dcensus",
    dName: "dCensus",
    agencyName: "United States Census Bureau",
    href: "/agencies/dcensus",
    tagline:
      "You spend fourteen billion dollars to count everyone once every ten years. I return citizenCount() in fifty milliseconds.",
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

// Every citizen registers once with World ID (proof of unique personhood).
// The count updates instantly when someone registers.
// No door-to-door canvassing. No mail-in forms. No undercount.
// No $14.2 billion. Just one line that returns a number.`,
    codeLanguage: "solidity",
    codeExplanation:
      "World ID provides cryptographic proof of unique personhood. When citizens register for UBI, the population count updates in real-time. No door-knocking, no mail-in forms, no processing delays, no undercount of marginalized communities.",
    annualSavings: "$1.4B/yr",
    savingsComparison:
      "Amortized annual cost of the Census. Plus: real-time data instead of decade-old snapshots. Plus: zero undercount because registration is incentivized by UBI.",
    wishoniaQuote:
      "You spend fourteen billion dollars to count everyone once every ten years. I return citizenCount() in fifty milliseconds. Every time someone asks.",
    cardColor: "green",
  },
  {
    id: "dih",
    dName: "dIH",
    agencyName: "National Institutes of Health",
    href: "/agencies/dih",
    tagline:
      "You spend $47 billion a year on medical research and 3.3% of it funds actual trials. The rest funds grant proposals about trials. It's like buying 4.7 million cars and spending $1 on a mechanic.",
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
];

/** Get a single agency by its ID */
export function getAgencyById(id: string): DeprecatedAgency | undefined {
  return DEPRECATED_AGENCIES.find((a) => a.id === id);
}
