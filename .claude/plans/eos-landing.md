# Plan: Earth Optimization Services landing on optimitron.com

Companion to `docs/eos-landing-plan.md` (strategy). This file is the **implementation
tracker** — Codex ticks the Step list and appends to the Agent log.

## Brief

Reframe optimitron.com's home from "The Earth Optimization Game" to the **Earth
Optimization Services (EOS)** services+investment landing. Move the existing game scroll
to `/game`. Leave `warondisease.org` untouched. optimitron.com is already legally EOS in
`lib/site.ts` (legalEntityName/organizationName/emailBranding all say "Earth Optimization
Services LLC", `userFraming: "manager"`); only the landing component still wears the "Game"
costume.

**Positioning (load-bearing):** the headline is the two-number objective —
**maximize median healthy life expectancy + median real after-tax income** (health AND
wealth), per the manual's "Optimocracy: …Maximize Median Health and Wealth" and OPG's
charter. Disease eradication / 1% Treaty is the **lead wedge**, not the whole mission.
Do NOT frame EOS as "point lobbying at curing disease."

## Research log

No third-party API/SDK/vendor surface in this change — it is internal Next.js App Router +
the repo's own site-variant system. No vendor-doc freshness check required (no external
tool/version assumptions). Repo-internal provenance (file:line, read this session):
- `packages/web/src/lib/site.ts:84` — `SiteHomeVariant` union (`optimitronLanding` |
  `onePercentTreatyLanding` | `initiativeLanding`); add `eosLanding` here.
- `packages/web/src/lib/site.ts:631` — `OPTIMITRON_CONFIG.pageVariants.home = "optimitronLanding"`; flip to `eosLanding`.
- `packages/web/src/lib/site.ts:592` — `OPTIMITRON_CONFIG.rootMetadata` ("Earth Optimization Game" copy to update).
- `packages/web/src/app/page.tsx:40` — `onePercentTreatyLanding` branch; `page.tsx:85` `initiativeLanding`; `page.tsx:95` fallback → `OptimitronLandingPage`.
- `packages/web/src/components/site/OptimitronLandingPage.tsx:37` — current 19-section game scroll (moves to `/game`).
- `packages/web/src/lib/routes.ts:407` — NavItem/exploreLinks structure for reuse.
- `disease-eradication-plan/knowledge/solution/earth-optimization-services.qmd:31` — Standard Package / 4 products (copy source).
- Manual via `searchManual`: Optimocracy objective = "Maximize Median Health and Wealth".

## Current state

```
page.tsx switch on site.pageVariants.home:
  onePercentTreatyLanding → OnePercentTreatyLandingPage   (warondisease.org)
  initiativeLanding       → SiteVariantLandingPage        (dfda / dih)
  (else / optimitron.com) → OptimitronLandingPage         ← "Earth Optimization Game", 19 sections
```

## Proposed state

```
SiteHomeVariant gains "eosLanding".
OPTIMITRON_CONFIG.pageVariants.home = "eosLanding".

page.tsx switch:
  onePercentTreatyLanding → OnePercentTreatyLandingPage    (unchanged)
  initiativeLanding       → SiteVariantLandingPage         (unchanged)
  eosLanding              → EarthOptimizationServicesLandingPage   ← NEW
  (fallback)              → OptimitronLandingPage           (still used by /game)

NEW  app/game/page.tsx → renders OptimitronLandingPage verbatim
                          (incl. the TREATY_PARENT_TASK_ID task fetch now in page.tsx)
```

## Step list

- [x] Add `"eosLanding"` to `SiteHomeVariant` in `lib/site.ts`; set
      `OPTIMITRON_CONFIG.pageVariants.home = "eosLanding"`.
- [x] Update `OPTIMITRON_CONFIG.rootMetadata` (title/description/keywords) from "Earth
      Optimization Game" → EOS health+wealth thesis. Keep `alternateSiteNames`.
- [x] Create `app/game/page.tsx` rendering `OptimitronLandingPage` (move the
      `TREATY_PARENT_TASK_ID` fetch from `page.tsx` into it).
- [x] Add `eosLanding` branch to `app/page.tsx` → `EarthOptimizationServicesLandingPage`.
- [x] Build `components/site/EarthOptimizationServicesLandingPage.tsx` per the section map
      in `docs/eos-landing-plan.md`, REUSING existing landing components
      (`HeroSection`, `OptimalPolicyPreview`, `WishocracyPreview`,
      `OptimizedGovernanceSection`, `FinalCTASection`) + the open-loop ASCII diagram from
      the `.qmd`. Draft copy verbatim from the `.qmd`, every user-facing string flagged
      `{/* TODO(copy): Mike copy gate */}`.
- [x] Order ladder: Free → `/vote`; $200+ and $25k+ → `/fund` for now with
      `TODO(invest)` (the real `/invest` securities page is a separate, legal-gated PR).
- [x] Treaty/editorial B&W styling on the EOS surface (no GameCTA/arcade yellow). `/game`
      keeps its existing chrome.
- [x] Add `/game` (and later `/invest`) to `OPTIMITRON_PLATFORM_PREFIXES`.
- [ ] Regenerate affected `.md` snapshots + screenshots for `/` and `/game`
      (`affected-routes.mjs` → targeted regen).
- [ ] `pnpm check` clean. Spot-check `/` and `/game` via Playwright MCP; tail
      `.dev-server.log` for runtime errors.
- [ ] Update `TODO.md` in the same staged changeset (or `todo-skipped:` reason).
- [ ] Stage changeset, DO NOT commit — report diff to orchestrator for Mike's approval.

## Risks

- **Holds PR #88.** This rides the open `feature/auth-magic-link-spam` branch (Mike's call).
  #88 is green/mergeable; it won't merge until EOS is review-ready. Keep EOS commits
  cleanly separable.
- **Stray uncommitted file** `packages/data/src/parameters/parameters-calculations-citations.ts`
  (35 insertions, not in any commit, not ours). DO NOT touch it. `git add` ONLY EOS files.
- **Copy is draft, not final.** Every user-facing string flagged `TODO(copy)`; nothing
  ships as approved until Mike's gate.
- **`/invest` deferred** — securities/legal copy; not in this changeset.
- Don't mix the 3 treasury mechanisms (Prize/IAB/$WISH) with the Loving Takeover.

## Files to touch

- `packages/web/src/lib/site.ts` (variant + metadata)
- `packages/web/src/app/page.tsx` (add branch)
- `packages/web/src/app/game/page.tsx` (NEW)
- `packages/web/src/components/site/EarthOptimizationServicesLandingPage.tsx` (NEW)
- regenerated `.md` snapshots for `/` and `/game`
- `TODO.md`

## ALERTS

(orchestrator-edited; Codex re-reads at top of every turn)
- Keep it on the CURRENT branch (`feature/auth-magic-link-spam`). No new branch, no worktree.
- Dev server already running at http://127.0.0.1:3001 — reuse it, do NOT start your own.
- Do NOT touch `parameters-calculations-citations.ts`.
- **`## Pivot 5` (Prisma VoteTokenMint -> PointMint + the 2 currency slides) IS THE CURRENT
  DIRECTION.** Pivots 1-4 are built/staged. Execute ONLY Pivot 5. The Prisma migration MUST be a
  pure table/enum RENAME (no data-destroying statement). Keep referendum-voting logic byte-identical.
- **NO SCREENSHOT ARTIFACTS THIS TIME. HARD BAN.** Do NOT generate
  `output/playwright/review/*`, do NOT take full-page screenshots, do NOT enter any
  recapture loop. Last run wasted ~25 min there. Verification is EXACTLY: `tsc --noEmit`
  + the 2 vitest files + ONE Playwright `browser_navigate` to `/` and `/game` reading
  `browser_console_messages` for errors. That is the entire verification budget. Then STOP.
- After building: `git add` ONLY EOS files, print `git diff --cached --stat`, report, STOP.
  Do NOT commit/push.

## Mike approved

Mike approved implementation in chat, 2026-06-05, verbatim:
> please proceed to implement your plan

Scope confirmations from the same session:
- Same branch / same PR (#88): "I don't see any problem with just keeping it on the same Branch and pull request do you?"
- Copy handling: "Draft from the .qmd, mark for review"
- Positioning: health AND wealth (maximize median healthy life expectancy + median real after-tax income), disease as the lead wedge — not "cure disease" alone.
- `/invest` securities page deferred (legal pass) — order ladder links to `/fund` with TODO(invest).

## Agent log

(Codex appends after each meaningful action)
- 2026-06-05: Read the Mike-approved implementation tracker, dispatch prompt, and
  strategy doc before edits. Confirmed ALERTS: stay on current branch, reuse
  http://127.0.0.1:3001, and do not touch
  `packages/data/src/parameters/parameters-calculations-citations.ts`.
- 2026-06-05: Ran quick memory/context pass and read package web rules. Relevant
  reminder: keep this tied to `TODO.md`, fundability, and campaign outcomes; use
  H2EWD copy workflow for public copy.
- 2026-06-05: Manual MCP was not available. Static manual download via
  PowerShell/curl failed on Windows Schannel (`SEC_E_NO_CREDENTIALS`), so I used
  web search against manual.warondisease.org. Usable snippets found: Optimocracy
  / OPG maximize median health and wealth; 1% Treaty 604:1 and treaty redirect
  framing. No usable manual snippets found for EOS Standard Package / four
  products / thermostat wording, so those strings will be sourced verbatim from
  `disease-eradication-plan/knowledge/solution/earth-optimization-services.qmd`.
- 2026-06-05: Implemented the EOS variant switch, EOS root metadata, `/game`
  page, route metadata/review registration for `/game`, reusable black-and-white
  modes for Hero/OPG/Wishocracy/Governance/Final CTA components, and the new
  `EarthOptimizationServicesLandingPage`. `$200+` and `$25,000+` order rungs
  point to `/fund` with `TODO(invest)` markers; no `/invest` page added.
- 2026-06-06: Re-read ALERTS, package web rules, H2EWD copy workflow, the pivot
  plan, the broken EOS component, route exports, and parameter constants before
  editing. Manual MCP was unavailable and `curl.exe` to the manual index failed
  with Windows Schannel `SEC_E_NO_CREDENTIALS`; web/manual search found the
  1% Treaty resource-allocation snippets, and local manual source confirmed the
  Loving Takeover snippets and EOS two-number mechanism. Read
  `parameters-calculations-citations.ts` only; no edits.
- 2026-06-06: Rewrote `EarthOptimizationServicesLandingPage.tsx` as the
  Berkshire-simple thesis page: semantic markup, treaty black-and-white styling,
  `ParameterValue` numbers, route-export link list, `/fund` investment rungs
  with `TODO(invest)`, and no GameCTA/reuse-tour imports. Verified with
  `tsc --noEmit` using the repo's larger Node heap after the default heap OOMed,
  the two requested Vitest files, and a no-artifact Playwright console check of
  `/` and `/game`; Browser MCP navigation was cancelled before fallback.
- 2026-06-06: Re-read ALERTS for Pivot 2. `searchManual`/`askWishonia` were not
  exposed by available MCP tools; `curl.exe` fallback to the manual static index
  failed with Windows Schannel `SEC_E_NO_CREDENTIALS`. Used local manual/source
  snippets instead: EOS brochure "Every civilization gets the same four
  products" plus the closed-loop Optimitron/Loving-Takeover/1%-Treaty circuit;
  Loving Takeover "~$127M/year" lobbying redirection and cheap-lawsuit vs
  maximalist-takeover framing; fundraising strategy "$1B vending machine ...
  $27B/year forever"; investment terms `eosCalc` and result-card strings.
- 2026-06-06: Rewrote `EarthOptimizationServicesLandingPage.tsx` for Pivot 2 as
  the 1950s Planetary Optimization Services pamphlet and added the client
  `EosInvestmentCalculator.tsx` with the plan-file calculator math, sliders,
  result cards, and required securities disclaimer. No screenshot artifacts.
- 2026-06-06: Verified Pivot 2 with `tsc --noEmit` (default Node heap OOMed;
  repo heap setting passed), the two requested Vitest files, and a no-artifact
  Playwright browser check on the existing `3001` server. MCP `browser_navigate`
  was cancelled by the client, so the fallback used one `page.goto` to
  `/?site=optimitron`, dragged `#eos-amount` from `25000` to `1704000`,
  confirmed the calculator summary changed, and captured no severe console or
  page errors. No screenshots or review artifacts created.

## Pivot 2026-06-06: Berkshire-simple (SUPERSEDES the reuse tour)

Mike, verbatim:
> Berkshire Hathaway has very simple fucking website. We have very complicated fucking
> website... think about what the website should look like in a Platonic ideal... our main
> objective is create this company Earth Optimization Services and then get people to invest
> and use it to buy all the shares of the companies that control the government and then use
> their lobbying power to get the government to implement policies that promote the general
> welfare. A loving takeover, in the vein of Carl Icahn and Warren Buffett.

Mike approved (this session): rebuild Berkshire-simple; keep variant wiring + /game move;
treaty editorial B&W (NOT full Times-New-Roman brutalism).

**The homepage has ONE job: investor understands the thesis and invests.** It is a
shareholder-letter page, not a product tour. Berkshire links its subsidiaries; it does not
embed their demos. Same move here.

### Revised Step list
- [ ] REVERT to origin (git checkout HEAD --) the 5 reuse-plumbed components — they are NOT
      used by the simple page and their changes only risk `/game`:
      `HeroSection.tsx`, `FinalCTASection.tsx`, `OptimalPolicyPreview.tsx`,
      `OptimizedGovernanceSection.tsx`, `WishocracyPreview.tsx`.
- [ ] REWRITE `EarthOptimizationServicesLandingPage.tsx` as the Berkshire-simple thesis page
      (text-first, treaty B&W, square corners, `font-black uppercase` headings). Sections:
      (1) one-line thesis + two CTAs `[Invest]` `[Vote free in 30s → warondisease.org]`;
      (2) THE NUMBERS table (use `<ParameterValue>` — grep
      `packages/data/src/parameters/parameters-calculations-citations.ts` for the 604:1
      ratio / military / trials / lobbying figures; do NOT hardcode);
      (3) HOW IT WORKS — 4 steps (buy shares → proxy proposals → boards redirect lobbying to
      maximize median healthy life-years + median real after-tax income → positive-sum);
      (4) WHAT THE CAPITAL OPERATES — a plain link list to the subsidiaries (dFDA, DIH, OPG,
      OBG, Wishocracy, 1% Treaty, Court, Manual, GitHub) reusing existing NavItem links from
      `routes.ts`; (5) footer line: Letters · Fund terms · Founder equity 0%.
      No animated previews, no sliders, no counters. ~15 real strings, each `TODO(copy)`.
- [ ] Order ladder rungs ($200 / $25k) → `/fund` with `TODO(invest)` (real `/invest` later).
- [ ] KEEP unchanged: `site.ts` variant+metadata, `page.tsx` branch, `app/game/*`,
      `routes.ts` gameLink, the 2 test files, `TODO.md`, docs.
- [ ] Manual-search FIRST for any copy (searchManual / askWishonia / curl fallback); cite.
- [ ] Verify per ALERTS (tsc + 2 tests + ONE console spot-check). NO screenshot artifacts.
- [ ] Re-stage EOS files only; print `git diff --cached --stat`; report; STOP.

### Platonic-ideal wireframe (target)
```
EARTH OPTIMIZATION SERVICES                         [Invest] [Vote]
We buy the companies that control the government and make them lobby
for curing disease instead of causing war. It pays shareholders better.
   [ Invest → ]      [ Vote free in 30s → warondisease.org ]
THE NUMBERS   military $2.72T/yr · trials $4.5B/yr · 604:1 · lobbying $127M/yr
HOW IT WORKS  1 buy shares · 2 proxy proposals · 3 boards redirect lobbying
              to maximize median health + median income · 4 positive-sum, repeat
WHAT THE CAPITAL OPERATES  dFDA · DIH · OPG · OBG · Wishocracy · 1% Treaty ·
                           Court · Manual · GitHub        (plain links)
Letters · Fund I terms · Founder equity 0%
```

### Copy + numbers (Mike-directed, 2026-06-06)

HERO (Mike's reframe — use A as draft, B as alternate; both `TODO(copy)`):
- A: "We buy the companies that control your government and use it to make you poorer and
  deader — then make them make you richer, healthier, and happier instead."
- B: "We buy the companies that own your government and quietly make you poorer and deader.
  Then we make them make you richer, healthier, and harder to kill."
Note: "make them" not "force them" — the loving takeover is positive-sum (boards win on
share price), not coercive.

MANUAL-SOURCED copy for the mechanism/why-loving blocks (quote, cite "The Loving Takeover"):
- "~$90 per global human buys a controlling stake in every major defense contractor; you
  redirect their lobbying toward the policies that make people richer and healthier."
- "$127M/yr lobbying budget — currently spent blocking the 1% treaty — gets pointed at
  passing it." (param if one exists; else cite manual, TODO(copy))
- "Loving, not hostile: the people bought out are made richer and longer-lived by it."
- "The lawsuit is the cheap version (one share, one demand letter). The takeover is the
  maximalist version (enough shares to vote the board)."

NUMBERS: source via `<ParameterValue>` where the constant exists — grep
`parameters-calculations-citations.ts` (READ-ONLY; do not edit) for the military/trials
ratio + lobbying figures. If no param exists for a figure, hardcode with a `TODO(param)`
note rather than inventing.

## Pivot 2 (2026-06-06): 1950s pamphlet + your-own-numbers calculator (SUPERSEDES Berkshire-simple)

Mike approved (this session). The Berkshire-spartan page is REPLACED. New shape, for the
anchor-investor audience already locked in `## Pivot`/`## Mike approved`:
**vision pamphlet → the machine (circuit diagram) → the standard package → why it pays →
YOUR calculator → terms → talk-to-us.** ONE universal page (no whale segmentation — the
calculator self-personalizes). KEEP the existing wiring (eosLanding variant, /game, tests).

AUDIENCE: rich accredited/anchor investor (EV-thinker) arriving via warm intro.
GOAL: make them think "this is real, I must talk to them" → click **Request the data room /
Book a call** (NOT a checkout). The calculator is the credibility centerpiece.

### Sections (rewrite EarthOptimizationServicesLandingPage.tsx)
1. Masthead — "PLANETARY OPTIMIZATION SERVICES / Earth Optimization Services, LLC — now
   accepting applications." Retro-ad voice from the EOS .qmd. CTAs: [See what your stake
   becomes ↓] [Talk to us].
2. The offer — "Live on a planet without war and disease." (.qmd intro)
3. **The machine** — "Your government has no thermostat. We install one." Reuse the
   closed-loop ASCII/diagram concept from the .qmd (Optimitron sensor → Loving Takeover
   actuator → 1% Treaty power → outcomes → feedback). Render as a clean B&W diagram.
4. The Standard Package — 4 products (Evidence Engine / Budget Redirect / Loving Takeover /
   Direct Allocation), terse.
5. Why it pays — "$1B vending machine → $27B/yr forever"; "invisible mass stupidity =
   infinite alpha"; "intelligent greed." (sources: fundraising-strategy.qmd, Paradigm-Shift
   Notion, loving-takeover.qmd)
6. **THE CALCULATOR** (new client component `EosInvestmentCalculator.tsx`) — see math below.
7. Terms — min $25k (friends & family) / $100k (institutional); two products (EOS share /
   IABs); founder equity 0%. (investment-terms.qmd)
8. CTA — [Request the data room] [Book a call]. Gate "invest" behind accredited/legal.

### Calculator — port `eosCalc` VERBATIM from investment-terms.qmd (do NOT re-derive)
Client component, useState sliders. Inputs (defaults): amount $25k [1k–5M], years 10 [1–30],
prob 10% [0.1–100], entryProb 5% [0.5–100], spReturn = `AVERAGE_MARKET_RETURN_PCT` [0–0.2],
netWorth $250k [0–100M], mult = `TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15`
(editable, show its 95% CI). Math:
```
prob = probPct/100 ; p0 = entryProbPct/100
takeover = DEFENSE_TAKEOVER_COST_TOTAL.value
success      = amount * mult
fail         = amount * (1+sp)^years
ev           = prob*success + (1-prob)*fail
evVsSp       = ev - fail
systemicUpside = netWorth * (mult-1) ; systemicEv = prob*systemicUpside
asleepSuccessMult = mult / p0 ; asleepSuccess = amount*asleepSuccessMult
asleepEv     = prob*asleepSuccess + (1-prob)*fail
edge         = prob / p0 ; efficientEv = amount*mult ; share = amount/takeover
```
Result cards (verbatim copy from investment-terms.qmd lines ~294-347): Value if Succeeds
(`mult`x), Value if Fails (defense stocks at sp%/yr), Expected Value (prob-weighted), and the
deadpan summary incl. "You also do not die of a curable disease... arguably the better return."
**SECURITIES DISCLAIMER REQUIRED** on the calculator: "Illustrative. YOUR assumptions, not a
promise or offer. Not investment advice." Money format: Intl.NumberFormat USD, 0 decimals.

### ALERTS update for Pivot 2
- Calculator is a `"use client"` component with useState; everything else stays server.
- Reuse param DATA from `@optimitron/data/parameters`; do NOT edit `parameters-calculations-citations.ts`.
- SAME HARD NO-SCREENSHOT RULE. Verify: tsc + the 2 vitest files + ONE Playwright console
  check of `/` (+ interact with one slider via browser to confirm it updates, no screenshot).
  Stage, print `git diff --cached --stat`, report, STOP.

## Pivot 3 (2026-06-07): cold-stranger rewrite + thermostat + calculator fix + rename + /eos route

Mike approved "go for it." Build ALL of this. Keeps Pivot 2 structure (pamphlet + calculator);
fixes comprehensibility. KEEP wiring (eosLanding) + the calculator component (with fixes).
PRINCIPLE: a cold stranger who has never heard of this must understand it. REMOVE undefined
jargon from the cold path (Loving Takeover, Optimitron, OPG, OBG, 1% Treaty, Evidence Engine,
Direct Allocation, Wishocracy) or define in the same breath. Plain Cunk/Vonnegut voice —
"$90 per person" NOT "$90 a head"; no "a fund buys the stake". Every string TODO(copy).

### Page flow (rewrite EarthOptimizationServicesLandingPage.tsx)
masthead → HERO → WHAT THIS IS → THERMOSTAT (oven vs gov vs EOS) → HOW IT WORKS (4 steps) →
WHY IT PAYS → calculator → terms → talk-to-us.

### Exact copy (verbatim; all TODO(copy))
HERO: "Governments are supposed to make people healthier and richer. We're buying the power
to make them."
WHAT THIS IS: "A government has one job: make the median person healthier and richer. Most
are bad at it, because the people who profit from the current setup pay to keep it that way
— governments spend [RATIO]x more testing weapons than testing cures. So we do the boring
thing. We buy a controlling share of the companies whose lobbying blocks the fix, hand that
power to ordinary people instead of a boardroom, and point it at the policies that nearly
every country's data says actually raise health and income. The lobby that spent decades
stopping cures starts paying for them. It's almost like pointing the money at the goal works
better. Weird. (This already runs as software. The math is public.)"
  [RATIO] -> <ParameterValue param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO} display="integer" />

THERMOSTAT — reuse earth-optimization-services.qmd:147-227, render 3 stacked panels (plain B&W):
  Heading: "Your government has no thermostat."
  Deck: "Your oven measures the temperature, compares it to what you asked for, and adjusts.
  So does your fridge, your cruise control, your toilet. Your government runs the most complex
  system on Earth with less feedback than a toaster."
  P1 YOUR OVEN (it checks, then adjusts): Set 350F -> Heat -> Oven -> Food; Thermometer
  feedback. "This is why your food is edible."
  P2 YOUR GOVERNMENT (it doesn't check anything): "War on Drugs" -> $1 trillion -> policy ->
  ??? (no sensor, no adjust). Overdose deaths 6,000 -> 107,000. Budget change: none. 53 years.
  "It never checks whether the policy worked. This is why your citizens are dead."
  P3 EARTH OPTIMIZATION SERVICES (installs the thermostat): "Measure two numbers — how long
  people live, how much they earn — keep the policies that raise them, drop the ones that
  don't, repeat."

HOW IT WORKS (4 steps):
  1 BUY THE POWER: "Buy a controlling share of the big weapons companies. The people you buy
  out get richer doing it — the share price goes up, not down."
  2 HAND IT TO EVERYONE: "Instead of one boardroom deciding what that power does, every person
  gets a say — simple this-or-that choices that add up to what the public actually wants."
  3 FIND THE POLICIES THAT WORK: "Feed in two centuries of data from nearly every country:
  which laws actually made people live longer and earn more. Rank them."
  4 USE THE LOBBY TO INSTALL THEM: "The lobbying budget that used to block the fix now pays to
  pass it — starting with [FUND] a year redirected into testing cures."
  [FUND] -> <ParameterValue param={TREATY_ANNUAL_FUNDING} />

WHY IT PAYS: "The whole takeover costs about [TOTAL] — roughly $90 per person, if every human
chipped in. Nobody collects $90 from anybody. You put money in, you own part of it, and the
returns come from those companies getting more valuable as the economy grows. You are not
paying to fix the planet. You own part of the fix."
  [TOTAL] -> <ParameterValue param={DEFENSE_TAKEOVER_COST_TOTAL} /> if it renders clean; "$90 per
  person" -> <ParameterValue param={DEFENSE_TAKEOVER_COST_PER_HUMAN} /> (rounds to ~$86; the prose
  "$90" is fine as the round vividness, but prefer the param so it stays sourced).

TERMS / CTA: keep Pivot 2 (min $25k friends&family / $100k institutional; founder equity 0%;
accredited-only off-page gate; Request the data room / Book a call).

### Calculator fixes (EosInvestmentCalculator.tsx) — keep eosCalc math intact
- DELETE the "Your Share of the Takeover" card (0.0000003% micro-fraction; meaningless + overflows).
- ABBREVIATE big currency on result cards: values >= 1,000,000 render compact ("$1.2M","$488M",
  "$2.4B") via Intl.NumberFormat notation:"compact" (a `moneyCompact()` helper). Small values stay
  full. This is the overflow fix — no number should break its box.
- Default to 3 plain inputs: "How much you invest", "Your odds it works (%)", "Years you hold".
  Put the rest (S&P return, market-implied entry probability, net worth, GDP multiplier) inside a
  collapsible <details> labelled "Advanced". Keep all math + the disclaimer.

### Rename + cleanup
- Rename component OptimitronLandingPage -> EarthOptimizationGameLandingPage (file
  OptimitronLandingPage.tsx -> EarthOptimizationGameLandingPage.tsx; export; import in
  app/game/page.tsx).
- app/page.tsx: REMOVE the now-dead fallback branch + its import of the game component (all 4 site
  keys map to a handled variant: warOnDisease->onePercentTreatyLanding, dfda/dih->initiativeLanding,
  optimitron->eosLanding). If TS needs a default return, render <EarthOptimizationServicesLandingPage/>.

### /eos route (lands EOS in CI screenshots + .md snapshot — investigated w3q7auc90)
- NEW app/eos/page.tsx: renders <EarthOptimizationServicesLandingPage/>, metadata=getRouteMetadata(eosLink).
- routes.ts: add `eos: "/eos"` to ROUTES; add `eosLink` NavItem (label "Earth Optimization
  Services", emoji ⚡, plain description, tagline, copyPreview:true, screenshot:true,
  reviewName:"eos", cta:"View"); add eosLink to routeReviewNavItems (after donateLink).
- Add "/eos" to OPTIMITRON_PLATFORM_PREFIXES. No allowlist edits needed (warOnDisease
  restrictToAllowlist:false). Update routes.test.ts/site.test.ts if they assert nav/route counts.

### ALERTS for Pivot 3
- Pivot 3 is the CURRENT direction (supersedes Pivot/Pivot 2 copy). SAME HARD NO-SCREENSHOT RULE.
- Verify: tsc + 2 vitest + ONE Playwright console check of `/` and `/eos` (interact one slider).
  Stage EOS files only; do NOT touch parameters-calculations-citations.ts. Report + STOP.
- The ORCHESTRATOR (Claude) does a COLD-STRANGER READ of rendered /eos before "done" — not Codex.

## Pivot 4 (2026-06-07): full VOTE → Earth Optimization Points rename (currency only)

Mike: "we have no users yet... should we just fix everything?" Verified: VoteToken/VoterPrizeTreasury
are NOT deployed (server-client.ts guards on zero address `0x0000...0000`; no real VOTE_TOKEN_ADDRESS).
So renaming is a pure code rename — NO redeploy, NO addresses, NO migration. Do it.

GOAL: the PRIZE CURRENCY "VOTE"/"VoteToken" becomes "Earth Optimization Point(s)" / symbol "EOP"
across code: the undeployed Solidity contract (packages/treasury-prize), typechain, the web
contract client, React components, server, API routes, formatters, vars, tests. User-facing text
already done via messaging.ts POINT_NAME (no re-do).

HARD BOUNDARY — classification (correctness, not caution):
- RENAME (currency): VoteToken.sol (symbol VOTE->EOP, name "Earth Optimization Point") + hardhat
  recompile + typechain regen; lib/contracts/server-client.ts token refs; VoteTokenBalanceCard ->
  EarthOptimizationPointsBalanceCard; referral-vote-token-mint.server -> referral-point-mint.server;
  /api/vote-tokens/* -> /api/points/* and /api/cron/vote-token-mint -> /api/cron/point-mint (no users,
  URL change OK); formatVOTE -> formatPoints; point vars (votePoints, voteCount, PRESET_VOTES,
  totalVotes-as-points). Keep VoterPrizeTreasury contract NAME (treasury voters claim from) - only the
  TOKEN renames.
- LEAVE (referendum ACTION of voting): TreatyVoteFlow/Section, VoteShareCard, VoteOrShareButton,
  VoteImpactSection, SurveyVoteFlow*, BillVoteCard, /api/referendums/[slug]/vote, treaty-vote.ts,
  verified-votes.server, per-verified-voter-impact.server + IMPACT_PER_VOTE, reasoning "VOTE"/"DOWNSTREAM_VOTE"
  outcome kinds, castReferendumVote, post-vote-share-*. These are voting, not currency.
- CLASSIFY CAREFULLY (ambiguous): demo slides slide-vote-point-dollar-value / slide-vote-value-asymmetry
  (these describe the POINT value = currency -> update the currency terms but keep referendum framing
  where the slide is about earning-by-voting). VoteValueReveal (value of a referendum vote -> mostly leave;
  update only currency nouns). When unsure, prefer LEAVE and flag.

VERIFY: hardhat compile (treasury-prize) + typechain ok; `pnpm --filter @optimitron/web exec tsc --noEmit`
green; the 2 EOS tests + any prize/vote-token tests pass; render /prize and /game (no console errors).
Confirm the referendum /vote flow and the vote API are UNTOUCHED. NO screenshot artifacts.

## Pivot 5 (2026-06-07): finish the rename — Prisma model + the 2 currency slides

Mike: "I guess we should rename those other things." Finish the VOTE->Earth Optimization Points
rename for the two leftovers Codex deferred. No users; safe.

PRISMA (packages/db/prisma/schema.prisma): rename `model VoteTokenMint` -> `model PointMint`,
`enum VoteTokenMintStatus` -> `enum PointMintStatus`, the relation fields `voteTokenMints` ->
`pointMints` on User (~line 1582) and Referendum (~line 4299), the `@relation("UserVoteTokenMints")`
name -> `"UserPointMints"`, and the doc comments ("VOTE token mint" -> "Earth Optimization Point
mint"). Then:
- The migration MUST be a pure RENAME, never destructive: edit the generated SQL so it is
  `ALTER TABLE "VoteTokenMint" RENAME TO "PointMint";` plus the enum-type rename. It must NOT
  re-create the table (no data-destroying statement).
- `prisma generate` to regenerate packages/db/src/generated/* (+ zod). These are GENERATED - do not
  hand-edit; regenerate.
- Update the ~8 hand-written consumers: `prisma.voteTokenMint` -> `prisma.pointMint`,
  `VoteTokenMintStatus` -> `PointMintStatus`, type imports. Files: api/cron/point-mint/route(.test),
  api/points/balance/route(.test), api/prize-treasury/status/route(.test),
  api/referendums/[slug]/vote/route(.test) (reference-only - keep voting logic identical),
  lib/impact-receipts.server(.test), lib/referral-point-mint.server(.test).

SLIDES (the 2 currency ones; LEAVE VoteValueReveal - borderline/referendum): rename
packages/web/src/components/demo/slides/sierra/slide-vote-point-dollar-value.tsx and
slide-vote-value-asymmetry.tsx + their symbols/imports/usages from VOTE/vote-point -> point /
Earth Optimization Point. Update any demo-script references to the slide ids/exports.

VERIFY: `pnpm --filter @optimitron/web exec tsc --noEmit` green; prize/point + impact-receipts +
the EOS tests pass; the migration SQL contains RENAME and contains no data-destroying statement.
Referendum voting logic still byte-identical. NO screenshot artifacts.
