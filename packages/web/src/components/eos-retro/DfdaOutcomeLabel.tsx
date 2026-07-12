/**
 * A dFDA Outcome Label and treatment ranking, typeset for the exhibit hall.
 * Adapted from demo/slides/sierra/slide-decentralized-fda.tsx (Sierra chrome
 * stripped). The dataset is an illustrative sample from published statin
 * trial aggregates, and the card says so; live labels are the /agencies/dfda
 * surface. Server component; zero client JS.
 */

const OUTCOME_LABEL = {
  treatment: "Atorvastatin 20mg",
  tag: "Lipid-lowering agent",
  outcomes: [
    { name: "LDL Cholesterol", change: -43, detail: "-69 mg/dL" },
    { name: "Cardiovascular Risk", change: -36, detail: "-4.2%" },
    { name: "HDL Cholesterol", change: 5, detail: "+2.3 mg/dL" },
  ],
  sideEffects: [
    { name: "Muscle Pain", pct: 8.2 },
    { name: "Liver Enzymes", pct: 1.2 },
  ],
  source: "42 trials, 48,500 participants",
};

const TREATMENT_RANKINGS = [
  { rank: 1, name: "Atorvastatin 20mg", effectiveness: 87, safety: 92, confidence: 95 },
  { rank: 2, name: "Rosuvastatin 10mg", effectiveness: 84, safety: 89, confidence: 91 },
  { rank: 3, name: "Ezetimibe 10mg", effectiveness: 62, safety: 96, confidence: 88 },
];

export function DfdaOutcomeLabel() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="er-panel er-ticked p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="er-card-title">Outcome label</p>
          <p className="er-caption">{OUTCOME_LABEL.tag}</p>
        </div>
        <p className="er-display mt-3 text-xl" style={{ color: "var(--er-cream)" }}>
          {OUTCOME_LABEL.treatment}
        </p>
        <div className="mt-4 space-y-3">
          {OUTCOME_LABEL.outcomes.map((o) => (
            <div className="flex items-center gap-3" key={o.name}>
              <span className="er-caption w-40 shrink-0" style={{ color: "var(--er-cream-soft)" }}>
                {o.name}
              </span>
              <div className="er-bar-track min-w-0 flex-1">
                <div
                  className="er-bar-fill"
                  style={{
                    width: `${Math.min(Math.abs(o.change), 100)}%`,
                    background: "var(--er-cyan)",
                  }}
                />
              </div>
              <span className="er-mono w-24 shrink-0 text-right text-sm" style={{ color: "var(--er-cyan)" }}>
                {o.change > 0 ? "+" : ""}
                {o.change}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--er-line)" }}>
          <p className="er-caption">
            Side effects:{" "}
            {OUTCOME_LABEL.sideEffects.map((se, i) => (
              <span key={se.name}>
                {i > 0 ? " · " : ""}
                {se.name}{" "}
                <span style={{ color: "var(--er-orange)" }}>{se.pct}%</span>
              </span>
            ))}
          </p>
          <p className="er-caption mt-1">{OUTCOME_LABEL.source}</p>
        </div>
      </div>

      <div className="er-panel-soft p-5">
        <p className="er-card-title">Treatment rankings</p>
        <p className="er-caption mt-1">High cholesterol, ranked by effectiveness</p>
        <div className="mt-4 space-y-3">
          {TREATMENT_RANKINGS.map((t) => (
            <div
              className="flex items-center gap-3 border p-3"
              key={t.rank}
              style={{
                borderColor: t.rank === 1 ? "var(--er-gold)" : "var(--er-line)",
              }}
            >
              <span
                className="er-display shrink-0 text-lg"
                style={{ color: t.rank === 1 ? "var(--er-gold)" : "var(--er-cream-muted)" }}
              >
                {t.rank}
              </span>
              <div className="min-w-0">
                <p className="er-body text-sm font-bold" style={{ color: "var(--er-cream)" }}>
                  {t.name}
                </p>
                <p className="er-caption mt-1">
                  <span style={{ color: "var(--er-cyan)" }}>{t.effectiveness}% effective</span>
                  {" · "}
                  <span style={{ color: "var(--er-gold)" }}>{t.safety}% safe</span>
                  {" · "}
                  {t.confidence}% confidence
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="er-caption mt-4">
          Exhibit sample typeset from published statin trial aggregates. The
          live labels update continuously as real-world data arrives.
        </p>
      </div>
    </div>
  );
}
