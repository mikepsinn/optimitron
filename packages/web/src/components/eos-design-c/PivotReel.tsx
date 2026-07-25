/**
 * The pivot. Register 1 ends on a black Academy leader — countdown circle,
 * crosshair, sweeping hand — and the question is asked in the dark. The
 * answer is on the other side, in the light: cream paper, projector beam,
 * type at full brochure size. Walking out of a courtroom into 1962.
 *
 * Both lines are verbatim from the spec's Transition block.
 */
export function PivotReel() {
  return (
    <>
      <div className="dc-pivot-dark">
        <svg
          aria-hidden="true"
          className="dc-leader"
          role="presentation"
          viewBox="0 0 200 200"
        >
          <g
            fill="none"
            stroke="#f2f2ef"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          >
            <circle cx="100" cy="100" r="92" />
            <circle cx="100" cy="100" r="66" />
            <line x1="100" y1="2" x2="100" y2="198" />
            <line x1="2" y1="100" x2="198" y2="100" />
          </g>
          <path
            className="dc-leader-sweep"
            d="M100 100 L100 8 A92 92 0 0 1 165 35 Z"
            fill="#e0523a"
            opacity="0.55"
          />
          <text
            fill="#f2f2ef"
            fontFamily="var(--v0-font-dm-sans), sans-serif"
            fontSize="86"
            fontWeight="900"
            textAnchor="middle"
            x="100"
            y="132"
          >
            3
          </text>
        </svg>

        <p className="dc-pivot-q">
          Has your species developed nuclear weapons, antibiotics, and the
          internet, and then pointed two of those three at each other?
        </p>
      </div>

      <section className="dc-pivot-light" id="the-pivot">
        <span className="dc-beam" aria-hidden="true" />
        <svg
          aria-hidden="true"
          className="dc-burst"
          role="presentation"
          viewBox="0 0 100 100"
        >
          <g stroke="#edaf22" strokeWidth="5" strokeLinecap="round" fill="none">
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI * 2) / 12;
              const inner = i % 2 === 0 ? 20 : 26;
              const outer = i % 2 === 0 ? 46 : 36;
              return (
                <line
                  key={i}
                  x1={50 + Math.cos(a) * inner}
                  y1={50 + Math.sin(a) * inner}
                  x2={50 + Math.cos(a) * outer}
                  y2={50 + Math.sin(a) * outer}
                />
              );
            })}
          </g>
          <circle cx="50" cy="50" r="13" fill="#e0523a" />
        </svg>

        <h1 className="dc-h dc-pivot-a">
          You may be <em>eligible</em> for optimization.
        </h1>
        <p className="dc-slate dc-pivot-sub">Earth Optimization Services</p>
      </section>
    </>
  );
}
