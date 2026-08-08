/**
 * Condition loaders — thin re-export of @optimitron/data medical dataset.
 */
export {
  type Condition,
  type ConditionCategory,
  getAllConditions,
  getConditionBySlug,
  getConditionByName,
  searchConditions,
  getConditionsByCategory,
  MEDICAL_CONDITIONS as conditions,
} from "@optimitron/data/datasets/medical"
