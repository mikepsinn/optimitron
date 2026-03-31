import Link from "next/link";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { getWishoniaAgency } from "@optimitron/data";
import { dssaLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(dssaLink);

const agency = getWishoniaAgency("dssa")!;

const welfareProblems = [
  {
    title: "Overhead exceeds impact",
    description:
      "Your species currently spends more administering welfare than it distributes in benefits. The overhead-to-impact ratio is, and I say this with genuine bewilderment, worse than 1:1 in several programs.",
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
  },
  {
    title: "The poverty trap",
    description:
      "Means-tested benefits create a cliff: earn $1 more and lose $2,000 in benefits. Your system actively punishes people for getting less poor. On my planet, this is classified as a bug, not a feature.",
    color: "bg-brutal-yellow",
    textColor: "text-brutal-yellow-foreground",
  },
  {
    title: "The crack-falling problem",
    description:
      "Millions of people who qualify for benefits never receive them because they can't navigate the paperwork. You built a safety net with holes larger than the people it's supposed to catch.",
    color: "bg-brutal-cyan",
    textColor: "text-brutal-cyan-foreground",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Transaction tax accumulates",
    description:
      "0.5% of every $WISH transaction flows to the treasury automatically. No filing. No audits. Just protocol-level revenue collection.",
  },
  {
    step: "02",
    title: "Treasury distributes UBI",
    description:
      "Anyone can call distributeUBI(). The function divides the treasury balance equally among all verified citizens. That's the entire welfare system.",
  },
  {
    step: "03",
    title: "World ID prevents fraud",
    description:
      "Each citizen registers once with World ID — cryptographic proof of unique personhood. No duplicate claims. No identity fraud. No case workers investigating.",
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
    { label: "Fraud prevention", value: "World ID (automatic)" },
  ],
};

export default function DTreasuryDssaPage() {
  return (
    <WishoniaAgencyPage agency={agency}>
      {/* Back link */}
      <div className="mb-8">
        <Link
          href={ROUTES.dtreasury}
          className="text-sm font-black uppercase text-brutal-pink hover:underline"
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
        <div className="space-y-4">
          {welfareProblems.map((problem) => (
            <div
              key={problem.title}
              className={`border-4 border-primary ${problem.color} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              <h3 className={`text-lg font-black uppercase ${problem.textColor}`}>
                {problem.title}
              </h3>
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The $WISH UBI Mechanism */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          How $WISH UBI Works
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          The transaction tax accumulates in a treasury that distributes
          Universal Basic Income to every verified citizen. World ID prevents
          fraud. No means testing. No case workers. No applications. Just money
          going directly to people.
        </p>
        <div className="space-y-4">
          {howItWorks.map((item) => (
            <div
              key={item.step}
              className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-black uppercase text-foreground text-sm">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-bold mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Side-by-Side Comparison */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          80+ Programs vs 1 For-Loop
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="border-4 border-primary bg-brutal-pink p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.1em] text-brutal-pink-foreground">
              Current System (SSA + Welfare)
            </h3>
            <div className="space-y-3">
              {comparisonData.current.map((item) => (
                <div
                  key={item.label}
                  className="border-4 border-primary bg-background p-3"
                >
                  <div className="text-xs font-black uppercase text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-sm font-black text-foreground">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.1em] text-foreground">
              $WISH UBI
            </h3>
            <div className="space-y-3">
              {comparisonData.wish.map((item) => (
                <div
                  key={item.label}
                  className="border-4 border-primary bg-background p-3"
                >
                  <div className="text-xs font-black uppercase text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-sm font-black text-foreground">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold leading-relaxed">
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
