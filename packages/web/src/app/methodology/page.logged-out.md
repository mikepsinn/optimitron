# /methodology

## Metadata

- Page title: Expected Value Methodology | International Campaign to End War and Disease
- Meta description: How every task gets its number: one human lifetime, no discount rate, probability stated separately, and a goal's value written from sourced parameters rather than summed from the tasks beneath it.
- Canonical: https://warondisease.org/methodology
- Open Graph title: Expected Value Methodology
- Open Graph description: How every task gets its number: one human lifetime, no discount rate, probability stated separately, and a goal's value written from sourced parameters rather than summed from the tasks beneath it.
- Open Graph image: https://warondisease.org/api/og/route?path=%2Fmethodology
- Twitter title: Expected Value Methodology
- Twitter description: How every task gets its number: one human lifetime, no discount rate, probability stated separately, and a goal's value written from sourced parameters rather than summed from the tasks beneath it.

## Visible Page Copy

## How we put a number on a task
- Every task in the tree carries an expected value, and the queue ranks work by it. That only means something if every number is computed the same way. These are the rules.
### The one-line rule
- Conditional value = the annual welfare effect × 73.4 years, undiscounted. Record it with a separate success probability. A goal's value is never summed from the tasks beneath it.
### The frame
| FIELD | VALUE | WHY |
| --- | --- | --- |
| Horizon | 73.4 years | Global life expectancy at birth ([WHO, 2024](https://manual.WarOnDisease.org/calculations.html#sec-global_life_expectancy_2024)). One human lifetime is a span a reader can feel, and it is a measured number rather than a chosen one. |
| Discount rate | 0 | See below. |
| Probability | 0–1, recorded as its own field | So the conditional value stays recoverable. |
#### Conditional value and expected value are two different numbers
- Both are stored, and confusing them is the easiest way to publish a wrong estimate.
- Conditional value — what the task is worth if it works. This is the number you derive: annual effect × 73.4.
- Success probability — the odds it works, recorded in its own field.
- Expected value — the two multiplied. This is what the queue ranks on, and it is what the expectedEconomicValueUsd fields hold.
- So probability is reflected in the expected value — that is what makes it "expected". What must never happen is probability being quietly baked into the conditional value and then applied a second time, or a conditional value being filed as though it were already probability-weighted. Keep both numbers, and the reader can always recover either one.
- When a task states a value but no probability, its expected value equals its conditional value. That is a deliberate signal, not a claim of certainty: it means the number is a ceiling nobody has discounted yet.
#### Why no discount rate
- A discount rate does one of two jobs: it prices uncertainty, or it prices impatience.
- Uncertainty is already priced here — every estimate carries an explicit probability of success — so discounting for risk would charge for it twice.
- That leaves pure time preference, which is a contested ethical position rather than a measurement. It is also the most-attacked parameter in this field: the Copenhagen Consensus rankings are criticised primarily because their discount rates structurally penalise long-horizon problems, making climate look weak against near-term health spending. Choosing zero does not make us right. It makes the choice visible and uniform instead of buried inside each estimate, and anyone who disagrees can apply their own rate to a stated undiscounted number — which they cannot do to a pre-discounted one.
#### Why no growth curve
- The form is deliberately flat: annual effect × horizon. No compounding. A reader can check the arithmetic in their head, and a growth assumption cannot hide in the same slot as a measurement.
### A goal's value is written, not derived
- This is the rule that is easiest to get wrong, and it is worth being concrete.
- Six mechanisms in the tree — the Court of Humanity, the 1% Treaty, the Loving Takeover, the Earth Optimization Prize, the decentralized FDA, and the shirt cascade — all carry the same peace-dividend value and differ only in their probability of success. They hang under different parents, because they reach that dividend by different arguments, but they are alternative routes to one outcome, not parts of it.
- So adding them up would count the same dividend six times. Splitting the parent's value across them is the same error inverted — it hands a task a number nobody estimated.
- A goal's value is a fact about the world, not about our task list. The value of ending disease does not change when someone adds a subtask. What a task earns for advancing a goal is credit for moving its probability, recorded on the link between them.
### Worked example: ending war
| STEP | SOURCE | VALUE |
| --- | --- | --- |
| Annual cost of war | [direct + indirect, global](https://manual.WarOnDisease.org/calculations.html#sec-global_annual_direct_indirect_war_cost) | $11.4T/year |
| × one lifetime | 73.4 years | $834T |
| × probability | probability war actually ends | the ranked expected value |
- Note this uses the whole cost of war, not the peace dividend. The dividend is what a one percent redirection buys, which is what the treaty asks for. The mission is the whole quantity.
### Worked example: ending disease
| STEP | SOURCE | VALUE |
| --- | --- | --- |
| Share of GDP lost to disease | [13%](https://manual.WarOnDisease.org/calculations.html#sec-disease_burden_gdp_drag_pct) | of [$115T](https://manual.WarOnDisease.org/calculations.html#sec-global_gdp_2025) |
| Annual drag | productivity + diverted medical cost | $14.9T/year |
| × one lifetime | 73.4 years | $1097T |
- That is economic drag only. It does not price the suffering itself, which belongs in the health fields on the same horizon and the same zero discount.
### Writing an estimate
- The instruction is research the number, not "use one that happens to exist". Missing evidence is a research task, not a reason to guess.
- Look for the number first. searchParameters covers the whole catalog, which already holds the manual's sourced economics.
- If nothing fits, add one with proposeParameterBundle: an immutable revision carrying its formula, inputs and provenance, held for human review. That is where the research belongs — it is reusable, versioned, and every estimate built on it moves when it is corrected.
- Never hand-edit parameters-calculations-citations.ts. It is generated from dih_models/parameters.py upstream and compiled into the catalog, so an edit there is overwritten on the next regeneration.
- Multiply by the 73.4-year horizon, then record the probability in its own field.
- Write the reasoning into the estimate, not the description. setTaskImpact takes assumptions, sourceUrls and estimateNotes, and they render under "Estimate calculation and sources" on the task. Prose in a description is not attached to the number, so nothing can tell you it went stale.
- Leave the estimate null only when you have looked and there is genuinely nothing defensible — and say so in estimateNotes, because a stated gap is a research lead. A blank is honest. An invented number gets ranked against real ones, and the ranking is what the whole system is for.
#### A known gap
- setTaskImpact cannot yet link an estimate to the specific parameter revisions it used. Managed estimates carry that chain and get staleness detection for free; an agent-written one carries sourceUrls and assumptions as text instead. Prefer promoting a number into a parameter when it is reusable — that is the difference between a citation and a dependency.
