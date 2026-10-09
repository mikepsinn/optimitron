import { Bot, Phone, MessageSquare, Brain } from "lucide-react"
import { HowItWorksStep } from "../HowItWorksStep"

export function Step7FDAiAgent() {
  return (
    <HowItWorksStep
      stepNumber={7}
      title="Check In by Phone or Text"
      icon={<Bot className="h-5 w-5 text-primary" />}
      description="A short daily call or text asks how you feel and records your answer, so you don't fill in forms."
      benefits={[
        "Answer in your own words",
        "Side effects you mention go to your doctor",
        "A reminder when a dose is due",
        "Ask how your check-ins compare with others on the same treatment",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Daily check-in</h4>
              <p className="text-sm text-muted-foreground">By phone or text</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                <p className="text-sm">
                  Good morning, Sarah! How are you feeling today after your treatment yesterday?
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start justify-end">
              <div className="bg-primary/10 p-3 rounded-lg rounded-tr-none">
                <p className="text-sm">I'm feeling better today. The headache is gone but I still feel a bit tired.</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <MessageSquare className="h-4 w-4 text-secondary-foreground" />
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                <p className="text-sm">
                  Thanks, Sarah. I've recorded that, and I'll let your doctor know you still feel tired. Would you
                  like to see how your check-ins compare with other patients on the same treatment?
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start justify-end">
              <div className="bg-primary/10 p-3 rounded-lg rounded-tr-none">
                <p className="text-sm">Yes, please show me.</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <MessageSquare className="h-4 w-4 text-secondary-foreground" />
              </div>
            </div>

            <div className="mt-2 text-xs text-center text-muted-foreground">
              Your answers go into your record, and your doctor sees any side effects you mention
            </div>
          </div>
        </div>
      }
      reverse={true}
    />
  )
}

