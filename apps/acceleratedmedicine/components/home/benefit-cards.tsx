import { Clock, DollarSign, LineChart, Users } from "lucide-react"

// Copied from the decentralized-fda prototype (apps/web/components/KeyBenefitsSection.tsx), without the
// links into the prototype. The only figures are the sourced RECOVERY comparison; do not add unsourced
// performance claims here.
const benefits = [
  {
    title: "Improved Patient Experience",
    icon: Users,
    intro: "Designed to make participation easier and more rewarding:",
    points: [
      "Take part from home instead of traveling to a trial site",
      "Personalized health insights for every participant",
      "Open to patients whom standard trials exclude",
    ],
  },
  {
    title: "Lower Cost per Patient",
    icon: DollarSign,
    intro: "Pragmatic trials show what is possible:",
    points: [
      "The RECOVERY trial cost about $500 per patient, compared with about $41,000 for a typical trial",
      "Data collection runs inside routine care",
      "Automated analysis replaces manual site work",
    ],
  },
  {
    title: "Better Data Quality",
    icon: LineChart,
    intro: "Designed for data that researchers can check and reuse:",
    points: [
      "Continuous data from apps and wearables, not only clinic visits",
      "Every number shows where it came from",
      "An open API for independent analysis",
    ],
  },
  {
    title: "Faster Access to Treatments",
    icon: Clock,
    intro: "Reduce the wait for life-changing treatments:",
    points: [
      "Outcome data from the first patients, not only at the end of a multi-year trial",
      "Rankings update as new evidence arrives",
    ],
  },
]

export function BenefitCards() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2">
      {benefits.map((benefit) => (
        <div key={benefit.title} className="flex h-full flex-col rounded-lg border bg-background p-6 shadow-sm">
          <div className="mb-4 w-fit rounded-full bg-primary/10 p-4">
            <benefit.icon aria-hidden="true" className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">{benefit.title}</h3>
          <div className="mt-2 flex-grow text-muted-foreground">
            <p className="mb-4">{benefit.intro}</p>
            <ul className="space-y-2">
              {benefit.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <div aria-hidden="true" className="mt-0.5 rounded-full bg-primary/10 p-1">
                    <svg width="8" height="8" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                      <circle cx="3" cy="3" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
