/**
 * Treatment loaders — thin re-export of @optimitron/data medical dataset.
 * Encyclopedia JSON lives once under packages/data/.../medical-data.
 */
export {
  type TreatmentWithConditions,
  type TreatmentForCondition,
  type ConditionTreatmentsFile,
  getAllTreatments,
  getTreatmentBySlug,
  searchTreatments,
  getTreatmentsByConditionSlug,
  getTreatmentForCondition,
  getConditionSlugsWithTreatments,
  MEDICAL_TREATMENTS,
} from "@optimitron/data/datasets/medical"
