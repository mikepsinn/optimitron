import {
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  GLOBAL_WARHEAD_COUNT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  WAR_CHILDREN_KILLED_SINCE_1900,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

const apocalypseCount = Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value);
const spendingRatio = Math.round(
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value,
);

function ApocalypseGrid() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-1"
      style={{ gridTemplateColumns: "repeat(31, minmax(0, 1fr))" }}
    >
      {Array.from({ length: apocalypseCount }, (_, index) => (
        <span
          className={`aspect-square min-w-0 border border-foreground ${
            index === 0 ? "bg-foreground" : "bg-background"
          }`}
          key={index}
        />
      ))}
    </div>
  );
}

function SpendingGrid() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-start gap-5">
      <div>
        <div
          aria-hidden="true"
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: "repeat(31, minmax(0, 1fr))" }}
        >
          {Array.from({ length: spendingRatio }, (_, index) => (
            <span className="aspect-square min-w-0 bg-foreground" key={index} />
          ))}
        </div>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.12em]">
          Military capacity / {spendingRatio} units
        </p>
      </div>
      <div>
        <div
          aria-hidden="true"
          className="aspect-square w-full border-2 border-foreground bg-background"
        />
        <p className="mt-3 text-center text-xs font-black uppercase tracking-[0.12em]">
          Trials / 1
        </p>
      </div>
    </div>
  );
}

export function StatusQuoEvidence() {
  return (
    <section className="border-t border-foreground" id="evidence">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          The allocation problem, drawn to scale
        </p>
        <h2 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl">
          Humanity bought 122 apocalypses and put the cures on layaway.
        </h2>

        <div className="mt-12 grid border-y-2 border-foreground lg:grid-cols-2">
          <article className="py-8 lg:border-r-2 lg:border-foreground lg:pr-10">
            <div className="flex items-baseline justify-between gap-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                Nuclear overkill
              </p>
              <p className="font-mono text-5xl font-black tracking-[-0.06em]">
                <ParameterValue
                  display="integer"
                  param={NUCLEAR_WINTER_OVERKILL_FACTOR}
                  valueOverride="122×"
                />
              </p>
            </div>
            <div className="mt-8">
              <ApocalypseGrid />
            </div>
            <div className="mt-6 grid grid-cols-[1rem_1fr] gap-x-3 gap-y-2 text-sm font-bold leading-6">
              <span
                aria-hidden="true"
                className="mt-1 aspect-square bg-foreground"
              />
              <p>
                One square: the roughly{" "}
                <ParameterValue
                  param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
                  valueOverride="100 warheads"
                />{" "}
                associated with a civilization-collapsing nuclear winter.
              </p>
              <span
                aria-hidden="true"
                className="mt-1 aspect-square border border-foreground"
              />
              <p>
                The other 121: backups, inside a global arsenal of{" "}
                <ParameterValue
                  param={GLOBAL_WARHEAD_COUNT}
                  valueOverride="12,241 warheads"
                />
                .
              </p>
            </div>
          </article>

          <article className="border-t-2 border-foreground py-8 lg:border-t-0 lg:pl-10">
            <div className="flex items-baseline justify-between gap-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                Annual spending ratio
              </p>
              <p className="font-mono text-5xl font-black tracking-[-0.06em]">
                <ParameterValue
                  display="integer"
                  param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                  valueOverride="604:1"
                />
              </p>
            </div>
            <div className="mt-8">
              <SpendingGrid />
            </div>
            <p className="mt-6 max-w-xl text-sm font-bold leading-6 text-muted-foreground">
              Governments spend about {spendingRatio} dollars on military capacity for each
              dollar they spend on government-funded clinical trials. Apparently
              the diseases were expected to surrender.
            </p>
          </article>
        </div>

        <dl className="grid border-b-2 border-foreground sm:grid-cols-3">
          <div className="py-7 sm:border-r sm:border-foreground sm:pr-6">
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Military spending since 1913
            </dt>
            <dd className="mt-2 font-mono text-3xl font-black sm:text-4xl">
              <ParameterValue
                param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
                valueOverride="$170T"
              />
            </dd>
          </div>
          <div className="border-t border-foreground py-7 sm:border-r sm:border-t-0 sm:border-foreground sm:px-6">
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Killed by war and state violence
            </dt>
            <dd className="mt-2 font-mono text-3xl font-black sm:text-4xl">
              <ParameterValue
                param={WAR_DEATHS_SINCE_1900}
                valueOverride="310M"
              />
            </dd>
          </div>
          <div className="border-t border-foreground py-7 sm:border-t-0 sm:pl-6">
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              Children among the dead
            </dt>
            <dd className="mt-2 font-mono text-3xl font-black sm:text-4xl">
              <ParameterValue
                param={WAR_CHILDREN_KILLED_SINCE_1900}
                valueOverride="102M"
              />
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

const ownershipNodes = [
  ["01", "Your retirement account"],
  ["02", "Universal asset managers"],
  ["03", "Corporate boards"],
  ["04", "Lobbying + capital"],
  ["05", "Government budgets"],
  ["06", "Your health + income"],
] as const;

export function OwnershipLoop() {
  return (
    <figure className="mt-12 border-y-2 border-foreground py-8">
      <figcaption className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
        The ownership loop
      </figcaption>
      <ol className="mt-6 grid gap-0 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch">
        {ownershipNodes.map(([number, label], index) => (
          <li className="contents" key={number}>
            <div className="flex min-h-24 flex-col justify-between border border-foreground p-4">
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {number}
              </span>
              <span className="mt-4 text-base font-black leading-5">
                {label}
              </span>
            </div>
            {index < ownershipNodes.length - 1 ? (
              <span
                aria-hidden="true"
                className="flex h-8 items-center justify-center text-2xl font-black md:h-auto md:w-7"
              >
                <span className="md:hidden">↓</span>
                <span className="hidden md:inline">→</span>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="mt-7 grid border-2 border-foreground bg-foreground text-background md:grid-cols-[12rem_1fr]">
        <p className="p-5 text-xs font-black uppercase tracking-[0.14em] md:border-r md:border-background/50">
          EOS enters here
        </p>
        <p className="border-t border-background/50 p-5 text-lg font-black leading-7 md:border-t-0">
          Coordinate the owners. Elect directors. Redirect lobbying and capital
          toward survival, health, and long-run growth.
        </p>
      </div>
    </figure>
  );
}
