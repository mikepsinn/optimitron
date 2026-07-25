/**
 * Corporate transformation cards: the same factories with different products.
 * Appears in Featured Product 4 (The Loving Takeover) and again in Section 8,
 * exactly as the spec lays out. The before/after is a CSS crossfade, disabled
 * under prefers-reduced-motion (both names stay visible either way).
 */
const TRANSFORMS = [
  { before: "Lockheed Martin", after: "Lockheed Martin Health Systems" },
  { before: "Raytheon", after: "Raytheon Wellness Infrastructure" },
  { before: "Northrop Grumman", after: "Northrop Grumman Medical Devices" },
  { before: "General Dynamics", after: "General Dynamics Civil Engineering" },
];

export function TransformationCards() {
  return (
    <>
      <div className="eos-transform-grid">
        {TRANSFORMS.map((t) => (
          <div className="eos-transform-card" key={t.before}>
            <span className="eos-transform-before">{t.before}</span>
            <span aria-hidden="true" className="eos-transform-arrow">
              ↓
            </span>
            <span className="eos-transform-after">{t.after}</span>
          </div>
        ))}
      </div>
      <div className="eos-prose" style={{ marginTop: "1.5rem" }}>
        <p>
          Same factories. Same engineers. Same stock tickers. Different
          products. The revenue was always the point; the killing was just the
          sales channel.
        </p>
      </div>
    </>
  );
}
