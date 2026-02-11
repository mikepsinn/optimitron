const papers = [
  {
    title: "dFDA Specification",
    desc: "PIS, temporal alignment, Bradford Hill, effect sizes",
    pkg: "@optomitron/optimizer",
    href: "https://dfda-spec.warondisease.org",
  },
  {
    title: "Wishocracy",
    desc: "RAPPA, eigenvector weights, Citizen Alignment Scores",
    pkg: "@optomitron/wishocracy",
    href: "https://wishocracy.warondisease.org",
  },
  {
    title: "Optimal Policy Generator",
    desc: "Policy Impact Score, Causal Confidence Score, method weights",
    pkg: "@optomitron/opg",
    href: "https://opg.warondisease.org",
  },
  {
    title: "Optimal Budget Generator",
    desc: "Diminishing returns, Optimal Spending Level, Budget Impact Score",
    pkg: "@optomitron/obg",
    href: "https://obg.warondisease.org",
  },
  {
    title: "Incentive Alignment Bonds",
    desc: "IAB mechanism, smart contract campaign funding",
    pkg: "@optomitron/treasury",
    href: "https://iab.warondisease.org",
  },
  {
    title: "Optimocracy",
    desc: "Two-metric welfare function (shared by OPG + OBG)",
    pkg: "Shared",
    href: "https://optimocracy.warondisease.org",
  },
];

const packages = [
  { name: "@optomitron/optimizer", desc: "Domain-agnostic causal inference engine", status: "🟡 Alpha" },
  { name: "@optomitron/wishocracy", desc: "RAPPA preference aggregation", status: "🟡 Alpha" },
  { name: "@optomitron/opg", desc: "Optimal Policy Generator", status: "🟡 Alpha" },
  { name: "@optomitron/obg", desc: "Optimal Budget Generator", status: "🟡 Alpha" },
  { name: "@optomitron/data", desc: "Data fetchers & loaders (OECD, World Bank, etc.)", status: "🟡 Alpha" },
  { name: "@optomitron/web", desc: "This website", status: "🟢 Active" },
  { name: "@optomitron/extension", desc: "Chrome extension for personal health", status: "⚪ Planned" },
  { name: "@optomitron/chat-ui", desc: "Conversational chat UI", status: "⚪ Planned" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Mission */}
      <section className="mb-16">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black mb-6">
          What is Optomitron?
        </h1>
        <div className="max-w-none space-y-4">
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            <strong className="text-black font-black">Optomitron identifies which policies, budgets, and interventions actually minimize
            suffering, eradicate preventable disease, and extend healthy lives</strong> — using time series data
            and causal inference across 20+ countries.
          </p>
          <p className="text-black/60 font-medium">
            Governments allocate trillions every year, but rarely know what works. We apply causal analysis
            to real-world policy outcomes — comparing jurisdictions, tracking natural experiments, and
            scoring interventions by their actual impact on human welfare.
          </p>
          <p className="text-black/60 font-medium">
            At its core, Optomitron provides a universal causal inference engine that takes any two time series and answers:
            <em> Does changing X cause Y to change? By how much? What&apos;s the optimal value of X?</em>
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="mb-16">
        <h2 className="section-title">The Problem</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-3xl mb-3">💀</div>
            <h3 className="text-black font-black mb-2">Preventable deaths</h3>
            <p className="text-sm text-black/60 font-medium">
              Millions die every year from diseases and conditions we know how to prevent or treat.
              Resources aren&apos;t allocated to what works — they&apos;re allocated to what&apos;s politically convenient.
            </p>
          </div>
          <div className="card">
            <div className="text-3xl mb-3">🏛️</div>
            <h3 className="text-black font-black mb-2">Policy by anecdote</h3>
            <p className="text-sm text-black/60 font-medium">
              Governments allocate trillions based on ideology and negotiation, not evidence of what
              actually improves outcomes. Nobody systematically measures what works.
            </p>
          </div>
          <div className="card">
            <div className="text-3xl mb-3">🔇</div>
            <h3 className="text-black font-black mb-2">No feedback loop</h3>
            <p className="text-sm text-black/60 font-medium">
              When a policy works in one jurisdiction, there&apos;s no systematic way to identify it and
              replicate it elsewhere. Successes go unnoticed; failures get repeated.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="section-title">Architecture</h2>
        <div className="card font-mono text-sm text-black/60 overflow-x-auto bg-cyan-100">
          <pre>{`
 ┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
 │  COLLECT     │     │  INFER           │     │  RECOMMEND       │
 │              │     │                  │     │                  │
 │  Health data │────▶│  Temporal        │────▶│  Personal optimal│
 │  Preferences │     │  alignment       │     │  values & doses  │
 │  Outcomes    │     │  Bradford Hill   │     │  Policy rankings │
 │  Spending    │     │  Effect sizes    │     │  Budget levels   │
 │  Policies    │     │  PIS scoring     │     │  Alignment scores│
 └─────────────┘     └──────────────────┘     └──────────────────┘`}
          </pre>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { n: "1", t: "Collect", d: "Import time series data from any source" },
            { n: "2", t: "Align", d: "Pair predictors and outcomes with onset delays" },
            { n: "3", t: "Score", d: "Apply 9 Bradford Hill causation criteria" },
            { n: "4", t: "Optimize", d: "Find optimal predictor values with CIs" },
            { n: "5", t: "Recommend", d: "Generate actionable, graded recommendations" },
          ].map((s) => (
            <div key={s.n} className="card text-center py-4">
              <div className="text-pink-500 font-black text-lg">{s.n}</div>
              <div className="text-black font-black text-sm uppercase">{s.t}</div>
              <div className="text-xs text-black/50 mt-1 font-medium">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Papers */}
      <section className="mb-16">
        <h2 className="section-title">📄 Papers</h2>
        <p className="text-sm text-black/60 mb-6 font-medium">
          Every algorithm in this codebase is defined in a published paper with exact formulas,
          worked examples, and parameter justifications.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {papers.map((p) => (
            <a
              key={p.href}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h3 className="text-black font-black group-hover:text-pink-500 transition-colors">
                {p.title}
              </h3>
              <p className="text-xs text-black/40 mt-1 font-bold">{p.pkg}</p>
              <p className="text-sm text-black/60 mt-2 font-medium">{p.desc}</p>
              <span className="text-xs text-pink-500 mt-2 inline-block font-black uppercase">Read paper →</span>
            </a>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="mb-16">
        <h2 className="section-title">📦 Packages</h2>
        <div className="overflow-x-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-yellow-300">
                <th className="text-left py-3 px-2 text-black font-black uppercase">Package</th>
                <th className="text-left py-3 px-2 text-black font-black uppercase">Description</th>
                <th className="text-center py-3 px-2 text-black font-black uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.name} className="border-b border-black">
                  <td className="py-2 px-2 font-mono text-xs text-pink-600 font-bold">{p.name}</td>
                  <td className="py-2 px-2 text-black/70 font-medium">{p.desc}</td>
                  <td className="py-2 px-2 text-center text-xs font-bold">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Coming soon */}
      <section className="mb-16">
        <div className="card border-pink-500 text-center bg-pink-50">
          <div className="text-4xl mb-4">🔮</div>
          <h3 className="text-xl font-black text-black mb-2 uppercase">Coming Soon</h3>
          <p className="text-black/60 mb-4 font-medium">
            Decentralized health data collection. Individuals contribute anonymized health outcomes
            to build the dataset from the ground up — accelerating disease eradication and suffering
            reduction. Your data stays on your device; the causal engine runs locally in your browser.
          </p>
          <a
            href="https://github.com/mikepsinn/optomitron"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-black px-6 py-2 text-sm font-black text-white uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Star on GitHub
          </a>
        </div>
      </section>

      {/* GitHub */}
      <section className="text-center">
        <a
          href="https://github.com/mikepsinn/optomitron"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-black/60 hover:text-pink-500 transition-colors font-bold"
        >
          github.com/mikepsinn/optomitron
        </a>
        <p className="text-xs text-black/40 mt-2 font-bold">
          MIT License © Mike P. Sinn
        </p>
      </section>
    </div>
  );
}
