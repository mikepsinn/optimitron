// Remove HeartHandshake, Aperture, DollarSign, Home, Smartphone, Lock, BarChartBig, FastForward, Archive, ListOrdered, Users, TrendingDown, BrainCircuit, FlaskConical, DatabaseZap imports as they are no longer used.

import { getSiteConfig } from "../../lib/site-config";
import {
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  PHARMA_DRUG_DEVELOPMENT_COST_CURRENT,
  ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE,
  DRUG_DISCOVERY_TO_APPROVAL_YEARS,
  COMBINATION_THERAPY_DISEASE_SPACE,
  CURRENT_DISEASE_PATIENTS_GLOBAL,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  RARE_DISEASES_COUNT_GLOBAL,
} from "@optimitron/data/parameters";
import { formatParameter } from "@optimitron/data/parameters/compact-format";

export function SystemProblemsSection() {
  const config = getSiteConfig();
  const showPoliticalContent = config.showPoliticalContent;

  // Derived values from parameters using formatParameter utility
  const costReductionFactor = formatParameter(
    RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  );
  const costPerParticipant = formatParameter(
    TRADITIONAL_PHASE3_COST_PER_PATIENT,
  );
  const developmentCost = formatParameter(PHARMA_DRUG_DEVELOPMENT_COST_CURRENT);
  const exclusionRate = formatParameter(ANTIDEPRESSANT_TRIAL_EXCLUSION_RATE);
  const yearsToMarket = formatParameter(DRUG_DISCOVERY_TO_APPROVAL_YEARS);
  const untestedCombinations = formatParameter(
    COMBINATION_THERAPY_DISEASE_SPACE,
  );
  const peopleSuffering = formatParameter(CURRENT_DISEASE_PATIENTS_GLOBAL);
  // Calculate percentage of diseases without treatment (95% = 6650/7000)
  const diseasesUntreatedPct = Math.round(
    (DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value /
      RARE_DISEASES_COUNT_GLOBAL.value) *
      100,
  );
  const diseasesWithTreatmentPct = 100 - diseasesUntreatedPct;

  const statistics = [
    {
      emoji: "💰",
      title: `${costReductionFactor} Higher Costs Than Necessary`,
      description: showPoliticalContent
        ? `Everything costs ${costReductionFactor} times more than it should. Efficiency is for other industries.`
        : `Current clinical trial costs are ${costReductionFactor} times higher than pragmatic trial alternatives.`,
    },
    {
      emoji: "👥",
      title: `${costPerParticipant} Cost Per Participant`,
      description: showPoliticalContent
        ? `It costs ${costPerParticipant} to include one person in a study. That's more than most people make in a year.`
        : `Traditional clinical trials cost ${costPerParticipant} per participant, exceeding median annual income in many countries.`,
    },
    {
      emoji: "💸",
      title: `${developmentCost} Development Cost`,
      description: showPoliticalContent
        ? `To make one new drug costs ${developmentCost}. Then they charge sick people to pay it back.`
        : `The average cost to develop a new drug is ${developmentCost}, reflected in pharmaceutical pricing.`,
    },
    {
      emoji: "☠️",
      title: "21K-120K Preventable Deaths",
      description: showPoliticalContent
        ? "Between 21,000 and 120,000 people die every decade because the paperwork takes too long."
        : "Regulatory delays contribute to an estimated 21,000-120,000 preventable deaths per decade.",
    },
    {
      emoji: "🚫",
      title: `${exclusionRate} of Patients Excluded`,
      description: showPoliticalContent
        ? `${exclusionRate} of sick people can't join trials. Apparently they're not sick in the right way.`
        : `Current trial eligibility criteria exclude ${exclusionRate} of patients with the condition being studied.`,
    },
    {
      emoji: "💊",
      title: `${diseasesUntreatedPct}% of Diseases Untreated`,
      description: showPoliticalContent
        ? `${diseasesUntreatedPct}% of diseases have no cure. We're really good at the other ${diseasesWithTreatmentPct}%, though.`
        : `${diseasesUntreatedPct}% of known diseases lack FDA-approved treatments, with research concentrated on the remaining ${diseasesWithTreatmentPct}%.`,
    },
    {
      emoji: "🤒",
      title: `${yearsToMarket} Years of Suffering`,
      description: showPoliticalContent
        ? `It takes ${yearsToMarket} years from 'we found a cure!' to actually getting it. Most of us will be dead by then.`
        : `The average time from discovery to widespread clinical adoption is ${yearsToMarket} years.`,
    },
    {
      emoji: "⚛️",
      title: `${untestedCombinations} Untested Treatments`,
      description: showPoliticalContent
        ? `${untestedCombinations} possible cures exist. We've tested approximately none of them.`
        : `An estimated ${untestedCombinations} potential treatment combinations remain untested with current methodologies.`,
    },
    {
      emoji: "🌍",
      title: `${peopleSuffering} People Suffering`,
      description: showPoliticalContent
        ? `${peopleSuffering} people are sick right now. The system is working exactly as designed.`
        : `Approximately ${peopleSuffering} people worldwide suffer from diseases with inadequate treatment options.`,
    },
    {
      emoji: "🧫",
      title: "44+ Years Since Last Disease Cure",
      description: showPoliticalContent
        ? "We haven't cured a major disease in 44 years. But don't worry, we're very busy."
        : "No major disease has been cured in over 44 years, highlighting the need for new research paradigms.",
    },
  ];

  return (
    <section
      id="horrible-problems-section" // Changed ID to reflect new content
      className="w-full py-12 md:py-24 lg:py-32 bg-brutal-cyan border-b-4 border-primary scroll-mt-[121px]"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-2">
            REASON 1.
          </h2>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            The Current System of Clinical Research Is Slow and Terrible
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:gap-8 justify-items-center">
          {statistics.map((stat, index) => (
            <div
              key={index}
              className="w-full max-w-md flex flex-col items-center gap-4 rounded-lg border bg-card p-5 shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02] text-center"
            >
              <span className="block text-3xl md:text-4xl">{stat.emoji}</span>
              <h3 className="text-lg font-semibold text-card-foreground md:text-xl">
                {stat.title}
              </h3>
              <p className="text-sm text-muted-foreground md:text-base">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
