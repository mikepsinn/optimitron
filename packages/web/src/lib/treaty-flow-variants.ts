export const TREATY_FLOW_VARIANTS = {
  voteFirstV1: "treaty_flow_v1_vote_first",
  contextFirstV2: "treaty_flow_v2_context_first",
} as const;

export type TreatyFlowVariant =
  (typeof TREATY_FLOW_VARIANTS)[keyof typeof TREATY_FLOW_VARIANTS];

export const DEFAULT_TREATY_FLOW_VARIANT =
  TREATY_FLOW_VARIANTS.contextFirstV2;

export const TREATY_FLOW_VARIANT_QUERY_PARAM = "treatyFlow";

const TREATY_FLOW_VARIANT_ALIASES: Record<string, TreatyFlowVariant> = {
  "1": TREATY_FLOW_VARIANTS.voteFirstV1,
  "v1": TREATY_FLOW_VARIANTS.voteFirstV1,
  "vote-first": TREATY_FLOW_VARIANTS.voteFirstV1,
  "vote_first": TREATY_FLOW_VARIANTS.voteFirstV1,
  "treaty-flow-v1-vote-first": TREATY_FLOW_VARIANTS.voteFirstV1,
  [TREATY_FLOW_VARIANTS.voteFirstV1]: TREATY_FLOW_VARIANTS.voteFirstV1,

  "2": TREATY_FLOW_VARIANTS.contextFirstV2,
  "v2": TREATY_FLOW_VARIANTS.contextFirstV2,
  "context-first": TREATY_FLOW_VARIANTS.contextFirstV2,
  "context_first": TREATY_FLOW_VARIANTS.contextFirstV2,
  "document": TREATY_FLOW_VARIANTS.contextFirstV2,
  "document-version": TREATY_FLOW_VARIANTS.contextFirstV2,
  "treaty-flow-v2-context-first": TREATY_FLOW_VARIANTS.contextFirstV2,
  [TREATY_FLOW_VARIANTS.contextFirstV2]: TREATY_FLOW_VARIANTS.contextFirstV2,
};

export function normalizeTreatyFlowVariant(
  value: string | null | undefined,
): TreatyFlowVariant | null {
  if (!value) return null;
  return TREATY_FLOW_VARIANT_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function getTreatyFlowVariantLabel(variant: TreatyFlowVariant) {
  switch (variant) {
    case TREATY_FLOW_VARIANTS.voteFirstV1:
      return "V1 vote-first";
    case TREATY_FLOW_VARIANTS.contextFirstV2:
      return "V2 context-first";
  }
}
