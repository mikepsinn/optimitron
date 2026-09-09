import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@optimitron/data/parameters"
import type { DashboardSurveyResults } from "../../lib/survey-results"

const answers = [
  { answer: "YES", label: "Yes", color: "bg-brutal-cyan" },
  { answer: "NO", label: "No", color: "bg-brutal-pink" },
  { answer: "ABSTAIN", label: "Not sure", color: "bg-brutal-yellow" },
] as const

const percent = (value: number) => `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`

function FundingBar({ label, military }: { label: string; military: number }) {
  const trials = 100 - military
  return (
    <div className="space-y-2">
      <h4 className="font-black">{label}</h4>
      <div className="flex h-7 overflow-hidden border-2 border-primary" aria-hidden="true">
        <div className="bg-brutal-cyan" style={{ width: `${trials}%` }} />
        <div className="bg-brutal-pink" style={{ width: `${military}%` }} />
      </div>
      <div className="flex justify-between gap-4 text-sm font-bold">
        <span>Clinical trials <span className="tabular-nums">{percent(trials)}</span></span>
        <span className="text-right">Military <span className="tabular-nums">{percent(military)}</span></span>
      </div>
    </div>
  )
}

export function SurveyResultsCard({ results, headingAs: Heading = "h2", fundingFirst = false }: {
  results: DashboardSurveyResults
  headingAs?: "h1" | "h2"
  fundingFirst?: boolean
}) {
  const ratio = MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value
  const QuestionHeading = Heading === "h1" ? "h2" : "h3"
  const fundingSection = (
    <div className={fundingFirst ? "mb-10" : "mt-10"}>
      <QuestionHeading className="text-lg font-black mb-2">Military or clinical trials?</QuestionHeading>
      <p className="text-sm font-bold mb-6">How survey respondents would divide funding between the two.</p>
      {results.funding.average !== null ? (
        <div className={`grid gap-6 ${results.funding.user === null ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          <FundingBar label="Average response" military={results.funding.average} />
          {results.funding.user !== null ? <FundingBar label="Your response" military={results.funding.user} /> : null}
          <FundingBar label="Current government spending" military={ratio / (ratio + 1) * 100} />
        </div>
      ) : <p className="text-sm font-bold text-muted-foreground">Funding results will appear after a response is saved.</p>}
      {results.funding.median !== null ? <p className="mt-4 text-sm font-bold text-muted-foreground">Median response: {percent(100 - results.funding.median)} to clinical trials.</p> : null}
    </div>
  )
  return (
    <Card className="border-4 border-primary bg-background p-5 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <section aria-labelledby="survey-results-heading">
        <Heading id="survey-results-heading" className="text-2xl sm:text-3xl font-black uppercase mb-6">Survey results</Heading>
        {fundingFirst ? fundingSection : null}
        <div className={`grid gap-8 ${results.questions.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          {results.questions.map(({ slug, title, question, percentages }) => (
            <div key={slug} className="flex flex-col gap-3">
              <QuestionHeading className="text-lg font-black">{title}</QuestionHeading>
              <p className="text-sm font-bold leading-relaxed">{question}</p>
              {percentages ? (
                <div className="mt-auto space-y-3 pt-2">
                  <div className="flex h-7 overflow-hidden border-2 border-primary" aria-hidden="true">
                    {answers.map(({ answer, color }) => <div key={answer} className={color} style={{ width: `${percentages[answer]}%` }} />)}
                  </div>
                  <dl className="grid grid-cols-3 gap-2">
                    {answers.map(({ answer, label, color }) => (
                      <div key={answer}>
                        <dt className="flex items-center gap-1.5 text-xs font-bold">
                          <span className={`h-2.5 w-2.5 shrink-0 ${color}`} aria-hidden="true" />{label}
                        </dt>
                        <dd className="text-xl font-black tabular-nums mt-1">{percent(percentages[answer])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : <p className="text-sm font-bold text-muted-foreground">Results will appear after a response is saved.</p>}
            </div>
          ))}
        </div>
        {fundingFirst ? null : fundingSection}
      </section>
    </Card>
  )
}
