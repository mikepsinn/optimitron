import type { OutcomeCategory } from "@/components/home/outcome-label"

import data from "./alzheimers.json"

// Alzheimer's disease from the decentralized-fda prototype's treatment estimates (mikepsinn/dfda,
// apps/web/data/optimitron/medical-data, a fork of this repo's packages/data with corrections.json
// applied), keeping only the fields the slides show. Lecanemab's label values come from its FDA label.
type Outcome = {
  name: string
  baseline?: string | null
  percentageChange?: number | null
  absoluteChange?: string | null
  dataSource?: string | null
  sourceUrl?: string | null
  isPositive?: boolean
  // Points of decline from baseline by the end of the trial in each arm, where the label reports both
  // (lecanemab, for slide 9's bars).
  treatmentDecline?: number
  placeboDecline?: number
}

export type TreatmentEstimate = {
  name: string
  slug: string
  effectiveness: number
  safetyScore: number
  timeToEffect: string | null
  annualCost: number | null
  primaryOutcomes: Outcome[]
  secondaryOutcomes: Outcome[]
  sideEffects: {
    name: string
    percentage?: number | null
    // The share of patients on placebo with the side effect, where the label reports it.
    placeboPercentage?: number
    dataSource?: string | null
    sourceUrl?: string | null
  }[]
}

export type DemoCondition = { slug: string; name: string; lastUpdated: string; treatments: TreatmentEstimate[] }

export const alzheimers: DemoCondition = data

export function rankTreatments(treatments: TreatmentEstimate[], sort: "effectiveness" | "safety") {
  const metric = sort === "safety" ? "safetyScore" : "effectiveness"
  return [...treatments].sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name, "en"))
}

// Plain names for the measures a reader sees; the dataset keeps the full names.
const plainNames: Record<string, string> = {
  "Clinical Dementia Rating-Sum of Boxes (CDR-SB)": "Dementia severity (CDR-SB)",
  "Alzheimer's Disease Assessment Scale-Cognitive Subscale 14 (ADAS-Cog14)": "Thinking and memory (ADAS-Cog14)",
  "Alzheimer's Disease Cooperative Study-Activities of Daily Living (ADCS-MCI-ADL)": "Daily activities (ADCS-MCI-ADL)",
  "Infusion-related reactions": "Infusion reactions",
  "ARIA-E (edema)": "Brain swelling (ARIA-E)",
  // ARIA-H counts small bleeds and iron deposits on the brain's surface (superficial siderosis).
  "ARIA-H (hemorrhage)": "Signs of brain bleeding (ARIA-H)",
}

export function plainName(name: string) {
  return plainNames[name] ?? name
}

// A public link someone can check, not an AI search redirect.
const checkableSourceUrl = /^https:\/\/(?!vertexaisearch\.cloud\.google\.com\/)[^\s]+$/
const sourceNames: Record<string, string> = { "fda-label": "FDA label", publication: "Published study" }

// The cited source of a value taken from one; null for an estimate.
function citedSource(item: { dataSource?: string | null; sourceUrl?: string | null }) {
  if (!item.sourceUrl || !checkableSourceUrl.test(item.sourceUrl) || item.dataSource === "ai-estimated") {
    return undefined
  }
  return { label: sourceNames[item.dataSource ?? ""] ?? "Source", href: item.sourceUrl }
}

// "-0.45 points (less increase compared to placebo's change from baseline)" with 27 means the treatment
// slowed decline by 27% against placebo. Shown as "+27%", it reads as a 27% rise, so it is spelled out.
const placeboSlowing = /^([+-]?[\d.]+ [a-z]+) \(less (?:increase|decrease|decline|worsening) compared to placebo/i

function outcomeValue(item: Outcome) {
  const slowing = item.absoluteChange ? placeboSlowing.exec(item.absoluteChange) : null
  if (slowing && item.percentageChange && item.percentageChange > 0) {
    return { absolute: `${item.percentageChange}% less decline than placebo (${slowing[1]})` }
  }
  return { percentage: item.percentageChange, absolute: item.absoluteChange ?? undefined }
}

export function treatmentOutcomeCategories(treatment: TreatmentEstimate): OutcomeCategory[] {
  const outcomes = (items: Outcome[]) => items.map(item => ({
    name: plainName(item.name),
    baseline: item.baseline ? `Baseline: ${item.baseline}` : "Baseline: Not provided",
    value: outcomeValue(item),
    isPositive: item.isPositive,
    source: citedSource(item),
    arms: item.treatmentDecline !== undefined && item.placeboDecline !== undefined
      ? { treatment: item.treatmentDecline, placebo: item.placeboDecline, unit: "points" }
      : undefined,
  }))
  const sideEffects = treatment.sideEffects.map(item => ({
    name: plainName(item.name),
    value: { percentage: item.percentage, kind: "frequency" as const },
    source: citedSource(item),
    arms: item.percentage != null && item.placeboPercentage !== undefined
      ? { treatment: item.percentage, placebo: item.placeboPercentage, unit: "%" }
      : undefined,
  }))
  const primary = outcomes(treatment.primaryOutcomes)
  return [
    {
      title: "Primary outcome estimates", items: primary,
      description: primary.some(item => item.arms)
        ? "Bars show points of decline by the end of the trial. Shorter is better."
        : undefined,
    },
    { title: "Other outcome estimates", items: outcomes(treatment.secondaryOutcomes) },
    {
      title: "Side-effect estimates", isSideEffectCategory: true,
      description: sideEffects.some(item => item.source)
        ? "Share of patients who had each one."
        : "Estimated frequency.",
      emptyText: "No side-effect estimates supplied; this does not establish safety.",
      items: sideEffects,
    },
  ]
}
