import Link from "next/link";
import { TreasuryDashboard } from "@/app/treasury/TreasuryDashboard";
import { GameCTA } from "@/components/ui/game-cta";
import { StepList } from "@/components/ui/step-list";
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
  },
  {
    value: "83,000",
    label: "IRS Employees",
    detail:
      "Eighty-three thousand people whose entire job is interpreting a 74,000-page tax code that no single human understands. You built a system so complicated that you need a small city of people just to run it. Impressive, in a way.",
  },
  {
    value: "0 data",
    label: "Budget Allocation",
    detail:
      "Politicians allocate trillions of dollars in public spending with zero systematic data on what citizens actually want. They use polls, focus groups, and whatever their largest donors suggest. On my planet, this is called 'guessing.'",
  },
];

const subPages = [
  {
    ...dirsLink,
    title: "Transaction Tax (Replaces the IRS)",
    description:
      "0.5% of every transaction. That's the whole tax code. Six protocol rules replacing 74,000 pages of rules that no single human on your planet understands. Your accountants can finally do something useful. Like not dying.",
  },
  {
    ...federalReserveLink,
    title: "Algorithmic Monetary Policy (Replaces the Fed)",
    description:
      "Fixed supply. Zero inflation. No room of 12 unelected humans holding a séance over interest rates. Your Federal Reserve has devalued your dollar 96% since 1913. A rock would have done better. Literally. A rock holds its value.",
  },
  {
    ...dssaLink,
    title: "Universal Basic Income (Replaces Welfare)",
    description:
      "Money goes in. Money goes out. To everyone. Equally. Personhood verification keeps one human from registering as three. No means testing. No case workers. No 45-day processing time to prove you're poor enough to eat.",
  },
];

const connectionSteps = [
  {
    step: "01",
    title: "You spend wishes",
    description:
      "Buy things, pay people, transact normally. 0.5% of every transaction automatically goes to the treasury. No filing. No tax return. No accountant.",
  },
  {
    step: "02",
    title: "Treasury splits funds",
    description:
      "The treasury automatically divides incoming revenue: a UBI floor goes to every verified citizen, and the remainder funds Wishocratic public goods.",
  },
  {
    step: "03",
    title: "Citizens choose priorities",
    description:
      "Five minutes of pairwise comparison produces stable budget weights via eigenvector decomposition.",
  },
  {
    step: "04",
    title: "The budget follows the data",
    description:
      "The budget reflects what citizens actually want, updated continuously and verified mathematically.",
  },
];

export default function DTreasuryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
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
            Wishes are not an investment. They are not a security. They are money
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
        <div className="grid grid-cols-1 gap-6 border-y border-foreground/30 py-6 md:grid-cols-3">
          {problemStats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0"
            >
              <div className="text-3xl font-black text-foreground">
                {stat.value}
              </div>
              <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
                {stat.label}
              </div>
              <p className="mt-3 text-xs font-bold leading-relaxed text-muted-foreground">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What wishes are */}
      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">
          What Wishes Are
        </h2>
        <div className="mb-6 border-l border-foreground/30 pl-4">
          <p className="text-sm text-foreground font-bold leading-relaxed mb-4">
            Wishes are a programmable currency with governance built into the
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
        <div className="grid grid-cols-1 gap-4 border-y border-foreground/30 py-4 md:grid-cols-3">
          <div>
            <div className="text-xs font-black uppercase mb-1">Not this</div>
            <div className="text-sm font-black">An investment vehicle</div>
          </div>
          <div>
            <div className="text-xs font-black uppercase mb-1">Not this</div>
            <div className="text-sm font-black">A security or speculative asset</div>
          </div>
          <div>
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
        <div className="divide-y divide-foreground/20 border-y border-foreground/30">
          {subPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group block py-5"
            >
              <div>
                <h3 className="text-xl font-black uppercase text-foreground group-hover:underline">
                  {page.title}
                </h3>
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  {page.description}
                </p>
                <span
                  className="mt-3 inline-block text-xs font-black uppercase text-foreground"
                >
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
        <StepList items={connectionSteps} />
      </section>

      {/* Treasury Dashboard */}
      <section id="dashboard" className="mb-16">
        <TreasuryDashboard />
      </section>

      {/* CTA */}
      <section className="border-y border-foreground/30 py-8 text-center">
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
