import type { BillCBA } from "@/lib/civic-cba";

interface BillCBACardProps {
  cba: BillCBA;
}

export function BillCBACard({ cba }: BillCBACardProps) {
  const { structural, llm } = cba;
  const signalClass = `opto-cba__signal--${structural.overallSignal}`;

  return (
    <div className="opto-cba">
      {llm ? (
        <>
          <div className="opto-cba__summary">{llm.summary}</div>
          {llm.pros.length > 0 && (
            <div className="opto-cba__section">
              <div className="opto-cba__section-label">Pros</div>
              <ul className="opto-cba__list opto-cba__list--pros">
                {llm.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {llm.cons.length > 0 && (
            <div className="opto-cba__section">
              <div className="opto-cba__section-label">Cons</div>
              <ul className="opto-cba__list opto-cba__list--cons">
                {llm.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="opto-cba__no-llm">
          Structural analysis only. Configure an API key for AI-powered summary.
        </div>
      )}

      <div className="opto-cba__structural">
        <div className="opto-cba__structural-header">
          Budget Impact
          <span className={`opto-cba__signal ${signalClass}`}>
            {structural.overallSignal}
          </span>
        </div>
        <div className="opto-cba__bars">
          {structural.categories.map((cat) => (
            <div key={cat.categoryId} className="opto-cba__bar-row">
              <span className="opto-cba__bar-label">
                {cat.icon} {cat.name}
              </span>
              <div className="opto-cba__bar-track">
                <div
                  className="opto-cba__bar-fill"
                  style={{ width: `${Math.min(cat.score * 100, 100)}%` }}
                />
              </div>
              <span className="opto-cba__bar-roi">
                {cat.roi ?? "N/A"}
              </span>
              <span className={`opto-cba__bar-direction opto-cba__bar-direction--${cat.direction}`}>
                {cat.direction === "increase" ? "\u2191" : "\u2193"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
