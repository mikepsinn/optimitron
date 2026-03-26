import { NavItemLink } from "@/components/navigation/NavItemLink";
import { onePercentTreatyPaperLink } from "@/lib/routes";
import { GameCTA } from "@/components/ui/game-cta";
import {
  fmtParam,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
} from "@optimitron/data/parameters";
import { Stat } from "@/components/ui/stat";
const dfdaCapacity = Math.round(
  (GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value * 0.01 * 0.8) /
    DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value,
);
const dfdaCapacityFmt = `${(dfdaCapacity / 1e6).toFixed(1)}M`;
const currentQueueYears = Math.round(
  6650 / (15 * 1), // approximation: 6650 diseases / 15 treatments per year
);

const treatySteps = [
  {
    before: `${fmtParam({...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD"})}/yr`,
    label: "Global Military Budget",
    after: "Take 1%",
    description: `Your species spends ${fmtParam({...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD"})} per year on the ability to destroy itself. We are asking for one percent of that. One. Percent.`,
  },
  {
    before: `${fmtParam(TRADITIONAL_PHASE3_COST_PER_PATIENT)}`,
    label: "Trial Cost",
    after: `${fmtParam(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT)}`,
    description: `Current clinical trials cost ${fmtParam(TRADITIONAL_PHASE3_COST_PER_PATIENT)} because you insist on running them in the most expensive way possible. Scale fixes that.`,
  },
  {
    before: `${(CURRENT_TRIAL_SLOTS_AVAILABLE.value / 1e6).toFixed(1)}M/yr`,
    label: "Trial Capacity",
    after: `${dfdaCapacityFmt}/yr`,
    description: `From ${(CURRENT_TRIAL_SLOTS_AVAILABLE.value / 1e6).toFixed(1)} million patients per year to ${(dfdaCapacity / 1e6).toFixed(1)} million. Same willing participants. Just actually letting them participate.`,
  },
  {
    before: `${currentQueueYears} years`,
    label: "Treatment Queue",
    after: `${Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value)} years`,
    description: `The ${currentQueueYears}-year queue to test treatments for every known disease shrinks to ${Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value)} years. Still embarrassing, but survivable.`,
  },
];

export function OnePercentTreatySection() {
  return (
    <section className="bg-brutal-cyan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            The 1% Treaty
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
            Take one percent of what you spend on killing each other and spend it on
            not dying instead. This is not a radical proposal. It is basic arithmetic.
            I genuinely do not understand what is taking so long.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {treatySteps.map((step) => (
            <div key={step.label} className="p-6 border-4 border-primary bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg font-black text-muted-foreground line-through">
                    {step.before}
                  </span>
                  <span className="text-brutal-cyan font-black text-xl">&rarr;</span>
                  <span className="text-lg font-black text-brutal-cyan">
                    {step.after}
                  </span>
                </div>
                <div className="flex-grow">
                  <span className="text-xs font-black px-2.5 py-1 bg-foreground text-background uppercase">
                    {step.label}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed font-bold mt-2">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 border-4 border-primary bg-brutal-cyan shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="text-4xl sm:text-5xl font-black text-foreground mb-2">
            {(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / 1e9).toFixed(1)}B Lives Saved
          </div>
          <p className="text-foreground font-bold max-w-xl mx-auto">
            <Stat param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED} /> deaths prevented. ROI: essentially infinite. The only
            thing standing between you and this is the part where you actually do it.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <GameCTA href="/prize" variant="primary">Play the Game</GameCTA>
            <NavItemLink
              item={onePercentTreatyPaperLink}
              variant="custom"
              external
              className="inline-flex items-center text-sm font-black text-muted-foreground uppercase hover:text-foreground transition-colors"
            >
              Read the paper &rarr;
            </NavItemLink>
          </div>
        </div>
      </div>
    </section>
  );
}
