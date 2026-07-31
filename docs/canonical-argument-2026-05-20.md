# Canonical argument — verbatim from Mike, lightly cleaned (2026-05-20)

> Mike: "please save a grammatically correct and coherent version as closely as possible to what I said somewhere for future reference"

This is the canonical chain-of-reasoning for the campaign, dictated by Mike in one continuous flow. Grammar fixed, profanity removed, dictation artifacts repaired. Substance and framing PRESERVED. Use this as the source for /foundations, /shirt pricing-thesis, /donate copy, foundation outreach, podcast pitches, anything that needs the full case in Mike's voice.

This is NOT a Claude rewrite. This is Mike's argument, transcribed.

---

## The canonical chain

If 8 billion people buy this t-shirt and wear it on the same day, they will have conversations with each other about it.

In those conversations they will realize:

- We currently spend **604 times** as much preparing for and waging war as we spend testing medicines for diseases that will kill us and everyone we love.
- Accepting a **121-apocalypse mass-murder capacity** (down from 122) would let us eradicate disease **12 times faster**.
- Military spending was **97% lower** immediately before the United States won World War II. The US then cut military spending **another 87% over 2 years** after winning. So drastic reductions are not hypothetical — they have already been done, by the same country, in living memory.
- It is therefore possible to cut vastly more than 1%, and doing so would speed up the rate of medical progress unimaginably.
- They will realize this is wise because the chance of dying in a terrorist attack is about **1 in 30 million**, and the chance of suffering and dying from a disease is nearly **100%**. The current spending ratio is the opposite of what the actual risk distribution would justify.

This is in the logical self-interest of **even the CEO of Lockheed Martin**, because:

- A 1% reduction in his bomb-selling commission is not as valuable as the continued existence of himself, his family, and the people he loves.
- Disease is very expensive to the economy.
- It is projected that if we did this reallocation and eradicated disease, Earth would be vastly more productive — **everyone would be approximately 4 times richer in 15 years**.

Therefore even the CEO of Lockheed Martin's interest in the 1% reduction is nothing compared to the increase in the size of the total pie of resources available to humanity if we eradicate disease instead of eradicating each other.

Therefore: **all you have to do to end war and disease is get 8 billion people to wear a shirt on the same day.**

It only costs approximately **$48 billion** — which is literally millions of times less than the cost of war and disease on society. (We can calculate exactly how many times less.)

Last time we ran the model, the projected value of the 1% Treaty alone was approximately **$84 quadrillion**. But that is a **floor**. If a billion people actually wore the shirt and had the conversation, they would not stop at 1%. They would cut much more.

There should be a **slider on the site** so every human can adjust the proposed treaty cut and see the recalculated outcomes. At most the cut would be 50/50 — half of military spending redirected. If 8 billion humans actually talked to each other about what their priorities are, disease eradication and education could happen very fast.

The **biotechnology sector would be a very good place to invest** in advance of this.

---

## Notes for downstream use

- This chain is the canonical source for `/foundations`, the `/shirt` pricing thesis, foundation outreach decks, podcast pitches, and any other surface that needs Mike's full case.
- When transcribing this onto a public page, do NOT pad with Wishonia metaphors that are not present in Mike's original. The voice IS the brand. Adding "Earth has been hitting itself for 10,000 years..." style asides without Mike's explicit greenlight = AI slop.
- Numbers (604×, 12×, 97%, 87%, 1-in-30M, 100%, 4×, 15yr, $48B, $84Q, 8B) should render through `<ParameterValue>` components when on a page so they stay catalog-sourced. Verbatim numerals are acceptable in this canonical doc.
- The slider UI primitive Mike named (treaty-cut % adjustable, outcomes recalculate live) is a NEW surface concept. Not currently built. Worth a task.

## Parameter mapping for each numeric claim

| Claim | Parameter (existing or needed) | Status |
|---|---|---|
| 604× spending ratio | `MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO` | Exists |
| 122 apocalypses (down to 121) | `NUCLEAR_WINTER_OVERKILL_FACTOR` | Exists |
| 12× faster disease eradication | Derived from `STATUS_QUO_QUEUE_CLEARANCE_YEARS` ÷ `DFDA_QUEUE_CLEARANCE_YEARS` (443÷36≈12.3) | Existing inputs, may need a derived alias |
| 97% pre-WWII reduction | `US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT` | Exists |
| 87% cut over 2 years post-WWII | `POST_WW2_MILITARY_CUT_PCT` | Exists |
| 1-in-30M terrorism (annual) | `ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR` | Exists |
| ~100% disease mortality | Implicit base rate; could parameterize as `LIFETIME_DISEASE_MORTALITY_PCT` | Probably not needed as a parameter; literal "approximately 100%" is fine |
| 4× richer in 15 years | `TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15` | Exists |
| $48B universal shirt distribution | `UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD` | NEW — task #31 in flight |
| $84Q projected value (as floor) | `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE` | Exists |
| "Millions of times less" ratio | Derived: `EXPECTED_TREATY_VALUE_USD` ÷ `UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD` ≈ $84Q ÷ $48B ≈ **1.77 million×** | Computable from existing + new params |

## Open questions / what this doc doesn't cover yet

- **Audit:** do the current /shirt, /foundations, /donate pages actually carry this chain in this clarity, or do they carry AI-slop voice-around-Mike's-words? Pending audit (this turn).
- **The slider primitive.** New UI concept Mike named: treaty-cut % adjustable, all downstream numbers recalculate live ($48B ratio, $84Q value, 4×GDP, etc.). Not currently built. Should be its own task.
- **Investment angle ("biotechnology sector would be a very good place to invest").** Where does this surface? /foundations as a secondary callout? A new /invest page? Not decided.
- **The 50/50 ceiling** ("at most it would be 50/50"). Implications for the slider: max value = 50%. Anchor the slider's right end at that ceiling.
- **The "$48B is millions of times less than war+disease cost" framing.** This is a different ratio than the per-shirt-value framing in the existing pricing thesis. Both are valid; need to pick which goes where (recommend: pricing thesis on /shirt, "millions of times less" framing on /foundations).
