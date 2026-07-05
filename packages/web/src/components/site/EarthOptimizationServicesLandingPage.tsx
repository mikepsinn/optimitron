import {
  ALIGNED_ELECTION_COMMISSION_ANNUAL_OPEX,
  AUTOMATED_REVENUE_SERVICE_ANNUAL_OPEX,
  AUTOMATED_REVENUE_SERVICE_SAVINGS_PER_AMERICAN_ANNUAL,
  COURT_BUILD_COST,
  DFDA_DIRECT_FUNDING_COST_PER_DALY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_UPFRONT_BUILD,
  DIH_NPV_ANNUAL_OPEX_INITIATIVES,
  DIH_NPV_UPFRONT_COST_INITIATIVES,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  IRS_ANNUAL_OPERATING_BUDGET,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  PEACE_DIVIDEND_LIFETIME_PER_PERSON,
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_ANNUAL_FUNDING,
  UNIVERSAL_SECURITY_ADMIN_ALL_IN_COST_PER_CITIZEN_ANNUAL,
  UNIVERSAL_SECURITY_ADMIN_ANNUAL_OPEX,
} from "@optimitron/data/parameters";
import { AGENCIES } from "@optimitron/data/datasets/wishonia-agencies";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/retroui/Button";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { EosServiceCounter } from "@/components/site/EosServiceCounter";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { fullManualPaperLink, optimocracyPaperLink, ROUTES } from "@/lib/routes";

// Retail compare-at math, computed from the same parameters the cards cite
// (module-level so it runs once, matching the TreatyVoteFlow precedent).
const ARS_SAVINGS_PCT =
  100 -
  (100 * AUTOMATED_REVENUE_SERVICE_ANNUAL_OPEX.value) /
    IRS_ANNUAL_OPERATING_BUDGET.value;

const mastheadLabel = "Earth Optimization Services";
const mastheadStatus =
  "Correction: your application was accepted at birth. You are one of 8,000,000,000 presidents.";
const tourLabel = "Tour the departments";
const shopLabel = "Shop the service counter";

const heroHeading = "The Government of Tomorrow is in stock.";
const whatThisIsHeading = "What this is";
const thermostatHeading = "Your government has no thermostat.";
const thermostatDeck =
  "Your oven measures the temperature, compares it to what you asked for, and adjusts. So does your fridge, your cruise control, your toilet. Your government runs the most complex system on Earth with less feedback than a toaster.";
const departmentsHeading = "The departments";
const departmentsDeck =
  "Every agency you already pay for, rebuilt so it can tell whether it's working. Prices are for planetary installation.";
const serviceCounterHeading = "The service counter";
const serviceCounterDeck =
  "Order civilization repairs like anything else you shop for. Every item shows the price, what you get, and the return on your dollar. Money-back guarantee: if the work never happens, your money comes back.";
const employeeManualHeading = "Employee manual";
const employeeManualDeck =
  "The manual at manual.warondisease.org is the employee handbook. Earth Optimization Services is the Company, which is you and everyone else. You run the planet now.";
const employeeManualLabel = "Read the employee manual";
const shareholderStripText =
  "EOS also sells shares. That conversation is legally required to be boring, so it happens over here.";
const shareholderStripLabel = "Shareholder paperwork";

const thermostatPanels = [
  {
    caption: "This is why your food is edible.",
    feedback: "Thermometer feedback",
    flow: ["Set 350F", "Heat", "Oven", "Food"],
    kicker: "it checks, then adjusts",
    title: "Your oven",
  },
  {
    caption:
      "It never checks whether the policy worked. This is why your citizens are dead.",
    feedback: "no sensor, no adjust",
    flow: ['"War on Drugs"', "$1 trillion", "policy", "???"],
    kicker: "it doesn't check anything",
    stats: ["Overdose deaths 6,000 -> 107,000", "Budget change: none", "53 years"],
    title: "Your government",
  },
  {
    caption:
      "Measure two numbers — how long people live, how much they earn — keep the policies that raise them, drop the ones that don't, repeat.",
    feedback: "health and income feedback",
    flow: ["Measure", "Compare", "Adjust", "Repeat"],
    kicker: "installs the thermostat",
    title: "Earth Optimization Services",
  },
] as const;

interface Department {
  action: { href: string; label: string };
  body: ReactNode;
  priceLines: { label: string; value: ReactNode }[];
  replaces: string;
  title: string;
}

const departments: Department[] = [
  {
    action: {
      href: optimocracyPaperLink.href,
      label: "Read the spec",
    },
    body: (
      <>
        The machine that writes laws and budgets from evidence. Two centuries
        of data from nearly every country go in. Three features come standard:
        the Optimal Policy Generator finds the laws that raise health and
        income, the Optimal Budget Generator does the same for spending, and
        Wishocracy is the ballot where eight billion presidents split the
        budget with simple this-or-that choices. It already runs as software.
        The math is public.
      </>
    ),
    priceLines: [{ label: "Price", value: "Included with every government" }],
    replaces: "Legislative guesswork",
    title: "The Optimitron",
  },
  {
    action: {
      href: AGENCIES.dfda.manualUrl,
      label: "Read the spec",
    },
    body: (
      <>
        Turns ordinary healthcare into evidence. Pragmatic trials at{" "}
        <ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} /> instead
        of <ParameterValue param={TRADITIONAL_PHASE3_COST_PER_PATIENT} />, run
        in real clinics on outcomes that matter. It prevents a year of death
        and suffering for{" "}
        <ParameterValue
          param={DFDA_DIRECT_FUNDING_COST_PER_DALY}
          valueOverride="84 cents"
        />
        , which is the best price anyone has quoted on anything.
      </>
    ),
    priceLines: [
      {
        label: "Build",
        value: <ParameterValue param={DFDA_UPFRONT_BUILD} />,
      },
    ],
    replaces: AGENCIES.dfda.replacesAgencyName,
    title: AGENCIES.dfda.dName,
  },
  {
    action: { href: AGENCIES.dih.manualUrl, label: "Read the blueprint" },
    body: (
      <>
        Receives the treaty&apos;s{" "}
        <ParameterValue param={TREATY_ANNUAL_FUNDING} /> and pays for results
        instead of grant paperwork. Nobody gets paid for writing essays about
        why they should be allowed to try curing things. They get paid for
        curing things.
      </>
    ),
    priceLines: [
      {
        label: "Setup",
        value: <ParameterValue param={DIH_NPV_UPFRONT_COST_INITIATIVES} />,
      },
      {
        // Unit is USD/year, so ParameterValue already renders the "/year".
        label: "Running",
        value: <ParameterValue param={DIH_NPV_ANNUAL_OPEX_INITIATIVES} />,
      },
    ],
    // Registry says "NIH + FDA", which collides with the dFDA card next door.
    replaces: "The NIH",
    title: AGENCIES.dih.dName,
  },
  {
    action: { href: ROUTES.court, label: "Enter the court" },
    body: (
      <>
        Where eight billion humans judge governments that spend public money
        against the public. Registers plaintiffs, summons jurors, publishes the
        evidence, renders the verdict, and enforces the settlement — the 1%
        Treaty.
      </>
    ),
    priceLines: [
      { label: "Build", value: <ParameterValue param={COURT_BUILD_COST} /> },
    ],
    replaces: "Courts that can't subpoena a government",
    title: "Court of Humanity",
  },
  {
    action: {
      href: AGENCIES.ddod.manualUrl,
      label: "Read the spec",
    },
    body: (
      <>
        You are picturing a very strong robot that collects the missiles and
        throws them into the sun. We have something stronger: a buy order. The
        department buys the weapons companies — the sellers get richer, and
        nobody shoots at a brokerage account — converts the stockpiles into
        reactor fuel (your species already did this once; it powered your
        lightbulbs for twenty years), and retires the war budget at 1% a year,
        verified. Disputes take six minutes. Nobody dies.
      </>
    ),
    priceLines: [
      {
        label: "The other guys",
        value: (
          <s>
            <ParameterValue param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} />
            {"/yr"}
          </s>
        ),
      },
      {
        label: "Your lifetime share of the savings",
        value: <ParameterValue param={PEACE_DIVIDEND_LIFETIME_PER_PERSON} />,
      },
    ],
    replaces: AGENCIES.ddod.replacesAgencyName,
    title: AGENCIES.ddod.dName,
  },
  {
    action: {
      href: AGENCIES.dirs.manualUrl,
      label: "Read the spec",
    },
    body: (
      <>
        Your tax code is 17.5 Harry Potters long, except Harry Potter has a
        coherent plot and your tax code has loopholes. The replacement is six
        lines of code: every transfer sends 0.5% to the treasury. No filing.
        No forms. No audits. You cannot lobby a smart contract.
      </>
    ),
    priceLines: [
      {
        label: "The other guys",
        value: (
          <s>
            <ParameterValue param={IRS_ANNUAL_OPERATING_BUDGET} />
            {"/yr"}
          </s>
        ),
      },
      {
        label: "The Government of Tomorrow",
        value: (
          <>
            <ParameterValue param={AUTOMATED_REVENUE_SERVICE_ANNUAL_OPEX} />
            {"/yr"}
          </>
        ),
      },
      {
        label: "You save",
        value: (
          <>
            {`${ARS_SAVINGS_PCT.toFixed(1)}% — `}
            <ParameterValue
              param={AUTOMATED_REVENUE_SERVICE_SAVINGS_PER_AMERICAN_ANNUAL}
            />{" "}
            per American per year
          </>
        ),
      },
    ],
    replaces: AGENCIES.dirs.replacesAgencyName,
    title: AGENCIES.dirs.dName,
  },
  {
    action: {
      href: AGENCIES.dssa.manualUrl,
      label: "Read the spec",
    },
    body: (
      <>
        The welfare bureaucracy becomes a for-loop: if you are human, you
        qualify. No applications, no caseworkers, no 45-day wait while the
        hungry stay hungry. Running the whole thing costs{" "}
        <ParameterValue
          figures={2}
          param={UNIVERSAL_SECURITY_ADMIN_ALL_IN_COST_PER_CITIZEN_ANNUAL}
        />{" "}
        per citizen a year.
      </>
    ),
    priceLines: [
      {
        label: "Price",
        value: (
          <>
            <ParameterValue param={UNIVERSAL_SECURITY_ADMIN_ANNUAL_OPEX} />
            {"/yr"}
          </>
        ),
      },
    ],
    replaces: AGENCIES.dssa.replacesAgencyName,
    title: AGENCIES.dssa.dName,
  },
  {
    action: {
      href: AGENCIES.dfec.manualUrl,
      label: "Read the spec",
    },
    body: (
      <>
        One number per politician: how closely their votes match what citizens
        actually want. Score high, get funded. Represent donors instead, get
        nothing. The current system is a vending machine where lobbyists insert
        money and legislation comes out. The replacement is a scoreboard where
        citizens insert preferences and representation comes out.
      </>
    ),
    priceLines: [
      {
        label: "Price",
        value: (
          <>
            <ParameterValue param={ALIGNED_ELECTION_COMMISSION_ANNUAL_OPEX} />
            {"/yr"}
          </>
        ),
      },
    ],
    replaces: AGENCIES.dfec.replacesAgencyName,
    title: AGENCIES.dfec.dName,
  },
];

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

function DepartmentCard({ department }: { department: Department }) {
  return (
    <article className="flex flex-col border-2 border-foreground p-4 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
        Replaces: {department.replaces}
      </p>
      <h3 className="mt-2 text-2xl font-black uppercase leading-none">
        {department.title}
      </h3>
      <p className="mt-4 flex-1 text-base font-bold leading-7">
        {department.body}
      </p>
      <dl className="mt-5 grid gap-2 border-t-2 border-foreground pt-4 sm:grid-cols-2">
        {department.priceLines.map((line) => (
          <div key={line.label}>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              {line.label}
            </dt>
            <dd className="text-lg font-black">{line.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5">
        <ActionButton href={department.action.href}>
          {department.action.label}
        </ActionButton>
      </div>
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
              <p className="mt-2 max-w-md text-sm font-bold uppercase text-muted-foreground">
                {mastheadStatus}
              </p>
            </div>
            <nav aria-label="Primary actions" className="flex flex-wrap gap-3">
              <ActionButton href="#departments" primary>
                {tourLabel}
              </ActionButton>
              <ActionButton href="#service-counter">{shopLabel}</ActionButton>
            </nav>
          </header>

          <section className="py-12 sm:py-16">
            <h1 className="max-w-5xl text-4xl font-black uppercase leading-none sm:text-6xl lg:text-7xl">
              {heroHeading}
            </h1>
            <p className="mt-6 max-w-4xl text-xl font-bold leading-9 sm:text-2xl sm:leading-10">
              It measures whether people live longer and earn more, keeps the
              policies that work, and drops the ones that don&apos;t. Your
              current model spends{" "}
              <ParameterValue
                display="integer"
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
              />
              x more testing weapons than cures. Trade-ins accepted.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ActionButton href="#departments" primary>
                {tourLabel}
              </ActionButton>
              <ActionButton href="#service-counter">{shopLabel}</ActionButton>
            </div>
          </section>
        </Container>
      </SectionContainer>

      <PageSection title={whatThisIsHeading}>
        <p className="max-w-5xl text-xl font-bold leading-9 sm:text-2xl sm:leading-10">
          A government has one job: promote the general welfare — make the
          median citizen healthier and richer. The current models misplace
          about{" "}
          <ParameterValue
            param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
          />{" "}
          a year — the gap between the policies you get and the optimal ones a
          working government would pick. Below is the replacement catalog,
          plus a service counter of repairs you can order today. All of it is
          open source. This page is just the tour.
        </p>
      </PageSection>

      <PageSection deck={thermostatDeck} title={thermostatHeading}>
        <div className="grid gap-5">
          {thermostatPanels.map((panel) => (
            <ThermostatPanel key={panel.title} panel={panel} />
          ))}
        </div>
      </PageSection>

      <PageSection
        deck={departmentsDeck}
        id="departments"
        title={departmentsHeading}
      >
        <div className="grid gap-5 md:grid-cols-2">
          {departments.map((department) => (
            <DepartmentCard department={department} key={department.title} />
          ))}
        </div>
      </PageSection>

      <PageSection
        deck={serviceCounterDeck}
        id="service-counter"
        title={serviceCounterHeading}
      >
        <EosServiceCounter />
      </PageSection>

      <PageSection deck={employeeManualDeck} title={employeeManualHeading}>
        <ActionButton href={fullManualPaperLink.href}>
          {employeeManualLabel}
        </ActionButton>
      </PageSection>

      <SectionContainer
        bgColor="background"
        borderPosition="top"
        className="bg-background text-foreground"
        padding="lg"
      >
        <Container size="lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-base font-bold leading-7">
              {shareholderStripText}
            </p>
            <ActionButton href={ROUTES.fund}>
              {shareholderStripLabel}
            </ActionButton>
          </div>
        </Container>
      </SectionContainer>
    </div>
  );
}
