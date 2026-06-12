import Link from "next/link";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { SimpleComparisonGrid } from "@/components/ui/simple-comparison";
import { StepList } from "@/components/ui/step-list";
import { AGENCIES } from "@optimitron/data/datasets/wishonia-agencies";
import { dirsLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(dirsLink);

const agency = AGENCIES.dirs;

const howItWorks = [
  {
    step: "01",
    title: "You spend wishes",
    description:
      "You buy things. You pay people. You live your life. The currency does the rest. On your planet, this step requires a tax attorney.",
  },
  {
    step: "02",
    title: "0.5% is deducted automatically",
    description:
      "Every transfer runs through _update(). The tax is computed, split off, and sent to the treasury. No filing. No form. No accountant.",
  },
  {
    step: "03",
    title: "The rest arrives at the recipient",
    description:
      "99.5% goes where you wanted it. The 0.5% funds the things you voted for in Wishocracy. Education, healthcare, infrastructure — whatever 8 billion people chose, not whatever 535 people's donors suggested.",
  },
  {
    step: "04",
    title: "No evasion possible",
    description:
      "The tax is protocol-level. There are no offshore accounts, no shell companies, no loopholes. If money moves, the tax happens. That's it.",
  },
];

const comparisonData = {
  current: [
    { label: "Tax code length", value: "74,000 pages" },
    { label: "IRS employees", value: "83,000" },
    { label: "Annual IRS budget", value: "$12.3 billion" },
    { label: "Annual compliance cost", value: "$200+ billion" },
    { label: "Filing time (total)", value: "6.1 billion hours/yr" },
    { label: "Evasion rate", value: "~15% ($600B+ gap)" },
  ],
  wish: [
    { label: "Tax code length", value: "6 protocol rules" },
    { label: "Employees needed", value: "0" },
    { label: "Annual operating cost", value: "$0" },
    { label: "Compliance cost", value: "$0" },
    { label: "Filing time", value: "0 seconds" },
    { label: "Evasion rate", value: "0% (protocol-enforced)" },
  ],
};

export default function DTreasuryDirsPage() {
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

      {/* Transaction tax mechanism */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          How the Transaction Tax Works
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          Every wishes transaction has a 0.5% fee baked into the currency.
          You spend money. The tax happens. Nobody files anything. Nobody audits
          anything. 74,000 pages of tax code, 83,000 IRS employees, and
          6.1 billion hours of annual filing time — all replaced by six lines of
          code that a competent intern could read in four minutes.
        </p>
        <StepList items={howItWorks} />
      </section>

      {/* Side-by-Side Comparison */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          IRS vs 6 Protocol Rules
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          The entire IRS budget is $12.3 billion per year. A 0.5% automated
          transaction tax on a currency with sufficient volume generates the
          same revenue with zero administrative overhead. The math is not
          complicated. The politics, apparently, is.
        </p>
        <SimpleComparisonGrid
          columns={[
            { title: "Current System (IRS)", items: comparisonData.current },
            { title: "Wishes Transaction Tax", items: comparisonData.wish },
          ]}
        />
        <div className="mt-6 border-l border-foreground/30 pl-4">
          <p className="text-sm font-bold leading-relaxed text-muted-foreground">
            Americans spend 6.1 billion hours per year on tax compliance. That&apos;s
            roughly 3 million full-time jobs worth of human effort — filling out
            forms, gathering receipts, hiring accountants — to accomplish what
            six lines of code do automatically and without error.
          </p>
        </div>
      </section>
    </WishoniaAgencyPage>
  );
}
