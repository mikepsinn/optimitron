/**
 * The Machine: a self-funding flywheel rendered as pure SVG with CSS/SMIL
 * animation (no JS). Seven stations around a rotating dashed ring, with
 * energy sparks orbiting the loop. Server component.
 */

const STATIONS = [
  "Money in",
  "Shares",
  "Board seats",
  "Lobbying redirect",
  "Policy change",
  "Outcomes improve",
  "Value increases",
];

const SIZE = 680;
const CENTER = SIZE / 2;
const RING_R = 252;
const NODE_R = 56;

interface StationPos {
  label: string;
  step: number;
  x: number;
  y: number;
}

const positions: StationPos[] = STATIONS.map((label, i) => {
  const angle = (i / STATIONS.length) * Math.PI * 2 - Math.PI / 2;
  return {
    label,
    step: i + 1,
    x: CENTER + RING_R * Math.cos(angle),
    y: CENTER + RING_R * Math.sin(angle),
  };
});

const ORBIT_PATH = `M ${CENTER + RING_R} ${CENTER} A ${RING_R} ${RING_R} 0 1 1 ${
  CENTER - RING_R
} ${CENTER} A ${RING_R} ${RING_R} 0 1 1 ${CENTER + RING_R} ${CENTER}`;

function splitLabel(label: string): string[] {
  const words = label.split(" ");
  if (words.length === 1) return words;
  return [words[0] ?? "", words.slice(1).join(" ")];
}

export function FlywheelDiagram() {
  return (
    <svg
      aria-label="The flywheel: money in, shares, board seats, lobbying redirect, policy change, outcomes improve, value increases, and back to money in"
      className="mx-auto block h-auto w-full max-w-2xl"
      role="img"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
    >
      <circle className="er-flywheel-ring" cx={CENTER} cy={CENTER} r={RING_R} />

      {/* Energy sparks orbiting the loop (SMIL, no JS). */}
      {[0, 1, 2].map((i) => (
        <circle
          className={i === 1 ? "er-flywheel-spark-gold" : "er-flywheel-spark"}
          key={i}
          r={i === 1 ? 6 : 4.5}
        >
          <animateMotion
            begin={`${(i * 18) / 3}s`}
            dur="18s"
            path={ORBIT_PATH}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {positions.map((p) => {
        const lines = splitLabel(p.label);
        return (
          <g key={p.label}>
            <circle className="er-flywheel-node" cx={p.x} cy={p.y} r={NODE_R} />
            <text
              className="er-flywheel-step"
              textAnchor="middle"
              x={p.x}
              y={p.y - 18}
            >
              {String(p.step).padStart(2, "0")}
            </text>
            <text className="er-flywheel-node-label" textAnchor="middle" x={p.x} y={p.y + 4}>
              {lines.map((line, li) => (
                <tspan dy={li === 0 ? 0 : 16} key={line} x={p.x}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      <text className="er-flywheel-center-title" textAnchor="middle" x={CENTER} y={CENTER - 4}>
        The machine
      </text>
      <text className="er-flywheel-center-sub" textAnchor="middle" x={CENTER} y={CENTER + 24}>
        Step 7 pays for step 1
      </text>
    </svg>
  );
}
