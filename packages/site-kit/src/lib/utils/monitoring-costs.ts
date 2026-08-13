/**
 * Standardized monitoring cost estimates by condition category
 * Used when AI-generated data doesn't include monitoring costs
 * 
 * Costs are annual estimates in USD based on typical monitoring requirements:
 * - Lab work frequency
 * - Imaging frequency  
 * - Specialist follow-up visits
 * - Disease-specific monitoring protocols
 */

import type { ConditionCategory } from '../../types/condition';

/**
 * Standardized annual monitoring costs by condition category (USD)
 * 
 * These estimates are based on:
 * - Typical lab work frequency (quarterly, semi-annual, annual)
 * - Imaging requirements (none, annual, semi-annual)
 * - Specialist visit frequency
 * - Disease-specific monitoring protocols
 */
export const MONITORING_COSTS_BY_CATEGORY: Record<ConditionCategory, number> = {
  // High monitoring requirements
  CARDIOVASCULAR: 1200, // ECG, lipid panels, BP monitoring, cardiology visits
  RENAL: 1800, // Frequent lab work (creatinine, eGFR), nephrology visits
  ENDOCRINE: 800, // Diabetes: A1c, glucose monitoring; Thyroid: TSH, T4
  CANCER: 2400, // Imaging (CT/MRI), tumor markers, oncology visits
  HEMATOLOGICAL: 1500, // CBC, blood chemistry, hematology visits
  
  // Medium monitoring requirements
  NEUROLOGICAL: 1000, // Imaging, neurology visits, cognitive assessments
  IMMUNOLOGICAL: 1400, // Autoimmune panels, rheumatology visits
  MUSCULOSKELETAL: 1200, // Inflammatory markers, imaging, rheumatology visits
  INFECTIOUS_DISEASE: 600, // Lab work for viral/bacterial load, ID visits
  METABOLIC: 800, // Similar to endocrine - lab work, monitoring
  
  // Lower monitoring requirements
  MENTAL_HEALTH: 400, // Periodic psychiatric visits, minimal lab work
  RESPIRATORY: 600, // Pulmonary function tests, chest imaging
  GASTROINTESTINAL: 800, // Endoscopy, lab work, GI visits
  DERMATOLOGICAL: 300, // Dermatology visits, minimal lab work
  OPHTHALMOLOGICAL: 500, // Eye exams, imaging
  UROLOGICAL: 600, // Lab work, imaging, urology visits
  OTHER: 500, // Default estimate
};

/**
 * Get standardized monitoring cost for a condition category
 */
export function getStandardMonitoringCost(category: ConditionCategory | undefined): number {
  if (!category) return MONITORING_COSTS_BY_CATEGORY.OTHER;
  return MONITORING_COSTS_BY_CATEGORY[category] || MONITORING_COSTS_BY_CATEGORY.OTHER;
}

/**
 * Get condition category from condition name (for when category isn't available)
 * Uses keyword matching to infer category
 */
export function inferConditionCategory(conditionName: string): ConditionCategory {
  const name = conditionName.toLowerCase();
  
  // Cardiovascular
  if (name.includes('cardiac') || name.includes('heart') || name.includes('coronary') || 
      name.includes('atrial') || name.includes('arrhythmia') || name.includes('cardiomyopathy')) {
    return 'CARDIOVASCULAR';
  }
  
  // Renal
  if (name.includes('kidney') || name.includes('renal') || name.includes('nephritis') || 
      name.includes('nephropathy') || name.includes('glomerulonephritis')) {
    return 'RENAL';
  }
  
  // Endocrine
  if (name.includes('diabetes') || name.includes('thyroid') || name.includes('hormone') || 
      name.includes('adrenal') || name.includes('hypothyroidism') || name.includes('hyperthyroidism')) {
    return 'ENDOCRINE';
  }
  
  // Cancer
  if (name.includes('cancer') || name.includes('carcinoma') || name.includes('tumor') || 
      name.includes('leukemia') || name.includes('lymphoma') || name.includes('sarcoma')) {
    return 'CANCER';
  }
  
  // Neurological
  if (name.includes('alzheimer') || name.includes('dementia') || name.includes('parkinson') || 
      name.includes('epilepsy') || name.includes('seizure') || name.includes('stroke') || 
      name.includes('migraine') || name.includes('headache')) {
    return 'NEUROLOGICAL';
  }
  
  // Mental Health
  if (name.includes('depression') || name.includes('anxiety') || name.includes('bipolar') || 
      name.includes('schizophrenia') || name.includes('adhd') || name.includes('ocd') || 
      name.includes('ptsd') || (name.includes('disorder') && (name.includes('mental') || name.includes('psychiatric')))) {
    return 'MENTAL_HEALTH';
  }
  
  // Respiratory
  if (name.includes('asthma') || name.includes('copd') || name.includes('pneumonia') || 
      name.includes('bronchitis') || name.includes('respiratory') || name.includes('pulmonary')) {
    return 'RESPIRATORY';
  }
  
  // Gastrointestinal
  if (name.includes('crohn') || name.includes('colitis') || name.includes('ibd') || 
      name.includes('ibs') || name.includes('gastro') || name.includes('hepatitis') || 
      name.includes('liver')) {
    return 'GASTROINTESTINAL';
  }
  
  // Dermatological
  if (name.includes('acne') || name.includes('eczema') || name.includes('psoriasis') || 
      name.includes('dermatitis') || name.includes('skin')) {
    return 'DERMATOLOGICAL';
  }
  
  // Musculoskeletal
  if (name.includes('arthritis') || name.includes('rheumatoid') || name.includes('lupus') || 
      name.includes('scleroderma') || name.includes('fibromyalgia') || name.includes('rheumat')) {
    return 'MUSCULOSKELETAL';
  }
  
  // Immunological
  if (name.includes('immune') || name.includes('autoimmune') || name.includes('immunodeficiency')) {
    return 'IMMUNOLOGICAL';
  }
  
  // Hematological
  if (name.includes('anemia') || name.includes('hemophilia') || name.includes('thrombosis') || 
      name.includes('coagulation') || name.includes('blood disorder')) {
    return 'HEMATOLOGICAL';
  }
  
  // Infectious Disease
  if (name.includes('infection') || name.includes('bacterial') || name.includes('viral') || 
      name.includes('tuberculosis') || name.includes('sepsis') || name.includes('fever') ||
      name.includes('hepatitis') || name.includes('chlamydia') || name.includes('gonorrhea')) {
    return 'INFECTIOUS_DISEASE';
  }
  
  // Metabolic
  if (name.includes('metabolic') || name.includes('gout') || name.includes('obesity')) {
    return 'METABOLIC';
  }
  
  // Urological
  if (name.includes('urinary') || name.includes('bladder') || name.includes('prostate') || 
      name.includes('kidney stone') || name.includes('nephrolithiasis')) {
    return 'UROLOGICAL';
  }
  
  // Ophthalmological
  if (name.includes('eye') || name.includes('retina') || name.includes('glaucoma') || 
      name.includes('cataract') || name.includes('vision')) {
    return 'OPHTHALMOLOGICAL';
  }
  
  return 'OTHER';
}

