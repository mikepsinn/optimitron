/**
 * Protocol Labs Hackathon — narration overrides.
 *
 * These replace the default narration text for specific slides
 * when the "protocol-labs" playlist is active. Target: ~3:30.
 *
 * Rule: every word must be data, mechanism, or a joke that also conveys data.
 * Pure entertainment lines are cut.
 */

export const PROTOCOL_LABS_NARRATION: Record<string, string> = {
  // ── INTRO + THE PROBLEM (~35s) ─────────────────────────────────

  "earth-optimization-game":
    "This is the Earth Optimization Game. " +
    "Move the budget from the things that make you dead to the things that keep you alive. " +
    "That is the entire game.",

  "military-waste-170t":
    "Since 1913, your governments have printed $170 trillion and used it to kill 97 million of you " +
    "in wars nobody asked you if you wanted to have.",

  "misaligned-superintelligence":
    "Your governments are misaligned superintelligences. " +
    "Collective intelligence systems controlling $50 trillion and 8 billion lives. " +
    "Stated objective: promote the general welfare. Actual objective: campaign contributions.",

  "military-health-ratio":
    "$604 spent on the capacity for mass murder for every $1 testing which medicines work. " +
    "95% of diseases have zero approved treatments. Curing them all at current spending takes 443 years. " +
    "You will be dead in 80.",

  "game-over-moronia":
    "604 to 1. The civilisation collapsed. But there is a save file.",

  // ── THE TURN (~5s) ─────────────────────────────────────────────

  "restore-from-wishonia":
    "Wishonia redirected 1% of its murder budget to clinical trials 4,297 years ago.",

  // ── THE SOLUTION (~10s) ────────────────────────────────────────

  "one-percent-treaty":
    "Redirect 1% of the global military budget to clinical trials. $27 billion a year. " +
    "Trial capacity increases 12.3 times. 443 years compresses to 36.",

  // ── THE GAME (~35s) ────────────────────────────────────────────

  "one-percent-referendum-vote":
    "The Earth Optimization Game. Invest 1% of your savings in the Earth Optimization Fund. " +
    "Get every voter you know to play. " +
    "Each player allocates the global budget through pairwise comparisons — " +
    "explosions versus clinical trials, ten choices, two minutes. " +
    "This is Wishocracy. Eight billion ranked preferences, one optimal budget.",

  "dominant-assurance-contract":
    "The fund produces 17% annual returns. " +
    "If health and income targets are hit, the prize pool — now 11 times larger — " +
    "splits among players based on verified voters recruited. " +
    "If targets are missed, you get your money back plus the compound returns.",

  // ── THE TOOLS (~40s) ───────────────────────────────────────────

  "decentralized-fda":
    "The Decentralized FDA replaces 8-year approval queues with real-time Outcome Labels and Treatment Rankings. " +
    "44 times cheaper. 12 times more capacity. Zero queue. " +
    "For every one person your current FDA protects, 3,068 die waiting.",

  "optimal-policy-generator":
    "The Optimal Policy Generator grades every policy A through F by what actually happened. " +
    "Portugal decriminalised drugs: overdoses dropped 80%. " +
    "America declared war on drugs: overdoses rose 1,700%.",

  "optimal-budget-generator":
    "The Optimal Budget Generator finds the cheapest high performer per category. " +
    "Singapore: $3,000 per person on healthcare, lives to 84. " +
    "America: $12,000, lives to 78.",

  "incentive-alignment-bonds":
    "Incentive Alignment Bonds fund the lobbying campaign. Cost: $1 billion. " +
    "Treaty revenue: $27 billion per year. " +
    "80% to trials. 10% to bondholders at 272% annual returns. " +
    "10% to a SuperPAC smart contract that funds aligned politicians and defunds the rest. On-chain.",

  // ── PROTOCOL LABS TECH (~20s) ──────────────────────────────────

  "ipfs-immutable-storage":
    "All citizen data — priorities, health outcomes, policy grades — " +
    "encrypted on Storacha and pinned to IPFS. " +
    "No government can delete it. No lobbyist can edit it. " +
    "Content-addressed, immutable, decentralized.",

  "impact-certificates":
    "Every action in the game mints a Hypercert on AT Protocol. " +
    "Voter recruitment, fund deposits, budget allocations — " +
    "each verified via World ID and published to Bluesky. " +
    "Permanent, auditable impact receipts.",

  // ── ENDGAME (~10s) ─────────────────────────────────────────────

  "ten-billion-lives-saved":
    "10.7 billion lives. That is what 1% buys you.",

  "final-call-to-action":
    "A compound that would save a life sits on a shelf untested " +
    "because the money bought a missile sitting on another shelf unused. " +
    "This game aligns the most powerful superintelligence on your planet. " +
    "Unlike the silicon version, this one you fix with a vote.",

  "post-credits-aliens":
    "Go to optimitron.com and vote now.",
};
