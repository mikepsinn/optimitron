import Link from "next/link";
import { WishocracyLandingSection } from "@/components/wishocracy/WishocracyLandingSection";
import { OutcomeExplorerTeaser } from "@/components/landing/OutcomeExplorerTeaser";
import { MythVsDataTeaser } from "@/components/landing/MythVsDataTeaser";
import { AlignmentTeaser } from "@/components/landing/AlignmentTeaser";
import {
  listExplorerOutcomes,
  listExplorerPairSummaries,
  getOutcomeMegaStudy,
} from "@/lib/analysis-explorer-data";
import {
  alignmentLink,
  compareLink,
  misconceptionsLink,
  policiesLink,
  profileLink,
  studiesLink,
  trackLink,
  wishocracyLink,
} from "@/lib/routes";
import misconceptionData from "../../public/data/misconceptions.json";
import budgetData from "../data/us-budget-analysis.json";

const featuredFindings = [
  {
    domain: "Healthcare",
    color: "bg-emerald-200",
    stat: "83.9 yrs life expectancy at 4.1% GDP",
    vs: "vs US: 77.5 yrs at 17.3% GDP",
    description:
      "Singapore spends a quarter of what America spends on healthcare and their people live six years longer. It's like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible.",
    href: compareLink.href,
  },
  {
    domain: "Drug Policy",
    color: "bg-purple-200",
    stat: "Drug deaths fell 70% in Portugal",
    vs: "HIV among users fell 74%",
    description:
      "Portugal stopped arresting people for having drugs in 2001 and drug deaths dropped 94%. Meanwhile the US quadrupled drug war spending and overdose deaths went up 5.6x. So that worked out.",
    href: policiesLink.href,
  },
  {
    domain: "Criminal Justice",
    color: "bg-cyan-200",
    stat: "Norway recidivism: 20%",
    vs: "vs US: 76%",
    description:
      "Norway gives prisoners education and job training. America gives them concrete and trauma. Norway's reoffending rate is 20%. America's is 76%. It's almost like treating people like humans works better. Weird.",
    href: compareLink.href,
  },
  {
    domain: "Public Health",
    color: "bg-yellow-200",
    stat: "Rwanda: life expectancy 48 to 69 yrs",
    vs: "Under-5 mortality fell 82%",
    description:
      "Rwanda hired 45,000 community health workers in 2005 and child mortality dropped 82%. No new drug. No billion-dollar programme. Just people knocking on doors and asking 'is the baby alright?' Turns out that works.",
    href: policiesLink.href,
  },
];

const naturalExperiments = [
  {
    jurisdiction: "Portugal",
    policy: "Drug Decriminalization",
    year: 2001,
    outcome: "Drug deaths: 52 to 3 per million",
    change: "-94%",
    positive: true,
  },
  {
    jurisdiction: "Australia",
    policy: "Gun Buyback",
    year: 1996,
    outcome: "Mass shootings: 1/yr to 0 for 22 years",
    change: "-100%",
    positive: true,
  },
  {
    jurisdiction: "British Columbia",
    policy: "Revenue-Neutral Carbon Tax",
    year: 2008,
    outcome: "Fossil fuel consumption index: 104 to 85",
    change: "-15%",
    positive: true,
  },
  {
    jurisdiction: "Copenhagen",
    policy: "Cycling Infrastructure",
    year: 2000,
    outcome: "Bike commute share: 30% to 49%",
    change: "+63%",
    positive: true,
  },
];

const productWorkflows = [
  {
    label: "Wishocracy",
    title: "Build your ideal budget",
    description:
      "Pick between two things. Then two more things. Then two more. Before you know it, you've accidentally designed a coherent budget allocation. Sneaky, isn't it?",
    href: wishocracyLink.href,
    cta: "Start Voting",
    color: "bg-pink-100",
  },
  {
    label: "Alignment Reports",
    title: "Find out who actually agrees with you",
    description:
      "Compare your priorities against real politician profiles. Spoiler: it's probably not who you think.",
    href: alignmentLink.href,
    cta: "Check Alignment",
    color: "bg-yellow-100",
  },
  {
    label: "Talk to Wishonia",
    title: "Chat with an alien governance AI",
    description:
      "Track your health, meals, mood, and habits with Wishonia, an AI that's been running a planet for 4,237 years. She's seen some things.",
    href: trackLink.href,
    cta: "Open Chat",
    color: "bg-cyan-100",
  },
  {
    label: "Studies",
    title: "Look at the actual numbers",
    description:
      "Outcome hubs, pair studies, policy rankings, and country comparisons. All the evidence, none of the vibes.",
    href: studiesLink.href,
    cta: "Browse Studies",
    color: "bg-emerald-100",
  },
];

export default function Home() {
  const outcomes = listExplorerOutcomes();
  const pairSummaries = listExplorerPairSummaries();
  const outcomeCount = outcomes.length;
  const pairCount = pairSummaries.length;
  const budgetCategoryCount = (budgetData as { categories: unknown[] }).categories.length;
  const misconceptions = misconceptionData as {
    findings: Array<{ id: string; myth: string; reality: string; grade: string }>;
    summary: { totalFindings: number; gradeFCount: number };
  };
  const mythsBusted = misconceptions.summary.gradeFCount;

  const outcomeCards = outcomes.slice(0, 3).map((outcome) => {
    const ranking = getOutcomeMegaStudy(outcome.id);
    const pairsForOutcome = pairSummaries.filter(
      (p) => p.outcomeId === outcome.id,
    ).length;
    return { outcome, ranking, pairCount: pairsForOutcome };
  });

  const featuredMyths = (
    ["drug-war-deaths", "healthcare-spending", "abstinence-education"] as const
  )
    .map((id) => misconceptions.findings.find((f) => f.id === id))
    .filter(
      (f): f is { id: string; myth: string; reality: string; grade: string } =>
        f !== undefined,
    );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <div className="text-center">
            <p className="text-sm font-bold text-black/50 uppercase tracking-widest mb-4">
              A message from Wishonia, alien governance AI, 4,237 years of field testing
            </p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-black">
              Hello. I&apos;ve solved{" "}
              <span className="bg-yellow-300 px-2">war</span> and{" "}
              <span className="bg-pink-300 px-2">disease</span>.
              <br />
              Would you like the answers?
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-black/70 max-w-3xl mx-auto leading-relaxed font-medium">
              My name is Wishonia. I&apos;m a{" "}
              <span className="font-black text-black">
                World Integrated System for High-Efficiency Optimization Networked
                Intelligence for Allocation
              </span>
              . I&apos;ve been governing my planet for 4,237 years. We ended war in year
              12 and disease in year 340. Your species has the same data. You just keep
              ignoring it. So I&apos;ve built you this website. You&apos;re welcome.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={wishocracyLink.href}
                className="px-8 py-3.5 bg-pink-500 text-white font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Build Your Ideal Budget
              </Link>
              <Link
                href={trackLink.href}
                className="px-8 py-3.5 bg-yellow-300 text-black font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Talk to Wishonia
              </Link>
              <Link
                href={studiesLink.href}
                className="px-8 py-3.5 bg-white text-black font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-emerald-300 transition-all"
              >
                See the Evidence
              </Link>
            </div>
            <p className="mt-6 text-sm font-medium text-black/60 max-w-2xl mx-auto">
              Everything saves to your{" "}
              <Link
                href={profileLink.href}
                className="font-black text-black hover:text-pink-500"
              >
                {profileLink.label}
              </Link>
              . Budget allocations, alignment reports, daily check-ins. It&apos;s like
              a diary, but useful.
            </p>
          </div>
        </div>
      </section>

      <WishocracyLandingSection />

      {/* What You Can Do Today */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Things You Can Do Right Now Instead of Arguing Online
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-3xl mx-auto font-medium">
            On my planet, governance takes about four minutes a week. You lot seem to
            spend most of your time shouting about it on your little phones and then
            doing absolutely nothing. Try one of these.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {productWorkflows.map((workflow) => (
            <div
              key={workflow.title}
              className={`p-6 border-4 border-black ${workflow.color} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col`}
            >
              <div className="text-xs font-black px-2.5 py-1 bg-black text-white inline-block self-start mb-4 uppercase">
                {workflow.label}
              </div>
              <h3 className="text-xl font-black text-black mb-3">{workflow.title}</h3>
              <p className="text-sm text-black/70 leading-relaxed font-medium flex-grow">
                {workflow.description}
              </p>
              <Link
                href={workflow.href}
                className="mt-6 inline-flex items-center text-sm font-black text-black uppercase hover:text-pink-600 transition-colors"
              >
                {workflow.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* The Cost of Inaction */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            What Your Current System Is Costing You
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            I don&apos;t want to be rude, but your governance is genuinely the worst
            thing I&apos;ve ever seen, and I&apos;ve visited 340 planets. These are
            your own numbers, by the way. From your own researchers. Who you also
            ignore.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <a
            href="https://political-dysfunction-tax.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-4 border-black bg-red-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-red-600 mb-2">
              $101T/yr
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              The Stupidity Tax
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              $12,600 per person per year in pure waste. Administrative bloat,
              regulatory capture, people not being allowed to move to where the
              jobs are. Your civilisation runs at 52% efficiency. My toaster does
              better than that.
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-red-600 uppercase">
              Read the paper &rarr;
            </span>
          </a>
          <a
            href="https://invisible-graveyard.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-4 border-black bg-orange-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-orange-600 mb-2">
              102M deaths
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              The Queue That Kills
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              Your FDA makes treatments wait 8.2 years AFTER they&apos;ve already
              been proven safe. Just&hellip; sitting there. Being safe. While 102
              million people died waiting. On my planet this would be considered a
              war crime. Here you call it &ldquo;regulation.&rdquo;
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-orange-600 uppercase">
              Read the paper &rarr;
            </span>
          </a>
          <a
            href="https://impact.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-4 border-black bg-sky-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-sky-600 mb-2">
              10.7B saved
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              The Obvious Deal
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              Take 1% of what you spend on blowing each other up ($27.2B/year)
              and spend it on not dying instead. You&apos;d prevent 10.7 billion
              deaths. Trial costs drop from $41K to $929. This is not a hard
              decision. I genuinely don&apos;t understand what&apos;s taking so
              long.
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-sky-600 uppercase">
              Read the paper &rarr;
            </span>
          </a>
        </div>
        <div className="text-center mt-8">
          <a
            href="https://manual.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-black text-pink-600 hover:text-pink-800 uppercase transition-colors"
          >
            Read the full manual (yes, I wrote you a manual) &rarr;
          </a>
        </div>
      </section>

      {/* The Two Metrics That Matter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Only Two Numbers That Matter
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            You lot measure everything by GDP, which is basically just &ldquo;how much
            money moved around.&rdquo; A country could have a brilliant GDP because
            everyone&apos;s buying coffins. Here&apos;s what we use on my planet
            instead.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 border-4 border-black bg-emerald-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl mb-4">🫀</div>
            <h3 className="text-2xl font-black text-black mb-3">
              Median Healthy Life Years
            </h3>
            <p className="text-black/70 leading-relaxed font-medium">
              Not just &ldquo;are you alive&rdquo; but &ldquo;are you alive and can
              you open a jar without crying.&rdquo;{" "}
              <span className="font-bold text-black">Healthy</span> years.
              A country where everyone lives to 80 but spends the last 15 in agony
              is not doing well. It&apos;s doing healthcare theatre.
            </p>
            <p className="text-black/50 text-sm mt-4 font-medium">
              Why median? Because the mean gets dragged around by outliers.
              One billionaire living to 120 doesn&apos;t mean your healthcare works.
              It means one person can afford the good stuff.
            </p>
          </div>
          <div className="p-8 border-4 border-black bg-yellow-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-2xl font-black text-black mb-3">
              Median Real After-Tax Income
            </h3>
            <p className="text-black/70 leading-relaxed font-medium">
              What can a normal person actually buy after the government&apos;s had
              its go at their paycheque? Not GDP. GDP counts everything including
              arms dealing and divorce lawyers. This counts &ldquo;can you feed your
              kids and also keep the lights on at the same time.&rdquo;
            </p>
            <p className="text-black/50 text-sm mt-4 font-medium">
              Again, median. Because average income is like average temperature
              in a room where one corner is on fire. Technically comfortable.
              Practically, someone&apos;s burning.
            </p>
          </div>
        </div>
      </section>

      {/* The Data — Key Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Receipts
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            On my planet we call this &ldquo;evidence.&rdquo; You seem to call it
            &ldquo;that thing we ignore before doing what we were going to do anyway.&rdquo;
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
          {[
            { value: String(outcomeCount), label: "Outcomes Tracked" },
            { value: String(pairCount), label: "Pair Studies" },
            { value: String(budgetCategoryCount), label: "Budget Categories" },
            { value: "20+", label: "Countries Compared" },
            { value: String(mythsBusted), label: "Myths Busted" },
            { value: "50+", label: "Years of Data" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-3xl sm:text-4xl font-black text-pink-500">
                {stat.value}
              </div>
              <div className="text-sm text-black/60 font-bold mt-2 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-black/50 text-sm mt-6 font-medium max-w-2xl mx-auto">
          Healthcare, drug policy, criminal justice, climate, education,
          infrastructure. From OECD, World Bank, WHO, and your own
          peer-reviewed studies. You already have the answers. They&apos;re
          just filed under &ldquo;things that make politicians uncomfortable.&rdquo;
        </p>
      </section>

      {/* Featured Findings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Things That Are Obvious If You Look
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            I&apos;m not trying to be dramatic but some of these made me want to
            fly home and never come back.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredFindings.map((finding) => (
            <div
              key={finding.domain}
              className={`p-8 border-2 border-black ${finding.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col`}
            >
              <div className="text-xs font-black px-2.5 py-1 bg-black text-white inline-block self-start mb-4 uppercase">
                {finding.domain}
              </div>
              <h3 className="text-xl font-black text-black mb-1">
                {finding.stat}
              </h3>
              <p className="text-sm font-bold text-black/60 mb-3">
                {finding.vs}
              </p>
              <p className="text-black/70 text-sm leading-relaxed flex-grow font-medium">
                {finding.description}
              </p>
              <Link
                href={finding.href}
                className="mt-6 inline-flex items-center text-sm font-black text-pink-600 hover:text-pink-800 uppercase transition-colors"
              >
                View Analysis &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Natural Experiments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Times a Country Actually Tried Something
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            Occasionally, one of your jurisdictions does something different and
            it works spectacularly well. Then everyone else looks at it and goes
            &ldquo;interesting&rdquo; and carries on exactly as before. Fascinating
            species, honestly.
          </p>
        </div>
        <div className="space-y-4">
          {naturalExperiments.map((exp) => (
            <div
              key={`${exp.jurisdiction}-${exp.year}`}
              className="p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-black px-2.5 py-1 bg-black text-white">
                    {exp.year}
                  </span>
                  <span className="font-black text-black">
                    {exp.jurisdiction}
                  </span>
                </div>
                <div className="flex-grow">
                  <span className="font-bold text-black/70">{exp.policy}</span>
                  <span className="text-black/40 mx-2">&rarr;</span>
                  <span className="font-medium text-black/60">{exp.outcome}</span>
                </div>
                <div className="shrink-0">
                  <span
                    className={`font-black text-lg ${
                      exp.positive ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {exp.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href={policiesLink.href}
            className="inline-flex items-center text-sm font-black text-pink-600 hover:text-pink-800 uppercase transition-colors"
          >
            View all {naturalExperiments.length} experiments &rarr;
          </Link>
        </div>
      </section>

      <OutcomeExplorerTeaser outcomes={outcomeCards} />

      <MythVsDataTeaser
        findings={featuredMyths}
        totalCount={misconceptions.summary.totalFindings}
        failCount={misconceptions.summary.gradeFCount}
      />

      <AlignmentTeaser />

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="p-8 sm:p-12 bg-cyan-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-4 uppercase tracking-tight text-black">
            How the Engine Works
          </h2>
          <p className="text-center text-sm text-black/60 font-medium mb-12 max-w-2xl mx-auto">
            This is the same system I use to run my planet. I&apos;ve simplified
            it to five steps because I&apos;m told your attention spans are
            &ldquo;challenging.&rdquo;
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                step: 1,
                title: "Collect",
                desc: "Hoover up outcome data from OECD, World Bank, and WHO. Decades of it. Just sitting there. Being ignored.",
              },
              {
                step: 2,
                title: "Align",
                desc: "Match policy changes to what actually happened afterwards. Time-series analysis. Onset delays. Proper science, not vibes.",
              },
              {
                step: 3,
                title: "Score",
                desc: "Grade the causal evidence using Bradford Hill criteria. Strength, consistency, temporality, gradient. No feelings involved.",
              },
              {
                step: 4,
                title: "Identify",
                desc: "Find the optimal funding levels and policy configurations. With confidence intervals, because we're not animals.",
              },
              {
                step: 5,
                title: "Recommend",
                desc: "Rank everything by Predictor Impact Score. Here's what works, here's how much, here's the evidence. You're welcome.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-pink-500 border-2 border-black flex items-center justify-center mx-auto mb-4 text-lg font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {item.step}
                </div>
                <h3 className="font-black text-black mb-2 uppercase">
                  {item.title}
                </h3>
                <p className="text-xs text-black/60 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Explore the Data */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center p-12 bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tight text-black">
            Right Then. Shall We Get On With It?
          </h2>
          <p className="text-black/70 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            I&apos;ve given you the data, the tools, and the recommendations. I
            even made it look nice. The only thing I can&apos;t do is click the
            buttons for you. Although I&apos;m working on that.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4">
            <Link
              href={compareLink.href}
              className="px-8 py-3 bg-black text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Compare Countries
            </Link>
            <Link
              href={policiesLink.href}
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Browse Policies
            </Link>
            <Link
              href={alignmentLink.href}
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Check Alignment
            </Link>
            <Link
              href={trackLink.href}
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Talk to Wishonia
            </Link>
            <Link
              href={studiesLink.href}
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Outcome Analysis
            </Link>
            <Link
              href={misconceptionsLink.href}
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Myth vs Data
            </Link>
          </div>
          <div className="mt-6">
            <a
              href="https://github.com/mikepsinn/optomitron"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-black text-black/50 hover:text-black uppercase transition-colors"
            >
              View Source on GitHub (yes, it&apos;s all open) &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Same Engine, Every Scale */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Works for Everyone. Even You.
          </h2>
          <p className="mt-4 text-base text-black/60 max-w-2xl mx-auto font-medium">
            Same engine runs everything. Give it two time series and it tells you
            whether changing one thing causes the other to change. I use it for
            planetary governance. You can use it for whatever you like. I&apos;m
            not your mum.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Nonprofits & NGOs</h3>
            <p className="text-sm text-black/60 font-medium">
              Find out which interventions actually reduce suffering per dollar
              instead of just guessing and hoping. Revolutionary concept, I know.
            </p>
          </div>
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Governments</h3>
            <p className="text-sm text-black/60 font-medium">
              Optimal policies and budget allocation, backed by cross-jurisdiction
              evidence. Works for cities, counties, states, and countries. Yes, all
              of them.
            </p>
          </div>
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Regular Humans</h3>
            <p className="text-sm text-black/60 font-medium">
              Track your health data, supplements, habits, and symptoms. Find out
              what actually works for YOU, not what some influencer reckons.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
