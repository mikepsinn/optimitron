'use client'
import { FlaskConical } from "lucide-react";
import { HowItWorksStep } from "../HowItWorksStep";
import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Badge } from "@optimitron/neobrutalist-ui/ui/badge";

// The act's two paths: the doctor recommends a screened treatment the patient chooses, or, if the
// patient agrees, enrolls them in a centrally run randomized comparison, as RECOVERY did. The doctor
// never picks an arm, and there is no placebo arm. Lecanemab's figures are from its FDA label.
export function Step2AssignIntervention() {
  return (
    <HowItWorksStep
      stepNumber={2}
      title="Recommend a Treatment, or Offer a Randomized Comparison"
      icon={<FlaskConical className="h-5 w-5 text-primary" />}
      description="Recommend a screened treatment that your patient chooses with you. Or, if your patient agrees, enroll them in a centrally run randomized comparison, as the RECOVERY trial did."
      benefits={[
        "Recommend any screened treatment, with written consent",
        "Offer willing patients a randomized comparison",
        "The trial assigns treatments at random; you never pick an arm",
        "No placebo arm",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold text-lg border-b pb-2">Patient: J. Doe</div>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-sm mb-2 flex justify-between items-center">
                  <span>Recommend a treatment</span>
                  <Badge>Screened</Badge>
                </div>
                <div className="space-y-3 border rounded-md p-3">
                  <div className="text-sm font-medium">Lecanemab (IV, every 2 weeks)</div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Decline on CDR-SB at 18 months</span>
                      <span className="text-green-700">27% slower</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-3 bg-green-500 rounded-full" style={{ width: "27%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Brain swelling (ARIA-E)</span>
                      <span>13%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-2 bg-amber-400 rounded-full" style={{ width: "13%" }}></div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Source: FDA label</div>
                  <Button size="sm" className="mt-1 w-full">Recommend lecanemab</Button>
                </div>
              </div>

              <div>
                <div className="font-medium text-sm mb-2 flex justify-between items-center">
                  <span>Offer a randomized comparison</span>
                  <Badge variant="secondary">Optional</Badge>
                </div>
                <div className="space-y-2 border rounded-md p-3 bg-muted/30 text-xs">
                  <div className="text-sm font-medium">Alzheimer&apos;s comparison study</div>
                  <p>Compares screened treatments with each other or with usual care. The central trial assigns each patient at random.</p>
                  <p className="text-muted-foreground">Joins only with your patient&apos;s written consent.</p>
                  <Button size="sm" variant="secondary" className="mt-1 w-full">Offer enrollment</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      reverse={true}
    />
  );
}
