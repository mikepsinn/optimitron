import Link from "next/link";

const features = [
  {
    title: "Preference Aggregation",
    description:
      "Pairwise comparison surveys let citizens express what they truly value, aggregated via eigenvector methods into collective priority rankings.",
    icon: "🗳️",
  },
  {
    title: "Causal Inference Engine",
    description:
      "Domain-agnostic causal analysis using temporal alignment and Bradford Hill criteria to determine what actually works.",
    icon: "🧠",
  },
  {
    title: "Optimal Policy Generation",
    description:
      "Evidence-based policy recommendations scored by predicted impact on citizen welfare metrics.",
    icon: "📋",
  },
  {
    title: "Budget Optimization",
    description:
      "Diminishing-returns modeling and cost-effectiveness analysis to allocate budgets where they have the most impact.",
    icon: "💰",
  },
  {
    title: "Politician Alignment Scores",
    description:
      "Track how elected officials' voting records align with their constituents' expressed preferences.",
    icon: "📊",
  },
  {
    title: "Multi-Jurisdiction Support",
    description:
      "From cities to countries — any jurisdiction can deploy Optomitron as its governance operating system.",
    icon: "🌐",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Optomitron
              </span>
            </h1>
            <p className="mt-6 text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              AI governance platform for maximizing median health and happiness.
              Connecting what people want, what&apos;s happening, what causes
              what, and what to do about it.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/preferences"
                className="px-8 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors text-lg"
              >
                Express Your Preferences
              </Link>
              <Link
                href="/about"
                className="px-8 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
              >
                Read the Papers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-primary-500/50 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center p-12 rounded-3xl bg-gradient-to-r from-primary-600/10 to-purple-600/10 border border-primary-500/20">
          <h2 className="text-3xl font-bold mb-4">
            Government as an Operating System
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Any jurisdiction — city, county, state, or country — can deploy
            Optomitron to collect citizen preferences, track outcomes, and
            generate evidence-based policy recommendations.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>
            Optomitron — Open source AI governance platform by{" "}
            <a
              href="https://github.com/mikepsinn"
              className="text-primary-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mike P. Sinn
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
