import Link from "next/link";
import { WishoniaAgencyPage } from "@/components/wishonia-agency/WishoniaAgencyPage";
import { getWishoniaAgency } from "@optimitron/data";
import { dirsLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(dirsLink);

const agency = getWishoniaAgency("dirs")!;

const howItWorks = [
  {
    step: "01",
    title: "You spend $WISH",
    description:
      "Buy things, pay people, transact normally. The token contract is your currency.",
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
      "99.5% of your transaction goes exactly where you intended. The 0.5% funds public goods — education, healthcare, infrastructure — allocated by citizen preferences.",
  },
  {
    step: "04",
    title: "No evasion possible",
    description:
      "The tax is protocol-level. There are no offshore accounts, no shell companies, no loopholes. If the token moves, the tax happens. That's it.",
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
    { label: "Tax code length", value: "6 lines of Solidity" },
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
          className="text-sm font-black uppercase text-brutal-pink hover:underline"
        >
          &larr; Back to dTreasury
        </Link>
      </div>

      {/* The $WISH Mechanism */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-foreground">
          How the Transaction Tax Works
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          Every $WISH transaction has a 0.5% fee built into the token contract.
          Revenue collection happens automatically — no filing, no audits, no
          74,000-page tax code, no 83,000 IRS employees. Just a protocol-level
          fee on economic activity.
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
          IRS vs 6 Lines of Solidity
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-bold text-muted-foreground">
          The entire IRS budget is $12.3 billion per year. A 0.5% automated
          transaction tax on a currency with sufficient volume generates the
          same revenue with zero administrative overhead. The math is not
          complicated. The politics, apparently, is.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.1em]">
              Current System (IRS)
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
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.1em]">
              $WISH Transaction Tax
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
