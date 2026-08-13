/**
 * Re-export condition types from the shared medical dataset.
 * Do not redefine here — @optimitron/data is the source of truth.
 */
export type {
  Condition,
  ConditionCategory,
} from "@optimitron/data/datasets/medical"
