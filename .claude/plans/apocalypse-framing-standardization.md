## Research log

- Read `.claude/codex-delegation.md:119-132`. The required plan-first section order is Research log, Brief, current/proposed ASCII diagrams, Step list, Risks, Files to touch, ALERTS, Agent log.
- Read `AGENTS.md:18-22`, `AGENTS.md:47-60`, and `AGENTS.md:89-96`. The work must prioritize `warondisease.org`, screenshot affected UI before commit, and get human approval before committing user-facing copy.
- Read `packages/data/AGENTS.md:7-25`. The `parameters` subpath is a supported data export, and data must not import Prisma runtime.
- Read `packages/web/AGENTS.md:19-52`. Web can consume all packages, public copy should use Wishonia voice, metadata comes from `routes.ts`, screenshots are required for UI changes, and exact prose should not be frozen in E2E unless copy is the contract.
- Read `docs/h2ewd.md:161-164`. The current long-form manual uses the "122 apocalypses" joke directly, which is the same unclear countable noun Ivy flagged.
- Read `TODO.md:122-178`. Ivy's feedback is verbatim there, the three candidates are named, and the implementation note requires parameter-backed numbers plus one prose constants module.
- Ran `rg -n "apocalypse|apocalypses|Apocalypse" packages`. Primary user-facing hits are in `Footer.tsx`, `donate/page.tsx`, `endorse/page.tsx`, `DonationCalculationNarrative.tsx`, `TreatyVoteFlow.tsx`, `TreatyPostVoteShareFlow.tsx`, managed task triggers, managed Grandma Kay data, route/site metadata, referendum-site messages, signatories, represented-person placeholders, share templates, generated markdown snapshots, and tests.
- Read the TODO-enumerated surfaces: `packages/web/src/components/Footer.tsx:42-63`, `packages/web/src/app/donate/page.tsx:44-58`, `packages/web/src/app/endorse/page.tsx:177-189`, `packages/web/src/components/donate/DonationCalculationNarrative.tsx:372-398`, `packages/web/src/components/landing/TreatyVoteFlow.tsx:543-595`, `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:791-812`, `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:854-872`, `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:946-949`, `packages/db/src/managed-data/managed-task-triggers.ts:116-144`, and `packages/db/src/managed-data/managed-grandma-kay.ts:72-92`.
- Read additional user-facing or generated-source hits that should not be missed during implementation: `packages/web/src/components/referendum/TreatyTradeThesis.tsx:8-25`, `packages/web/src/lib/site.ts:48-55`, `packages/web/src/lib/routes.ts:41-43`, `packages/web/src/lib/routes.ts:750-754`, `packages/web/src/lib/routes.ts:843-848`, `packages/web/src/lib/routes.ts:916-920`, `packages/web/src/messages/en-US/war-on-disease.json:2-7`, `packages/web/src/content/referendum-sites/one-percent-treaty.ts:19-32`, `packages/web/src/components/referendum/SignatoriesLeaderboard.tsx:66-79`, `packages/web/src/components/people/RepresentedPersonForm.tsx:1184-1197`, `packages/web/src/components/people/ManageRepresentedPeopleClient.tsx:962-975`, `packages/web/src/lib/humanity-manager-promotion-content.tsx:49-58`, `packages/web/src/lib/humanity-manager-promotion-content.tsx:72-110`, `packages/web/src/lib/humanity-manager-promotion-content.tsx:137-150`, `packages/web/src/components/tasks/ProgramTaskSection.tsx:107-123`, and `packages/web/src/lib/tasks/share-templates.ts:88-97`, `packages/web/src/lib/tasks/share-templates.ts:185-209`, `packages/web/src/lib/tasks/share-templates.ts:268-277`, `packages/web/src/lib/tasks/share-templates.ts:625-677`, `packages/web/src/lib/tasks/share-templates.ts:725-733`.
- Read parameter sources: `packages/data/src/parameters/parameters-calculations-citations.ts:6388-6401` defines `NUCLEAR_WINTER_OVERKILL_FACTOR` as 122.41x and ties it to the civilizational-collapse/nuclear-winter threshold; `packages/data/src/parameters/parameters-calculations-citations.ts:6956-6968` and `packages/data/src/parameters/parameters-calculations-citations.ts:3568-3596` define the existing "Price of Apocalypse" and "Apocalypse Markup" parameters that should not be renamed in this sweep.
- Read existing flow-only derived parameters in `packages/web/src/lib/treaty-share-flow-parameters.ts:140-168`. `FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR`, `FLOW_WASTEFUL_APOCALYPSES`, and `FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD` already compute the rounded values the new shared data module should own or expose consistently.
- Read trigger-token plumbing in `packages/web/src/lib/triggers/context.ts:71-124`, where `apocalypseCount` and `apocalypseCountLinked` are generated for managed task templates.
- Read task-share token plumbing in `packages/web/src/lib/tasks/share-templates.ts:22-49` and `packages/web/src/lib/tasks/accountability.ts:376-421`; additional overkill tokens must be added there if share templates stop hardcoding `122`, `120.8`, `12,141`, and `~100`.
- No WebSearch was run. This plan does not introduce new nuclear-winter consensus claims beyond the repo's existing parameter/citation layer; candidate B is chosen because it avoids needing more scientific exposition in UI copy. If Mike wants the scientific sentence sharpened, do a separate last-12-months literature check before changing the underlying parameter descriptions.

## Brief

Ivy's feedback is correct: "a hundred of them ends civilization" and "122 apocalypses" require a causal chain the reader has not been given. The plan is to ratify candidate B, the overkill-layer framing:

> Humanity has 122x the warheads needed to end civilization. Trade one of those 122 layers of overkill for disease eradication. The other 121 stay; the deterrent doesn't move.

Candidate B should win because it drops the countable "apocalypse" noun, keeps the "trade" frame that makes the absurdity legible, and answers the likely deterrence objection inside the phrase. Candidate A is clearer but too long for metadata, buttons, and tight UI. Candidate C is short but still treats "nuclear winter" as a countable object and loses the deterrent reassurance.

The standardized phrase should live in `packages/data/src/parameters/nuclear-overkill-framing.ts`, exported through `@optimitron/data/parameters`. That location is better than `packages/web/src/lib/messaging/` because `packages/db` managed data and `packages/web` UI both need the same phrasing, and `packages/db` must not depend on `packages/web`. The module should stay pure TypeScript: no React, no Prisma, no web imports.

## Current state ASCII diagram

```
packages/data/src/parameters/parameters-calculations-citations.ts
  |  raw parameters:
  |  - GLOBAL_WARHEAD_COUNT
  |  - NUCLEAR_WINTER_WARHEAD_THRESHOLD
  |  - NUCLEAR_WINTER_OVERKILL_FACTOR
  |  - DFDA_QUEUE_CLEARANCE_YEARS
  |  - STATUS_QUO_QUEUE_CLEARANCE_YEARS
  v
scattered local prose and formatting
  |
  +-> packages/web/src/lib/site.ts
  |     WAR_ON_DISEASE_APOCALYPSE_DESCRIPTION hardcodes the frame
  |
  +-> packages/web/src/lib/routes.ts
  |     route metadata repeats "one apocalypse"
  |
  +-> packages/web/src/content/referendum-sites/one-percent-treaty.ts
  |     local apocalypseCount/reducedApocalypseCount/treatyTradePosition
  |
  +-> packages/web/src/components/**/*.tsx
  |     ParameterValue numbers, but prose is duplicated per component
  |
  +-> packages/web/src/lib/triggers/context.ts
  |     exposes apocalypseCount/apocalypseCountLinked
  |        |
  |        v
  |     packages/db/src/managed-data/managed-task-triggers.ts
  |        hardcoded reminder prose
  |
  +-> packages/db/src/managed-data/managed-grandma-kay.ts
  |     hardcoded public comment
  |
  +-> packages/web/src/lib/tasks/share-templates.ts
  |     hardcoded 122 / 120.8 / ~100 / apocalypses
  |
  v
generated markdown/email previews
  packages/web/src/app/**/*.logged-out.md
  packages/web/src/lib/email/post-vote-share.email.md
```

## Proposed state ASCII diagram

```
packages/data/src/parameters/nuclear-overkill-framing.ts
  |
  +-> exports NUCLEAR_OVERKILL_FRAMING_PARAMETERS
  |     - globalWarheads
  |     - winterThresholdWarheads
  |     - overkillLayers
  |     - spareOverkillLayers
  |     - trialCapacityMultiplier
  |     - statusQuoYears
  |     - dfdaYears
  |
  +-> exports NUCLEAR_OVERKILL_FRAMING_TEMPLATES
  |     one source for footer, metadata, flow, reminder, share,
  |     represented-person placeholder, and managed-seed prose
  |
  +-> exports NUCLEAR_OVERKILL_COPY_TOKENS
  |     stable token names for plain text and markdown contexts
  |
  +-> exports renderNuclearOverkillTemplate()
        pure string renderer for metadata, task templates, tests, and snapshots

@optimitron/data/parameters
  |
  +-> packages/web TSX
  |     ParameterValue renders the parameters from the shared template tokens
  |
  +-> packages/web metadata/routes/messages
  |     plain renderer fills the same templates
  |
  +-> packages/web trigger/task-share token builders
  |     expose overkillLayers, spareOverkillLayers, etc.
  |
  +-> packages/db managed data
        imports shared raw template strings or shared default public comments

generated markdown/email previews
  regenerate after source changes so snapshots match the centralized copy
```

## Step list

- [ ] Re-read this plan and the empty `## ALERTS` section before touching code.

- [ ] Add `packages/data/src/parameters/nuclear-overkill-framing.ts`.
  - Export `NUCLEAR_OVERKILL_SPARE_LAYERS` as a derived `Parameter` equal to `Math.max(0, Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value) - 1)`.
  - Export `NUCLEAR_OVERKILL_FRAMING_PARAMETERS` with exact keys:
    - `globalWarheads`
    - `winterThresholdWarheads`
    - `overkillLayers`
    - `spareOverkillLayers`
    - `trialCapacityMultiplier`
    - `statusQuoYears`
    - `dfdaYears`
  - Export `NUCLEAR_OVERKILL_COPY_TOKENS` with exact string token keys:
    - `globalWarheads`
    - `winterThresholdWarheads`
    - `overkillLayers`
    - `spareOverkillLayers`
    - `trialCapacityMultiplier`
    - `statusQuoYears`
    - `dfdaYears`
  - Export `NUCLEAR_OVERKILL_FRAMING_TEMPLATES` with exact template keys:
    - `coreFull`
    - `coreShort`
    - `footerDescription`
    - `voteMetadataDescription`
    - `donateMetadataDescription`
    - `aboutMetadataDescription`
    - `treatyTradePosition`
    - `donateHeadline`
    - `endorseCrueltySentence`
    - `signatoriesCrueltySentence`
    - `nuclearFlowDismissive`
    - `nuclearFlowThreshold`
    - `nuclearFlowInventory`
    - `nuclearFlowWaste`
    - `nuclearFlowTrade`
    - `nuclearFlowCollectiveAgreement`
    - `nuclearFlowPerVoteDetail`
    - `moreOverkillButton`
    - `lessOverkillButton`
    - `reminderPhoneScript`
    - `grandmaKayPublicComment`
    - `representedPersonQuestion`
    - `representedPersonPlaceholder`
    - `humanityManagerHeading`
    - `humanityManagerInventory`
    - `humanityManagerGoal`
    - `programTaskSummary`
    - `shareDetailedMath`
    - `shareShortTrade`
    - `shareCalendarDescription`
    - `shareSlackDm`
  - Export `renderNuclearOverkillTemplate(template, values)` for plain string contexts. Keep it pure and fail loudly if a token is missing.
  - Export this module from `packages/data/src/parameters/index.ts`.

- [ ] Use this exact base phrasing in `NUCLEAR_OVERKILL_FRAMING_TEMPLATES.coreFull`:
  - `Humanity has {overkillLayers}x the warheads needed to end civilization. Trade one of those {overkillLayers} layers of overkill for disease eradication. The other {spareOverkillLayers} stay; the deterrent doesn't move.`

- [ ] Use these exact replacement strings for the TODO-enumerated surfaces, rendered with `ParameterValue` where a token is numeric:
  - `Footer.tsx:44-50`: `Let's trade one of humanity's {overkillLayers} layers of nuclear overkill for disease eradication in {dfdaYears} years instead of {statusQuoYears}.`
  - `donate/page.tsx:45-57`: `Trade one layer of nuclear overkill for disease eradication in {dfdaYears} years.`
  - `endorse/page.tsx:179-188`: `Allowing billions of humans to suffer and die from disease so governments can preserve {overkillLayers} layers of nuclear overkill is barbaric mass cruelty. Like slavery, it will persist until enough humans and institutions publicly state that it is morally wrong and incredibly stupid. Your organization can be one of those institutions.`
  - `DonationCalculationNarrative.tsx:379-398`: `Earth owns {globalWarheads} nuclear warheads. {winterThresholdWarheads} is enough for nuclear winter. That is {overkillLayers}x the warheads needed to end civilization. Keep {spareOverkillLayers} layers of overkill. Spend one layer curing every disease.`
  - `TreatyVoteFlow.tsx:553-559`: `Cool. The {overkillLayers} layers of nuclear overkill haven't moved.`
  - `TreatyVoteFlow.tsx:561-565`: `{winterThresholdWarheads} nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans.`
  - `TreatyVoteFlow.tsx:566-572`: `Humanity has about {globalWarheads} nuclear weapons. That is {overkillLayers}x the warheads needed to end civilization.`
  - `TreatyVoteFlow.tsx:573-580`: `You can only ruin Earth once. The other {spareOverkillLayers} layers of overkill are just wasteful. The 1% Treaty asks you to trade one layer of overkill for something slightly nicer.`
  - `TreatyVoteFlow.tsx:588-594`: buttons become `More overkill layers please` and `Fewer overkill layers please`.
  - `TreatyPostVoteShareFlow.tsx:797-812`: same four nuclear-flow sentences as `TreatyVoteFlow`.
  - `TreatyPostVoteShareFlow.tsx:862-871`: quote becomes `Yes, we are willing to trade one of humanity's {overkillLayers} layers of nuclear overkill for eradicating disease within our lifetimes.`
  - `TreatyPostVoteShareFlow.tsx:947-949`: `When a majority of humans on Earth publicly agree that letting their families die to preserve {overkillLayers} layers of nuclear overkill is idiotic, no politician can refuse the trade without losing their seat.`
  - `managed-task-triggers.ts:140-144`: `Humanity has {overkillLayers}x the nuclear warheads needed to end civilization. The 1% Treaty asks you to trade one of those {overkillLayers} layers of overkill for disease eradication in your lifetime. The other {spareOverkillLayers} stay; the deterrent doesn't move.`
  - `managed-grandma-kay.ts:83,91`: `She would trade one layer of nuclear overkill for dementia research.`

- [ ] Also replace non-TODO grep hits that are user-facing or generated-source inputs:
  - `TreatyTradeThesis.tsx`: `humanity should trade one of its {overkillLayers} layers of nuclear overkill to compress the disease-eradication timeline from {statusQuoYears} years to {dfdaYears} years`.
  - `site.ts`: replace `WAR_ON_DISEASE_APOCALYPSE_DESCRIPTION` with `WAR_ON_DISEASE_OVERKILL_DESCRIPTION` and update call sites.
  - `routes.ts`: replace local `apocalypseCount` with shared rendered templates for vote, donate, and about descriptions.
  - `war-on-disease.json` and `one-percent-treaty.ts`: replace `{apocalypseCount}` and `{reducedApocalypseCount}` template slots with `{overkillLayers}` and `{spareOverkillLayers}`; update `one-percent-treaty.test.ts`.
  - `SignatoriesLeaderboard.tsx`: use the same `signatoriesCrueltySentence` as `endorseCrueltySentence`, adjusted only for "people" vs "humans" if Mike wants that local distinction.
  - `RepresentedPersonForm.tsx` and `ManageRepresentedPeopleClient.tsx`: use `What would they trade one layer of nuclear overkill for?` and `She would trade one layer of nuclear overkill for dementia research.`
  - `humanity-manager-promotion-content.tsx`: heading `Trade one layer of nuclear overkill for {trialCapacityMultiplier}x more clinical trials.`; inventory sentence same as the shared `humanityManagerInventory`; goal sentence `...agree to trade one layer of nuclear overkill for the {dfdaYears}-year disease-eradication timeline.`
  - `ProgramTaskSection.tsx`: `Humanity currently spends enough on mass-murder capacity for {overkillLayers} layers of nuclear overkill. This treaty asks it to keep {spareOverkillLayers} and trade one layer for {trialCapacityMultiplier}x more clinical trial capacity to cure disease.`
  - `share-templates.ts`: stop hardcoding `122`, `120.8`, `12,141`, `~100`, and "apocalypses"; add share tokens and use `shareDetailedMath`, `shareShortTrade`, `shareCalendarDescription`, and `shareSlackDm`.
  - Generated `*.logged-out.md` and `post-vote-share.email.md` files should not be hand-edited; regenerate them from source.

- [ ] Update token builders and tests.
  - In `packages/web/src/lib/triggers/context.ts`, add `overkillLayers`, `overkillLayersLinked`, `spareOverkillLayers`, and `spareOverkillLayersLinked`. Keep `apocalypseCount` and `apocalypseCountLinked` as backwards-compatible aliases only if existing synced task bodies still need to render before managed data is re-synced.
  - In `packages/web/src/lib/tasks/share-templates.ts`, add `overkill_layers`, `spare_overkill_layers`, `global_warheads`, and `winter_threshold_warheads` to `ShareTokenKey`.
  - In `packages/web/src/lib/tasks/accountability.ts`, populate those tokens from `NUCLEAR_OVERKILL_FRAMING_PARAMETERS`.
  - Update `packages/web/src/lib/triggers/__tests__/context.test.ts`, `packages/web/src/lib/tasks/accountability.test.ts`, route/site tests, and referendum-content tests to assert the new token names and absence of public "apocalypse" copy.

- [ ] Update generated/user-facing artifacts.
  - Run `pnpm --filter @optimitron/web copy:preview` to regenerate affected page markdown snapshots.
  - Run `pnpm --filter @optimitron/web email:preview-md` to regenerate the post-vote share email markdown.
  - Run `rg -n "apocalypse|apocalypses|Apocalypse" packages/web/src packages/db/src packages/data/src` after regeneration. Expected remaining matches: internal type literal/screen IDs, tests that intentionally name the old screen ID, legacy parameter slugs/display names/manual titles, and comments that explicitly document backwards compatibility. No public copy should still say "one apocalypse" or "122 apocalypses".

- [ ] Verification commands for the implementation phase.
  - `pnpm --filter @optimitron/data test`
  - `pnpm --filter @optimitron/web test -- src/lib/__tests__/routes.test.ts src/lib/__tests__/site.test.ts src/content/referendum-sites/one-percent-treaty.test.ts src/lib/triggers/__tests__/context.test.ts src/lib/tasks/accountability.test.ts src/lib/email/__tests__/post-vote-share-email.test.ts`
  - `pnpm --filter @optimitron/web typecheck:fast`
  - Do not run `pnpm build` or `next build`.

- [ ] UI and copy review before commit.
  - Reuse the dev server at `http://127.0.0.1:3001` if it is already serving the app.
  - Capture screenshot review at `packages/web/output/playwright/review/latest.html` for at least `/`, `/vote`, `/donate`, `/endorse`, `/signatories`, `/tasks`, and the post-vote/share-email preview surfaces if available.
  - Inspect screenshots and generated previews for broken line wrapping, awkward repeated nouns, and any remaining confusing countable-apocalypse phrasing.
  - Present the changed public copy to Mike and ask for explicit approval before commit.

## Risks

- "Layer of nuclear overkill" is clearer than "apocalypse", but it is still a metaphor. The first use on a page should pair it with `{overkillLayers}x the warheads needed to end civilization` so the metaphor is grounded.
- The treaty redirects 1% of military spending; it does not literally dismantle a fixed bundle of nuclear warheads. Keep "trade one layer" as a moral-budget frame and avoid wording that implies unilateral disarmament or a mechanical warhead-removal operation.
- Renaming parameter slugs like `APOCALYPSE_MARKUP`, `PRICE_OF_APOCALYPSE`, or `NUCLEAR_WINTER_OVERKILL_FACTOR` is out of scope. Those names are citation and calculation IDs; changing them risks broken manual URLs and generated references.
- `packages/db` managed-data imports can consume `@optimitron/data`, but `@optimitron/data` must not import `@optimitron/db` runtime or `packages/web`. Keep the central module pure.
- Share templates have exact-token validation. Adding overkill tokens requires updating both `ShareTokenKey` and `buildTaskShareTokens`, or every affected template may be filtered out or fail rendering tests.
- Generated markdown snapshots and email previews can make the diff look larger than the source change. Regenerate them, but do not hand-edit them.
- E2E tests use `data-screen="apocalypse"` as an internal screen ID. Do not rename the internal literal unless the implementation intentionally updates tests and screenshots; public text can change independently.
- Public copy changes cannot be committed until Mike explicitly approves the changed copy and screenshot/preview review.

## Files to touch

- Create: `packages/data/src/parameters/nuclear-overkill-framing.ts`
- Modify: `packages/data/src/parameters/index.ts`
- Modify: `packages/web/src/components/Footer.tsx`
- Modify: `packages/web/src/app/donate/page.tsx`
- Modify: `packages/web/src/app/endorse/page.tsx`
- Modify: `packages/web/src/components/donate/DonationCalculationNarrative.tsx`
- Modify: `packages/web/src/components/landing/TreatyVoteFlow.tsx`
- Modify: `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx`
- Modify: `packages/web/src/components/referendum/TreatyTradeThesis.tsx`
- Modify: `packages/web/src/components/referendum/SignatoriesLeaderboard.tsx`
- Modify: `packages/web/src/components/people/RepresentedPersonForm.tsx`
- Modify: `packages/web/src/components/people/ManageRepresentedPeopleClient.tsx`
- Modify: `packages/web/src/components/tasks/ProgramTaskSection.tsx`
- Modify: `packages/web/src/lib/humanity-manager-promotion-content.tsx`
- Modify: `packages/web/src/lib/site.ts`
- Modify: `packages/web/src/lib/routes.ts`
- Modify: `packages/web/src/messages/en-US/war-on-disease.json`
- Modify: `packages/web/src/content/referendum-sites/one-percent-treaty.ts`
- Modify: `packages/web/src/content/referendum-sites/one-percent-treaty.test.ts`
- Modify: `packages/web/src/lib/triggers/context.ts`
- Modify: `packages/web/src/lib/triggers/__tests__/context.test.ts`
- Modify: `packages/web/src/lib/tasks/share-templates.ts`
- Modify: `packages/web/src/lib/tasks/accountability.ts`
- Modify: `packages/web/src/lib/tasks/accountability.test.ts`
- Modify: `packages/web/src/lib/__tests__/routes.test.ts`
- Modify: `packages/web/src/lib/__tests__/site.test.ts`
- Modify: `packages/web/src/lib/email/__tests__/post-vote-share-email.test.ts`
- Modify: `packages/db/src/managed-data/managed-task-triggers.ts`
- Modify: `packages/db/src/managed-data/managed-grandma-kay.ts`
- Modify: `packages/db/src/__tests__/seed.integration.test.ts`
- Modify: `packages/web/src/app/**/*.logged-out.md` only via `copy:preview`
- Modify: `packages/web/src/lib/email/post-vote-share.email.md` only via `email:preview-md`
- Do not touch: `packages/db/prisma/schema.prisma`
- Do not touch unless Mike explicitly expands scope: parameter slugs/display names/manual titles for `APOCALYPSE_MARKUP`, `APOCALYPSE_MARKUP_MULTIPLIER`, and `PRICE_OF_APOCALYPSE`

## ALERTS

## Agent log

## Codex critique (round 1)

Not solid as written. The plan is directionally right to kill the countable "122 apocalypses" noun and it is right not to rename `APOCALYPSE_MARKUP`, `APOCALYPSE_MARKUP_MULTIPLIER`, `PRICE_OF_APOCALYPSE`, or `NUCLEAR_WINTER_OVERKILL_FACTOR`. Those are existing parameter/citation identifiers, not just UI copy. But candidate B should not be ratified as the universal public phrase without a colder stranger pass.

1. Candidate B is better than "122 apocalypses", but it is still insider shorthand.
   - The first sentence works: "Humanity has 122x the warheads needed to end civilization."
   - The next phrase, "trade one of those 122 layers of overkill", is not automatically clearer to a zero-context reader. "Layer" is a metaphor, not an object. A cold reader can still ask: what is a layer, who trades it, and does this mean disarmament?
   - In the six prominent `TreatyPostVoteShareFlow.tsx` uses, there is enough room to use a causal first mention before the shorthand: about 100 nuclear weapons can trigger nuclear winter and food-chain collapse; humanity has about 12,200; that is 122x. After that, "one layer of nuclear overkill" is usable.
   - Recommendation: make B the shorthand after a causal first mention, not the whole standard. First exposure on each major page/flow should use a compact A/B hybrid.

2. Module location is not quite right.
   - The counter-argument to `packages/web/src/lib/messaging/` is real: grep confirms `packages/db` is a consumer because `packages/db/src/managed-data/managed-task-triggers.ts` and `packages/db/src/managed-data/managed-grandma-kay.ts` own user-facing managed seed/reminder prose, and `packages/db/package.json` already depends on `@optimitron/data`.
   - But `packages/data/src/parameters/nuclear-overkill-framing.ts` is the wrong namespace. Prose templates are not parameters. The existing parameter file shape is numeric/citation/calculation records; mixing campaign copy templates into `parameters` makes `@optimitron/data/parameters` a junk drawer.
   - Better home: `packages/data/src/campaign/nuclear-overkill-framing.ts` exported through `@optimitron/data/campaign`, or a small `@optimitron/data/messaging` subpath. Keep derived numeric parameters in `parameters`; keep public prose in campaign/messaging.

3. The TODO-enumerated surfaces are covered, but the grep sweep still has misses and soft spots.
   - The plan does handle the TODO list: `Footer`, `donate`, `endorse`, `DonationCalculationNarrative`, the six `TreatyPostVoteShareFlow` uses, `TreatyVoteFlow`, `managed-task-triggers`, and `managed-grandma-kay`.
   - It undercalls `packages/web/src/lib/treaty-share-flow-parameters.ts`: `FLOW_WASTEFUL_APOCALYPSES`, its `parameterName`, and display text will still match `rg -i apocalypse`. If that derived parameter can ever surface through `ParameterValue` details, debug views, tests, generated copy, or parameter exports, it is not just harmless internal residue. Either rename it to spare overkill layers or explicitly classify it as internal legacy.
   - It omits `packages/web/src/lib/__tests__/treaty-share-flow-parameters.test.ts` from Files to touch, even though that test will likely need updates if the flow derived parameter changes.
   - It omits `packages/web/src/app/api/referendums/[slug]/represented-people/route.test.ts:384`, which still fixtures the Grandma Kay public comment. That is not the old screen-id literal; it mirrors user-facing seeded copy.
   - The generated `page.logged-out.md` files are covered by wildcard regeneration, but the plan should require a final source-vs-generated classification after `rg -l -i "apocalypse" packages/web/src packages/db/src packages/data/src`, not just a broad "expected remaining matches" paragraph.

4. The proposed button labels do not scan as buttons.
   - `More overkill layers please` and `Fewer overkill layers please` are long, samey, and require parsing the metaphor inside a tight control.
   - Better button-shaped pairs: `Keep the overkill` / `Trade one layer`, or `Keep all 122` / `Trade one layer`.
   - The plan should specify button copy separately from paragraph copy. A good paragraph phrase can still be bad button text.

5. Grandma Kay needs bespoke treatment.
   - `She would trade one layer of nuclear overkill for dementia research` is clearer than `one apocalypse`, but it also sanitizes the emotional punch and sounds like policy memo copy.
   - This is a memorial/public-comment placeholder, not metadata. Do not force the global template onto it.
   - A stronger direction is closer to: `She would rather spend one layer of nuclear overkill on dementia research.` Still imperfect, but it preserves agency and grief better than "would trade one layer..."

6. The no-WebSearch rationale is weak.
   - This is repo-internal work, but the public copy rests on a scientific threshold claim. I did a brief check.
   - National Academies, 2025, `Potential Environmental Effects of Nuclear War`, does not make the threshold a simple settled slogan. It frames nuclear-war effects as a six-stage causal chain and emphasizes major uncertainties/data gaps that limit modeling. Source: https://nap.nationalacademies.org/catalog/27515/potential-environmental-effects-of-nuclear-war
   - A 2026 `npj Clean Air` paper models a regional conflict using 100 simultaneous 15 kt detonations and a 5 Tg black-carbon scenario, and finds multi-year hemispheric climate disruption plus globally transported fallout. Source: https://www.nature.com/articles/s44407-026-00064-7
   - That supports the repo's existing 100-warhead / 5 Tg assumption as a rough parameter, but it argues against overconfident wording like a clean consensus threshold. Prefer "about 100 nuclear weapons can trigger..." or "the model threshold is about 100..." in technical explanatory copy.

## Codex critique summary

Top 3 issues:

1. Candidate B should be a shorthand after a causal first mention, not the universal first-read standard.
2. The shared module belongs in campaign/messaging data, not `parameters`, because DB and web both need the prose but prose is not a parameter.
3. The plan misses residual grep/test work around `FLOW_WASTEFUL_APOCALYPSES` and represented-person API fixtures, and its button/Grandma Kay rewrites need bespoke copy.

## Claude + Mike decisions (round 2)

Mike chose the Pattern A first / Pattern B shorthand approach. First mention per surface gets the causal chain: about `{NUCLEAR_WINTER_WARHEAD_THRESHOLD}` nuclear weapons can trigger nuclear winter and food-chain collapse; humanity has about `{GLOBAL_WARHEAD_COUNT}` warheads; therefore `{NUCLEAR_WINTER_OVERKILL_FACTOR}`x the warheads needed to end civilization. Subsequent references may use the shorthand "layers of nuclear overkill".

Explicit exclusions: do not change the `More apocalypses please` button label at `packages/web/src/components/landing/TreatyVoteFlow.tsx:588`, and do not change Grandma Kay's public comment at `packages/db/src/managed-data/managed-grandma-kay.ts:83,91`.

Parameter placeholders in this section are implementation instructions. In TSX, render supported numeric placeholders with `ParameterValue`; in trigger strings, expose equivalent `{{params.*}}` tokens backed by the same parameters. Relevant existing parameters from `packages/data/src/parameters/parameters-calculations-citations.ts` are `GLOBAL_WARHEAD_COUNT`, `NUCLEAR_WINTER_WARHEAD_THRESHOLD`, `NUCLEAR_WINTER_OVERKILL_FACTOR`, `DFDA_QUEUE_CLEARANCE_YEARS`, `STATUS_QUO_QUEUE_CLEARANCE_YEARS`, and `DFDA_TRIAL_CAPACITY_MULTIPLIER`. Add a derived display parameter for `{NUCLEAR_OVERKILL_SPARE_LAYERS}` equal to `Math.max(0, Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value) - 1)` so "other 121" is not hardcoded.

| File path with line numbers | Current text | Replacement text | Notes |
| --- | --- | --- | --- |
| `packages/web/src/components/Footer.tsx:44-62` | `Let's trade one apocalypse out of humanity's {NUCLEAR_WINTER_OVERKILL_FACTOR}-apocalypse mass-murder capacity for disease eradication in {DFDA_QUEUE_CLEARANCE_YEARS} years instead of {STATUS_QUO_QUEUE_CLEARANCE_YEARS}.` | `About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons can trigger nuclear winter and food-chain collapse. Humanity has about {GLOBAL_WARHEAD_COUNT} warheads, {NUCLEAR_WINTER_OVERKILL_FACTOR}x the warheads needed to end civilization. Let's trade one layer of overkill for disease eradication in {DFDA_QUEUE_CLEARANCE_YEARS} years instead of {STATUS_QUO_QUEUE_CLEARANCE_YEARS}.` | First mention: use Pattern A causal chain, then one Pattern B shorthand. |
| `packages/web/src/app/donate/page.tsx:45-57` | `Trade one of humanity's {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses for disease eradication in {DFDA_QUEUE_CLEARANCE_YEARS} years` | `About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons can trigger nuclear winter and food-chain collapse. Humanity has about {GLOBAL_WARHEAD_COUNT} warheads. Trade one of its {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of overkill for disease eradication in {DFDA_QUEUE_CLEARANCE_YEARS} years.` | First mention: use Pattern A causal chain before the headline trade. |
| `packages/web/src/app/endorse/page.tsx:179-188` | `Allowing billions of humans to suffer and die from disease so governments can preserve {NUCLEAR_WINTER_OVERKILL_FACTOR}-apocalypse mass-murder capacity is barbaric mass cruelty. Like slavery, it will persist until enough humans and institutions publicly state that it is morally wrong and incredibly stupid. Your organization can be one of those institutions.` | `About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons can trigger nuclear winter and food-chain collapse; humanity has about {GLOBAL_WARHEAD_COUNT} warheads. Allowing billions of humans to suffer and die from disease so governments can preserve {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill is barbaric mass cruelty. Like slavery, it will persist until enough humans and institutions publicly state that it is morally wrong and incredibly stupid. Your organization can be one of those institutions.` | First mention: use Pattern A causal chain, then Pattern B shorthand in the moral claim. |
| `packages/web/src/components/donate/DonationCalculationNarrative.tsx:384-398` | `Earth owns {GLOBAL_WARHEAD_COUNT} nuclear warheads. {NUCLEAR_WINTER_WARHEAD_THRESHOLD} is enough for nuclear winter. We have {NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses' worth of weapons. Keep the deterrent. Spend one slice curing every disease.` | `Earth owns {GLOBAL_WARHEAD_COUNT} nuclear warheads. About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} can trigger nuclear winter and food-chain collapse. That is {NUCLEAR_WINTER_OVERKILL_FACTOR}x the warheads needed to end civilization. Keep the deterrent. Spend one layer of overkill curing every disease.` | First mention inside this narrative step: Pattern A causal chain, then Pattern B shorthand. |
| `packages/web/src/components/landing/TreatyVoteFlow.tsx:553-558` | `Cool. The {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses haven't moved.` | `Cool. The {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill haven't moved.` | Subsequent reference: this only appears after the excluded `More apocalypses please` button path. |
| `packages/web/src/components/landing/TreatyVoteFlow.tsx:561-571` | `{FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans. Humanity has about {FLOW_GLOBAL_WARHEAD_COUNT} nuclear weapons. That's {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses of mass murder capacity.` | `{FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons exploding can trigger a nuclear winter that collapses the food chain and kills most humans. Humanity has about {FLOW_GLOBAL_WARHEAD_COUNT} nuclear weapons. That is {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}x the warheads needed to end civilization.` | First mention: Pattern A causal chain. |
| `packages/web/src/components/landing/TreatyVoteFlow.tsx:573-580` | `You can only ruin Earth once. The other {FLOW_WASTEFUL_APOCALYPSES} are just wasteful. The 1% Treaty asks you to trade one apocalypse for something slightly nicer.` | `You can only ruin Earth once. The other {NUCLEAR_OVERKILL_SPARE_LAYERS} layers of nuclear overkill are just wasteful. The 1% Treaty asks you to trade one layer of overkill for something slightly nicer.` | Subsequent reference: Pattern B shorthand. Rename `FLOW_WASTEFUL_APOCALYPSES` to a spare-overkill-layers derived display parameter. |
| `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:797-802` | `Cool. The {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses haven't moved.` | `Cool. The {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill haven't moved.` | Subsequent reference: same alt-path response as vote flow. |
| `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:806-812` | `{FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans. Humanity has about {FLOW_GLOBAL_WARHEAD_COUNT} nuclear weapons. That's {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses of mass murder capacity. You can only ruin Earth once. The other {FLOW_WASTEFUL_APOCALYPSES} are just wasteful. The 1% Treaty asks you to trade one apocalypse for something slightly nicer.` | `{FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons exploding can trigger a nuclear winter that collapses the food chain and kills most humans. Humanity has about {FLOW_GLOBAL_WARHEAD_COUNT} nuclear weapons. That is {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}x the warheads needed to end civilization. You can only ruin Earth once. The other {NUCLEAR_OVERKILL_SPARE_LAYERS} layers of nuclear overkill are just wasteful. The 1% Treaty asks you to trade one layer of overkill for something slightly nicer.` | First mention for the post-vote nuclear explanation: Pattern A causal chain first, Pattern B shorthand after. |
| `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:862` | `You trigger a chain reaction that gets a majority of humans on Earth - {FLOW_MAJORITY_OF_HUMANS_ON_EARTH} people - to collectively agree: "Yes, we are willing to sacrifice one apocalypse of our {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypse capacity in exchange for eradicating disease within our lifetimes."` | `You trigger a chain reaction that gets a majority of humans on Earth - {FLOW_MAJORITY_OF_HUMANS_ON_EARTH} people - to collectively agree: "Yes, we are willing to trade one of humanity's {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill for eradicating disease within our lifetimes. The deterrent stays."` | Subsequent reference: Pattern B shorthand after the earlier causal explanation. |
| `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:868-871` | `Imagine you triggered a chain reaction that got a majority of humans on Earth - {FLOW_MAJORITY_OF_HUMANS_ON_EARTH} people - to collectively agree: "Yes, we are willing to sacrifice one apocalypse of our {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypse capacity in exchange for eradicating disease within our lifetimes."` | `Imagine you triggered a chain reaction that got a majority of humans on Earth - {FLOW_MAJORITY_OF_HUMANS_ON_EARTH} people - to collectively agree: "Yes, we are willing to trade one of humanity's {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill for eradicating disease within our lifetimes. The deterrent stays."` | Subsequent reference: Pattern B shorthand after the earlier causal explanation. |
| `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:947-948` | `When a majority of humans on Earth publicly agree that letting their families die for {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses is idiotic, no politician can refuse the trade without losing their seat.` | `When a majority of humans on Earth publicly agree that letting their families die to preserve {FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill is idiotic, no politician can refuse the trade without losing their seat.` | Subsequent reference: Pattern B shorthand. |
| `packages/db/src/managed-data/managed-task-triggers.ts:140-142` | `Humans spend {{params.militaryVsResearchRatio}} times more on weapons than on testing which medicines work. There's a treaty - the 1% Treaty - that redirects 1% of military spending into pragmatic clinical trials. Sixty million humans die every year, mostly from things we already know how to fix. The treaty would shorten the time to disease eradication from about {{params.statusQuoYears}} years to about {{params.dfdaYears}}. Humanity has enough nuclear mass-murder capacity for about {{params.apocalypseCount}} apocalypses. The 1% Treaty asks you to sacrifice one of those apocalypses for disease eradication in your lifetime.` | `Humans spend {{params.militaryVsResearchRatio}} times more on weapons than on testing which medicines work. There's a treaty - the 1% Treaty - that redirects 1% of military spending into pragmatic clinical trials. Sixty million humans die every year, mostly from things we already know how to fix. The treaty would shorten the time to disease eradication from about {{params.statusQuoYears}} years to about {{params.dfdaYears}}. About {{params.nuclearWinterWarheadThreshold}} nuclear weapons can trigger nuclear winter and food-chain collapse. Humanity has about {{params.globalWarheadCount}} nuclear weapons - {{params.nuclearWinterOverkillFactor}}x the warheads needed to end civilization. The 1% Treaty asks you to trade one layer of overkill for disease eradication in your lifetime. The deterrent does not move.` | First mention in the phone script: Pattern A causal chain, then Pattern B shorthand. Add trigger params backed by `NUCLEAR_WINTER_WARHEAD_THRESHOLD`, `GLOBAL_WARHEAD_COUNT`, and `NUCLEAR_WINTER_OVERKILL_FACTOR`. |

Proposed module path: `packages/data/src/campaign/nuclear-overkill-framing.ts`.

Reason: this is campaign prose, not a canonical parameter set. `packages/data/src/campaign.ts` already owns campaign-facing constants used across packages, and both `packages/web` UI and `packages/db` managed seed data can depend on `@optimitron/data`. `packages/data/src/messaging/` is too broad for a treaty-specific rhetorical standard.

Proposed exports and values:

```ts
export const NUCLEAR_OVERKILL_COPY_PARAMETER_KEYS = {
  globalWarheadCount: "GLOBAL_WARHEAD_COUNT",
  nuclearWinterWarheadThreshold: "NUCLEAR_WINTER_WARHEAD_THRESHOLD",
  nuclearWinterOverkillFactor: "NUCLEAR_WINTER_OVERKILL_FACTOR",
  nuclearOverkillSpareLayers: "NUCLEAR_OVERKILL_SPARE_LAYERS",
  dfdaQueueClearanceYears: "DFDA_QUEUE_CLEARANCE_YEARS",
  statusQuoQueueClearanceYears: "STATUS_QUO_QUEUE_CLEARANCE_YEARS",
  dfdaTrialCapacityMultiplier: "DFDA_TRIAL_CAPACITY_MULTIPLIER",
} as const;

export const NUCLEAR_OVERKILL_FIRST_MENTION =
  "About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons can trigger nuclear winter and food-chain collapse. Humanity has about {GLOBAL_WARHEAD_COUNT} warheads, {NUCLEAR_WINTER_OVERKILL_FACTOR}x the warheads needed to end civilization." as const;

export const NUCLEAR_OVERKILL_SHORTHAND =
  "Trade one of humanity's {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill for disease eradication. The deterrent does not move." as const;

export const NUCLEAR_OVERKILL_SURFACE_COPY = {
  footer:
    "About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons can trigger nuclear winter and food-chain collapse. Humanity has about {GLOBAL_WARHEAD_COUNT} warheads, {NUCLEAR_WINTER_OVERKILL_FACTOR}x the warheads needed to end civilization. Let's trade one layer of overkill for disease eradication in {DFDA_QUEUE_CLEARANCE_YEARS} years instead of {STATUS_QUO_QUEUE_CLEARANCE_YEARS}.",
  donateHero:
    "About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons can trigger nuclear winter and food-chain collapse. Humanity has about {GLOBAL_WARHEAD_COUNT} warheads. Trade one of its {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of overkill for disease eradication in {DFDA_QUEUE_CLEARANCE_YEARS} years.",
  endorseMoralClaim:
    "About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons can trigger nuclear winter and food-chain collapse; humanity has about {GLOBAL_WARHEAD_COUNT} warheads. Allowing billions of humans to suffer and die from disease so governments can preserve {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill is barbaric mass cruelty. Like slavery, it will persist until enough humans and institutions publicly state that it is morally wrong and incredibly stupid. Your organization can be one of those institutions.",
  donationNarrative:
    "Earth owns {GLOBAL_WARHEAD_COUNT} nuclear warheads. About {NUCLEAR_WINTER_WARHEAD_THRESHOLD} can trigger nuclear winter and food-chain collapse. That is {NUCLEAR_WINTER_OVERKILL_FACTOR}x the warheads needed to end civilization. Keep the deterrent. Spend one layer of overkill curing every disease.",
  flowAltDismissive:
    "Cool. The {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill haven't moved.",
  flowFirstMention:
    "{NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons exploding can trigger a nuclear winter that collapses the food chain and kills most humans. Humanity has about {GLOBAL_WARHEAD_COUNT} nuclear weapons. That is {NUCLEAR_WINTER_OVERKILL_FACTOR}x the warheads needed to end civilization.",
  flowTrade:
    "You can only ruin Earth once. The other {NUCLEAR_OVERKILL_SPARE_LAYERS} layers of nuclear overkill are just wasteful. The 1% Treaty asks you to trade one layer of overkill for something slightly nicer.",
  collectiveAgreementAlt:
    "You trigger a chain reaction that gets a majority of humans on Earth - {MAJORITY_OF_HUMANS_ON_EARTH} people - to collectively agree: \"Yes, we are willing to trade one of humanity's {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill for eradicating disease within our lifetimes. The deterrent stays.\"",
  collectiveAgreement:
    "Imagine you triggered a chain reaction that got a majority of humans on Earth - {MAJORITY_OF_HUMANS_ON_EARTH} people - to collectively agree: \"Yes, we are willing to trade one of humanity's {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill for eradicating disease within our lifetimes. The deterrent stays.\"",
  perVotePoliticalClaim:
    "When a majority of humans on Earth publicly agree that letting their families die to preserve {NUCLEAR_WINTER_OVERKILL_FACTOR} layers of nuclear overkill is idiotic, no politician can refuse the trade without losing their seat.",
  phoneScriptNuclearParagraph:
    "About {{params.nuclearWinterWarheadThreshold}} nuclear weapons can trigger nuclear winter and food-chain collapse. Humanity has about {{params.globalWarheadCount}} nuclear weapons - {{params.nuclearWinterOverkillFactor}}x the warheads needed to end civilization. The 1% Treaty asks you to trade one layer of overkill for disease eradication in your lifetime. The deterrent does not move.",
} as const;
```

## Mike approved (round 3 — supersedes round 2)

Round 2 was REJECTED by Mike. Codex invented "layers of nuclear overkill" everywhere — Mike found that phrasing stupid AND did not authorize the universal replacement of "apocalypse" with "overkill." This section supersedes round 2's per-surface table.

The actual change set Mike approved, after the orchestrator searched `manual.warondisease.org/assets/json/search-index.json` for existing canonical phrasings (per CLAUDE.md:41 — a rule that should have been honored before round 2):

The manual already contains a near-canonical Wishonia-voice version: *"Your governments possess nuclear weapons sufficient to end civilization {{ nuclear_winter_overkill_factor_nounit }} times but have not cured Alzheimer's once. This treaty asks them to be 1% more rational."* This is the pattern to reuse, not invent around.

Per-surface decisions:

| File path with line numbers | Decision | Reasoning |
| --- | --- | --- |
| `packages/web/src/components/Footer.tsx:44,50` | KEEP AS-IS | Footer is a short tagline. Causal-chain preamble would bloat a footer that renders on every page. |
| `packages/web/src/app/donate/page.tsx:51` | REPLACE with the manual's Alzheimer's tagline (parameter-backed) | "Your governments possess nuclear weapons sufficient to end civilization {NUCLEAR_WINTER_OVERKILL_FACTOR} times but have not cured Alzheimer's once." |
| `packages/web/src/app/endorse/page.tsx:185` | REPLACE the moral-claim sentence with the manual's Alzheimer's tagline | Fits the moral-claim context cleanly. |
| `packages/web/src/components/donate/DonationCalculationNarrative.tsx:397` | REPLACE with the manual's Alzheimer's tagline | Mike said the current version is bad; pulling in the canonical from the manual. |
| `packages/web/src/components/landing/TreatyVoteFlow.tsx:561-571` (full nuclear paragraph) | EXTRACT AS CANONICAL `NUCLEAR_OVERKILL_FULL_EXPLANATION` and keep this surface using it as-is | This is the working full causal-chain explanation; export so other surfaces can reuse without rewriting. |
| `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:806-812` (full nuclear paragraph + "121 wasteful" + trade) | EXTRACT AS CANONICAL `NUCLEAR_OVERKILL_TRADE_PITCH` and keep this surface using it as-is | Mike said this version is "quite nice." Export so other surfaces can reuse. |
| `packages/web/src/components/landing/TreatyVoteFlow.tsx:558` and `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:802` ("The 122 apocalypses haven't moved.") | REWRITE — Mike said this doesn't parse | Replace with something concrete. Recommend: "Done. Humanity keeps all 122 apocalypses." (literal acknowledgement that the user voted to preserve the stockpile). |
| `packages/web/src/components/landing/TreatyVoteFlow.tsx:579` ("You can only ruin Earth once. The other 121 are wasteful.") | KEEP AS-IS | Mike marked good. |
| `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:862,871` ("sacrifice one apocalypse of our 122 apocalypse capacity") | KEEP AS-IS | Mike marked good. |
| `packages/web/src/components/landing/TreatyPostVoteShareFlow.tsx:948` ("letting their families die for 122 apocalypses is idiotic") | KEEP AS-IS | Mike marked good. |
| `packages/db/src/managed-data/managed-task-triggers.ts:142` (phone script) | REPLACE the apocalypse paragraph with the manual's Alzheimer's tagline + trade clause | Phone-friendly version: the canonical Alzheimer's line, then "The 1% Treaty asks them to be 1% more rational." Direct lift from the manual. |
| `packages/web/src/components/landing/TreatyVoteFlow.tsx:588` ("More apocalypses please" button label) | KEEP AS-IS | Mike explicit exclusion. |
| `packages/db/src/managed-data/managed-grandma-kay.ts:83,91` ("She would trade one apocalypse for dementia research.") | KEEP AS-IS | Mike explicit exclusion. |

Net change set:
- 5 surfaces actually get updated (donate page, endorse page, DonationCalculationNarrative, phone-script trigger, the two "haven't moved" instances)
- 2 surfaces get extracted as canonical exports for downstream reuse (TreatyVoteFlow nuclear paragraph, TreatyPostVoteShareFlow trade pitch)
- 5 surfaces keep their current phrasing
- 2 surfaces are explicit exclusions

Module: `packages/data/src/campaign/nuclear-overkill-framing.ts` exports:

```ts
// Direct lift from manual.warondisease.org. Used on short tagline
// surfaces (donate hero, endorse moral claim, donation narrative,
// phone-script template).
export const NUCLEAR_OVERKILL_ALZHEIMERS_TAGLINE =
  "Your governments possess nuclear weapons sufficient to end civilization {NUCLEAR_WINTER_OVERKILL_FACTOR} times but have not cured Alzheimer's once.";

// Optional follow-up sentence when the surface has room.
export const NUCLEAR_OVERKILL_ALZHEIMERS_TREATY_FOLLOWUP =
  "The 1% Treaty asks them to be 1% more rational.";

// Long causal-chain explanation. Currently lives in
// TreatyVoteFlow.tsx; export so other surfaces can pull from one
// source. Numbers parameter-backed.
export const NUCLEAR_OVERKILL_FULL_EXPLANATION =
  "{NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans. Humanity has about {GLOBAL_WARHEAD_COUNT} nuclear weapons. That's {NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses of mass murder capacity.";

// Full explanation + the trade pitch + "121 wasteful" framing.
// Currently lives in TreatyPostVoteShareFlow.tsx; export so other
// surfaces can pull from one source.
export const NUCLEAR_OVERKILL_TRADE_PITCH =
  NUCLEAR_OVERKILL_FULL_EXPLANATION +
  " You can only ruin Earth once. The other {NUCLEAR_OVERKILL_SPARE_LAYERS} are just wasteful. The 1% Treaty asks you to trade one apocalypse for something slightly nicer.";

// Dismissive alt-path response after the user clicks
// "More apocalypses please."
export const NUCLEAR_OVERKILL_BUTTON_REJECT_RESPONSE =
  "Done. Humanity keeps all {NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses.";
```

Numbers parameter-backed via the existing `NUCLEAR_WINTER_OVERKILL_FACTOR` / `GLOBAL_WARHEAD_COUNT` / `NUCLEAR_WINTER_WARHEAD_THRESHOLD` parameters and a new derived `NUCLEAR_OVERKILL_SPARE_LAYERS` ( = factor - 1, currently 121).

Implementation dispatch must instruct Codex to call `mcp__optimitron-tasks__searchManual` to verify the canonical phrasings are still current in the manual before quoting (per CLAUDE.md:41, now enforced by `.claude/hooks/enforce-manual-search-in-copy-dispatch.mjs`).
