import { FileText } from "lucide-react"

import { OutcomeLabel } from "@/components/home/outcome-label"
import { alzheimers, treatmentOutcomeCategories } from "@/components/present/patient-journey/alzheimers"
import { HowItWorksStep } from "../HowItWorksStep"

// Lecanemab's label, the one the deck shows: every value is from its FDA label, with the source linked.
// The preview keeps two primary outcomes and three side effects; the home page's label section shows it all.
const lecanemab = alzheimers.treatments.find(treatment => treatment.slug === "lecanemab")!
const [primary, , sideEffects] = treatmentOutcomeCategories(lecanemab)
const preview = [
  { ...primary, items: primary.items.slice(0, 2) },
  { ...sideEffects, items: sideEffects.items.slice(0, 3) },
]

export function Step2ViewOutcomeLabels() {
  return (
    <HowItWorksStep
      stepNumber={2}
      title="View Outcome Labels"
      icon={<FileText className="h-5 w-5 text-primary" />}
      description="Review what is known about a treatment before deciding, with the source of every number."
      benefits={[
        "See results from trials and from treated patients",
        "Understand potential side effects and their frequency",
        "Compare with standard of care treatments",
        "Check the source of every value",
      ]}
      preview={<OutcomeLabel title={lecanemab.name} tag="Alzheimer's disease" data={preview} />}
      reverse={true}
    />
  )
}
