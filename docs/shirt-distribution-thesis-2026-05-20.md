# Shirt Distribution Thesis (Mike, 2026-05-20)

Captured verbatim then structured. **This is a strategic argument document, not page copy.** Voice and final wording for any surface that uses this material need separate copy review.

## Verbatim (Mike, voice-to-text)

> [On the T-shirt page] do we say buy the T-shirt that ended war and disease and explain the logic that if a billion people wore this t-shirt on the same day on Earth Optimization Day [2026-08-06] and we're forced to discuss the fact that humanity currently has a sufficient mass murder capacity to cause 122 apocalypses and we have the option to sacrifice one of these apocalypses for disease eradication in our lifetime. Like even military-industrial-complex lobbyists, the benefits to them personally of eradicating the disease that is going to murder them and their entire family is vastly greater than any amount of money [from a] 1% reduction in the amount of money they make through forcing everyone to buy all these redundant implements of destruction. Additionally, on this day they would also need to consider the fact that in the United States military spending was 97% lower than it currently is immediately before they won World War II, and after World War II they decreased military spending 87% over 2 years. So there is no reasonable justification why it is unacceptable to sacrifice 1% to just have a 1% reduction, producing an allocation of 98.8% for bombs and 1.2% for clinical trials, [given the discrepancy between] a 1 in 30 million chance they will be killed by a terrorist and 100% chance they will be killed by a disease. Therefore if you had 8 billion people wearing this shirt and they all voted on this website, it would be the largest global referendum and manifestation of human will and values in human history. Therefore if foundations just spent maybe 3% of their annual budget [on shirts] this thing would produce, with just the 1% treaty, maybe 84 quadrillion in value shift, [pull] the disease eradication timeline forward by about 212 years, potentially prevent 10.7 billion deaths over this time, and X quadrillion hours of suffering. And it would cost like $48 billion or something to buy everybody a t-shirt. But this is only 3% of their budget. Therefore it would be entirely rational for them to just use 3% of their budget to buy some t-shirts one year and end war and disease. And even though it just starts with the 1% treaty, once humanity agrees everybody wants this, then comes the question: okay, so if 1% is this good, then why don't you just do 2%? And then if you do 2% you eradicate diseases even faster — like 20 times faster — then why not 3%? And the logical conclusion is that war is idiotic. You have 8 billion people realizing how idiotic it is to let 2 billion people suffer from disease so we can have 122 apocalypses when you only need one.

## Structured claim chain

### Layer 1 — The shirt is a coordination device, not merch

| # | Claim | Source / status |
|---|---|---|
| 1 | The shirt's purpose is to force a global conversation on a specific day | New strategic frame — Earth Optimization Day = 2026-08-06 (Hiroshima anniversary, per session memory) |
| 2 | If 1B+ humans wear it on the same day, the conversation cannot be avoided | New claim, asserted |
| 3 | Past tense framing ("THIS T-SHIRT ENDED WAR AND DISEASE") presupposes the outcome — wearers are retroactively credited with the win, which is the curiosity hook for the bystander reading the front | Already shipped in shirt front copy |

### Layer 2 — Why self-interested actors should support the 1% Treaty

| # | Claim | Source / status |
|---|---|---|
| 4 | Even military-industrial-complex lobbyists personally benefit MORE from disease eradication than they lose from a 1% military reduction | Personal-utility argument, not currently in the manual; needs grounding |
| 5 | The diseases that will kill them and their families have a 100% mortality rate; their personal share of "loss from 1% reduction" is bounded; expected value of a cure is unbounded | Math is sound; needs formal calculation |
| 6 | A 1% reduction leaves 98.8% for military, 1.2% for clinical trials | Trivially derived from current allocation |
| 7 | Risk math: 1 in 30M chance of death by terrorist vs. 100% chance of death by disease, and current spending inverts the ratio | Already in the treaty WHEREAS clauses (war-on-disease.json — verify exact citation) |

### Layer 3 — Historical precedent that 1% is trivially small

| # | Claim | Source / status |
|---|---|---|
| 8 | US pre-WWII military spending was 97% lower than today's peacetime budget (inflation-adjusted) | Already in treaty WHEREAS clause + parameters catalog (`peace-dividend.html` cited at war-on-disease.json) |
| 9 | The US won WWII at that lower spending level | Same source |
| 10 | The US cut military spending 87% in 2 years post-WWII and the result was the fastest growth in median standard of living in history | Same source — verify exact phrasing |

### Layer 4 — Scale math (the bulk-buyer argument)

| # | Claim | Source / status |
|---|---|---|
| 11 | 8B people wearing the shirt + voting = largest global referendum and manifestation of human will in history | Definitionally true if achieved |
| 12 | ~$48B to give every human a shirt | Needs verification: 8B × ~$6/shirt unit cost ≈ $48B. Compare to CustomCat Pro plan at $13.67/shirt — bulk wholesale at scale plausibly $5-7. Range: $40B–$110B |
| 13 | $48B = ~3% of annual global philanthropy budget | Needs verification: global philanthropy ~$1.5T/yr; 3% = $45B. Numbers track |
| 14 | The expected value of the 1% Treaty passing is ~$84 quadrillion in value shift, 212yr disease-eradication acceleration, 10.7B deaths prevented, X quadrillion hours of suffering prevented | Mostly in parameters catalog: `FLOW_VOTER_LIVES_SAVED_ROUNDED`, `FLOW_VOTER_SUFFERING_YEARS_PREVENTED`, peace-dividend; the $84Q figure needs explicit derivation |
| 15 | Therefore the rational allocation decision for a foundation is to spend 3% of annual budget on universal shirt distribution (a 933,000,000× ROI in expected value terms) | New synthesis — needs presentation as a calculator, not just a paragraph |

### Layer 5 — The escalation argument (why 1% is just the start)

| # | Claim | Source / status |
|---|---|---|
| 16 | Once 1% works, the natural question is "why not 2%, then 3%?" | Already in treaty Article III ("the percentage can go up; it never goes down") |
| 17 | The logical terminal conclusion: war itself is irrational because nobody actually prefers 122 apocalypse-worths of overkill capacity to disease eradication | Implicit in the 122-apocalypse framing; never stated as the terminal conclusion on any current page |

## Numbers that need verification before this becomes any user-facing surface

- **$48B universal shirt cost** — back-of-envelope but the multiplier matters; verify against bulk POD wholesale floors. Range probably $40B–$110B.
- **3% of global philanthropy budget = $48B** — global philanthropy estimates vary widely ($550B US-only / $1.5T global per Giving USA + Candid). Worth citing source.
- **$84 quadrillion value shift** — not visible in the parameters catalog I can see; derive or remove.
- **212-year disease-eradication acceleration** — verify against `DFDA_QUEUE_CLEARANCE_YEARS` vs `STATUS_QUO_QUEUE_CLEARANCE_YEARS` (currently 443 vs 36 = 407-year delta; 212 may be a different cut).
- **10.7B deaths** — already cited as `FLOW_VOTER_LIVES_SAVED_ROUNDED × all voters` per session context; verify exact derivation.
- **Personal-utility argument for MIC lobbyists** — needs an explicit per-capita expected-utility calculation, not a rhetorical claim.

## Integration question

This argument has TWO audiences with different conversion goals. Treating them on one page is what the current /shirt page does badly: it half-addresses individual buyers and doesn't address foundations at all.

### Audience A — Individual buyer landing on /shirt
- Current goal: buy a shirt
- Current copy: hero + WHY paragraph + order form
- What this thesis adds: the "wearing it on Earth Optimization Day produces the largest referendum in history" frame — coordination-device framing, not merch
- Risk: the full bulk-math argument is wasted attention for a $25 individual order

### Audience B — Foundation program officer / major donor / coalition organizer
- Conversion goal: bulk order or shirt-printing grant (the 933,000,000× ROI math)
- Current surface: **none exists** — /donate doesn't make this case; /join is org-coalition not foundation-bulk
- What this thesis adds: the entire scale calculation, foundation-as-rational-actor argument, "$48B is 3% of your annual budget" pitch

## Integration options

**A) Inline on /shirt below order form.** Add a "Why this shirt is a coordination device, not merch" section beneath the order CTA. One scroll. Universal audience.
- Pro: single page, leverages existing /shirt traffic
- Con: dilutes the individual conversion path; foundation officer landing on /shirt has to scroll past consumer apparel UX to find the thesis

**B) Separate `/shirt/why` page linked from /shirt.** /shirt stays focused on order conversion; /shirt/why is the long-form thesis.
- Pro: clean separation of audiences; /shirt stays tight
- Con: extra click; "why" pages are notoriously underread

**C) Dedicated `/foundations` (or `/distribution`) page targeting foundations.** Bulk-math argument lives here. /shirt links to it as "Foundations: see the math →" + a comparable callout on /join + /donate.
- Pro: matches Audience B's real goal (bulk grant); reuses the foundation-task work shipped today
- Con: real new route + design + copy lift
- **Strongest match to the conversion goal Mike just spent the day building toward** (the foundation-join task work, the 10-foundation registry)

**D) Capture only — don't integrate yet.** This doc is the artifact; iterate the argument, verify numbers, then decide integration.
- Pro: lowest risk of shipping unverified numbers ($84Q etc.) on a public page
- Con: no compounding traffic value while the argument is true and the math holds

## My recommendation

**C now, with the numbers verified before any surface ships.** The foundation-bulk audience is exactly the audience the morning's `/join` + foundation-task work was built to convert. A `/foundations` page is the natural conversion surface for them — the place where the 933M× ROI math gets shown alongside the campaign-grant calculator (which already exists at `OrganizationGrantCalculator.tsx`).

The argument elements for /shirt itself are *separate* — the coordination-device frame ("if 1B people wear this on Aug 6") belongs on /shirt as one tight paragraph below the hero, not the full bulk math. Different audience, different ask.

**Order of work if C is approved:**
1. Verify the numbers flagged above (Codex read-only audit against the parameters catalog + manual + cited sources).
2. Draft `/foundations` page copy (separate dispatch, with verbatim BEFORE/AFTER review).
3. Add the one-paragraph "coordination device" frame to /shirt (verbatim review).
4. Cross-link from /join + /donate footer to /foundations.

## Mike's decisions (2026-05-20, follow-up)

1. **Personal-utility argument: IN SCOPE.** Use it wherever the full case for the military-industrial complex audience is being made. Not an overclaim — it's the only rational case for someone on the inside.
   - The frame: "We're asking for a 1% reduction so that their entire family's diseases get cured. Is that worth 1% of their bomb-selling commission, or is there some other way they can make money besides making doomsday devices?"
   - Strengthening claim Mike added: **after ~15 years of the 1% Treaty, projected global GDP could be ~4× higher** from compounding productivity gains + the externality costs of war disappearing. Therefore the MIC stakeholders are net **richer** post-treaty than they would have been continuing the status quo, because the total economic pie grows faster than 1% bomb commissions shrink.
   - Status of the 4× / 15yr claim: needs verification against the parameters catalog. Suspected location: `packages/data/src/parameters/peace-dividend.ts` or a sibling. If not there, propose adding a derived parameter (`COMPOUND_PEACE_DIVIDEND_GDP_MULTIPLIER_15YR` or similar) with explicit derivation chain + 95% CI.

2. **"Earth Optimization Day" branding: USE IT.** Date: 2026-08-06 (Hiroshima anniversary). Show the date on /shirt, /foundations, /join cross-links — wherever the "wear it on the same day" argument appears.

3. **$48B universal-shirt cost: WAS A GUESS, NOT A CLAIM.** Don't ship $48B as a hard number. Calculate the real one in `packages/data/src/parameters/` so it's reusable across surfaces:
   - Suggested parameter name: `UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD`
   - Derivation: `WORLD_POPULATION_HUMANS × BULK_SHIRT_UNIT_COST_USD` (and add `BULK_SHIRT_UNIT_COST_USD` as its own parameter if not present, citing the wholesale POD floor — CustomCat Pro plan baseline + bulk-tier estimate).
   - Both should have explicit 95% CI bounds. The 933M× ROI claim then follows from `EXPECTED_TREATY_VALUE_USD / UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD` and is recalculated whenever either input updates.

## Open work (in dependency order)

1. **Parameter audit + add what's missing.** Read-only Codex pass against `packages/data/src/parameters/` to confirm/find:
   - 4× GDP / 15yr compound peace dividend → exists or proposed location
   - World population (likely exists)
   - Bulk POD shirt cost (likely absent — needs adding with CustomCat-based estimate + CI)
   - $84Q value-shift derivation → exists or proposed location
   - 212yr disease-eradication acceleration → verify against existing `STATUS_QUO_QUEUE_CLEARANCE_YEARS - DFDA_QUEUE_CLEARANCE_YEARS`
   Output: a parameter-status table, no code edits.

2. **Add missing parameters** as a separate dispatch with explicit derivations + CIs, citing manual sources where they exist. Dispatch only after the audit confirms what's missing.

3. **Draft `/foundations` page copy** with the full case, all argument layers (1-5), Earth Optimization Day date, personal-utility-for-MIC argument, and all numbers backed by `<ParameterValue>` references to the catalog. Verbatim BEFORE/AFTER review before commit.

4. **Add the one-paragraph coordination-device frame to /shirt** referencing Earth Optimization Day + linking to /foundations for the bulk math. Verbatim review.

5. **Cross-link from /join + /donate footer to /foundations.**

---

## Verbatim cleaned copy (from Mike, transcribed + profanity/typo cleaned + filler-word compressed; substance and framing preserved)

> Mike's rule: "as close to my language as possible without profanity and grammatical errors." Codex dispatches MUST quote these strings verbatim. Numbers in `<ParameterValue>` curly tokens are placeholders for catalog lookups, not copy decisions.

### /foundations page — full case

#### Hero / opening frame

> Buy the t-shirt that ended war and disease.
>
> If 1 billion humans wear this shirt on the same day — Earth Optimization Day, August 6 — humanity is forced to discuss the fact that it currently maintains sufficient mass-murder capacity to cause **122 apocalypses**, and that it has the option to sacrifice one of these apocalypses for disease eradication within our lifetime.

#### Personal utility for the military-industrial complex

> Even military-industrial-complex lobbyists personally benefit more from disease eradication than from any amount of money they make from a 1% reduction in the bombs they sell. The diseases are going to murder them and their entire families. The personal benefit of curing those diseases is vastly greater than 1% of their commission on doomsday devices.
>
> We are asking for a 1% reduction so that their entire family's diseases get eradicated. Is that worth 1% of their salary? Or is there some other way to make money besides selling doomsday devices?

#### Compound peace dividend

> Projections estimate that **15 years** after the 1% Treaty is adopted, global GDP could be approximately **4 times higher** from compounding productivity gains and the removal of war's externality costs.
>
> The military-industrial complex will be substantially richer after the treaty than they would have been continuing the status quo — even after the 1% bomb-commission haircut. They are going to be a lot richer if we just stop having wars and eradicate diseases. The global GDP growth will vastly exceed any losses they take from a 1% reduction in their bomb-selling commission.

#### Historical precedent

> Immediately before the United States won World War II, military spending was **97% lower** than it is today. After winning the war, the US cut military spending another **87% over 2 years**.
>
> There is no reasonable justification for refusing a 1% reduction. That produces an allocation of **98.8% for bombs and 1.2% for clinical trials**.

#### Risk math

> Your chance of being killed by a terrorist is **1 in 30 million**.
>
> Your chance of being killed by a disease is **100%**.
>
> The current spending ratio is the opposite.

#### Scale claim

> If **8 billion people** wear this shirt and vote on this website, it becomes the largest global referendum and manifestation of human will and values in human history.

#### Foundation pitch

> Distributing the shirt to every human on Earth would cost approximately **`<ParameterValue param={UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD} />`**. That is approximately **3% of the global annual philanthropy budget**.
>
> With just the 1% Treaty, this produces approximately **`<ParameterValue param={EXPECTED_TREATY_VALUE_USD} />`** in projected value shift, pulls the disease-eradication timeline forward by approximately **`<ParameterValue param={DISEASE_ERADICATION_ACCELERATION_YEARS} /> years`**, prevents approximately **`<ParameterValue param={FLOW_VOTER_LIVES_SAVED_TOTAL} /> deaths`**, and prevents **`<ParameterValue param={SUFFERING_HOURS_PREVENTED} />` of suffering**.
>
> It is entirely rational for a foundation to spend 3% of one year's budget to end war and disease.

#### Address the objection: yes, this sounds insane

> Skeptical reader's first reaction: "All you have to do to end war and disease is for everyone to wear a t-shirt? This sounds insane."
>
> Correct. It sounds insane.
>
> We have walked through the logical proof above. Identify the step where the logic breaks. If you cannot, the proposal is not insane — it is just unfamiliar.
>
> The fact that it sounds insane — and that it is simple enough for any human on Earth to understand — is why it works.
>
> Most things that would benefit everyone on Earth do not get done because they are too complex to coordinate around. They require expertise to evaluate, institutions to align, and decades to deploy. A t-shirt with a QR code linking to a 30-second vote requires none of that. A 5-year-old can read it. A 99-year-old can wear it. The action is trivial; the underlying argument has room to spread.
>
> Simplicity + universal benefit + universal comprehensibility is the rare combination that actually goes viral. The proposal is memetic precisely because the surface — wear a shirt — is trivial enough that the argument can ride along.

#### The escalation argument

> Even though it starts at 1%, once humanity agrees that this is good, the natural next question is: if 1% is this good, why not 2%?
>
> If 2% eradicates diseases 20 times faster, why not 3%?
>
> The logical conclusion is that war is irrational. 8 billion people will realize how irrational it is to let 2 billion people suffer from disease so that humanity can maintain 122 apocalypses of mass-murder capacity when one is enough.

### /shirt page — one-paragraph coordination-device frame (place below current hero, above order form)

> Wear it on Earth Optimization Day — August 6.
>
> If 1 billion humans wear this shirt on the same day, humanity is forced to discuss the fact that it currently maintains sufficient mass-murder capacity to cause 122 apocalypses, and that it has the option to sacrifice one of these apocalypses for disease eradication within our lifetime.
>
> **[Foundations: see the bulk math →](/foundations)**

### /join + /donate footer cross-link

> Foundations: distributing the shirt to every human on Earth costs roughly 3% of the global annual philanthropy budget. **[See the case →](/foundations)**

---

## Parameter tokens used in the copy above

| Token | Status | Notes |
|---|---|---|
| `UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD` | Likely NEW | Derive: `WORLD_POPULATION_HUMANS × BULK_SHIRT_UNIT_COST_USD` |
| `BULK_SHIRT_UNIT_COST_USD` | Likely NEW | Cite CustomCat Pro plan + bulk-tier floor; 95% CI |
| `WORLD_POPULATION_HUMANS` | Likely exists | Verify |
| `EXPECTED_TREATY_VALUE_USD` | Verify | Mike's "$84 quadrillion" — needs explicit derivation in catalog |
| `DISEASE_ERADICATION_ACCELERATION_YEARS` | Likely exists | `STATUS_QUO - DFDA` queue clearance delta. Mike cited 212yr; current treaty page cites 407yr (443-36). Reconcile. |
| `FLOW_VOTER_LIVES_SAVED_TOTAL` | Likely exists | Per session memory: `FLOW_VOTER_LIVES_SAVED_ROUNDED × total voters` |
| `SUFFERING_HOURS_PREVENTED` | Likely exists | War-on-disease.json mentions "1.93 quadrillion hours" |
| `COMPOUND_PEACE_DIVIDEND_GDP_MULTIPLIER_15YR` | Likely NEW | The 4×/15yr claim — needs derivation + CI |

Parameter audit dispatch will confirm before any /foundations page draft ships.

---

## Formal CBA proof — what exists, what's missing (Mike, follow-up 2026-05-20)

> Mike asked: "do we have like a logical theorem or something that proves this is rational for philanthropic foundations to buy $48 billion or whatever worth of t-shirts and what relative value of doing this compared to alternative uses of $48 billion?"

### What we already have

- **Cost-per-DALY = $0.00177.** Documented in the foundation join task description (`managed-seed-data.ts` per session memory). The unit price of one disability-adjusted life year prevented through this campaign.
- **50,300× more cost-effective than insecticide-treated bednets.** Already cited in the same task description. ITNs are GiveWell's top-charity benchmark for global-health intervention cost-effectiveness; this is the canonical comparison. Buried in a task description, not on a public-facing comparison page.
- **Per-grant CBA calculator** at `OrganizationGrantCalculator.tsx` — computes survey-responses × lives-saved × suffering-prevented for any grant amount.
- **Treaty WHEREAS clauses** in `war-on-disease.json` — structured argument with parameter-backed numbers (covers most of the "why a 1% reduction is rational" base case).

### What we don't have

One structured surface that:

1. States the CBA in proof form (premises → derivations → conclusion).
2. Shows the **comparative table vs. alternative uses of $48B** that a foundation program officer would actually consider:
   - GiveWell top charities (Against Malaria Foundation, Helen Keller, Malaria Consortium)
   - Cash transfers (GiveDirectly)
   - Animal welfare (The Humane League, etc.)
   - AI safety / longtermist (Open Phil, MIRI, ARC)
   - Climate (Founders Pledge climate fund, etc.)
   - Operational reserve (foundations holding cash)
3. Shows the comparison in DALY-per-dollar AND in projected aggregate impact (lives, suffering-hours, expected value of treaty passage).
4. Is rigorous enough that a foundation's program officer can defend it to their board without immediately getting eaten alive.

### Where this lives

**One `/foundations` page, not a separate `/foundations/proof` sub-page** (Mike, 2026-05-20). The page is BOTH the rhetorical case AND the formal-argument document AND the assurance-contract option, top to bottom. Upper half: rhetorical case (Mike's verbatim copy above). Middle: formal CBA + comparison table vs. alternative uses of $48B. Lower: assurance-contract mechanism for foundations that want to commit without first-mover risk.

---

## Assurance contract mechanism for foundation pledges (Mike, follow-up 2026-05-20)

> Mike asked: "do we suggest that we maybe make like some kind of assurance contract or something whereby if they don't want to like commit immediately then like or buy them immediately. they could like commit to buying some amount of them assuming we get all of them sold."

### Prior art: the Earth Optimization Prize

Per `CLAUDE.md` "Treasury: Three Independent Mechanisms" — the Earth Optimization Prize (`/prize`) already implements a dominant assurance contract:

- Depositors put USDC into `VoterPrizeTreasury` (Base Sepolia).
- Capital sits in Aave earning yield.
- Success path: treaty passes → VOTE-token holders claim proportional shares of the prize pool.
- Failure path (15yr no-treaty): depositors claim back **principal + ~4.2× yield** (`$100 × 1.10^15 = $418`).
- Break-even success probability: **0.0067%**. Zero downside. Dominant assurance.

This is exactly the mechanism Mike is describing, applied to a different outcome.

### Proposed design: ShirtDistributionAssuranceContract

Same pattern, different threshold + deadline + payout shape:

| Element | Earth Optimization Prize | Proposed Shirt Distribution Contract |
|---|---|---|
| Capital pool | `VoterPrizeTreasury` | New `ShirtDistributionTreasury` |
| Deposit currency | USDC | USDC (foundations) + USDC-denominated shirt-count pledges (small donors) |
| Yield bearing | Aave on Base | Same |
| Threshold trigger | n/a — open-ended deposit | **Threshold-based:** funds release only if total commitments ≥ X by Earth Optimization Day 2026-08-06 |
| Success payout | VOTE-token holders share prize | Funds release for bulk POD order; shirts ship to pledger addresses or coordinator address for redistribution |
| Failure payout | 15yr → principal + 4.2× yield | Deadline miss → principal + accumulated yield back to pledger |
| First-mover risk | None (always dominant) | None (always dominant — yield exceeds zero opportunity cost) |
| Realistic threshold | n/a | NOT the full $48B universal-distribution target. Partial coordination is still meaningful. Suggested first-stage threshold: **enough pledges for 100M-1B shirts (~$500M-$10B at bulk pricing)** — that's still the largest coordinated public-health distribution in history, and the threshold compounds — when stage 1 hits, stage 2 opens at a higher threshold |

### Why this matters for foundations specifically

Foundations carry **first-mover risk aversion**: if Open Philanthropy commits $500M and no one else does, they look reckless. If Open Philanthropy *conditionally* commits $500M, it only deploys when the other ~$5B is committed by peers, **and** the principal is preserved with yield until the threshold hits — that's not a reputation risk, that's prudent capital allocation.

The assurance contract converts a coordination problem into a treasury product.

### Recommendation: capture, surface on `/foundations`, build only when triggered

- **Don't build speculatively.** A new smart-contract + custody + audit + regulatory lift is months of work. Build only when there's a foundation that says "we'd commit if this mechanism existed" (signal from the `/foundations` page).
- **DO surface the mechanism on `/foundations`** as an "Optional commitment path" section. Frame: "If you want to commit but don't want first-mover risk, we can deploy a dominant assurance contract — same mechanism the Earth Optimization Prize uses — for shirt distribution. Tell us your pledge amount; we'll build the contract if we get three foundation pledges totaling ≥ $X."
- **Use Earth Optimization Prize as the credibility anchor** on /foundations: "Same mechanism, different outcome." Don't re-explain assurance contracts from scratch; link to /prize.

### Open product questions (not deciding here)

- Does the shirt-distribution contract use the same `$VOTE` token as the prize, or a new credit token? (Probably new — different incentive surface.)
- Does it accept individual donations or only org pledges? (Probably both — same UX as the prize.)
- Does the threshold structure mirror Kickstarter (all-or-nothing) or sliding (partial release at lower thresholds)? (Recommend sliding — partial coordination is still 10× any current single-funder bet.)
- How does it interact with the existing `OrganizationGrantCalculator` flow? (Calculator stays as the per-org "your impact if you act alone"; assurance contract is the "your impact if we coordinate" path.)

### Data model for soft pledges (Mike, follow-up 2026-05-20)

> Mike asked: "do we have some data model where we could be storing like soft commitments or commitments to donating in an insurance contract... maybe his tasks for me or something or tasks for themselves so we can keep track of this a total amount committed"

**Answer: yes — use the existing `Task` model. No new schema needed for v0.**

#### What the existing schema already supports

`packages/db/prisma/schema.prisma` Task model has all the fields needed:

- `assigneeOrganizationId` — links the pledge to the foundation pledger
- `assigneePersonId` — for individual pledges
- `parentTaskId` — lets us tree all pledges under one "Shirt Distribution Assurance Contract" parent task
- `status: TaskStatus` (`DRAFT` / `ACTIVE` / `VERIFIED` / `STALE`) — `ACTIVE` = open soft pledge, `VERIFIED` = fulfilled, `STALE` = expired/abandoned
- `taskKey` — unique stable pledge ID for idempotent updates
- `currentImpactEstimateSetId` → `TaskImpactEstimateSet` carries the cost/value fields (`estimatedCashCostUsdBase`, `expectedEconomicValueUsdBase`)
- `description` / `impactStatement` — pledge terms, conditions, deadline
- `communicationEndpoints` — how the pledger gets notified when threshold hits or deadline misses (reuses existing task-assignment-email infrastructure)
- `dueAt` — the assurance-contract deadline (2026-08-06 / Earth Optimization Day)

What does NOT exist and is NOT needed for v0:

- A dedicated `Pledge` model. The Task model expresses pledges natively; adding a parallel model would duplicate `assignee`, `status`, `description`, `impact` semantics.
- A `Commitment` / `Donation` model. Same reasoning.
- Conditional Stripe charges. Stripe authorizations expire in 7 days; a 6+ month threshold deadline cannot use authorize-and-hold. v0 soft pledge = intent record only; threshold-hit triggers a manual or email-driven follow-up to capture payment via the existing donate flow.

#### v0 data shape

Conceptual:

- ONE parent task: `taskKey = "shirt-distribution-assurance-contract:2026-08-06"`. Description = "Coordinated foundation pledges for universal shirt distribution by Earth Optimization Day." This task represents the contract itself.
- ONE child task PER PLEDGE: `parentTaskId = <parent.id>`, `taskKey = "pledge:<org-slug>:<timestamp>"`, `assigneeOrganizationId = <foundation.id>`, `status = ACTIVE`, `dueAt = 2026-08-06`. Description = the pledge terms ("$X conditional on total reaching $Y"). Cost field carries the pledge amount.
- Aggregate: `total_committed = sum(child.currentImpactEstimateSet.estimatedCashCostUsdBase)` where parent matches.

UI surfaces:

- **/foundations** displays the live total via a Server Component that queries the aggregate.
- **/foundations** has a pledge intake form that POSTs to a new API route, which creates the child Task.
- **The pledger's own `/tasks` UI** shows their pledge in their normal task list (no new surface to learn — leverages existing task infrastructure).
- **Mike's admin `/tasks` UI** shows all pledges grouped under the parent (no new surface for Mike either — same task list he already uses).

#### v0 ship list (NOT dispatching yet — flagged for after /foundations stub lands)

1. Create the parent assurance-contract task via `managed-seed-data.ts` (declarative, idempotent — same pattern as foundation join tasks).
2. New API route `/api/foundations/pledge` that validates input + creates the child Task with the right parent + assignee + impact-estimate cost.
3. Pledge intake form component on `/foundations` (rich-text terms, dollar amount, contact email, org name).
4. Aggregate query helper: `getShirtDistributionPledgeTotal()` that returns `{ totalUsd, pledgerCount, latestPledgeAt }`.
5. Server Component on `/foundations` that displays the live counter (`Current commitments: $X / target $Y`).
6. Email notification when threshold hit (reuses task-assignment-email infrastructure — once total crosses threshold, parent task transitions and notifies all child pledgers).

#### v1 — only when v0 shows adoption

- Dedicated `Pledge` model with explicit `pledgedAt`, `confirmedAt`, `cancelledAt`, `paymentMethodId` (Stripe SetupIntent), `threshold`, `deadline`. Adds proper schema clarity.
- Stripe SetupIntent capture at pledge time (saves payment method); on threshold-hit, server-side PaymentIntent.create with the saved method and amount.
- Smart-contract escrow via the existing `VoterPrizeTreasury` infrastructure as an OPTIONAL trustless path for pledgers who don't want centralized custody.
- Public dashboard with per-pledger transparency (opt-in).

#### Recommendation

Build v0 with the existing Task model. **No schema changes needed.** Total dispatchable work for v0: ~1 day of focused Codex work covering all 6 ship items above. Wait until /foundations stub lands + parameter additions land + full /foundations page expansion lands before dispatching this — pledge intake is the LAST step before launch, because there's no point capturing pledges against an argument the page hasn't fully made yet.

## Open questions / what this doc doesn't cover yet

- **/shirt consumer page integration.** Should the "this sounds insane" objection-handling section also appear on /shirt for individual buyers, or stay /foundations-only? Not yet decided.
- **Personal-utility argument tone for MIC stakeholders.** Mike approved including it; verbatim copy in the doc is direct. Does it need a softer-edged variant for foundation officers who might find it too combative? Not asked yet.
- **`/foundations/pledge` vs inline intake form.** Should the soft-pledge form be a separate sub-route, an inline form on `/foundations`, or a "Contact us to pledge" button that opens a dialog/email? Not decided.
- **Privacy / public-display of pledger names.** Do pledges appear with the foundation name visible publicly (signaling effect, social-proof flywheel) or anonymous-by-default with opt-in transparency? Not decided.
- **Anonymous / non-auth pledge submission.** Can a foundation officer submit a pledge without first creating an account, or is OAuth-required? Friction tradeoff not yet decided.
- **Threshold value(s) for sliding-trigger structure.** What are the actual stage thresholds (100M shirts? 1B? Tiered)? Not decided; depends partly on parameter-audit final cost values.
- **Comparison table contents.** Which specific alternatives should the comparative-CBA table on /foundations include? GiveWell tops are obvious; cash transfers, AI safety, animal welfare, climate — pick a subset, not all of them. **Mike D3 answer 2026-05-20: Top 3 — GiveWell tops + GiveDirectly + AI safety.**

---

## Pricing thesis for /shirt (Mike, follow-up 2026-05-20)

> Mike asked: "this would technically be the best t-shirt in the history of the universe if a billion people buy it. so it seems like it's a good bargain if they only have to pay $25... we could say that it cost more than [the most expensive other t-shirt that has ever been sold]... alternatively, the value of the shirt might be the $84 quadrillion dollars divided by the number of shirts / 8 billion. so we could say the actual cost of the shirt is 84 quadrillion divided by 8 billion and then we could just give a discount from that down to $25"

### The Wishonia-deadpan pricing frame

Two valid anchoring strategies:

**Anchor A (campaign-derived):** Per-shirt true value = `EXPECTED_TREATY_VALUE_USD / WORLD_POPULATION_HUMANS`

- $84,786,551,002,649,840 ÷ 8,000,000,000 = **$10,598,318.88 per shirt**
- Charging $25 = **99.9998% discount off true value**
- Or: "$10,598,293.88 in savings per shirt"

This is the absurdist-math-taken-seriously version that aligns with the rest of the campaign's parameter-backed argumentation.

**Anchor B (comparative-market):** Per-shirt true value ≥ price of most expensive t-shirt ever sold

- "By definition this is the best t-shirt in the history of the universe (it ended war and disease). It should therefore cost more than any other t-shirt in history."
- The most-expensive-t-shirt-ever-sold reference price needs verification: candidates include rare collectible/auction-house t-shirts ($75K-$200K range for verified records; one-off art collaborations can hit higher), Hermès / luxury one-offs, or the Madonna concert tee that sold for ~$160K. Need to fact-check the actual record.
- Then: "We are charging $25. That is approximately a 99.984% discount off the most expensive t-shirt ever sold, and that t-shirt did not even end war and disease."

### Recommendation

**Ship Anchor A primarily.** Reasons:

1. **Parameter-backed.** Sources to `EXPECTED_TREATY_VALUE_USD` (= `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE`, already in the catalog) and `GLOBAL_POPULATION_2024` (also in the catalog). Both refresh automatically as the model updates. No fact-check rot.
2. **Aligns with /foundations argument.** The same $84Q figure anchors the foundation pitch; using it on /shirt creates a unified frame.
3. **Funnier in the Wishonia voice.** "$10,598,318.88 per shirt, discounted to $25" — the precision is the joke. Deadpan absurdism is the brand.

Anchor B can appear as a secondary throwaway line if you want the comparative dunk ("and that t-shirt did not even end war and disease"). Optional.

### Verbatim cleaned copy (Mike's words, cleaned)

Section header (place below the order form on /shirt):

> THE BEST T-SHIRT IN THE HISTORY OF THE UNIVERSE.

Body:

> If a billion humans wear this shirt on Earth Optimization Day, it becomes the best-selling t-shirt in human history. Because it ended war and disease, it also becomes the most valuable t-shirt in human history.
>
> The actual per-shirt value: `<ParameterValue param={EXPECTED_TREATY_VALUE_USD} />` divided by `<ParameterValue param={GLOBAL_POPULATION_2024} />` = approximately **$10,598,318.88 per shirt**.
>
> We are charging $25.
>
> That is a **99.9998% discount**. You are welcome.

(Optional Anchor B footnote, if Mike wants the comparative-market dunk:)

> For reference, the most expensive other t-shirt ever sold was approximately [PRICE]. That t-shirt did not end war and disease.

### Where this lives

- `packages/web/src/app/shirt/page.tsx` — new section below the order form (or below the coordination-device frame already shipped today, depending on order).
- Needs a new derived parameter in `packages/data/src/parameters/shirt-distribution.ts` (task #31): `PER_SHIRT_TRUE_VALUE_USD = EXPECTED_TREATY_VALUE_USD / GLOBAL_POPULATION_2024` with explicit derivation chain so the rendered number stays parameter-accurate.
- Optional new parameter for Anchor B: `MOST_EXPENSIVE_TSHIRT_EVER_SOLD_USD` (requires fact-check on auction records).

### Open questions

- Use Anchor A only, Anchor B only, or both (A primary + B footnote)?
- For Anchor B: which specific "most expensive t-shirt ever sold" record to cite? Needs auction-house verification.
- Where exactly on /shirt does the pricing section sit — above the order form (anchoring), below it (closing argument), or as a separate scroll-down callout?
- Does the same pricing argument also appear on /foundations as part of the foundation-pitch section, or is it /shirt-only?

---

## The pledge funnel IS the vote funnel (Mike, 2026-05-20)

> Mike: "if you got them to pledge to buy the t-shirts they already went on the website voted so you already got 8 billion people to agree to optimally allocate resources"

### The unification

Three things we've been treating as separate are actually one:

1. The shirt as coordination device.
2. The vote as actual win condition.
3. The pledge mechanism as funding/commitment layer.

Unified: **the pledge funnel IS the vote funnel.** Everyone who pledges has to land on the site. The site asks them to vote. So every shirt pledge captures a vote, whether the shirts ever ship or not.

### Implication for the win condition

The shirts do not need to physically exist for the campaign to succeed.

- If 4 billion people pledge to buy the shirt, the 4 billion votes get captured along the pledge funnel.
- 4 billion votes triggers the 1% Treaty referendum win condition.
- After the treaty passes, the $48B production cost becomes a solved problem:
  - Foundations now have a passed treaty to point at, and production funding becomes easier
  - Manufacturers race to fill demand at lower per-unit cost
  - OR humanity decides shirts were the wrong delivery vehicle and we use the votes for the treaty without ever printing 8B shirts
- None of those scenarios are the campaign's problem to pre-solve. The 4 billion votes is the win condition. The shirt-distribution mechanic is the *acquisition channel*, not the *deliverable*.

### Implication for the build

The pledge form must atomically capture vote + pledge in a single flow. No two-step. One button:

> **Pledge to buy this shirt and vote yes on the 1% Treaty.**

If the user has not yet voted in the referendum, the pledge endpoint atomically casts their treaty vote alongside the pledge insert. Single transaction. No "we'll redirect you to the vote page after pledging." No "make sure you also vote." The action IS the vote.

If the user has already voted, the pledge endpoint just records the pledge.

### Implication for /shirt copy

The /shirt page should foreground the **pledge** path over the **immediate-buy** path. Immediate-buy is still available for users who want a shirt right now and trust the campaign to deliver. But pledge is the primary CTA, because:

- Lower friction (no money out the door today)
- Higher conversion (commitment is psychologically easier than purchase)
- Captures the vote even if the user never follows through on the pledge
- Aligns with the assurance-contract mechanic (pledges accumulate toward threshold)

### Open questions

- Does the immediate-buy path also atomically capture the vote? (Recommend: yes — buying the shirt is at least as much a vote signal as pledging to buy.)
- Does the /vote page also surface a "pledge a shirt while you're voting" upsell? (Recommend: yes — same atomic-action insight in reverse.)
- How prominent is the "and vote yes on the 1% Treaty" copy on the pledge button — primary text, parenthetical, fine print? (Recommend: explicit primary text. The vote is the point.)
- Does the atomic pledge+vote flow require a schema change to the pledge primitive (task #33) or can it be handled in the API route by calling the existing vote endpoint inside the same transaction?

This insight changes the architecture of task #33's pledge API. Flagging on the task.
