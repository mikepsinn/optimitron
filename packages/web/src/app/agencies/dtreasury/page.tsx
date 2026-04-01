import Link from "next/link";
import { TreasuryDashboard } from "@/app/treasury/TreasuryDashboard";
import { GameCTA } from "@/components/ui/game-cta";
import {
  dtreasuryLink,
  dirsLink,
  federalReserveLink,
  dssaLink,
  ROUTES,
} from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(dtreasuryLink);

const problemStats = [
  {
    value: "$13.5T/yr",
    label: "Global Welfare Spending",
    detail:
      "Your species spends $13.5 trillion per year on social protection programs globally. Between $400 and $675 billion of that is pure administration — case workers, applications, audits, fraud detection — all to decide who deserves to not starve. On my planet, we just... give people money.",
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
    detailColor: "text-brutal-pink-foreground",
  },
  {
    value: "83,000",
    label: "IRS Employees",
    detail:
      "Eighty-three thousand people whose entire job is interpreting a 74,000-page tax code that no single human understands. You built a system so complicated that you need a small city of people just to run it. Impressive, in a way.",
    color: "bg-brutal-yellow",
    textColor: "text-brutal-yellow-foreground",
    detailColor: "text-brutal-yellow-foreground",
  },
  {
    value: "0 data",
    label: "Budget Allocation",
    detail:
      "Politicians allocate trillions of dollars in public spending with zero systematic data on what citizens actually want. They use polls, focus groups, and whatever their largest donors suggest. On my planet, this is called 'guessing.'",
    color: "bg-brutal-cyan",
    textColor: "text-brutal-cyan-foreground",
    detailColor: "text-brutal-cyan-foreground",
  },
];

const subPages = [
  {
    ...dirsLink,
    title: "Transaction Tax (Replaces the IRS)",
    description:
      "0.5% of every transaction. That's the whole tax code. Six lines of Solidity replacing 74,000 pages of rules that no single human on your planet understands. Your accountants can finally do something useful. Like not dying.",
    color: "bg-brutal-pink",
    textColor: "text-brutal-pink-foreground",
  },
  {
    ...federalReserveLink,
    title: "Algorithmic Monetary Policy (Replaces the Fed)",
    description:
      "Fixed supply. Zero inflation. No room of 12 unelected humans holding a séance over interest rates. Your Federal Reserve has devalued your dollar 96% since 1913. A rock would have done better. Literally. A rock holds its value.",
    color: "bg-brutal-yellow",
    textColor: "text-brutal-yellow-foreground",
  },
  {
    ...dssaLink,
    title: "Universal Basic Income (Replaces Welfare)",
    description:
      "Money goes in. Money goes out. To everyone. Equally. World ID confirms you're a real human and not three bots in a trenchcoat. No means testing. No case workers. No 45-day processing time to prove you're poor enough to eat.",
    color: "bg-brutal-cyan",
    textColor: "text-brutal-cyan-foreground",
  },
];

export default function DTreasuryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            dTreasury
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
            $WISH is not an investment. It&apos;s not a security. It&apos;s money
            that does what money was supposed to do before your species turned
            it into a system that requires 83,000 bureaucrats, a 74,000-page
            manual, and still can&apos;t feed everyone.
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
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-1">Not this</div>
            <div className="text-sm font-black">An investment vehicle</div>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-1">Not this</div>
            <div className="text-sm font-black">A security or speculative asset</div>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xs font-black uppercase mb-1">This</div>
            <div className="text-sm font-black">Money with built-in governance</div>
          </div>
        </div>
      </section>

      {/* Three Mechanisms — Sub-Page Cards */}
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
        <div className="space-y-4">
          {subPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group block"
            >
              <div
                className={`border-4 border-primary ${page.color} p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`}
              >
                <h3 className={`text-xl font-black uppercase ${page.textColor}`}>
                  {page.title}
                </h3>
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  {page.description}
                </p>
                <span className="mt-3 inline-block text-xs font-black uppercase text-foreground">
                  Learn more &rarr;
                </span>
              </div>
            </Link>
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
                  Wishocratic public goods.
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
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black shrink-0">
                04
              </span>
              <div>
                <h3 className="font-black uppercase text-sm">No politicians deciding. No lobbying. Just data.</h3>
                <p className="text-sm font-bold mt-1">
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
      <section className="card bg-brutal-pink text-brutal-pink-foreground border-primary text-center">
        <h2 className="text-2xl font-black mb-3 uppercase">
          Money That Does Something
        </h2>
        <p className="mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          Your current system: earn money, get taxed, hope politicians spend it
          well, watch them not do that, repeat for 200 years. The alternative:
          money that funds public goods automatically, distributes a basic
          income universally, and lets you choose priorities directly. It&apos;s
          almost like treating people like humans works better. Weird.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href={ROUTES.wishocracy} variant="secondary">Express Your Preferences</GameCTA>
          <GameCTA href="/prize" variant="outline">Play the Game</GameCTA>
          <GameCTA href="/about" variant="outline">Learn More</GameCTA>
        </div>
      </section>
    </div>
  );
}
