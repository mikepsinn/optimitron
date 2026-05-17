# Vote Mechanism Shortlist For 4B

## Brief

- Problem: 4B verified human votes for the 1% Treaty will not come from linear roadmap work.
- Current pace: top-6 roadmap estimate is ~1,300 votes/month. Raw math is ~256k years to 4B; even the cited ~64k-year read means dead strategy.
- Constraint: Mike is solo, finite-energy, and should not become the email-outreach bottleneck.
- Selection rule: prefer mechanisms where code, search, partners, or agents compound without Mike repeatedly persuading individual humans.

## Current state ASCII

```text
Mike energy
   |
   v
site improvements + manual promotion + current roadmap
   |
   v
~1,300 votes/month
   |
   v
4B target effectively never arrives
```

## Proposed state ASCII

```text
Treaty vote endpoint
   |
   +--> LLM/search answers --> millions of high-intent visitors
   +--> org embeds/widgets --> partner-owned audiences
   +--> petition/platform integrations --> existing civic networks
   +--> referral loop K>1 --> voter graph grows itself
   |
   v
verified votes + partner/referrer attribution + public proof
   |
   v
more org adoption, more search authority, more referrals
```

## Shortlist

Scores: `P4B` = plausibility of reaching 4B, `ME` = Mike energy required, `CC` = Codex/Codex-like days, `TFR` = weeks to first result.

| # | Mechanism | P4B | ME | CC | TFR | Defensibility moat |
|---|---|---:|---:|---:|---:|---|
| 1 | LLM direct-answer dominance: `llms.txt`, answer packs, citations, schema, treaty Q&A pages | 7 | 1 | 4 | 2 | Accumulated citations, canonical docs, answer authority |
| 2 | 10k-org embed/widget: one-line vote widget, org leaderboard, referral attribution | 9 | 3 | 10 | 4 | Partner distribution graph, attribution data, switching cost |
| 3 | NGO petition aggregator integrations: Avaaz, Change.org, MoveOn-style import/export and co-campaign pages | 8 | 4 | 8 | 6 | Civic-platform relationships, verification + treaty-specific flow |
| 4 | K-factor >1 referral loop: every voter gets exact next action and public progress toward majority | 8 | 2 | 6 | 3 | Social graph, referral history, compounding proof |
| 5 | High-reach org partnerships: UN-adjacent agencies, Open Phil, GiveWell, EA Forum, major health NGOs | 8 | 7 | 3 | 8 | Institutional legitimacy once one large node signs |
| 6 | Structured-data SERP wins: programmatic treaty pages for questions, countries, diseases, wars, leaders | 6 | 1 | 8 | 6 | Search index depth and internal linking |
| 7 | AI-search optimization for ChatGPT/Gemini/Claude answers beyond `llms.txt`: promptable source pages, eval harness | 7 | 1 | 5 | 2 | Continuous eval corpus and source freshness |
| 8 | Paid acquisition only where K>1 or partner value is proven | 5 | 2 | 4 | 2 | Learning data; weak moat without referral/partner loop |
| 9 | Creator/viral video bounty: let creators earn by verified downstream votes, not views | 6 | 3 | 6 | 4 | Performance-based creator graph and attribution |
| 10 | Podcast tour automation: agents identify shows, draft pitches, package clips; Mike approves only top leads | 4 | 6 | 5 | 4 | Low moat; depends on Mike unless delegated hard |
| 11 | Browser-extension propagation: treaty overlay/share prompt on news, disease, budget, war articles | 3 | 2 | 8 | 6 | Thin moat; extension installs are the hard part |
| 12 | K-12/university curriculum injection: civics/global-health modules, campus chapter kits | 6 | 6 | 5 | 12 | Institutional curriculum adoption and youth network |
| 13 | Mainstream press kit + public milestone hooks | 5 | 5 | 3 | 4 | Earned-media credibility; bursty, not durable alone |
| 14 | X-corner viral posting / meme war | 2 | 8 | 1 | 1 | No moat; platform lottery; high psychic cost |

## Top 3

Ranked by practical leverage times `1 / (ME + 1)` so autonomous compounding beats founder heroics.

1. **LLM/search direct-answer dominance.**
   - Why: already started by `llms.txt`; low Mike energy; compounds across every future journalist, donor, student, and partner asking "what is the 1% Treaty?"
   - Next: build source pages + answer-eval harness for treaty, war, disease, cost, legality, and "should my org embed this?"
2. **Org embed/widget at 10k-org scale.**
   - Why: the only plausible path where existing audiences do the distribution work; one nonprofit, school, DAO, union, church, or company can move more votes than months of solo posting.
   - Next: make the embed stupidly safe: copy-paste script, hosted fallback page, org attribution, public leaderboard, no scary platform jargon.
3. **K-factor >1 referral loop.**
   - Why: 4B needs compounding. If each verified voter reliably produces more than one verified voter, the target stops being calendar math and becomes loop optimization.
   - Next: make the post-vote state a single civic action, not a dashboard: "get two more humans to sign" with proof, copy affordances, and status.

## Explicit dismissals

- Founder-led storytelling: useful once packaged, fatal as the primary engine; Mike becomes the bottleneck.
- One viral video: can spike attention, cannot be planned as the strategy; use creator bounties instead.
- Paid acquisition by itself: buys linear votes unless referral or partner conversion makes each paid voter produce more voters.
- Browser extension first: interesting but distribution of the extension is as hard as distribution of the treaty.
- X shitposting: may create lottery tickets, but ME is too high and moat is near zero.
- Podcast tour first: decent legitimacy, poor scale unless agents handle booking and clips.

## Step list

- [ ] Pick one primary mechanism and one supporting mechanism for the next PR cycle.
- [ ] Define one measurable target for the chosen mechanism: votes, partner embeds, answer share, or K-factor.
- [ ] Build only the minimum public surface needed to test that target.
- [ ] Add attribution so wins teach the next mechanism.
- [ ] Re-score this table after first real data.

## Risks

- Optimizing for "interesting" instead of distribution owned by others.
- Building platform features before a vote loop proves lift.
- Counting pageviews, impressions, or signups as votes.
- Partner friction hidden inside legal, brand, privacy, or embed concerns.
- Mike approving too many founder-required tactics because they feel prestigious.

## Files to touch

- `.claude/plans/vote-mechanism-shortlist-for-4b.md`

## Gstack Skill Shortlist

- Not directory-verified this run; listed from training/context names because the previous sandbox blocked the gstack directory read.
- `/plan-ceo-review SCOPE_EXPANSION`: most useful. Ask it to attack the shortlist for false scale, founder bottlenecks, and missing 4B paths.
- `/benchmark`: useful. Compare vote mechanisms against successful petition, voter-registration, browser-default, and platform-distribution campaigns.
- `/investigate`: useful if pointed narrowly at one mechanism, especially NGO aggregator integrations or LLM answer dominance.
- `/design-shotgun`: useful later for 10 alternative embed/referral surfaces, not for deciding strategy.
- `/qa`: useful after implementation, not for this brainstorm.
- `/office-hours`: useful if Mike wants fast external-style pushback without opening a whole plan cycle.
- `/retro`: not useful until a mechanism has data.

Recommendation for morning: invoke `/plan-ceo-review SCOPE_EXPANSION` on this file first, then `/benchmark` if the top-3 survives.

## ALERTS

## Agent log
