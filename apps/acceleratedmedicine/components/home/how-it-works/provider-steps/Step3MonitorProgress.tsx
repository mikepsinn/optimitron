'use client'
import { TrendingUp } from "lucide-react";
import { HowItWorksStep } from "../HowItWorksStep";
import { Card, CardContent, CardHeader, CardTitle } from "@optimitron/neobrutalist-ui/ui/card";

// The same outcome categories as the board's yearly report on the deck's slide 15.
const outcomes = [
  { label: "Improved", count: 21 },
  { label: "No real change", count: 14 },
  { label: "Worsened", count: 6 },
  { label: "Stopped", count: 4 },
  { label: "Lost to follow-up", count: 3 },
]

export function Step3MonitorProgress() {
  return (
    <HowItWorksStep
      stepNumber={3}
      title="Monitor Your Patients' Outcomes"
      icon={<TrendingUp className="h-5 w-5 text-primary" />}
      description="Track how your patients are doing, report side effects in minutes, and see the same outcome categories the board publishes."
      benefits={[
        "Outcome reports straight from routine medical records",
        "Serious side effects reach the review board within five days",
        "Good, bad and unclear results are all recorded",
        "Compare your patients with every clinic's pooled results",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Patients on Lecanemab</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Outcome reports due this week</span>
                <span className="text-sm font-bold">3</span>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Outcomes at 6 months (48 patients)</div>
                <div className="space-y-1 text-xs">
                  {outcomes.map(outcome => (
                    <div key={outcome.label} className="flex justify-between">
                      <span>{outcome.label}</span>
                      <span className="font-semibold tabular-nums">{outcome.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Recent side-effect reports</div>
                <div className="text-xs space-y-1">
                  <p><span className="font-semibold">P12345:</span> Mild ARIA, reported to the board</p>
                  <p><span className="font-semibold">P67890:</span> Headache (resolved)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
      reverse={false}
    />
  );
}
