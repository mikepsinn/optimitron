export type ConditionCategory =
  | "DERMATOLOGICAL"
  | "RENAL"
  | "GASTROINTESTINAL"
  | "METABOLIC"
  | "CANCER"
  | "ENDOCRINE"
  | "NEUROLOGICAL"
  | "INFECTIOUS_DISEASE"
  | "MENTAL_HEALTH"
  | "CARDIOVASCULAR"
  | "IMMUNOLOGICAL"
  | "RESPIRATORY"
  | "MUSCULOSKELETAL"
  | "HEMATOLOGICAL"
  | "UROLOGICAL"
  | "OPHTHALMOLOGICAL"
  | "OTHER";

export interface Condition {
  name: string;
  slug: string;
  description: string;
  emoji: string;
  peopleAffected: number;
  newCasesPerYear: number;
  deathsPerYear: number;
  activeTrialCount: number;
  globalFundingUSD: number;
  category: ConditionCategory;
  icd10Codes: string | null;
  dataSourceYear: number;
  synonyms: string[];
  disabilityAdjustedLifeYears: number | null;
  yearsLivedWithDisability: number | null;
  yearsLostToPrematureDeath: number | null;
}
