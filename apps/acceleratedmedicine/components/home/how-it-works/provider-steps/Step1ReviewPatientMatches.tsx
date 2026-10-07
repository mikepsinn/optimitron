'use client'
import { Users } from "lucide-react";
import { HowItWorksStep } from "../HowItWorksStep";
import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Badge } from "@optimitron/neobrutalist-ui/ui/badge";

import { alzheimers, rankTreatments } from "@/components/present/patient-journey/alzheimers";

// The deck's approved Alzheimer's treatments with the prototype's scores (out of 100). The scores support
// the doctor's judgment; they do not make the decision.
const options = rankTreatments(alzheimers.treatments, "effectiveness").slice(0, 4)

export function Step1ReviewPatientMatches() {
  return (
    <HowItWorksStep
      exampleData
      stepNumber={1}
      title="Review Screened Options for Your Patient"
      icon={<Users className="h-5 w-5 text-primary" />}
      description="See the treatments an independent board has screened for your patient's condition, ranked by the evidence so far. The ranking supports your judgment; it does not replace it."
      benefits={[
        "Options ranked by outcomes from trials and treated patients",
        "Eligibility checked against your patient's record",
        "An outcome label, with sources, for every option",
        "You and your patient make the decision",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold text-lg border-b pb-2">Patient: John Doe (ID: P12345)</div>
            <div className="text-sm font-medium mb-2">Screened options (Condition: Alzheimer&apos;s disease)</div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {options.map(option => (
                <div key={option.slug} className="rounded-lg border p-3 bg-card">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{option.name}</div>
                    <Badge variant="outline">Eligible</Badge>
                  </div>
                  {[["Effectiveness estimate", option.effectiveness], ["Safety estimate", option.safetyScore]].map(([label, score]) => (
                    <div key={label} className="mt-2 flex items-center gap-2">
                      <div className="w-32 shrink-0 text-xs text-muted-foreground">{label}:</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2" style={{ width: `${score}%` }}></div>
                      </div>
                      <span className="whitespace-nowrap text-xs font-medium">{score}/100</span>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="mt-3 w-full">View outcome label</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      reverse={false}
    />
  );
}
