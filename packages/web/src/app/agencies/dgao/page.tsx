import { GameCTA } from "@/components/ui/game-cta";
import { transparencyLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(transparencyLink);

const pipelineSteps = [
  {
    number: 1,
    label: "Citizen Preferences",
    description:
      "Citizens pick between two things. Then two more. Do this enough times and the maths tells you what everyone actually wants. Your current method is to let 535 people guess.",
    color: "bg-foreground",
    textColor: "text-background",
    subTextColor: "text-background",
  },
  {
    number: 2,
    label: "Alignment Scoring",
    description:
      "We compare what your politicians actually voted for against what you actually wanted. The gap between those two numbers is called a Citizen Alignment Score. It is usually depressing.",
    color: "bg-background",
    textColor: "text-foreground",
    subTextColor: "text-foreground",
  },
  {
    number: 3,
    label: "Public Audit Trail",
    description:
      "Every score needs a trail: inputs, method, version, and date. Otherwise it is just another person on the internet saying numbers with confidence. The records live where nobody can quietly delete them. Your governments love deleting things. This one can't.",
    color: "bg-background",
    textColor: "text-foreground",
    subTextColor: "text-foreground",
  },
  {
    number: 4,
    label: "Campaign Finance",
    description:
      "Campaign support should follow measured alignment with citizens, not donor access, dinner fundraisers, or whichever lobbyist brought the nicest spreadsheet. Not how much they promised. Not how good their hair is. What they did.",
    color: "bg-background",
    textColor: "text-foreground",
    subTextColor: "text-foreground",
  },
  {
    number: 5,
    label: "Public Goods",
    description:
      "Once the loop works, money moves toward what citizens choose and what improves the two terminal metrics: healthy life-years and real income.",
    color: "bg-foreground",
    textColor: "text-background",
    subTextColor: "text-background",
  },
];

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
            Transparency
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            The Full Pipeline
          </h1>
          <p className="text-lg text-foreground leading-relaxed font-bold">
            Governance data should be inspectable by default. Preference
            snapshots, alignment scores, and funding decisions should point back
            to the evidence that produced them.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            The useful question is not whether a dashboard looks official. The
            useful question is whether a stranger can inspect the inputs and get
            the same answer.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase text-foreground mb-8">
          From Voice to Policy
        </h2>
        <div className="space-y-0">
          {pipelineSteps.map((step, index) => (
            <div key={step.label} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 border-4 border-primary ${step.color} flex items-center justify-center font-black text-lg`}>
                  {step.number}
                </div>
                {index < pipelineSteps.length - 1 && (
                  <div className="w-1 flex-1 bg-foreground" />
                )}
              </div>
              <div className={`flex-1 border-4 border-primary ${step.color} p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                <h3 className={`text-xl font-black uppercase ${step.textColor}`}>
                  {step.label}
                </h3>
                <p className={`mt-2 text-sm font-bold ${step.subTextColor}`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card bg-background text-foreground border-primary text-center">
        <h2 className="text-2xl font-black mb-3 uppercase">
          Audit Everything
        </h2>
        <p className="mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          The code is public. The method is public. The assumptions are written
          down. If a score cannot be checked, it is not governance. It is
          theatre with a nicer chart.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="https://github.com/mikepsinn/optimitron" variant="secondary" external>View Source</GameCTA>
          <GameCTA href="https://wishocracy.warondisease.org" variant="outline" external>Wishocracy Paper</GameCTA>
        </div>
      </section>
    </div>
  );
}
