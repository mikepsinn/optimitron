import { Search } from "lucide-react"

import { alzheimers, rankTreatments } from "@/components/present/patient-journey/alzheimers"
import { HowItWorksStep } from "../HowItWorksStep"

// The approved Alzheimer's treatments the deck shows, ranked by the prototype's effectiveness scores
// (out of 100). No experimental therapies appear here.
const ranked = rankTreatments(alzheimers.treatments, "effectiveness")

export function Step1FindTrials() {
  return (
    <HowItWorksStep
      stepNumber={1}
      title="Compare the Most Promising Treatments for Your Condition"
      icon={<Search className="h-5 w-5 text-primary" />}
      description="See the treatments for your condition ranked side by side, each with an outcome label."
      benefits={[
        "Compare effectiveness, side effects and cost side by side",
        "See how strong the evidence is for each treatment",
        "Find participating clinics near you",
        "Talk the options over with your own doctor",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="rounded-md border px-3 py-2 flex items-center gap-2 bg-background">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Alzheimer&apos;s disease</span>
            </div>

            <div className="text-sm font-medium mb-2">Comparative Effectiveness Rankings (estimated, out of 100)</div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {ranked.map(treatment => (
                <div key={treatment.slug} className="rounded-lg border p-3 bg-card">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{treatment.name}</div>
                    <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">FDA approved</div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: `${treatment.effectiveness}%` }}></div>
                    </div>
                    <span className="whitespace-nowrap text-xs font-medium">{treatment.effectiveness}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      reverse={false}
    />
  )
}
