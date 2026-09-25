import { GLOBAL_GOVERNMENT_EXPENSE_ANNUAL } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { LandingSection, Tile, TileGrid } from "./LandingSection";
import { LoopDot } from "./LoopDot";

/*
 * Three control loops, drawn the way the manual's "Why Your Government Does
 * Not Have a Thermostat" and "Theory of Operation" chapters draw them. SVG
 * text stays at 14 user units because the contrast audit reads computed font
 * size, and the viewBoxes are sized so that renders close to 14px on screen.
 */

const BOX_WIDTH = 84;
const BOX_STEP = 105;
const ROW_Y = 36;
const ROW_HEIGHT = 48;
const ROW_MID = ROW_Y + ROW_HEIGHT / 2;

function rowBoxX(index: number) {
  return index * BOX_STEP + 0.75;
}

function rowBoxCenter(index: number) {
  return rowBoxX(index) + BOX_WIDTH / 2;
}

/** Middle of the wire from box `index` to the next: where a still dot sits. */
function wireBetweenBoxes(index: number) {
  return rowBoxX(index) + BOX_WIDTH + (BOX_STEP - BOX_WIDTH) / 2;
}

function ArrowMarker({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        markerHeight="7"
        markerWidth="7"
        orient="auto-start-reverse"
        refX="9"
        refY="5"
        viewBox="0 0 10 10"
      >
        <path className="fill-foreground" d="M0,0 L10,5 L0,10 z" />
      </marker>
    </defs>
  );
}

function RowArrows({ markerId }: { markerId: string }) {
  return (
    <g
      className="stroke-foreground"
      fill="none"
      markerEnd={`url(#${markerId})`}
      strokeWidth="1.5"
    >
      {[0, 1, 2].map((index) => {
        const from = rowBoxX(index) + BOX_WIDTH + 0.5;
        const to = rowBoxX(index + 1) - 1.5;
        return <path d={`M${from},${ROW_MID} H${to}`} key={index} />;
      })}
    </g>
  );
}

function BoxLabel({
  center,
  lines,
  y = ROW_Y,
  height = ROW_HEIGHT,
}: {
  center: number;
  height?: number;
  lines: string[];
  y?: number;
}) {
  const lineHeight = 17;
  const firstBaseline =
    y + height / 2 - ((lines.length - 1) * lineHeight) / 2 + 5;
  return (
    <>
      {lines.map((line, index) => (
        <text
          key={line}
          textAnchor="middle"
          x={center}
          y={firstBaseline + index * lineHeight}
        >
          {line}
        </text>
      ))}
    </>
  );
}

function OvenLoop() {
  const markerId = "loop-arrow-oven";
  const loopPath = `M${rowBoxCenter(0)},${ROW_MID} H${rowBoxCenter(2)} V183 H${rowBoxCenter(0)} Z`;
  return (
    <svg
      aria-labelledby="oven-loop-title"
      className="h-auto w-full"
      fontSize="14"
      role="img"
      viewBox="0 0 400 216"
    >
      <title id="oven-loop-title">
        Your oven: you set 350°F, the heating element heats the oven, the oven
        cooks the food, and a thermometer feeds the temperature back to the
        setting.
      </title>
      <ArrowMarker id={markerId} />
      <path
        className="stroke-foreground/20"
        d={loopPath}
        fill="none"
        strokeWidth="1.5"
      />
      <RowArrows markerId={markerId} />
      <g
        className="stroke-foreground"
        fill="none"
        markerEnd={`url(#${markerId})`}
        strokeWidth="1.5"
      >
        <path d={`M${rowBoxCenter(2)},${ROW_Y + ROW_HEIGHT + 1} V183 H219`} />
        <path d={`M77,183 H${rowBoxCenter(0)} V${ROW_Y + ROW_HEIGHT + 2}`} />
      </g>
      <g className="fill-background stroke-foreground" strokeWidth="1.5">
        {[0, 1, 2, 3].map((index) => (
          <rect
            height={ROW_HEIGHT}
            key={index}
            width={BOX_WIDTH}
            x={rowBoxX(index)}
            y={ROW_Y}
          />
        ))}
        <rect height="46" width="140" x="77" y="160" />
      </g>
      <g className="fill-foreground">
        <BoxLabel center={rowBoxCenter(0)} lines={["Set", "350°F"]} />
        <BoxLabel center={rowBoxCenter(1)} lines={["Heating", "element"]} />
        <BoxLabel center={rowBoxCenter(2)} lines={["Oven"]} />
        <BoxLabel center={rowBoxCenter(3)} lines={["Food"]} />
        <text textAnchor="middle" x="147" y="180">
          Thermometer
        </text>
      </g>
      <text className="fill-muted-foreground" textAnchor="middle" x="147" y="197">
        measures, adjusts
      </text>
      <LoopDot
        durationSeconds={6}
        path={loopPath}
        start={[wireBetweenBoxes(0), ROW_MID]}
      />
    </svg>
  );
}

function GovernmentLoop() {
  const markerId = "loop-arrow-government";
  const openPath = `M${rowBoxCenter(0)},${ROW_MID} H${rowBoxCenter(3)}`;
  return (
    <svg
      aria-labelledby="government-loop-title"
      className="h-auto w-full"
      fontSize="14"
      role="img"
      viewBox="0 0 400 190"
    >
      <title id="government-loop-title">
        Your government: the War on Drugs spent one trillion dollars on drug
        policy with no sensor, no measurement, and no adjustment. Overdose
        deaths rose from 6,000 to 107,000 a year over 53 years.
      </title>
      <ArrowMarker id={markerId} />
      <RowArrows markerId={markerId} />
      <g className="fill-background stroke-foreground" strokeWidth="1.5">
        {[0, 1, 2].map((index) => (
          <rect
            height={ROW_HEIGHT}
            key={index}
            width={BOX_WIDTH}
            x={rowBoxX(index)}
            y={ROW_Y}
          />
        ))}
      </g>
      <rect
        className="fill-background stroke-brutal-red dark:stroke-destructive"
        height={ROW_HEIGHT}
        strokeDasharray="4 4"
        strokeWidth="1.5"
        width={BOX_WIDTH}
        x={rowBoxX(3)}
        y={ROW_Y}
      />
      <g className="fill-foreground">
        <BoxLabel center={rowBoxCenter(0)} lines={["“War on", "Drugs”"]} />
        <BoxLabel center={rowBoxCenter(1)} lines={["$1 trillion", "spent"]} />
        <BoxLabel center={rowBoxCenter(2)} lines={["Drug", "policy"]} />
      </g>
      <g className="fill-brutal-red dark:fill-destructive" fontWeight="700">
        <text fontSize="18" textAnchor="middle" x={rowBoxCenter(3)} y={ROW_MID + 6}>
          ???
        </text>
        <text textAnchor="middle" x="200" y="116">
          No sensor. No measurement. No adjustment.
        </text>
      </g>
      <g className="fill-muted-foreground">
        <text x="0" y="152">
          Overdose deaths a year
        </text>
        <text x="0" y="176">
          Years running
        </text>
      </g>
      <g className="fill-foreground" fontWeight="700" textAnchor="end">
        <text x="400" y="152">
          6,000 → 107,000
        </text>
        <text x="400" y="176">
          53
        </text>
      </g>
      <LoopDot
        durationSeconds={4}
        fadeOut
        path={openPath}
        start={[wireBetweenBoxes(0), ROW_MID]}
      />
    </svg>
  );
}

const WIDE_BOX_WIDTH = 120;
const WIDE_BOX_X = [0.75, 140, 279.25] as const;
const WIDE_ROWS = [28, 148] as const;
const WIDE_ROW_HEIGHT = 64;

function wideCenter(column: number) {
  return WIDE_BOX_X[column]! + WIDE_BOX_WIDTH / 2;
}

function WideBox({
  column,
  gloss,
  label,
  row,
}: {
  column: number;
  gloss: [string, string];
  label: string;
  row: number;
}) {
  const x = WIDE_BOX_X[column]!;
  const y = WIDE_ROWS[row]!;
  const center = wideCenter(column);
  return (
    <g>
      <rect
        className="fill-background stroke-foreground"
        height={WIDE_ROW_HEIGHT}
        strokeWidth="1.5"
        width={WIDE_BOX_WIDTH}
        x={x}
        y={y}
      />
      <text
        className="fill-foreground"
        fontWeight="700"
        textAnchor="middle"
        x={center}
        y={y + 22}
      >
        {label}
      </text>
      {gloss.map((line, index) => (
        <text
          className="fill-muted-foreground"
          key={line}
          textAnchor="middle"
          x={center}
          y={y + 40 + index * 16}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function OptimizedLoop() {
  const markerId = "loop-arrow-optimized";
  const top = WIDE_ROWS[0] + WIDE_ROW_HEIGHT / 2;
  const bottom = WIDE_ROWS[1] + WIDE_ROW_HEIGHT / 2;
  const loopPath = `M${wideCenter(0)},${top} H${wideCenter(2)} V${bottom} H${wideCenter(0)} Z`;
  return (
    <svg
      aria-labelledby="optimized-loop-title"
      className="h-auto w-full"
      fontSize="14"
      role="img"
      viewBox="0 0 400 250"
    >
      <title id="optimized-loop-title">
        Optimized government: the target is median healthy life and income by
        2040; the error is the political dysfunction tax; Optimitron&apos;s
        policy and budget generators choose the correction; laws, budgets, and
        board seats apply it to governments and firms; sensors measure healthy
        life and income and send the readings back to the target.
      </title>
      <ArrowMarker id={markerId} />
      <path
        className="stroke-foreground/20"
        d={loopPath}
        fill="none"
        strokeWidth="1.5"
      />
      <g
        className="stroke-foreground"
        fill="none"
        markerEnd={`url(#${markerId})`}
        strokeWidth="1.5"
      >
        <path d={`M121.5,${top} H138`} />
        <path d={`M260.5,${top} H277.5`} />
        <path d={`M${wideCenter(2)},${WIDE_ROWS[0] + WIDE_ROW_HEIGHT + 1} V${WIDE_ROWS[1] - 2}`} />
        <path d={`M278.5,${bottom} H262`} />
        <path d={`M139.25,${bottom} H122.5`} />
        <path d={`M${wideCenter(0)},${WIDE_ROWS[1] - 1} V${WIDE_ROWS[0] + WIDE_ROW_HEIGHT + 2}`} />
      </g>
      <WideBox column={0} gloss={["healthy life +", "income, 2040"]} label="TARGET" row={0} />
      <WideBox column={1} gloss={["the gap:", "dysfunction tax"]} label="ERROR" row={0} />
      <WideBox column={2} gloss={["policy + budget", "generators"]} label="OPTIMITRON" row={0} />
      <WideBox column={2} gloss={["laws, budgets,", "board seats"]} label="ACTUATORS" row={1} />
      <WideBox column={1} gloss={["governments", "and firms"]} label="THE ECONOMY" row={1} />
      <WideBox column={0} gloss={["measure HALE", "and income"]} label="SENSORS" row={1} />
      <text className="fill-muted-foreground" textAnchor="middle" x="200" y="240">
        Readings go back to the target.
      </text>
      <LoopDot
        durationSeconds={6}
        path={loopPath}
        start={[(WIDE_BOX_X[0] + WIDE_BOX_WIDTH + WIDE_BOX_X[1]) / 2, top]}
      />
    </svg>
  );
}

const DIAGRAMS = [
  {
    caption:
      "The oven checks whether the food is the right temperature. If not, it adjusts.",
    diagram: <OvenLoop />,
    note: "closed loop",
    title: "Your oven",
  },
  {
    caption:
      "It never checks whether the policy is working, so it never adjusts.",
    diagram: <GovernmentLoop />,
    note: "open loop",
    title: "Your government",
  },
  {
    caption:
      "The sensor measures what the policies did, compares it with the target, and adjusts.",
    diagram: <OptimizedLoop />,
    note: "closed loop",
    title: "Optimized government",
  },
] as const;

export function ControlLoopSection() {
  const governmentSpending = `$${(GLOBAL_GOVERNMENT_EXPENSE_ANNUAL.value / 1e12).toFixed(1)} trillion`;
  return (
    <LandingSection id="thermostat" title="Why your government does not have a thermostat">
      <p className="max-w-3xl text-base leading-7 text-foreground sm:text-lg sm:leading-8">
        You pay your governments{" "}
        <ParameterValue
          className="font-bold"
          param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
          valueOverride={governmentSpending}
        />{" "}
        a year to promote the general welfare, which means raising median health
        and wealth. They never check whether any policy or budget actually does.
        We analyze two centuries of data from 193 countries with causal
        inference to find the policies and budgets that do.
      </p>
      <TileGrid className="mt-8">
        {DIAGRAMS.map(({ caption, diagram, note, title }) => (
          <Tile key={title} note={note} title={title}>
            {diagram}
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{caption}</p>
          </Tile>
        ))}
      </TileGrid>
    </LandingSection>
  );
}
