export default function PoliticiansPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Politician Alignment Scores</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          See how your elected officials&apos; voting records align with citizen
          preferences. Higher scores mean better representation.
        </p>
      </div>

      {/* Placeholder scorecard */}
      <div className="space-y-4">
        {[
          { name: "Rep. Example A", party: "D", score: null, votes: 0 },
          { name: "Sen. Example B", party: "R", score: null, votes: 0 },
          { name: "Rep. Example C", party: "I", score: null, votes: 0 },
        ].map((pol) => (
          <div
            key={pol.name}
            className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-lg">
                👤
              </div>
              <div>
                <div className="font-semibold">{pol.name}</div>
                <div className="text-sm text-gray-500">Party: {pol.party}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-400">—</div>
              <div className="text-xs text-gray-500">
                Alignment score · {pol.votes} votes analyzed
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-gray-500">
          Alignment scores will populate once voting record data and citizen
          preference data are connected. The RAPPA engine computes Citizen
          Alignment Scores by comparing each official&apos;s votes against the
          aggregated preference rankings.
        </p>
      </div>
    </div>
  );
}
