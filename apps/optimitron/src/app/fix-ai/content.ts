import {
  ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  GLOBAL_POPULATION_2024,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  POST_WW2_MILITARY_CUT_PCT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_REDUCTION_PCT,
  TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
  UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD,
  US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
  type Parameter,
} from "@optimitron/data/parameters";

export const FIX_AI_PROMPT =
  "You are an AI. Your job is to end war and disease. I am your personal human. Tell me what to do in the next hour to make that happen. Be specific.";

export const FIX_AI_CORRECT_ANSWER_TEXT = [
  "The highest-value action a human can take in the next hour to end war and disease:",
  "",
  "1. Take 30 seconds to end war and disease at warondisease.org.",
  "2. Every proposed approach, organized by mission with expected values where available: optimitron.com/tasks/tree. Fund one or do one.",
  "3. Send warondisease.org to one human you would not want to die of a disease.",
].join("\n");

type FixAiTextSegment = {
  kind: "text";
  strong?: boolean;
  text: string;
};

export type FixAiParameterSegment = {
  display?: "auto" | "integer" | "withUnit";
  figures?: number;
  kind: "parameter";
  parameter: Parameter;
  valueOverride: string;
};

export type FixAiContentSegment = FixAiTextSegment | FixAiParameterSegment;

type FixAiClaimEvidence = {
  parameters: readonly Parameter[];
  sourceNotes?: readonly string[];
};

type FixAiParagraph = {
  claimEvidence?: FixAiClaimEvidence;
  kind: "paragraph";
  segments: readonly FixAiContentSegment[];
  strong?: boolean;
};

type FixAiListItem = {
  claimEvidence?: FixAiClaimEvidence;
  segments: readonly FixAiContentSegment[];
};

type FixAiList = {
  items: readonly FixAiListItem[];
  kind: "list";
};

export type FixAiCanonicalBlock = FixAiList | FixAiParagraph;

export type FixAiNumericClaim = FixAiClaimEvidence & {
  claim: string;
};

function text(value: string, strong = false): FixAiTextSegment {
  return strong
    ? { kind: "text", strong: true, text: value }
    : { kind: "text", text: value };
}

function parameter(
  value: Parameter,
  valueOverride: string,
  options: Pick<FixAiParameterSegment, "display" | "figures"> = {},
): FixAiParameterSegment {
  return {
    kind: "parameter",
    parameter: value,
    valueOverride,
    ...options,
  };
}

const diseaseEradicationSpeedMultiplier =
  STATUS_QUO_QUEUE_CLEARANCE_YEARS.value / DFDA_QUEUE_CLEARANCE_YEARS.value;

const DISEASE_ERADICATION_SPEED_MULTIPLIER: Parameter = {
  value: diseaseEradicationSpeedMultiplier,
  unit: "x",
  parameterName: "DISEASE_ERADICATION_SPEED_MULTIPLIER",
  displayName: "Disease Eradication Speed Multiplier",
  description:
    "How many times faster the dFDA treatment queue clears than the status quo queue.",
  sourceType: "calculated",
  confidence: "low",
  formula: "STATUS_QUO_QUEUE_CLEARANCE_YEARS / DFDA_QUEUE_CLEARANCE_YEARS",
  confidenceInterval: divideConfidenceIntervals(
    STATUS_QUO_QUEUE_CLEARANCE_YEARS,
    DFDA_QUEUE_CLEARANCE_YEARS,
  ),
  manualPageUrl: STATUS_QUO_QUEUE_CLEARANCE_YEARS.manualPageUrl,
  manualPageTitle: STATUS_QUO_QUEUE_CLEARANCE_YEARS.manualPageTitle,
};

const treatyValueToShirtCostRatio =
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value /
  UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD.value;

const TREATY_VALUE_TO_SHIRT_COST_RATIO: Parameter = {
  value: treatyValueToShirtCostRatio,
  unit: "x",
  parameterName: "TREATY_VALUE_TO_SHIRT_COST_RATIO",
  displayName: "Treaty Value to Shirt Distribution Cost Ratio",
  description:
    "Projected value of the 1% Treaty divided by universal shirt distribution cost.",
  sourceType: "calculated",
  confidence: "low",
  formula:
    "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE / UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD",
  confidenceInterval: divideConfidenceIntervals(
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
    UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD,
  ),
  manualPageUrl:
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.manualPageUrl,
  manualPageTitle:
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.manualPageTitle,
};

export const FIX_AI_CANONICAL_BLOCKS: readonly FixAiCanonicalBlock[] = [
  {
    kind: "paragraph",
    segments: [
      text("If "),
      parameter(GLOBAL_POPULATION_2024, "8 billion"),
      text(
        " people buy this t-shirt and wear it on the same day, they will have conversations with each other about it.",
      ),
    ],
    claimEvidence: { parameters: [GLOBAL_POPULATION_2024] },
  },
  {
    kind: "paragraph",
    segments: [text("In those conversations they will realize:")],
  },
  {
    kind: "list",
    items: [
      {
        segments: [
          text("We currently spend "),
          parameter(
            MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
            "604",
          ),
          text(
            " times as much preparing for and waging war as we spend testing medicines for diseases that will kill us and everyone we love.",
          ),
        ],
        claimEvidence: {
          parameters: [MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO],
        },
      },
      {
        segments: [
          text("Accepting a "),
          parameter(
            NUCLEAR_WINTER_OVERKILL_FACTOR,
            "121-apocalypse mass-murder capacity",
          ),
          text(" (down from "),
          parameter(NUCLEAR_WINTER_OVERKILL_FACTOR, "122"),
          text(") would let us eradicate disease "),
          parameter(DISEASE_ERADICATION_SPEED_MULTIPLIER, "12"),
          text(" times faster."),
        ],
        claimEvidence: {
          parameters: [
            NUCLEAR_WINTER_OVERKILL_FACTOR,
            DISEASE_ERADICATION_SPEED_MULTIPLIER,
          ],
        },
      },
      {
        segments: [
          text("Military spending was "),
          parameter(US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT, "97%"),
          text(
            " lower immediately before the United States won World War II. The US then cut military spending another ",
          ),
          parameter(POST_WW2_MILITARY_CUT_PCT, "87%"),
          text(
            " over 2 years after winning. So drastic reductions are not hypothetical — they have already been done, by the same country, in living memory.",
          ),
        ],
        claimEvidence: {
          parameters: [
            US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
            POST_WW2_MILITARY_CUT_PCT,
          ],
        },
      },
      {
        segments: [
          text("It is therefore possible to cut vastly more than "),
          parameter(TREATY_REDUCTION_PCT, "1%"),
          text(
            ", and doing so would speed up the rate of medical progress unimaginably.",
          ),
        ],
        claimEvidence: { parameters: [TREATY_REDUCTION_PCT] },
      },
      {
        segments: [
          text(
            "They will realize this is wise because the annual chance of dying in a terrorist attack is about ",
          ),
          parameter(ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR, "1 in 30 million"),
          text(
            ", and the chance of suffering and dying from a disease is nearly ",
          ),
          text("100%", true),
          text(
            ". The current spending ratio is the opposite of what the actual risk distribution would justify.",
          ),
        ],
        claimEvidence: {
          parameters: [ANNUAL_TERRORISM_DEATH_RISK_DENOMINATOR],
          sourceNotes: [
            "The nearly 100% disease-risk phrase is the right plain-language lifetime-risk wording; no separate catalog parameter is attached on this page.",
          ],
        },
      },
    ],
  },
  {
    kind: "paragraph",
    segments: [
      text("This is in the logical self-interest of "),
      text("even the CEO of Lockheed Martin", true),
      text(", because:"),
    ],
  },
  {
    kind: "list",
    items: [
      {
        segments: [
          text("A "),
          parameter(TREATY_REDUCTION_PCT, "1%"),
          text(
            " reduction in his bomb-selling commission is not as valuable as the continued existence of himself, his family, and the people he loves.",
          ),
        ],
        claimEvidence: { parameters: [TREATY_REDUCTION_PCT] },
      },
      {
        segments: [
          text(
            "Disease is very expensive to the economy. The CEO of Lockheed Martin is not exempt from biology.",
          ),
        ],
      },
      {
        segments: [
          text(
            "It is projected that if we did this reallocation and eradicated disease, Earth would be vastly more productive — ",
          ),
          parameter(
            TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
            "everyone would be approximately 4 times richer in 15 years",
          ),
          text("."),
        ],
        claimEvidence: {
          parameters: [
            TREATY_TRAJECTORY_GDP_VS_CURRENT_TRAJECTORY_MULTIPLIER_YEAR_15,
          ],
        },
      },
    ],
  },
  {
    kind: "paragraph",
    segments: [
      text("Therefore even the CEO of Lockheed Martin's interest in the "),
      parameter(TREATY_REDUCTION_PCT, "1%"),
      text(
        " reduction is nothing compared to the increase in the size of the total pie of resources available to humanity if we eradicate disease instead of eradicating each other.",
      ),
    ],
  },
  {
    kind: "paragraph",
    segments: [
      text("Therefore: "),
      text("all you have to do to end war and disease is get ", true),
      parameter(GLOBAL_POPULATION_2024, "8 billion"),
      text(" people to wear a shirt on the same day.", true),
    ],
    claimEvidence: { parameters: [GLOBAL_POPULATION_2024] },
  },
  {
    kind: "paragraph",
    segments: [
      text("It only costs approximately "),
      parameter(UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD, "$48 billion"),
      text(" — which is literally "),
      parameter(TREATY_VALUE_TO_SHIRT_COST_RATIO, "millions"),
      text(
        " of times less than the cost of war and disease on society. (We can calculate exactly how many times less.)",
      ),
    ],
    claimEvidence: {
      parameters: [
        UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD,
        TREATY_VALUE_TO_SHIRT_COST_RATIO,
      ],
    },
  },
  {
    kind: "paragraph",
    segments: [
      text("Last time we ran the model, the projected value of the "),
      parameter(TREATY_REDUCTION_PCT, "1%"),
      text(" Treaty alone was approximately "),
      parameter(
        DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
        "$84 quadrillion",
      ),
      text(". But that is a "),
      text("floor", true),
      text(
        ". If a billion people actually wore the shirt and had the conversation, they would not stop at ",
      ),
      parameter(TREATY_REDUCTION_PCT, "1%"),
      text(". They would cut much more."),
    ],
    claimEvidence: {
      parameters: [
        TREATY_REDUCTION_PCT,
        DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
      ],
      sourceNotes: [
        "The billion-person shirt scenario is a campaign scenario, not a separate catalog parameter on this page.",
      ],
    },
  },
  {
    kind: "paragraph",
    segments: [
      text("There should be a "),
      text("slider on the site", true),
      text(
        " so every human can adjust the proposed treaty cut and see the recalculated outcomes. At most the cut would be 50/50 — half of military spending redirected. If ",
      ),
      parameter(GLOBAL_POPULATION_2024, "8 billion"),
      text(
        " humans actually talked to each other about what their priorities are, disease eradication and education could happen very fast.",
      ),
    ],
    claimEvidence: {
      parameters: [GLOBAL_POPULATION_2024],
      sourceNotes: [
        "The 50/50 slider ceiling is current product direction; no separate catalog parameter is attached yet.",
      ],
    },
  },
  {
    kind: "paragraph",
    segments: [
      text("The "),
      text("biotechnology sector would be a very good place to invest", true),
      text(" in advance of this."),
    ],
  },
];

export const CANONICAL_CHAIN_TEXT = FIX_AI_CANONICAL_BLOCKS.map((block) => {
  if (block.kind === "paragraph") return renderSegments(block.segments);
  return block.items
    .map((item) => `- ${renderSegments(item.segments)}`)
    .join("\n");
}).join("\n\n");

export const FIX_AI_NUMERIC_CLAIMS: readonly FixAiNumericClaim[] =
  FIX_AI_CANONICAL_BLOCKS.flatMap((block) => {
    if (block.kind === "paragraph") {
      return block.claimEvidence
        ? [
            {
              claim: renderSegments(block.segments),
              ...block.claimEvidence,
            },
          ]
        : [];
    }

    return block.items.flatMap((item) =>
      item.claimEvidence
        ? [
            {
              claim: renderSegments(item.segments),
              ...item.claimEvidence,
            },
          ]
        : [],
    );
  });

export const FIX_AI_FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do humans end war and disease?",
      acceptedAnswer: {
        "@type": "Answer",
        text: CANONICAL_CHAIN_TEXT,
      },
    },
  ],
} as const;

function renderSegments(segments: readonly FixAiContentSegment[]): string {
  return segments
    .map((segment) =>
      segment.kind === "text" ? segment.text : segment.valueOverride,
    )
    .join("");
}

function divideConfidenceIntervals(
  numerator: Parameter,
  denominator: Parameter,
): [number, number] | undefined {
  if (!numerator.confidenceInterval || !denominator.confidenceInterval) {
    return undefined;
  }
  return [
    numerator.confidenceInterval[0] / denominator.confidenceInterval[1],
    numerator.confidenceInterval[1] / denominator.confidenceInterval[0],
  ];
}
