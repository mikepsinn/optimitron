export default function PreferencesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Express what matters to you through pairwise comparisons. Your
          preferences help determine optimal policies for your jurisdiction.
        </p>
      </div>

      {/* Placeholder comparison UI */}
      <div className="max-w-2xl mx-auto">
        <div className="p-8 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-6xl mb-6">🗳️</p>
          <h2 className="text-xl font-semibold mb-4">
            Pairwise Comparison Interface
          </h2>
          <p className="text-gray-500 mb-6">
            Which do you think is more important? You&apos;ll be shown two
            priorities at a time and asked to choose which matters more to you.
            Your responses are aggregated using eigenvector methods (RAPPA) to
            produce collective rankings.
          </p>

          {/* Mock comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors cursor-not-allowed opacity-50">
              <div className="text-3xl mb-2">🏥</div>
              <div className="font-medium">Healthcare Access</div>
            </button>
            <button className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors cursor-not-allowed opacity-50">
              <div className="text-3xl mb-2">🎓</div>
              <div className="font-medium">Education Funding</div>
            </button>
          </div>

          <p className="text-sm text-gray-400">
            Coming soon — connect the RAPPA engine to enable live comparisons.
          </p>
        </div>
      </div>
    </div>
  );
}
