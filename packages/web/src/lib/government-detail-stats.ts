import {
  type GovernmentMetrics,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
} from "@optimitron/data";

export interface GovernmentDetailStatCard {
  label: string;
  value: string;
  emoji: string;
  subtitle?: string;
  source?: string;
  url?: string;
}

export interface GovernmentDetailSections {
  spendingProfile: GovernmentDetailStatCard[];
  bodyCount: GovernmentDetailStatCard[];
  justiceAndDomestic: GovernmentDetailStatCard[];
}

function formatUSD(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatRatio(value: number): string {
  if (value >= 1000) return `${Math.round(value).toLocaleString()}:1`;
  if (value >= 100) return `${value.toFixed(0)}:1`;
  return `${value.toFixed(1)}:1`;
}

export function getGovernmentDetailSections(
  government: GovernmentMetrics,
): GovernmentDetailSections {
  const clinicalTrialRatio =
    getMilitaryToGovernmentClinicalTrialRatio(government);
  const medicalResearchRatio =
    getMilitaryToGovernmentMedicalResearchRatio(government);

  const spendingProfile: GovernmentDetailStatCard[] = [
    {
      label: "Military Spending/yr",
      emoji: "💣",
      value: formatUSD(government.militarySpendingAnnual.value),
      subtitle: `${government.militaryPctGDP.value}% of GDP`,
      source: government.militarySpendingAnnual.source,
      url: government.militarySpendingAnnual.url,
    },
    {
      label: "Health Spending/capita",
      emoji: "🏥",
      value: formatUSD(government.healthSpendingPerCapita.value),
      source: government.healthSpendingPerCapita.source,
      url: government.healthSpendingPerCapita.url,
    },
    {
      label: "Life Expectancy",
      emoji: "⏳",
      value: `${government.lifeExpectancy.value} yrs`,
      source: government.lifeExpectancy.source,
      url: government.lifeExpectancy.url,
    },
  ];

  if (clinicalTrialRatio !== null) {
    spendingProfile.push({
      label: "Military : Trials Ratio",
      emoji: "⚖️",
      value: formatRatio(clinicalTrialRatio),
      subtitle: "Weapons per $1 of government clinical trials",
    });
  }

  if (medicalResearchRatio !== null) {
    spendingProfile.push({
      label: "Military : Research Ratio",
      emoji: "🔬",
      value: formatRatio(medicalResearchRatio),
      subtitle: "Weapons per $1 of total government medical research",
    });
  }

  if (government.govMedicalResearchSpending) {
    spendingProfile.push({
      label: "Gov Medical Research/yr",
      emoji: "🧬",
      value: formatUSD(government.govMedicalResearchSpending.value),
      subtitle: "Total research budget (basic science + overhead + admin)",
      source: government.govMedicalResearchSpending.source,
      url: government.govMedicalResearchSpending.url,
    });
  }

  if (government.clinicalTrialSpending) {
    spendingProfile.push({
      label: "Gov Clinical Trials/yr",
      emoji: "🧪",
      value: formatUSD(government.clinicalTrialSpending.value),
      subtitle: "Actual interventional trials, not total research overhead",
      source: government.clinicalTrialSpending.source,
      url: government.clinicalTrialSpending.url,
    });
  }

  spendingProfile.push({
    label: "Arms Exports/yr",
    emoji: "🔫",
    value: formatUSD(government.armsExportsAnnual.value),
    source: government.armsExportsAnnual.source,
    url: government.armsExportsAnnual.url,
  });

  spendingProfile.push({
    label: "Debt",
    emoji: "💳",
    value: `${government.debtPctGDP.value}% of GDP`,
    source: government.debtPctGDP.source,
  });

  if (government.corporateWelfareAnnual) {
    spendingProfile.push({
      label: "Corporate Welfare/yr",
      emoji: "🏦",
      value: formatUSD(government.corporateWelfareAnnual.value),
      source: government.corporateWelfareAnnual.source,
      url: government.corporateWelfareAnnual.url,
    });
  }

  if (government.fossilFuelSubsidies) {
    spendingProfile.push({
      label: "Fossil Fuel Subsidies/yr",
      emoji: "🛢️",
      value: formatUSD(government.fossilFuelSubsidies.value),
      source: government.fossilFuelSubsidies.source,
      url: government.fossilFuelSubsidies.url,
    });
  }

  if (government.farmSubsidies) {
    spendingProfile.push({
      label: "Farm Subsidies/yr",
      emoji: "🌾",
      value: formatUSD(government.farmSubsidies.value),
      source: government.farmSubsidies.source,
      url: government.farmSubsidies.url,
    });
  }

  const bodyCount: GovernmentDetailStatCard[] = [
    {
      label: "Body Count",
      emoji: "💀",
      value: formatNumber(government.militaryDeathsCaused.value),
      subtitle: government.militaryDeathsCaused.period,
      source: government.militaryDeathsCaused.source,
      url: government.militaryDeathsCaused.url,
    },
    {
      label: "Nuclear Warheads",
      emoji: "☢️",
      value: formatNumber(government.nuclearWarheads.value),
      source: government.nuclearWarheads.source,
      url: government.nuclearWarheads.url,
    },
  ];

  if (government.civilianDeathsCaused) {
    bodyCount.push({
      label: "Civilian Deaths",
      emoji: "🪦",
      value: formatNumber(government.civilianDeathsCaused.value),
      source: government.civilianDeathsCaused.source,
      url: government.civilianDeathsCaused.url,
    });
  }

  if (government.countriesBombed) {
    bodyCount.push({
      label: "Countries Bombed",
      emoji: "💥",
      value: formatNumber(government.countriesBombed.value),
      source: government.countriesBombed.source,
      url: government.countriesBombed.url,
    });
  }

  if (government.droneStrikes) {
    bodyCount.push({
      label: "Drone Strikes",
      emoji: "🎯",
      value: formatNumber(government.droneStrikes.value),
      source: government.droneStrikes.source,
      url: government.droneStrikes.url,
    });
  }

  if (government.refugeesCreated) {
    bodyCount.push({
      label: "Refugees Created",
      emoji: "🏃",
      value: formatNumber(government.refugeesCreated.value),
      source: government.refugeesCreated.source,
      url: government.refugeesCreated.url,
    });
  }

  if (government.sanctionsDeathsAttributed) {
    bodyCount.push({
      label: "Sanctions Deaths",
      emoji: "🚫",
      value: formatNumber(government.sanctionsDeathsAttributed.value),
      source: government.sanctionsDeathsAttributed.source,
      url: government.sanctionsDeathsAttributed.url,
    });
  }

  const justiceAndDomestic: GovernmentDetailStatCard[] = [
    {
      label: "Homicide Rate /100K",
      emoji: "🔪",
      value: government.homicideRate.value.toFixed(1),
      source: government.homicideRate.source,
      url: government.homicideRate.url,
    },
    {
      label: "Incarceration /100K",
      emoji: "⛓️",
      value: formatNumber(government.incarcerationRate.value),
      source: government.incarcerationRate.source,
      url: government.incarcerationRate.url,
    },
  ];

  if (government.murderClearanceRate) {
    justiceAndDomestic.push({
      label: "Murders Solved",
      emoji: "🔍",
      value: `${government.murderClearanceRate.value}%`,
      source: government.murderClearanceRate.source,
      url: government.murderClearanceRate.url,
    });
  }

  if (government.drugPrisoners) {
    justiceAndDomestic.push({
      label: "Drug Prisoners",
      emoji: "🚔",
      value: formatNumber(government.drugPrisoners.value),
      source: government.drugPrisoners.source,
      url: government.drugPrisoners.url,
    });
  }

  if (government.drugWarSpendingAnnual) {
    justiceAndDomestic.push({
      label: "Drug War Spending/yr",
      emoji: "💊",
      value: formatUSD(government.drugWarSpendingAnnual.value),
      source: government.drugWarSpendingAnnual.source,
      url: government.drugWarSpendingAnnual.url,
    });
  }

  if (government.drugOverdoseDeaths) {
    justiceAndDomestic.push({
      label: "Overdose Deaths/yr",
      emoji: "☠️",
      value: formatNumber(government.drugOverdoseDeaths.value),
      source: government.drugOverdoseDeaths.source,
      url: government.drugOverdoseDeaths.url,
    });
  }

  if (government.policeKillingsAnnual) {
    justiceAndDomestic.push({
      label: "Police Killings/yr",
      emoji: "🚨",
      value: formatNumber(government.policeKillingsAnnual.value),
      source: government.policeKillingsAnnual.source,
      url: government.policeKillingsAnnual.url,
    });
  }

  if (government.privatePrisonPopulation) {
    justiceAndDomestic.push({
      label: "Private Prison Population",
      emoji: "🏗️",
      value: formatNumber(government.privatePrisonPopulation.value),
      source: government.privatePrisonPopulation.source,
      url: government.privatePrisonPopulation.url,
    });
  }

  return {
    spendingProfile,
    bodyCount,
    justiceAndDomestic,
  };
}
