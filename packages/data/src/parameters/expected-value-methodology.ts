import {
  DISEASE_BURDEN_GDP_DRAG_PCT,
  GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST,
  GLOBAL_GDP_2025,
  GLOBAL_LIFE_EXPECTANCY_2024,
} from "./parameters-calculations-citations";
import {
  END_DISEASE_LIFETIME_VALUE_USD,
  END_WAR_LIFETIME_VALUE_USD,
  MISSION_VALUE_HORIZON_YEARS,
} from "./mission-value-horizon";

/**
 * Best available provenance link for a parameter, or null.
 *
 * Not every parameter carries `sourceUrl` -- a calculated one like the war
 * cost has a derivation (`calculationsUrl`) rather than a single citation.
 * Reaching straight for `sourceUrl` published "(undefined)" as the href on a
 * public page, so this resolves in order of usefulness and the caller renders
 * plain text when there is nothing to link.
 */
function provenanceUrl(param: {
  calculationsUrl?: string;
  manualPageUrl?: string;
  sourceUrl?: string;
}): string | null {
  return (
    param.calculationsUrl ?? param.sourceUrl ?? param.manualPageUrl ?? null
  );
}

/** Markdown link when the parameter has provenance, plain text when it does not. */
function citedText(
  label: string,
  param: { calculationsUrl?: string; manualPageUrl?: string; sourceUrl?: string },
) {
  const url = provenanceUrl(param);
  return url ? `[${label}](${url})` : label;
}

function usdShort(value: number) {
  const units: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
  ];
  for (const [size, suffix] of units) {
    if (Math.abs(value) >= size) {
      const scaled = value / size;
      return `$${scaled.toFixed(Math.abs(scaled) >= 100 ? 0 : 1)}${suffix}`;
    }
  }
  return `$${value.toFixed(0)}`;
}

/**
 * The expected-value rules, as markdown, with every figure interpolated from
 * the parameter catalog so the prose cannot drift from the numbers it
 * describes.
 *
 * Single source for all three audiences: the /methodology page renders it,
 * docs/EXPECTED_VALUE_METHODOLOGY.md points at it, and the MCP tools that
 * write estimates quote its rule so agents estimate consistently.
 */
export const EXPECTED_VALUE_METHODOLOGY_MARKDOWN = `# How we put a number on a task

Every task in the tree carries an expected value, and the queue ranks work by
it. That only means something if every number is computed the same way. These
are the rules.

## The one-line rule

**Conditional value = the annual welfare effect × ${MISSION_VALUE_HORIZON_YEARS} years, undiscounted.
Record it with a separate success probability. A goal's value is never summed from the tasks beneath it.**

## The frame

| Field | Value | Why |
| --- | --- | --- |
| Horizon | **${MISSION_VALUE_HORIZON_YEARS} years** | Global life expectancy at birth (${citedText("WHO, 2024", GLOBAL_LIFE_EXPECTANCY_2024)}). One human lifetime is a span a reader can feel, and it is a *measured* number rather than a chosen one. |
| Discount rate | **0** | See below. |
| Probability | 0–1, recorded as its own field | So the conditional value stays recoverable. |

### Conditional value and expected value are two different numbers

Both are stored, and confusing them is the easiest way to publish a wrong estimate.

- **Conditional value** — what the task is worth *if it works*. This is the number
  you derive: annual effect × ${MISSION_VALUE_HORIZON_YEARS}.
- **Success probability** — the odds it works, recorded in its own field.
- **Expected value** — the two multiplied. This is what the queue ranks on, and it
  is what the \`expectedEconomicValueUsd\` fields hold.

So probability *is* reflected in the expected value — that is what makes it
"expected". What must never happen is probability being quietly baked into the
conditional value and then applied a second time, or a conditional value being
filed as though it were already probability-weighted. Keep both numbers, and the
reader can always recover either one.

When a task states a value but no probability, its expected value equals its
conditional value. That is a deliberate signal, not a claim of certainty: it means
the number is a ceiling nobody has discounted yet.

### Why no discount rate

A discount rate does one of two jobs: it prices uncertainty, or it prices
impatience.

Uncertainty is already priced here — every estimate carries an explicit
probability of success — so discounting for risk would charge for it twice.

That leaves pure time preference, which is a contested ethical position rather
than a measurement. It is also the most-attacked parameter in this field: the
Copenhagen Consensus rankings are criticised primarily because their discount
rates structurally penalise long-horizon problems, making climate look weak
against near-term health spending. Choosing zero does not make us right. It
makes the choice **visible and uniform** instead of buried inside each estimate,
and anyone who disagrees can apply their own rate to a stated undiscounted
number — which they cannot do to a pre-discounted one.

### Why no growth curve

The form is deliberately flat: annual effect × horizon. No compounding. A
reader can check the arithmetic in their head, and a growth assumption cannot
hide in the same slot as a measurement.

## A goal's value is written, not derived

This is the rule that is easiest to get wrong, and it is worth being concrete.

Six mechanisms in the tree — the Court of Humanity, the 1% Treaty, the Loving
Takeover, the Earth Optimization Prize, the decentralized FDA, and the shirt
cascade — all carry the *same* peace-dividend value and differ only in their
probability of success. They hang under different parents, because they reach
that dividend by different arguments, but they are **alternative routes to one
outcome**, not parts of it.

So adding them up would count the same dividend six times. Splitting the
parent's value across them is the same error inverted — it hands a task a number
nobody estimated.

A goal's value is a fact about the world, not about our task list. The value of
ending disease does not change when someone adds a subtask. What a task earns
for advancing a goal is credit for moving its **probability**, recorded on the
link between them.

## Worked example: ending war

| Step | Source | Value |
| --- | --- | --- |
| Annual cost of war | ${citedText("direct + indirect, global", GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST)} | ${usdShort(GLOBAL_ANNUAL_DIRECT_INDIRECT_WAR_COST.value)}/year |
| × one lifetime | ${MISSION_VALUE_HORIZON_YEARS} years | **${usdShort(END_WAR_LIFETIME_VALUE_USD)}** |
| × probability | probability war actually ends | the ranked expected value |

Note this uses the *whole* cost of war, not the peace dividend. The dividend is
what a one percent redirection buys, which is what the treaty asks for. The
mission is the whole quantity.

## Worked example: ending disease

| Step | Source | Value |
| --- | --- | --- |
| Share of GDP lost to disease | ${citedText(`${(DISEASE_BURDEN_GDP_DRAG_PCT.value * 100).toFixed(0)}%`, DISEASE_BURDEN_GDP_DRAG_PCT)} | of ${citedText(usdShort(GLOBAL_GDP_2025.value), GLOBAL_GDP_2025)} |
| Annual drag | productivity + diverted medical cost | ${usdShort(DISEASE_BURDEN_GDP_DRAG_PCT.value * GLOBAL_GDP_2025.value)}/year |
| × one lifetime | ${MISSION_VALUE_HORIZON_YEARS} years | **${usdShort(END_DISEASE_LIFETIME_VALUE_USD)}** |

That is economic drag only. It does not price the suffering itself, which
belongs in the health fields on the same horizon and the same zero discount.

## Writing an estimate

1. Find or add a **sourced annual parameter**. Never hand-type a number onto a
   task.
2. Multiply by the ${MISSION_VALUE_HORIZON_YEARS}-year horizon.
3. State the probability separately.
4. Put the chain in the task description so a reader can check it without
   reading code.

If no defensible parameter exists, **leave the estimate blank and say so**. A
blank is honest. An invented number gets ranked against real ones, and the
ranking is what the whole system is for.
`;

/** Compact form for MCP tool descriptions, where space is tight. */
export const EXPECTED_VALUE_RULE_SUMMARY = `Derive the CONDITIONAL value (worth if it works) as annual welfare effect x ${MISSION_VALUE_HORIZON_YEARS} years (one human lifetime), undiscounted, on the LIFETIME frame. Then supply expectedEconomicValueUsd* ALREADY MULTIPLIED by success probability -- these fields hold probability-weighted value and nothing downstream multiplies again -- and record successProbabilityBase in its own field so the conditional value stays recoverable. Do not file a conditional value as though it were weighted. A goal's value is written from sourced parameters, never summed from its subtasks (sibling tasks are usually alternative routes to one outcome, so summing double-counts). If no sourced parameter exists, leave the estimate null rather than inventing one. Full rules: /methodology`;
