import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import {
  GLOBAL_DISEASE_DEATHS_DAILY,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
} from "@optimitron/data/parameters"
import { ParameterValue } from "./shared/ParameterValue"

// The case surfaces still live on warondisease.org until the court routes
// land in this app (issue #254); these become local paths then.
const CASE_URL = "https://warondisease.org/humanity-v-government"
const PLAINTIFFS_URL = "https://warondisease.org/plaintiffs"
const VERDICT_URL = "https://warondisease.org/court"

const actionButtonClassName =
  "inline-block border-4 border-primary px-6 py-3 text-center text-lg font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"

/**
 * courtofhumanity.org home: the docket. One case, three actions —
 * read it, join it as a plaintiff, render a verdict.
 */
export function CourtHomePage() {
  return (
    <>
      <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg">
        <Container>
          <h1 className="text-4xl font-black uppercase leading-none sm:text-6xl md:text-7xl">
            The Court of
            <br />
            <span className="text-brutal-yellow">Humanity</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-bold sm:text-xl">
            Where humanity brings its case against the institutions it pays to
            protect it. Court is in session.
          </p>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
        <Container size="md">
          <p className="mb-2 text-sm font-black uppercase tracking-wide">
            Now on the docket
          </p>
          <Card className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:p-12">
            <h2 className="text-3xl font-black uppercase sm:text-4xl">
              Humanity v. Government
            </h2>
            <p className="mt-6 text-lg font-medium leading-relaxed">
              The defendants collect $
              <ParameterValue
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                display="integer"
                className="font-black text-brutal-pink"
              />{" "}
              for weapons for every $1 they spend testing which medicines work,
              while{" "}
              <ParameterValue
                param={GLOBAL_DISEASE_DEATHS_DAILY}
                format={{ precision: 0 }}
                className="font-black text-brutal-pink"
              />{" "}
              humans die of disease every day. The plaintiffs are the humans
              who pay them to promote the general welfare. The remedy sought:
              redirect 1% of military spending to pragmatic clinical trials.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <a href={CASE_URL} className={`${actionButtonClassName} bg-brutal-cyan text-foreground`}>
                Read the case
              </a>
              <a href={PLAINTIFFS_URL} className={`${actionButtonClassName} bg-brutal-pink text-brutal-pink-foreground`}>
                Register a plaintiff
              </a>
              <a href={VERDICT_URL} className={`${actionButtonClassName} bg-background text-foreground`}>
                Render your verdict
              </a>
            </div>
          </Card>
        </Container>
      </SectionContainer>
    </>
  )
}
