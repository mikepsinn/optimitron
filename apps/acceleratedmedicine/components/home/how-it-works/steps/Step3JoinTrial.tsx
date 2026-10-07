import { ClipboardCheck } from "lucide-react"
import { HowItWorksStep } from "../HowItWorksStep"

export function Step3JoinTrial() {
  return (
    <HowItWorksStep
      stepNumber={3}
      title="Decide in Writing"
      icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
      description="Sign a plain-language consent with your doctor: the treatment, the risks, the unknowns and the cost."
      benefits={[
        "Sign online, after talking it over with your doctor",
        "Known and unknown risks in plain language",
        "The cost, and who pays, before you start",
        "Stop at any time",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold">Informed Consent</div>
            <div className="space-y-3">
              <div className="text-sm">
                I understand that this treatment is experimental and that my outcome will be recorded.
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-sm"></div>
                </div>
                <div className="text-sm">I have reviewed the outcome label</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-sm"></div>
                </div>
                <div className="text-sm">I understand the known and unknown risks</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-sm"></div>
                </div>
                <div className="text-sm">I know the cost and who pays</div>
              </div>
              <div className="mt-4">
                <div className="bg-primary text-primary-foreground rounded px-3 py-2 text-sm text-center">
                  Sign consent
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      reverse={false}
    />
  )
}

