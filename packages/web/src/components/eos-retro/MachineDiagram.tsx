import {
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  US_TOTAL_LOBBYING_ANNUAL,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

/**
 * The machine, read left to right like the factory it is: intake hopper
 * (money in), three press stages (shares, board seats, lobbying redirect),
 * an output chute (better laws), and a return conveyor (value increases)
 * looping back to the intake. Technical-drawing style: thin lines, no fills,
 * no step numbers. The only numbers are real ones, rendered as HTML captions
 * below the drawing so ParameterValue stays clickable and legible.
 */

const STAGES = [
  { cx: 300, lines: ["Shares"] },
  { cx: 470, lines: ["Board", "seats"] },
  { cx: 640, lines: ["Lobbying", "redirect"] },
];

const BELT_TOP = 246;
const BELT_BOTTOM = 256;

function Gear({ cx, cy }: { cx: number; cy: number }) {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return {
      x1: cx + 26 * Math.cos(a),
      y1: cy + 26 * Math.sin(a),
      x2: cx + 34 * Math.cos(a),
      y2: cy + 34 * Math.sin(a),
    };
  });
  return (
    <g className="er-gear">
      <circle className="er-m-line" cx={cx} cy={cy} r={26} />
      <circle className="er-m-line" cx={cx} cy={cy} r={7} />
      {teeth.map((t) => (
        <line
          className="er-m-line"
          key={`${t.x1}-${t.y1}`}
          x1={t.x1}
          x2={t.x2}
          y1={t.y1}
          y2={t.y2}
        />
      ))}
    </g>
  );
}

export function MachineDiagram() {
  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg
          aria-label="Machine schematic, left to right: money pours into an intake hopper, moves along a conveyor through three stages labeled shares, board seats, and lobbying redirect, and exits down a chute as better laws. A return conveyor labeled value increases loops the output back to the intake."
          className="mx-auto block h-auto w-full min-w-[760px]"
          role="img"
          viewBox="0 0 960 460"
        >
          {/* Intake hopper */}
          <polygon className="er-m-line" fill="none" points="40,60 200,60 150,132 90,132" />
          <line className="er-m-line" x1={104} x2={104} y1={132} y2={BELT_TOP} />
          <line className="er-m-line" x1={136} x2={136} y1={132} y2={BELT_TOP} />
          <text className="er-m-label" textAnchor="middle" x={120} y={98}>
            Money in
          </text>
          {/* Coins falling through the chute */}
          <circle className="er-m-fine" cx={120} cy={162} fill="none" r={5} />
          <circle className="er-m-fine" cx={120} cy={190} fill="none" r={5} />
          <circle className="er-m-fine" cx={120} cy={218} fill="none" r={5} />

          {/* Conveyor belt */}
          <line className="er-m-line" x1={90} x2={800} y1={BELT_TOP} y2={BELT_TOP} />
          <line className="er-m-line" x1={90} x2={800} y1={BELT_BOTTOM} y2={BELT_BOTTOM} />
          {Array.from({ length: 13 }, (_, i) => 118 + i * 56).map((x) => (
            <circle className="er-m-fine" cx={x} cy={251} fill="none" key={x} r={4.5} />
          ))}

          {/* Flow arrows on the belt */}
          {[225, 385, 555, 720].map((x) => (
            <path
              className="er-m-gold"
              d={`M ${x - 7} 244 L ${x + 7} 251 L ${x - 7} 258`}
              fill="none"
              key={x}
            />
          ))}

          {/* Press stages */}
          {STAGES.map((s) => (
            <g key={s.cx}>
              <Gear cx={s.cx} cy={112} />
              <rect
                className="er-m-line"
                fill="none"
                height={106}
                width={124}
                x={s.cx - 62}
                y={140}
              />
              {/* Piston from gear into the housing */}
              <line className="er-m-fine" x1={s.cx} x2={s.cx} y1={146} y2={168} />
              <line
                className="er-m-fine"
                x1={s.cx - 20}
                x2={s.cx + 20}
                y1={168}
                y2={168}
              />
              {s.lines.map((line, li) => (
                <text
                  className="er-m-label"
                  key={line}
                  textAnchor="middle"
                  x={s.cx}
                  y={s.lines.length === 1 ? 202 : 192 + li * 20}
                >
                  {line}
                </text>
              ))}
            </g>
          ))}

          {/* Output chute */}
          <line className="er-m-line" x1={800} x2={876} y1={BELT_TOP} y2={314} />
          <line className="er-m-line" x1={792} x2={868} y1={258} y2={326} />
          {/* The product: a law, on paper */}
          <rect className="er-m-line" fill="none" height={28} width={40} x={852} y={330} />
          <line className="er-m-fine" x1={858} x2={886} y1={338} y2={338} />
          <line className="er-m-fine" x1={858} x2={886} y1={346} y2={346} />
          <line className="er-m-fine" x1={858} x2={878} y1={352} y2={352} />
          <text className="er-m-label" textAnchor="middle" x={872} y={384}>
            Better laws
          </text>

          {/* Return conveyor: output value loops back to the intake */}
          <path
            className="er-m-line er-m-dash"
            d="M 892 344 L 932 344 L 932 405 L 30 405 L 30 34 L 110 34 L 110 46"
            fill="none"
          />
          <path className="er-m-gold" d="M 104 44 L 110 56 L 116 44" fill="none" />
          {[650, 280].map((x) => (
            <path
              className="er-m-gold"
              d={`M ${x + 7} 398 L ${x - 7} 405 L ${x + 7} 412`}
              fill="none"
              key={x}
            />
          ))}
          <path className="er-m-gold" d="M 23 226 L 30 212 L 37 226" fill="none" />
          <text className="er-m-tag" textAnchor="middle" x={475} y={394}>
            Value increases
          </text>
        </svg>
      </div>
      <figcaption className="er-caption mt-4 flex flex-wrap justify-between gap-x-8 gap-y-2">
        <span>
          At the intake:{" "}
          <ParameterValue figures={2} param={US_TOTAL_LOBBYING_ANNUAL} /> a
          year currently buys the laws.
        </span>
        <span>
          At the output: a{" "}
          <ParameterValue
            param={POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL}
          />{" "}
          a year gap, waiting to be collected.
        </span>
      </figcaption>
    </figure>
  );
}
