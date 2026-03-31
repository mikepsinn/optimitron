# Funding The Commons — Submission

## Summary

Governments spend $604 on military for every $1 on clinical trials. 150,000 people die from treatable diseases every day. The treatment queue is 443 years long.

Optimitron is the Earth Optimization Game — open-source public-goods infrastructure that turns this into a solvable coordination problem. Players invest 1% of their savings, recruit every voter they know, and wishocratically allocate the global budget from explosions to cures. If health and income targets are hit by 2040, VOTE holders split the prize pool. If not, deposits have been earning 17%/yr — you still 11x your money. Break-even probability: 0.0067%.

Built with Storacha + IPFS for immutable citizen data, Hypercerts on AT Protocol for verifiable impact receipts, World ID for sybil-resistant one-person-one-vote, ERC-8004 for autonomous agent identity, and smart contracts on Base.

## The Problem

Since 1913, governments have printed $170 trillion and used it to kill 97 million people in wars nobody asked them if they wanted to have. Every dollar invested in healthcare returns $1.80. Every dollar invested in military returns $0.60. Your species chose the $0.60 option.

The Political Dysfunction Tax — the total cost of this misallocation — is $101 trillion per year. $12,600 per person. $50,500 per household of four.

95% of diseases have zero FDA-approved treatments. The FDA makes treatments wait 8.2 years AFTER they've been proven safe. For every 1 person it protects from a bad drug, 3,070 die waiting for a good one. The dollar has lost 96% of its value since 1913 — if wages had kept pace with productivity, the median family would earn $528,000. The actual number is $77,500.

The parasitic economy — cybercrime plus military spending — is growing at 15% per year. The productive economy is growing at 3%. Argentina collapsed at 38%. Yugoslavia at 40%. The Soviet Union at 45%. By 2040, Earth crosses the same threshold.

## The Solution: The Earth Optimization Game

Three steps:

1. **Invest** — Put 1% of your savings into the Earth Optimization Fund
2. **Recruit** — Get every voter you know to play (target: 4 billion)
3. **Allocate** — Players decide how the global budget should be split via pairwise comparisons (Wishocracy)

**Win conditions** (measurable, on a deadline):

| Metric | Current | Target (2040) |
|--------|---------|---------------|
| Healthy life expectancy (HALE) | 63.3 years | 69.8 years (+6.5) |
| Global median income | $18,700 | $149,000 (8×) |

**The goal**: redirect 1% of the global military budget to pragmatic clinical trials — $27 billion a year. Trial capacity increases 12.3×. 443 years compresses to 36. 10.7 billion lives saved.

### The Prize

The Fund produces 17% annual returns. If targets are hit, your VOTE points pay out — each could be worth up to $8,400. If targets are missed, you get your deposit back plus compound returns — $100 becomes $1,100. Two out of three outcomes are wins. The third one is Somalia.

### The Tools (to help players win)

- **Wishocracy** — Each player allocates the global budget through pairwise comparisons. Ten choices, two minutes. Eight billion preferences, one optimal budget. When you ask people what they want, cures beat bombs. Nobody has ever asked.
- **Optimal Policy Generator** — Grades every policy A–F by what actually happened. America spent $90B/yr on the War on Drugs — overdoses rose 1,700%. Portugal decriminalised drugs for almost nothing — overdoses dropped 80%.
- **Optimal Budget Generator** — Finds the cheapest high-performer per category. Singapore: $3,000/person on healthcare, lives to 84. America: $12,000, lives to 78.
- **Decentralized FDA** — Real-time Outcome Labels and Treatment Rankings. 44× cheaper. 12× more capacity. Zero queue.
- **Incentive Alignment Bonds** — Raise $1B from investors. Fund politicians who vote for the treaty, defund the ones who don't. When the treaty passes, bondholders get perpetual returns. The math does the lobbying.
- **Decentralized IRS** — 74,000 pages of tax code replaced by a 0.5% transaction tax in four lines of Solidity. No filing. No loopholes. No lobbyist can bribe a smart contract.
- **Universal Basic Income** — Your species already spends $13.5T/yr on welfare. Up to $675B is pure administrative waste. UBI does the same job for $675B less bureaucracy.

## Sponsor Technology Integration

### Storacha + IPFS (Filecoin ecosystem)

**Package**: `@optimitron/storage`

All citizen data — budget preferences, treaty votes, health outcomes, impact metrics — stored on Storacha and pinned to IPFS. No government can delete it. No lobbyist can edit it. Content-addressed, immutable, decentralized.

- Budget optimization outputs stored as content-addressed history chains
- Each snapshot links to its predecessor via CID, forming an auditable provenance trail
- Citizens can independently verify that their preference data was included in the aggregation

### Hypercerts (Impact Certificates)

**Package**: `@optimitron/hypercerts`

Every action in the game mints a Hypercert on AT Protocol. Voter recruitment, fund deposits, budget allocations — each verified via World ID and published to Bluesky. Permanent, auditable impact receipts.

- Hypercert record builders convert Optimitron outputs into standardized activity, measurement, evaluation, and attachment records
- AT Protocol publishing helpers push records to the decentralized social graph
- Impact claims are independently verifiable

### World ID (Worldcoin)

**Integration**: `@worldcoin/idkit` in `@optimitron/web`

Proof-of-personhood for sybil-resistant civic participation. One person, one vote.

- Voter verification: every VOTE token requires a World ID proof
- Referendum voting with World ID gating
- UBI distribution ensures one-per-human payouts
- Referral tracking requires recruited voters to be World ID-verified

### ERC-8004 (Agent Identity)

**Package**: `@optimitron/agent`

Autonomous policy analyst agent with ERC-8004 on-chain identity and reputation. Discovers the largest preference gaps, runs causal analysis, publishes receipts through Hypercerts and Storacha.

- Agent manifest enforces ERC-8004 identity fields (operator wallet, registration tx, supported tools)
- All outputs signed and attributable to a registered on-chain identity

### Base (Blockchain)

**Packages**: `@optimitron/treasury-prize`, `@optimitron/treasury-iab`, `@optimitron/treasury-wish`

All smart contracts on Base Sepolia. Solidity 0.8.24, Hardhat 2.22, OpenZeppelin 5.1.

- `VoterPrizeTreasury` + `VoteToken` — Prize mechanism (deployed)
- `IABVault` + `IABSplitter` + `PublicGoodsPool` — Incentive Alignment Bonds
- `WishToken` + `WishocraticTreasury` + `UBIDistributor` — Monetary reform
- `AlignmentScoreOracle` + `PoliticalIncentiveAllocator` — On-chain accountability

## Why This Fits Funding The Commons

This is public-goods infrastructure, not a dashboard.

- **Legible**: every conclusion tied to evidence, measurements, and source links
- **Forkable**: civic groups, journalists, researchers, and local governments can reuse the stack
- **Composable**: Storacha, Hypercerts, and ERC-8004 are infrastructure layers, not one-off hacks
- **Accountable**: the product makes it easier to inspect how public claims are made

17 TypeScript packages. 4 Solidity contract families. Domain-agnostic causal inference engine. Full Next.js app — live at optimitron.com.

## Demo Narration Script

The full presentation (27 slides, ~8 minutes) walks through the problem, the game mechanics, the tools, and the sponsor tech integration:

### Slide 1: The Earth Optimization Game
> The Earth Optimization Game. Optimize your governments to stop making everyone poorer and deader and start making everyone healthier and wealthier!

### Slide 2: Credits
> The Earth Optimization Game is brought to you by the good humans at Protocol Labs funding the Commons, Hypercerts, Storacha, Worldcoin, and Base.

### Slide 3: Misaligned Superintelligence
> Your governments are misaligned superintelligences. Collective intelligence systems controlling 50 trillion dollars and 8 billion lives. Stated objective: promote the general welfare. Actual objective: campaign contributions.

### Slide 4: $170 Trillion
> Since 1913, your governments have printed 170 trillion dollars out of nothing and spent these nothing papers on murdering 97 million humans and destroying many valuable things those humans spent their entire lives building. Consequently your paycheck now buys 97 percent less due to the aforementioned destruction.

### Slide 5: Opportunity Cost
> Instead of murdering 97 million people and destroying everything they built, they could have funded 37,778 years of clinical trials. They bought the other thing. Through compounding effects, you would be 33 times richer and significantly less diseased today if someone had aligned your governments in 1913. They did not. So that is what you are going to do.

### Slide 6: 604:1
> So right now they currently spend 604 dollars on the capacity for mass murder for every one dollar testing which medicines work. 95 percent of diseases have zero FDA-approved treatments. Curing them all at current spending takes 443 years. You will be dead in 80. I mention this not to be rude but because you seem weirdly calm about it.

### Slide 7: Collapse Clock
> The parasitic economy — cybercrime plus military spending — is growing at 15 percent per year. The productive economy is growing at 3. Argentina collapsed at 38 percent. Yugoslavia at 40. The Soviet Union at 45. By 2040, Earth crosses the same threshold. Think Somalia, but everywhere. But there is a save file.

### Slide 8: Select an Earth
> Three timelines over 15 years. Status quo: parasitic economy overtakes productive. You get poorer and deader. The 1 percent treaty: all nations redirect 1 percent of military spending to clinical trials simultaneously — no one loses strategic advantage. Healthy people work more, earn more, and spend less on healthcare. That compounds. 6.5 more healthy years, 12 times richer. Optimal governance: end the 101 trillion dollar Political Dysfunction Tax. 40 times richer. Choose.

### Slide 9: The 1% Treaty
> Redirect 1 percent of the global military budget to pragmatic trials integrated into standard healthcare — 82 times more efficient than traditional trials. 27 billion dollars a year. Trial capacity increases 12.3 times. 443 years compresses to 36.

### Slide 10: Pluralistic Ignorance
> Everyone wants to end war and disease. But everyone thinks it's crazy because nobody else will agree to the steps to make it happen. So nobody does anything. Your economists call this pluralistic ignorance. I call this the dumbest reason a civilisation has ever continued dying and murdering each other.

### Slide 11: Win Conditions
> The entire game comes down to two numbers. Healthy life expectancy: 63.3 years, target 69.8. Median income: 18 thousand 7 hundred dollars, target 149 thousand. Your species has produced 4,000 pages of U.N. resolutions about these numbers. This game has two progress bars. We find the bars more effective.

### Slide 12: The Fund
> Billions of people have to overcome pluralistic ignorance and work together to achieve this. Since your species requires small pieces of paper with presidents on them before you will do anything, you create the Earth Optimization Prize Fund. The target is 1 percent of global savings, diversified across the venture capital sector, producing 17 percent annual returns. If humanity hits the median income and healthy lifespan targets by 2040, your Vote Points pay out. If humanity fails, you get your deposit back plus 17 percent annual returns — your hundred dollars still becomes eleven hundred. Two out of three outcomes are wins. The third option is Somalia.

### Slide 13: The Prize
> Vote, then share your referral link. Each friend who votes through your link earns you one VOTE point. Each point could be worth up to $8,440.

### Slide 14: The Armory
> Now you have the incentive. Here are the tools to hit the targets.

### Slide 15: Decentralized FDA
> 9,500 compounds are proven safe but 99.7 percent of their uses have never been tested. Your FDA makes patients wait 8 years after a drug is proven safe. The Decentralized FDA: real-time Outcome Labels and Treatment Rankings. 44 times cheaper. 12 times more capacity.

### Slide 16: Optimal Policy Generator
> The Optimal Policy Generator uses causal inference on hundreds of years of data across dozens of countries to grade every policy A through F by what actually happened. America spent 90 billion dollars a year on the War on Drugs. Overdoses rose 1,700 percent. Portugal decriminalised drugs for almost nothing. Overdoses dropped 80 percent.

### Slide 17: Optimal Budget Generator
> The Optimal Budget Generator finds the cheapest high performer per category. Singapore: 3,000 dollars per person on healthcare, lives to 84. America: 12,000 dollars, lives to 78.

### Slide 18: Wishocracy
> You have seen what happens when politicians allocate your money. 97 million dead and a 604 to 1 ratio of bombs to cures. Wishocracy lets you do it instead. Each player allocates the global budget through pairwise comparisons — clinical trials versus military spending, education versus the drug war. Ten choices, two minutes. Eight billion preferences, one optimal budget.

### Slide 19: The Budget
> When you ask people what they want, cures beat bombs. Nobody has ever asked.

### Slide 20: Incentive Alignment Bonds
> Now you know what everyone wants and what the optimal budget is. How do you get your politicians to actually do it? Incentive Alignment Bonds. Raise 1 billion dollars from investors. Use it to fund politicians who vote for the treaty and defund the ones who do not. When the treaty passes, bondholders get perpetual returns proportional to the treaty percentage. Politicians get electoral support proportional to it. Every investor and every politician becomes a permanent lobbyist for expanding it. The math does the lobbying.

### Slide 21: Decentralized Fed
> Twelve unelected humans meet eight times a year to decide how much your money is worth. When they print new money, it goes to banks and asset holders first. In 2020 they printed 4 trillion dollars. The wealth of the top 1 percent increased by exactly 4 trillion dollars that year. This smart contract replaces them. Zero percent inflation anchored to productivity growth. New money distributed equally to every human via UBI.

### Slide 22: Decentralized IRS
> Your tax code is 74,000 pages. It costs 546 billion dollars a year in compliance. A 0.5 percent transaction tax does the same job in four lines of Solidity. No filing. No accountants. No loopholes. No lobbyist can bribe a smart contract to give their client a tax loophole.

### Slide 23: Universal Basic Income
> Your species already spends 13.5 trillion dollars a year on welfare to prevent starvation. Up to 675 billion of that is pure administrative waste. Universal basic income does the same job for 675 billion less bureaucracy.

### Slide 24: Storacha + IPFS
> The Optimal Policy Generator, Budget Generator, and Decentralized FDA are all powered by data collected through a decentralized census. 8 billion citizens verified via World ID. Budget preferences, treaty votes, health outcomes, impact metrics — stored on Storacha and pinned to IPFS. No government can delete it. No lobbyist can edit it.

### Slide 25: Hypercerts
> Every action in the game mints a Hypercert on AT Protocol. Voter recruitment, fund deposits, budget allocations — each verified via World ID and published to Bluesky. Permanent, auditable impact receipts.

### Slide 26: 10.7 Billion Lives
> 10.7 billion lives. 1.9 quadrillion hours of suffering prevented. That is what 1 percent buys you.

### Slide 27: Play Now
> Think about someone you love who is suffering right now. The treatment that would help them exists as an untested compound on a shelf, because the money bought a missile instead. That missile incinerated a child who would have grown up to discover the cure. You lose the treatment. You lose the scientist. You get the invoice. One percent fixes this. One vote starts it. Go to optimitron dot com and play now.

## Links

- **Live app**: https://optimitron.com
- **GitHub**: https://github.com/wishonia/optimitron
- **Demo video**: https://optimitron.com/demo?playlist=protocol-labs
- **Papers**: [dFDA Spec](https://dfda-spec.warondisease.org) | [Wishocracy](https://wishocracy.warondisease.org) | [OPG](https://opg.warondisease.org) | [OBG](https://obg.warondisease.org) | [IAB](https://iab.warondisease.org) | [Political Dysfunction Tax](https://political-dysfunction-tax.warondisease.org)
