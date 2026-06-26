import {
  DEFENSE_TAKEOVER_COST_PER_HUMAN,
  DEFENSE_TAKEOVER_COST_TOTAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  TREATY_ANNUAL_FUNDING,
} from "@optimitron/data/parameters";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/retroui/Button";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { EosInvestmentCalculator } from "@/components/site/EosInvestmentCalculator";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { fullManualPaperLink } from "@/lib/routes";

const requestDataRoomSubject = "EOS data room request"; // TODO(copy): Mike copy gate. Source: Pivot 3 CTA.
const bookCallSubject = "EOS investor call"; // TODO(copy): Mike copy gate. Source: Pivot 3 CTA.
const requestDataRoomHref = `mailto:m@warondisease.org?subject=${encodeURIComponent(
  requestDataRoomSubject,
)}`;
const bookCallHref = `mailto:m@warondisease.org?subject=${encodeURIComponent(
  bookCallSubject,
)}`;
const calculatorHref = "#eos-calculator";

const mastheadLabel = "Earth Optimization Services"; // TODO(copy): Mike copy gate. Source: Pivot 3 masthead.
const mastheadStatus = "Now accepting applications."; // TODO(copy): Mike copy gate. Source: Pivot 2 terms/CTA.
const investorActionsLabel = "Investor actions"; // TODO(copy): Mike copy gate. Source: Pivot 3 CTA.
const calculatorLabel = "See what your stake becomes"; // TODO(copy): Mike copy gate. Source: Pivot 2 calculator CTA.
const requestDataRoomLabel = "Request the data room"; // TODO(copy): Mike copy gate. Source: Pivot 3 goal.
const bookCallLabel = "Book a call"; // TODO(copy): Mike copy gate. Source: Pivot 3 goal.

const heroHeading =
  "Governments are supposed to make people healthier and richer. We're buying the power to make them."; // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
const whatThisIsHeading = "What this is"; // TODO(copy): Mike copy gate. Source: Pivot 3 page flow.
const thermostatHeading = "Your government has no thermostat."; // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
const thermostatDeck =
  "Your oven measures the temperature, compares it to what you asked for, and adjusts. So does your fridge, your cruise control, your toilet. Your government runs the most complex system on Earth with less feedback than a toaster."; // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy and earth-optimization-services.qmd:177-224.
const howItWorksHeading = "How it works"; // TODO(copy): Mike copy gate. Source: Pivot 3 page flow.
const employeeManualHeading = "Employee manual"; // TODO(copy): Mike copy gate. Source: humanity-manager-employment-agreement.qmd.
const employeeManualDeck =
  "The manual at warondisease.org is the employee handbook. Earth Optimization Services is the Company, which is you and everyone else. Your title is President of Earth Optimization Services, and so is everyone's. Eight billion presidents, no boss. You run the planet now."; // TODO(copy): Mike copy gate. Source: humanity-manager-employment-agreement.qmd.
const employeeManualLabel = "Read the employee manual"; // TODO(copy): Mike copy gate. Source: humanity-manager-employment-agreement.qmd.
const whyItPaysHeading = "Why it pays"; // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
const calculatorHeading = "Your calculator"; // TODO(copy): Mike copy gate. Source: Pivot 3 page flow.
const calculatorDeck =
  "Use your own assumptions. If the numbers stop working, good - you just saved yourself the money. Either way you leave knowing."; // TODO(copy): Mike copy gate. Source: Pivot 2 calculator framing.
const termsHeading = "Terms"; // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
const termsDeck =
  "The pitch is public. The paperwork is not. For accredited investors, the securities materials live off-page, where the law wants them."; // TODO(copy): Mike copy gate. Source: Pivot 3 legal gate.
const finalHeading = "Talk to us"; // TODO(copy): Mike copy gate. Source: Pivot 3 page flow.
const finalDeck =
  "Request the data room or book a call. The math is public. The buy-in is not a one-click checkout - the law makes us talk first."; // TODO(copy): Mike copy gate. Source: Pivot 3 CTA/legal gate.
const legalGateText =
  "Accredited-only securities discussion. Not an offer. Not investment advice."; // TODO(copy): Mike copy gate. Source: Pivot 3 terms and calculator disclaimer.

const thermostatPanels = [
  {
    caption: "This is why your food is edible.", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    feedback: "Thermometer feedback", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    flow: ["Set 350F", "Heat", "Oven", "Food"], // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    kicker: "it checks, then adjusts", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    title: "Your oven", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
  },
  {
    caption:
      "It never checks whether the policy worked. This is why your citizens are dead.", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    feedback: "no sensor, no adjust", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    flow: ['"War on Drugs"', "$1 trillion", "policy", "???"], // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy and earth-optimization-services.qmd:200-219.
    kicker: "it doesn't check anything", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    stats: ["Overdose deaths 6,000 -> 107,000", "Budget change: none", "53 years"], // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy and earth-optimization-services.qmd:211-219.
    title: "Your government", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
  },
  {
    caption:
      "Measure two numbers — how long people live, how much they earn — keep the policies that raise them, drop the ones that don't, repeat.", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    feedback: "health and income feedback", // TODO(copy): Mike copy gate. Source: Pivot 3 thermostat summary.
    flow: ["Measure", "Compare", "Adjust", "Repeat"], // TODO(copy): Mike copy gate. Source: Pivot 3 thermostat summary.
    kicker: "installs the thermostat", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    title: "Earth Optimization Services", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
  },
] as const;

const howItWorksSteps = [
  {
    body:
      "Buy a controlling share of the big weapons companies. The people you buy out get richer doing it - the share price goes up, not down.", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    title: "Buy the power", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
  },
  {
    body:
      "Instead of one boardroom deciding what that power does, every person gets a say - simple this-or-that choices that add up to what the public actually wants.", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    title: "Hand it to everyone", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
  },
  {
    body:
      "Feed in two centuries of data from nearly every country: which laws actually made people live longer and earn more. Rank them.", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
    title: "Find the policies that work", // TODO(copy): Mike copy gate. Source: Pivot 3 exact copy.
  },
] as const;

const terms = [
  {
    body: "Friends and family minimum.", // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
    label: "$25,000", // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
  },
  {
    body: "Institutional minimum.", // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
    label: "$100,000", // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
  },
  {
    body: "Earth Optimization Services shares and Incentive Alignment Bonds.", // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
    label: "2 products", // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
  },
  {
    body: "Founder equity.", // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
    label: "0%", // TODO(copy): Mike copy gate. Source: Pivot 3 terms.
  },
] as const;

function ActionButton({
  children,
  href,
  primary = false,
}: {
  children: ReactNode;
  href: string;
  primary?: boolean;
}) {
  const className = [
    "rounded-none border-2 border-foreground px-5 py-3 font-black uppercase shadow-none",
    "hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0",
    primary
      ? "bg-foreground text-background hover:bg-background hover:text-foreground"
      : "bg-background text-foreground hover:bg-foreground hover:text-background",
  ].join(" ");

  return (
    <Button asChild className={className} variant="outline">
      {href.startsWith("mailto:") || href.startsWith("http") ? (
        <a href={href}>{children}</a>
      ) : (
        <Link href={href}>{children}</Link>
      )}
    </Button>
  );
}

function PageSection({
  children,
  deck,
  id,
  title,
}: {
  children: ReactNode;
  deck?: string;
  id?: string;
  title: string;
}) {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="top"
      className="bg-background text-foreground"
      padding="lg"
    >
      <Container size="lg">
        <div className="max-w-4xl">
          <h2
            className="text-3xl font-black uppercase leading-none sm:text-5xl"
            id={id}
          >
            {title}
          </h2>
          {deck ? (
            <p className="mt-4 text-lg font-bold leading-8 sm:text-xl">
              {deck}
            </p>
          ) : null}
        </div>
        <div className="mt-10">{children}</div>
      </Container>
    </SectionContainer>
  );
}

function ThermostatPanel({
  panel,
}: {
  panel: (typeof thermostatPanels)[number];
}) {
  return (
    <article className="border-2 border-foreground p-4 sm:p-6">
      <div className="flex flex-col gap-2 border-b-2 border-foreground pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="text-2xl font-black uppercase leading-none">
          {panel.title}
        </h3>
        <p className="text-sm font-black uppercase text-muted-foreground">
          {panel.kicker}
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
        {panel.flow.map((node, index) => (
          <div className="contents" key={`${panel.title}-${node}`}>
            <div className="border-2 border-foreground bg-background p-3 text-center text-sm font-black uppercase">
              {node}
            </div>
            {index < panel.flow.length - 1 ? (
              <div
                aria-hidden="true"
                className="text-center text-lg font-black"
              >
                -&gt;
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 border-2 border-foreground p-3 text-center text-sm font-black uppercase">
        {panel.feedback}
      </div>
      {"stats" in panel ? (
        <dl className="mt-4 grid gap-2 text-sm font-black uppercase sm:grid-cols-3">
          {panel.stats.map((stat) => (
            <div className="border-2 border-foreground p-3" key={stat}>
              <dt className="sr-only">{stat}</dt>
              <dd>{stat}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="mt-4 text-base font-bold leading-7">{panel.caption}</p>
    </article>
  );
}

export function EarthOptimizationServicesLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SectionContainer
        bgColor="background"
        borderPosition="bottom"
        className="bg-background text-foreground"
        padding="lg"
      >
        <Container size="lg">
          <header className="flex flex-col gap-4 border-b-2 border-foreground pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-normal">
                {mastheadLabel}
              </p>
              <p className="mt-2 text-sm font-bold uppercase text-muted-foreground">
                {mastheadStatus}
              </p>
            </div>
            <nav
              aria-label={investorActionsLabel}
              className="flex flex-wrap gap-3"
            >
              <ActionButton href={requestDataRoomHref} primary>
                {requestDataRoomLabel}
              </ActionButton>
              <ActionButton href={bookCallHref}>{bookCallLabel}</ActionButton>
            </nav>
          </header>

          <section className="py-12 sm:py-16">
            <h1 className="max-w-5xl text-4xl font-black uppercase leading-none sm:text-6xl lg:text-7xl">
              {heroHeading}
            </h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <ActionButton href={requestDataRoomHref} primary>
                {requestDataRoomLabel}
              </ActionButton>
              <ActionButton href={bookCallHref}>{bookCallLabel}</ActionButton>
              <ActionButton href={calculatorHref}>{calculatorLabel}</ActionButton>
            </div>
          </section>
        </Container>
      </SectionContainer>

      <PageSection title={whatThisIsHeading}>
        {/* TODO(copy): Mike copy gate. Source: Pivot 3 exact copy with parameterized ratio. */}
        <p className="max-w-5xl text-xl font-bold leading-9 sm:text-2xl sm:leading-10">
          A government has one job: make the median person healthier and richer.
          Most are bad at it, because the people who profit from the current
          setup pay to keep it that way — governments spend{" "}
          <ParameterValue
            display="integer"
            param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
          />
          x more testing weapons than testing cures. So we do the boring thing.
          We buy a controlling share of the companies whose lobbying blocks the
          fix, hand that power to ordinary people instead of a boardroom, and
          point it at the policies that nearly every country&apos;s data says
          actually raise health and income. The lobby that spent decades
          stopping cures starts paying for them. It&apos;s almost like pointing the
          money at the goal works better. Weird. (This already runs as software.
          The math is public.)
        </p>
      </PageSection>

      <PageSection deck={thermostatDeck} title={thermostatHeading}>
        <div className="grid gap-5">
          {thermostatPanels.map((panel) => (
            <ThermostatPanel key={panel.title} panel={panel} />
          ))}
        </div>
      </PageSection>

      <PageSection title={howItWorksHeading}>
        <div className="grid border-t-2 border-foreground md:grid-cols-2">
          {howItWorksSteps.map((step, index) => (
            <article
              className="border-b-2 border-foreground py-6 md:border-r-2 md:px-6 md:even:border-r-0 md:first:pl-0"
              key={step.title}
            >
              <p className="text-sm font-black uppercase text-muted-foreground">
                {index + 1}
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase">
                {step.title}
              </h3>
              <p className="mt-4 text-base font-bold leading-7">{step.body}</p>
            </article>
          ))}
          <article className="border-b-2 border-foreground py-6 md:border-r-2 md:px-6 md:even:border-r-0">
            <p className="text-sm font-black uppercase text-muted-foreground">4</p>
            {/* TODO(copy): Mike copy gate. Source: Pivot 3 exact copy. */}
            <h3 className="mt-2 text-2xl font-black uppercase">
              Use the lobby to install them
            </h3>
            {/* TODO(copy): Mike copy gate. Source: Pivot 3 exact copy with parameterized funding. */}
            <p className="mt-4 text-base font-bold leading-7">
              The lobbying budget that used to block the fix now pays to pass it
              - starting with{" "}
              <ParameterValue display="withUnit" param={TREATY_ANNUAL_FUNDING} />{" "}
              a year redirected into testing cures.
            </p>
          </article>
        </div>
      </PageSection>

      <PageSection deck={employeeManualDeck} title={employeeManualHeading}>
        <ActionButton href={fullManualPaperLink.href}>
          {employeeManualLabel}
        </ActionButton>
      </PageSection>

      <PageSection title={whyItPaysHeading}>
        {/* TODO(copy): Mike copy gate. Source: Pivot 3 exact copy with parameterized takeover cost. */}
        <p className="max-w-5xl text-xl font-bold leading-9 sm:text-2xl sm:leading-10">
          The whole takeover costs about{" "}
          <ParameterValue
            display="withUnit"
            param={DEFENSE_TAKEOVER_COST_TOTAL}
          />{" "}
          - roughly{" "}
          <ParameterValue
            display="withUnit"
            param={DEFENSE_TAKEOVER_COST_PER_HUMAN}
          />{" "}
          per person, if every human chipped in. Nobody collects $90 from
          anybody. You put money in, you own part of it, and the returns come
          from those companies getting more valuable as the economy grows. You
          are not paying to fix the planet. You own part of the fix.
        </p>
      </PageSection>

      <PageSection
        deck={calculatorDeck}
        id="eos-calculator"
        title={calculatorHeading}
      >
        <EosInvestmentCalculator />
      </PageSection>

      <PageSection deck={termsDeck} title={termsHeading}>
        <div className="grid border-t-2 border-foreground sm:grid-cols-2 lg:grid-cols-4">
          {terms.map((term) => (
            <article
              className="border-b-2 border-foreground py-5 sm:border-r-2 sm:px-5 sm:even:border-r-0 lg:even:border-r-2 lg:last:border-r-0 lg:first:pl-0"
              key={term.label}
            >
              <h3 className="text-3xl font-black uppercase">{term.label}</h3>
              <p className="mt-3 text-base font-bold leading-7">{term.body}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <SectionContainer
        bgColor="background"
        borderPosition="top"
        className="bg-background text-foreground"
        padding="lg"
      >
        <Container size="lg">
          <div className="max-w-4xl">
            <h2 className="text-3xl font-black uppercase leading-none sm:text-5xl">
              {finalHeading}
            </h2>
            <p className="mt-4 text-lg font-bold leading-8 sm:text-xl">
              {finalDeck}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ActionButton href={requestDataRoomHref} primary>
              {requestDataRoomLabel}
            </ActionButton>
            <ActionButton href={bookCallHref}>{bookCallLabel}</ActionButton>
          </div>
          <p className="mt-6 border-2 border-foreground p-3 text-xs font-black uppercase">
            {legalGateText}
          </p>
        </Container>
      </SectionContainer>
    </div>
  );
}
