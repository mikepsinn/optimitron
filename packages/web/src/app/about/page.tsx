const papers = [
  {
    title: "dFDA Specification",
    description:
      "The Decentralized FDA framework — temporal alignment, Bradford Hill criteria, Predictor Impact Scores, and causal effect size estimation.",
    url: "https://dfda-spec.warondisease.org",
  },
  {
    title: "Optimocracy",
    description:
      "Two-metric welfare function for governance: maximizing median health AND happiness simultaneously.",
    url: "https://optimocracy.warondisease.org",
  },
  {
    title: "Optimal Policy Generator",
    description:
      "Evidence-based policy recommendations using Policy Impact Scores and Comprehensive Causal Scoring.",
    url: "https://opg.warondisease.org",
  },
  {
    title: "Optimal Budget Generator",
    description:
      "Diminishing-returns modeling, Optimal Spending Levels, and Budget Impact Scores for cost-effective allocation.",
    url: "https://obg.warondisease.org",
  },
  {
    title: "Wishocracy / RAPPA",
    description:
      "Ranked Aggregate Pairwise Preference Algorithm — eigenvector-based preference aggregation and Citizen Alignment Scores.",
    url: "https://wishocracy.warondisease.org",
  },
  {
    title: "Incentive Alignment Bonds",
    description:
      "Transparent crypto treasury that distributes campaign funds based on politician alignment scores. (Phase 4 — future)",
    url: "https://iab.warondisease.org",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold">About Optomitron</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-3xl">
          Optomitron is an open-source AI governance platform designed to
          maximize median health and happiness for humanity. It connects citizen
          preferences, real-world outcomes, causal inference, and policy
          optimization into a single system.
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Core Papers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {papers.map((paper) => (
            <a
              key={paper.title}
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-primary-500/50 transition-colors group"
            >
              <h3 className="text-lg font-semibold group-hover:text-primary-500 transition-colors">
                {paper.title} ↗
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                {paper.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Architecture</h2>
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 font-mono text-sm leading-relaxed">
          <pre className="text-gray-600 dark:text-gray-400 overflow-x-auto">{`optomitron/
├── packages/
│   ├── causal/    🧠 Domain-agnostic causal inference engine
│   ├── rappa/     🗳️ Preference aggregation (RAPPA)
│   ├── opg/       📋 Optimal Policy Generator
│   ├── obg/       💰 Optimal Budget Generator
│   ├── data/      📊 Data fetchers (OECD, WHO, FRED, ...)
│   ├── db/        🗄️ Prisma schema + database
│   └── web/       🌐 This app — Next.js dashboard`}</pre>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold mb-2">Open Source</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Optomitron is MIT-licensed and developed by{" "}
          <a
            href="https://github.com/mikepsinn"
            className="text-primary-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mike P. Sinn
          </a>
          . Source code:{" "}
          <a
            href="https://github.com/mikepsinn/optomitron"
            className="text-primary-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/mikepsinn/optomitron
          </a>
        </p>
      </div>
    </div>
  );
}
