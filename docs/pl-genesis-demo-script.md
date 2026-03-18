# PL Genesis Hackathon — Demo Video Script

**Target length**: 2–3 minutes
**Tone**: Wishonia narrating (deadpan, data-first, dry)

---

## 1. Hook (15s)

> "Your governments are misaligned superintelligences — collective intelligence systems controlling billions of lives, optimising for re-election instead of welfare. I built alignment software. It works on my planet. Let's see if your species can handle it."

*Visual*: Optimitron homepage hero, the tagline scrolling in.

---

## 2. Wishocracy — Citizen Preferences (25s)

> "Step one: actually ask people what they want. Radical concept, I know."

*Visual*: Open `/wishocracy`. Show pairwise comparison cards — "Healthcare vs Defense", slider interaction.

> "Citizens compare budget priorities head-to-head. Eigenvector decomposition produces stable preference weights from as few as ten comparisons. Your species invented this maths in 1977 and then mostly used it to rank sports teams."

*Visual*: Show completion state with summary. Highlight the **"Content-addressed on IPFS"** badge with the Storacha CID.

> "Every preference snapshot is stored on Storacha — content-addressed, immutable, linked to its predecessor. No server can alter it after the fact."

---

## 3. Alignment — Politician Report Cards (20s)

> "Step two: find out which of your elected officials actually agrees with you."

*Visual*: Navigate to `/alignment`. Show ranked politicians with scores.

> "Voting records are compared against citizen preferences. Each politician gets a Citizen Alignment Score — a single number that answers 'how much do they actually represent you?'"

*Visual*: Zoom into a politician card. Highlight the **"Verified on IPFS"** green badge. Click it to show the CID gateway link.

---

## 4. Hypercerts — Verifiable Attestations (25s)

> "Every alignment score is published as a Hypercert on the AT Protocol and stored on Storacha."

*Visual*: Navigate to `/transparency`. Show the attestation records grid — IPFS CIDs, AT Protocol URIs.

> "Click any CID. You'll see the raw JSON — the Activity claim, the Measurements, the Evaluation. Tamper-proof. Auditable by anyone. This is what accountability looks like when you take it seriously."

*Visual*: Click a Storacha gateway link, show raw JSON in browser.

---

## 5. Earth Optimization Prize (20s)

> "Traditional philanthropy: give money, hope it works, never check. My approach: outcome-based escrow."

*Visual*: Navigate to `/prize`. Show the mechanism steps and donation section.

> "Donors deposit $WISH into a Public Goods Pool smart contract. The funds are locked until health and income metrics cross verifiable thresholds. Then donors vote on which implementers get paid — weighted by deposit amount. Your deposit IS your identity. No sybil attacks possible."

*Visual*: Highlight the PublicGoodsPool contract details — deposit-as-identity, Storacha evidence CIDs, bonded disputes.

> "Implementers register with Storacha CIDs linking to their Hypercert evidence. Challengers can post a bond to dispute allocations. Lose → you forfeit the bond. Win → the fraudster gets deactivated. Accountability with teeth."

---

## 6. $WISH Token + IAB (25s)

> "Now for the part your campaign finance lobbyists won't enjoy."

*Visual*: Show the $WISH Token & UBI section on the transparency page.

> "The $WISH token has a 0.5% transaction tax. That replaces your IRS. No 74,000-page tax code. No 83,000 employees. Revenue collection as a protocol feature."

> "The tax funds two things: Universal Basic Income — distributed automatically to verified citizens via World ID — and Incentive Alignment Bonds, where smart contracts distribute campaign funds to politicians based on their Hypercert-verified alignment scores."

*Visual*: Show the pipeline diagram. Highlight each step.

> "Politicians earn funding by aligning with citizens, not donors. No PACs. No lobbyists. Just maths."

---

## 7. Architecture (15s)

> "Under the hood: 15 packages, 2,600+ tests, a domain-agnostic causal inference engine, and a fully typed TypeScript monorepo."

*Visual*: Quick scroll through the GitHub repo. Show package structure. Flash test output.

> "Storacha for content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. All open source."

---

## 8. Close (15s)

> "Storacha makes governance data immutable. Hypercerts make it auditable. Smart contracts make it enforceable. Your species has had these tools for years. You just keep not using them."

*Visual*: Return to homepage. Show the tagline.

> "Optimitron. Alignment software for the most powerful AIs on your planet — the ones made of people."

*Visual*: GitHub URL. End card.

---

## Technical Notes

- Record at 1080p minimum
- Use browser dev tools to hide any loading states
- Pre-populate Wishocracy with enough comparisons to show a complete report
- Have the Storacha gateway CID link pre-loaded in a separate tab for quick cut
- Background music: something understated and slightly ominous (think BBC documentary)
