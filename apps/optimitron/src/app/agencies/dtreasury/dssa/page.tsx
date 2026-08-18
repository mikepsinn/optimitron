import Link from "next/link";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { SimpleComparisonGrid } from "@/components/ui/simple-comparison";
import { StepList } from "@/components/ui/step-list";
import { AGENCIES } from "@optimitron/data/datasets/wishonia-agencies";
import { dssaLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(dssaLink);

const agency = AGENCIES.dssa;

const welfareProblems = [
  {
    title: "Overhead exceeds impact",
    description:
      "Your species currently spends more administering welfare than it distributes in benefits. The overhead-to-impact ratio is, and I say this with genuine bewilderment, worse than 1:1 in several programs.",
    color: "bg-background",
    textColor: "text-foreground",
  },
  {
    title: "The poverty trap",
    description:
      "Means-tested benefits create a cliff: earn $1 more and lose $2,000 in benefits. Your system actively punishes people for getting less poor. On my planet, this is classified as a bug, not a feature.",
    color: "bg-background",
    textColor: "text-foreground",
  },
  {
    title: "The crack-falling problem",
    description:
      "Millions of people who qualify for benefits never receive them because they can't navigate the paperwork. You built a safety net with holes larger than the people it's supposed to catch.",
    color: "bg-background",
    textColor: "text-foreground",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Transaction tax accumulates",
    description:
      "0.5% of every transaction flows to the treasury automatically. The tax happens when you spend. Like sales tax, except it funds keeping people alive instead of whatever your current sales tax funds. (Nobody knows.)",
  },
  {
    step: "02",
    title: "Treasury distributes UBI",
    description:
      "One function. Divides the money equally among every verified citizen. That's the entire welfare system. Your current one has 80+ programmes and still loses people in the cracks.",
  },
  {
    step: "03",
    title: "Personhood verification prevents fraud",
    description:
      "Each citizen proves they're a real human once. Not three duplicate claims. One proof, one registration. No case workers spending eight hours confirming you exist.",
  },
  {
    step: "04",
    title: "No means testing. Ever.",
    description:
      "Everyone gets the same amount. The billionaire gets it. The homeless person gets it. The administrative savings from eliminating means testing exceed the cost of giving it to people who don't 'need' it.",
  },
];

const comparisonData = {
  current: [
    { label: "Welfare programs", value: "80+ overlapping" },
    { label: "Annual admin overhead", value: "~$400–675 billion" },
    { label: "Application processing", value: "~45 days" },
    { label: "People who fall through cracks", value: "Millions" },
    { label: "Poverty trap", value: "Earn more, lose benefits" },
    { label: "Fraud prevention cost", value: "Billions/year" },
  ],
  wish: [
    { label: "Programs", value: "1 (UBI)" },
    { label: "Annual admin overhead", value: "$0" },
    { label: "Distribution time", value: "1 block (~12 seconds)" },
    { label: "Eligible citizens missed", value: "0" },
    { label: "Poverty trap", value: "None (universal)" },
    { label: "Fraud prevention", value: "Personhood verification" },
  ],
};

export default function DTreasuryDssaPage() {
  return (
    <WishoniaAgencyPage agency={agency}>
      {/* Back link */}
      <div className="mb-8">
        <Link
          href={ROUTES.dtreasury}
          className="text-sm font-black uppercase text-foreground hover:underline"
        >
          &larr; Back to dTreasury
        </Link>
      </div>

      {/* Why Welfare Fails */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          Why Your Welfare System Fails
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          Your species built 80+ overlapping welfare programs, each with its own
          bureaucracy, application process, and fraud investigation department.
          The result: you spend more deciding who deserves help than you spend
          helping them.
        </p>
        <div className="divide-y divide-foreground/20 border-y border-foreground/30">
          {welfareProblems.map((problem) => (
            <div
              key={problem.title}
              className="py-5"
            >
              <h3 className="text-lg font-black uppercase text-foreground">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* UBI mechanism */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          How UBI Works
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          The transaction tax accumulates in a treasury that distributes
          Universal Basic Income to every verified citizen. No means testing.
          No case workers. No applications. Just money going directly to people.
        </p>
        <StepList items={howItWorks} />
      </section>

      {/* Side-by-Side Comparison */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          80+ Programs vs 1 For-Loop
        </h2>
        <SimpleComparisonGrid
          columns={[
            {
              title: "Current System (SSA + Welfare)",
              items: comparisonData.current,
            },
            { title: "Wishes UBI", items: comparisonData.wish },
          ]}
        />
        <div className="mt-6 border-l border-foreground/30 pl-4">
          <p className="text-sm font-bold leading-relaxed text-muted-foreground">
            The $1.1 trillion your species spends administering welfare is more
            than the GDP of the Netherlands. That money doesn&apos;t feed anyone.
            It doesn&apos;t house anyone. It pays for the privilege of deciding
            which poor people are poor enough to deserve help. UBI eliminates
            that entire question.
          </p>
        </div>
      </section>
    </WishoniaAgencyPage>
  );
}
