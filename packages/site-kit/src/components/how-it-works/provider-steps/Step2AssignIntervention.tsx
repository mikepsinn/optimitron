"use client";
import { FlaskConical } from "lucide-react";
import { HowItWorksStep } from "../HowItWorksStep";
import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { Badge } from "@optimitron/neobrutalist-ui/ui/badge";

export function Step2AssignIntervention() {
  return (
    <HowItWorksStep
      stepNumber={2}
      title="Assign Patients to Trial Arms with Confidence"
      icon={<FlaskConical className="h-5 w-5 text-primary" />}
      description="Review detailed outcome labels, compare trial arms (including standard of care), and assign patients directly."
      benefits={[
        "Make informed decisions with transparent outcome data",
        "Compare effectiveness and side effect profiles easily",
        "Assign patients to specific trial arms seamlessly",
        "Integrate assignment with patient management workflows",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="border-b pb-2">
              <div className="font-bold text-lg">
                Lecanemab Trial - Patient: J. Doe
              </div>
              <div className="text-xs text-muted-foreground">
                Illustrative demo data
              </div>
            </div>
            <div className="space-y-4">
              {/* Trial Arm 1: Lecanemab */}
              <div>
                <div className="font-medium text-sm mb-2 flex justify-between items-center">
                  <span>Arm 1: Lecanemab (Bi-weekly IV)</span>
                  <Badge>Active</Badge>
                </div>
                <div className="space-y-3 border rounded-md p-3">
                  {/* Effectiveness */}
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Decline slowed vs standard care (ADAS-Cog)</span>
                      <span className="text-green-600">27%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-3 bg-green-500 rounded-full"
                        style={{ width: "27%" }}
                      ></div>
                    </div>
                  </div>
                  {/* Side Effects */}
                  <div>
                    <div className="font-medium text-xs mb-1 pt-2">
                      Key Side Effects:
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Immune Response (ARIA)</span>
                      <span>12%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-amber-400 rounded-full"
                        style={{ width: "12%" }}
                      ></div>
                    </div>
                  </div>
                  <Button size="sm" className="mt-3 w-full">
                    Assign to Lecanemab Arm
                  </Button>
                </div>
              </div>

              {/* Trial Arm 2: Standard of Care */}
              <div>
                <div className="font-medium text-sm mb-2 flex justify-between items-center">
                  <span>Arm 2: Standard of Care</span>
                  <Badge variant="secondary">Reference</Badge>
                </div>
                <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                  {/* Effectiveness */}
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Cognitive Function (ADAS-Cog)</span>
                      <span className="text-muted-foreground">
                        Usual rate of decline
                      </span>
                    </div>
                  </div>
                  {/* Side Effects */}
                  <div>
                    <div className="font-medium text-xs mb-1 pt-2">
                      Key Side Effects:
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Headache</span>
                      <span>5%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-amber-400 rounded-full"
                        style={{ width: "5%" }}
                      ></div>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="mt-3 w-full">
                    Continue Standard of Care
                  </Button>
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
