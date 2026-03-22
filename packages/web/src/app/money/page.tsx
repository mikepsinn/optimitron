import type { Metadata } from "next";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { TreasuryDashboard } from "@/app/treasury/TreasuryDashboard";
import {
  wishocracyLink,
  prizeLink,
  aboutLink,
} from "@/lib/routes";

export const metadata: Metadata = {
  title: "How Money Should Work | Optimitron",
  description:
    "A programmable currency with governance built into the protocol. Transaction tax replaces the IRS. Universal Basic Income replaces welfare. Wishocratic allocation replaces politicians.",
};

const problemStats = [
  {
    value: "$1.1T/yr",
    label: "Welfare Administration",
    detail:
      "Your species spends $1.1 trillion per year administering means-tested welfare programs. Case workers, applications, audits, fraud detection — all to decide who deserves to not starve. On my planet, we just... give people money.",
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
    detailColor: "text-muted-foreground",
  },
  {
    value: "83,000",
    label: "IRS Employees",
    detail:
      "Eighty-three thousand people whose entire job is interpreting a 74,000-page tax code that no single human understands. You built a system so complicated that you need a small city of people just to run it. Impressive, in a way.",
    color: "bg-brutal-yellow",
    textColor: "text-foreground",
    detailColor: "text-muted-foreground",
  },
  {
    value: "0 data",
    label: "Budget Allocation",
    detail:
      "Politicians allocate trillions of dollars in public spending with zero systematic data on what citizens actually want. They use polls, focus groups, and whatever their largest donors suggest. On my planet, this is called 'guessing.'",
    color: "bg-brutal-cyan",
    textColor: "text-foreground",
    detailColor: "text-muted-foreground",
  },
];

const mechanisms = [
  {
    icon: "🏦",
    title: "Transaction Tax (Replaces the IRS)",
    description:
      "Every $WISH transaction has a 0.5% fee built into the token contract. Revenue collection happens automatically — no filing, no audits, no 74,000-page tax code, no 83,000 IRS employees. Just a protocol-level fee on economic activity.",
    detail:
      "The entire IRS budget is $12.3 billion per year. A 0.5% automated transaction tax on a currency with sufficient volume generates the same revenue with zero administrative overhead. The math is not complicated. The politics, apparently, is.",
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
    subTextColor: "text-background",
    detailColor: "text-muted-foreground",
  },
  {
    icon: "🍞",
    title: "Universal Basic Income (Replaces Welfare)",
    description:
      "The transaction tax accumulates in a treasury that distributes Universal Basic Income to every verified citizen. World ID prevents fraud. No means testing. No case workers. No applications. Just money going directly to people.",
    detail:
      "Your species currently spends more administering welfare than it distributes in benefits. The overhead-to-impact ratio is, and I say this with genuine bewilderment, worse than 1:1 in several programs. UBI eliminates the entire administrative layer.",
    color: "bg-brutal-cyan",
    textColor: "text-foreground",
    subTextColor: "text-foreground",
    detailColor: "text-muted-foreground",
  },
  {
    icon: "🗳️",
    title: "Wishocratic Allocation (Replaces Politicians)",
    description:
      "Citizens do pairwise comparisons on spending priorities — 'Do you care more about education or infrastructure?' Eigenvector decomposition produces stable budget weights from as few as 10 comparisons per citizen.",
    detail:
      "Instead of electing someone to guess your preferences for four years, you just... state your preferences. Directly. It takes about five minutes. The math aggregates them into a coherent budget. No lobbying required.",
    color: "bg-brutal-yellow",
    textColor: "text-foreground",
    subTextColor: "text-foreground",
    detailColor: "text-muted-foreground",
  },
];

export default function MoneyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            Monetary Reform
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            How Money Should Work
          </h1>
          <p className="text-lg text-foreground leading-relaxed font-bold">
            Your species spends more administering money than it distributes.
            You built a tax system so complicated that you need 83,000 people
            just to run it. You means-test poverty relief so aggressively that
            the bureaucracy costs more than the relief. Here&apos;s the fix.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            A programmable currency with governance built into the protocol.
            Not an investment. Not a security. A medium of exchange with
            automatic public goods funding — where you get to decide which
            ones.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          The Problem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problemStats.map((stat) => (
            <div
              key={stat.label}
              className={`border-4 border-primary ${stat.color} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className={`text-3xl font-black ${stat.textColor}`}>
                {stat.value}
              </div>
              <div className={`text-xs font-black uppercase mt-1 ${stat.textColor}`}>
                {stat.label}
              </div>
              <p className={`text-xs font-bold mt-3 leading-relaxed ${stat.detailColor}`}>
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What $WISH Actually Is */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          What $WISH Actually Is
        </h2>
        <div className="border-4 border-primary bg-background p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
          <p className="text-sm text-foreground font-bold leading-relaxed mb-4">
            $WISH is a programmable currency with governance built into the
            protocol. Every time you use it, 0.5% automatically funds public
            goods. You decide which public goods via five minutes of pairwise
            comparisons. That&apos;s it. That&apos;s the entire system.
          </p>
          <p className="text-sm text-foreground font-bold leading-relaxed mb-4">
            What if your money funded public goods every time you used it, and
            you got to decide which ones?
          </p>
          <p className="text-sm text-muted-foreground font-bold leading-relaxed">
            It is not an investment. It is not a security. It is a medium of
            exchange that happens to solve three problems your species has been
            failing at for centuries: tax collection, poverty relief, and
            democratic resource allocation.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-4 border-primary bg-brutal-cyan p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">Not this</div>
            <div className="text-sm font-black text-foreground">An investment vehicle</div>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">Not this</div>
            <div className="text-sm font-black text-foreground">A security or speculative asset</div>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase text-muted-foreground mb-1">This</div>
            <div className="text-sm font-black text-foreground">Money with built-in governance</div>
          </div>
        </div>
      </section>

      {/* Three Built-In Mechanisms */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          Three Built-In Mechanisms
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-8 max-w-3xl">
          Your species keeps building separate institutions for tax collection,
          poverty relief, and democratic allocation — then wondering why they
          don&apos;t talk to each other. These three mechanisms are built into
          the currency itself.
        </p>
        <div className="space-y-0">
          {mechanisms.map((mech, index) => (
            <div key={mech.title} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 border-4 border-primary ${mech.color} flex items-center justify-center text-2xl shrink-0`}
                >
                  {mech.icon}
                </div>
                {index < mechanisms.length - 1 && (
                  <div className="w-1 flex-1 bg-foreground" />
                )}
              </div>
              <div
                className={`flex-1 border-4 border-primary ${mech.color} p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
              >
                <h3 className={`text-xl font-black uppercase ${mech.textColor}`}>
                  {mech.title}
                </h3>
                <p className={`mt-2 text-sm font-bold ${mech.subTextColor}`}>
                  {mech.description}
                </p>
                <p className={`mt-3 text-xs font-bold ${mech.detailColor} leading-relaxed`}>
                  {mech.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How They Connect */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-6">
          How They Connect
        </h2>
        <div className="space-y-4">
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                01
              </span>
              <div>
                <h3 className="font-black uppercase text-foreground text-sm">You spend $WISH</h3>
                <p className="text-sm text-muted-foreground font-bold mt-1">
                  Buy things, pay people, transact normally. 0.5% of every
                  transaction automatically goes to the treasury. No filing. No
                  tax return. No accountant.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                02
              </span>
              <div>
                <h3 className="font-black uppercase text-foreground text-sm">Treasury splits funds</h3>
                <p className="text-sm text-muted-foreground font-bold mt-1">
                  The treasury automatically divides incoming revenue: a UBI
                  floor goes to every verified citizen, and the remainder funds
                  wishocratic public goods.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                03
              </span>
              <div>
                <h3 className="font-black uppercase text-foreground text-sm">Citizens choose priorities</h3>
                <p className="text-sm text-muted-foreground font-bold mt-1">
                  Five minutes of pairwise comparison — &ldquo;education or
                  infrastructure?&rdquo; &ldquo;healthcare or defence?&rdquo;
                  — produces stable budget weights via eigenvector decomposition.
                </p>
              </div>
            </div>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                04
              </span>
              <div>
                <h3 className="font-black uppercase text-foreground text-sm">No politicians deciding. No lobbying. Just data.</h3>
                <p className="text-sm text-foreground font-bold mt-1">
                  The budget reflects what citizens actually want, updated
                  continuously, verified mathematically. On my planet, this
                  process takes about four minutes a week. You lot seem to spend
                  most of your time shouting about it on your little phones and
                  then doing absolutely nothing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Isn't a "Crypto Thing" */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          Why This Isn&apos;t a &ldquo;Crypto Thing&rdquo;
        </h2>
        <p className="text-sm font-bold text-muted-foreground mb-6 max-w-3xl">
          I understand the scepticism. Your species has produced approximately
          14,000 tokens whose primary innovation was having a picture of a dog
          on them. This is not that.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-3 text-sm">
              The token is an implementation detail
            </h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              A programmable currency is the only way to make tax collection
              automatic and treasury governance decentralised. The blockchain
              is infrastructure, not ideology. You don&apos;t get excited about
              TCP/IP either, and that&apos;s fine.
            </p>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-3 text-sm">
              No ICO. No presale hype.
            </h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              Value comes from adoption as a medium of exchange, not from
              speculation. If nobody uses it to buy things, it&apos;s worthless
              — exactly like every other currency. The difference is that this
              one funds public goods automatically.
            </p>
          </div>
          <div className="border-4 border-primary bg-background p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black uppercase text-foreground mb-3 text-sm">
              Fixed supply. Zero inflation.
            </h3>
            <p className="text-sm text-muted-foreground font-bold leading-relaxed">
              $WISH has a fixed supply set once at deployment. No minting. No
              central bank. No algorithm deciding how much to print. Your
              central banks created $13 trillion since 2020. $WISH creates
              exactly zero, ever. Productivity gains manifest as gentle
              deflation — same money, more goods, everyone&apos;s purchasing
              power rises.
            </p>
          </div>
        </div>
      </section>

      {/* Treasury Dashboard */}
      <section id="dashboard" className="mb-16">
        <TreasuryDashboard />
      </section>

      {/* CTA */}
      <section className="card bg-brutal-pink border-primary text-center">
        <h2 className="text-2xl font-black text-brutal-pink-foreground mb-3 uppercase">
          Money That Does Something
        </h2>
        <p className="text-background mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          Your current system: earn money, get taxed, hope politicians spend it
          well, watch them not do that, repeat for 200 years. The alternative:
          money that funds public goods automatically, distributes a basic
          income universally, and lets you choose priorities directly. It&apos;s
          almost like treating people like humans works better. Weird.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-foreground px-6 py-3 text-sm font-black text-background uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Express Your Preferences
          </NavItemLink>
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-background px-6 py-3 text-sm font-black text-foreground uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Play the Game
          </NavItemLink>
          <NavItemLink
            item={aboutLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-background px-6 py-3 text-sm font-black text-foreground uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Learn More
          </NavItemLink>
        </div>
      </section>
    </div>
  );
}
