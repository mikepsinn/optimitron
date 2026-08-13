/**
 * Centralized messaging constants for consistent language across the entire project.
 *
 * Benefits:
 * - Single source of truth for all user-facing messaging
 * - Easy to update messaging globally
 * - Type-safe with autocomplete
 * - Consistent tone and phrasing
 * - Easy A/B testing of different phrasings
 */

import {
  EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  GLOBAL_REGISTERED_VOTERS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  TREATY_PEACE_PLUS_RD_ANNUAL_BENEFITS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  RECOVERY_TRIAL_COST_REDUCTION_FACTOR,
  HOURS_PER_YEAR,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/impact-params/parameters"
import { formatParameter } from "@optimitron/impact-params/format"

// ============================================================================
// FORMATTED VALUES - Use formatParameter() for consistent sig figs
// ============================================================================

// Efficacy lag (per-treatment patient access framing)
const efficacyLagFormatted = formatParameter(EFFICACY_LAG_YEARS)

// Timeline shift (aggregate systemic impact)
const timelineShiftYearsRounded = Math.round(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS.value)
const timelineShiftLivesSavedFormatted = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED)
const timelineShiftDalysFormatted = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS)
const timelineShiftEconomicValueFormatted = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE)
const timelineShiftSufferingHoursFormatted = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS)

// Movement/humanity targets
const votingTargetFormatted = formatParameter(GLOBAL_REGISTERED_VOTERS)

// Economic values
const recurringBenefitFormatted = formatParameter(TREATY_PEACE_PLUS_RD_ANNUAL_BENEFITS)
const oneTimeHealthValueFormatted = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE)

// ============================================================================
// RAW VALUES - For calculations and Number fields
// ============================================================================
const totalLivesSavedRaw = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value
const recurringBenefitValue = TREATY_PEACE_PLUS_RD_ANNUAL_BENEFITS.value
const oneTimeHealthValueNumber = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value

// Per-vote impact values generated against the majority-of-humanity denominator.
const sufferingYearsPerVote = VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR.value
const sufferingYearsPerVoteRounded = Math.round(sufferingYearsPerVote)
const livesSavedPerVoteRaw = VOTER_LIVES_SAVED.value
const livesSavedPerVoteFormatted = livesSavedPerVoteRaw.toFixed(1)

export const MESSAGING = {
  /** Core impact statistics and claims */
  impact: {
    /** How much faster cures reach patients through pragmatic trials
     *
     * Use "perTreatment" variants (8.2 years) for individual patient access framing
     * Use "systemic" variants (212 years) for aggregate impact calculations (lives saved, DALYs, etc.)
     */
    curesArriveXYearsSooner: {
      // Per-treatment framing (individual patient access - 8.2 year efficacy lag)
      full: `getting new cures to patients at least ${efficacyLagFormatted} years sooner`,
      short: `getting cures to patients ${efficacyLagFormatted} years sooner`,
      veryShort: `accelerate cures by ${efficacyLagFormatted} years`,
      noun: `${efficacyLagFormatted} years of faster cures`,
      years: efficacyLagFormatted,
      // Systemic framing (aggregate impact - 212 year timeline shift)
      systemicFull: `shifting treatment timelines ${timelineShiftYearsRounded} years earlier on average`,
      systemicShort: `${timelineShiftYearsRounded}-year average timeline shift`,
      systemicNoun: `${timelineShiftYearsRounded}-year timeline shift`,
      systemicYears: timelineShiftYearsRounded,
    },

    /** What ONE person's vote accomplishes (individual impact) */
    perVote: {
      livesSaved: `${livesSavedPerVoteFormatted} lives saved`,
      livesSavedNumber: livesSavedPerVoteRaw,
      sufferingYearsPrevented: `${sufferingYearsPerVoteRounded} years of suffering prevented`,
      sufferingYearsPreventedNumber: sufferingYearsPerVoteRounded,
      combined: `${livesSavedPerVoteFormatted} lives saved + ${sufferingYearsPerVoteRounded} years of suffering prevented`,
    },

    /** Global impact if we reach the voting target */
    globalImpactAtTippingPoint: {
      totalLivesSaved: `${timelineShiftLivesSavedFormatted} lives`,
      totalLivesSavedNumber: totalLivesSavedRaw,
      livesSavedPhrase: `save ${timelineShiftLivesSavedFormatted} lives`,
      // One-time benefit from accelerating when cures arrive
      oneTimeHealthValue: `${oneTimeHealthValueFormatted} one-time health value`,
      oneTimeHealthValueNumber: oneTimeHealthValueNumber,
      // Recurring annual benefits (peace dividend + R&D savings)
      recurringAnnualBenefit: `${recurringBenefitFormatted} recurring annually`,
      recurringAnnualBenefitNumber: recurringBenefitValue,
    },

    /** Timeline shift impact - one-time gains from accelerating when cures arrive */
    timelineShift: {
      years: timelineShiftYearsRounded,
      yearsPhrase: `${timelineShiftYearsRounded}-year timeline shift`,
      livesSaved: timelineShiftLivesSavedFormatted,
      livesSavedPhrase: `${timelineShiftLivesSavedFormatted} lives saved`,
      dalysAverted: timelineShiftDalysFormatted,
      dalysAvertedPhrase: `${timelineShiftDalysFormatted} DALYs averted`,
      economicValue: timelineShiftEconomicValueFormatted,
      economicValuePhrase: `${timelineShiftEconomicValueFormatted} total value`,
      sufferingHoursEliminated: timelineShiftSufferingHoursFormatted,
      sufferingHoursPhrase: `${timelineShiftSufferingHoursFormatted} hours of suffering eliminated`,
    },

    /** Disease treatment statistics */
    diseasesCured: {
      percentWithNoTreatment: "95%",
      percentWithNoTreatmentPhrase: "95% of diseases have no FDA-approved treatment",
    },

    /** Cost reduction from pragmatic trials */
    costReduction: {
      multiplier: `${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}×`,
      multiplierPhrase: `${RECOVERY_TRIAL_COST_REDUCTION_FACTOR.value}× cheaper`,
    },

    /** Core vision/mission phrases */
    vision: {
      makeSufferingOptional: "make suffering optional",
      sufferingOptional: "suffering optional",
      endPreventableSuffering: "end preventable suffering",
    },
  },

  /** How the system works (mechanism) */
  mechanism: {
    pragmaticTrials: "pragmatic clinical trials",
    ubiquitousPragmaticTrials: "ubiquitous pragmatic clinical trials",
    realTimeEfficacyTrials: "real-time efficacy trials",
    patientAccessAfterSafetyTesting: "patients access promising treatments after safety testing while collecting real-world efficacy data",
  },

  /** dFDA terminology - abstract framework framing */
  dfda: {
    /** Full term (lowercase for abstract concept) */
    fullTerm: "decentralized framework for drug assessment",

    /** Abbreviated form */
    abbreviation: "dFDA",

    /** Full with abbreviation */
    fullWithAbbreviation: "decentralized framework for drug assessment (dFDA)",

    /** Plural form for general concept */
    plural: "decentralized frameworks for drug assessment",
    pluralWithAbbreviation: "decentralized frameworks for drug assessment (dFDAs)",

    /** Article + term variations */
    indefiniteArticle: "a decentralized framework for drug assessment",
    indefiniteWithAbbreviation: "a decentralized framework for drug assessment (dFDA)",
    indefiniteShort: "a dFDA",

    /** What it does */
    purpose: "ranks treatments by real-world effectiveness",
    comparison: "The current FDA approves treatments. A decentralized framework for drug assessment (dFDA) ranks them.",

    /** Implementation framing (not proprietary) */
    implementationPhrase: "implementing a dFDA approach",
    adoptionPhrase: "when dFDA frameworks are widely adopted",
  },

  /** Call-to-action phrases for buttons, links, and shares */
  callToAction: {
    votePhrase: {
      short: "Vote to make suffering optional",
      full: "Vote to make suffering optional through pragmatic clinical trials",
      withPersonalImpact: `Vote to save ${livesSavedPerVoteFormatted} lives and prevent ${sufferingYearsPerVoteRounded} years of suffering`,
    },

    joinMovement: {
      short: "Help make suffering optional",
      full: `Help get cures to patients ${efficacyLagFormatted} years sooner`,
      withGlobalImpact: `Help save ${timelineShiftLivesSavedFormatted} lives`,
    },

    quickAction: {
      thirtySecondsSufferingOptional: "Take 30 seconds to make suffering optional",
      thirtySecondsWithImpact: `Take 30 seconds to save ${livesSavedPerVoteFormatted} lives and prevent ${sufferingYearsPerVoteRounded} years of suffering`,
    },

    helpPhrase: "Help make suffering optional",
  },

  /** Time commitments and survey structure */
  timeCommitment: {
    votingTakesThirtySeconds: "30 seconds",
    twoQuestionSurvey: "2-question survey",
    thirtySecondSurvey: "30-second survey",
  },

  /** Survey branding and vote question wording */
  survey: {
    officialName: "Global Clinical Trial Abundance Survey",
    organizationSurveyName: (orgName: string) => `${orgName}'s Global Clinical Trial Abundance Survey`,

    /** The actual question users vote on */
    voteQuestion: {
      short: "Should all nations work together to make suffering optional through pragmatic clinical trials?",
      full: `Should all nations work together to make suffering optional through pragmatic clinical trials, accelerating cures by ${efficacyLagFormatted} years and ensuring no country is at a disadvantage?`,
    },
  },

  /** Organization/movement descriptions for meta tags and about pages */
  organizationDescription: {
    /** Standard description - aspirational and impact-focused */
    standard: "A global campaign to make suffering optional through pragmatic clinical trials.",

    /** Full description with impact numbers */
    withImpactNumbers: `A global campaign to make suffering optional through pragmatic clinical trials. Get new cures to patients ${efficacyLagFormatted} years sooner and save ${timelineShiftLivesSavedFormatted} lives.`,

    /** Non-political variant for organizations nervous about advocacy */
    nonPoliticalResearchFraming: "A global research initiative to accelerate medical progress through pragmatic clinical trials.",
  },

  /** Social proof and movement credibility numbers */
  movementGoals: {
    humansNeededForMajorityOfEarth: `${votingTargetFormatted} humans`,
    majorityOfHumansOnEarth: `${votingTargetFormatted} humans`,
  },

  /** Section headers and titles for UI components */
  sectionHeaders: {
    makingSufferingOptionalTheMath: "Making Suffering Optional: The Math",
    pragmaticTrialsMakeCuresFaster: "Pragmatic Trials Make Cures Faster",
    yourImpactPerHourOfSharing: "Your Impact Per Hour of Sharing",
    livesSaved: "Lives saved",
    sufferingPrevented: "Suffering Prevented",
    economicValue: "Economic Value",
    votesRequired: "Votes required",
  },

  /** Detailed mechanism explanations (longer form) */
  mechanismExplanations: {
    howPragmaticTrialsWork: "Ubiquitous pragmatic trials let patients access promising treatments after safety testing, while collecting real-world efficacy data.",

    eliminatesRegulatoryDelay: (years: number) => `This eliminates the current ${years}-year regulatory delay`,

    makingSufferingOptionalForMillions: "making suffering optional for millions waiting for cures",
    makingSufferingOptionalForThousands: "making suffering optional for thousands",

    fullPragmaticTrialsExplanation: (regulatoryDelayYears: number) =>
      `Ubiquitous pragmatic trials let patients access promising treatments after safety testing, while collecting real-world efficacy data. This eliminates the current ${regulatoryDelayYears}-year regulatory delay, making suffering optional for millions waiting for cures.`,
  },

  /** Phrases about the regulatory system */
  regulatory: {
    regulatoryDelay: (years: number) => `${years}-year regulatory delay`,
    currentRegulatoryDelay: "current regulatory delay",
    eliminatesDelay: "eliminates the delay",
  },

  /** Impact scale qualifiers (thousands/millions affected) */
  impactScale: {
    forMillions: "for millions",
    forThousands: "for thousands",
    perPerson: "per person",
    globally: "globally",
  },
} as const

/** Helper to get appropriate messaging based on political sensitivity context */
export const getMessagingForContext = (context: 'withImpactNumbers' | 'nonPoliticalResearch' = 'withImpactNumbers') => {
  return {
    ...MESSAGING,
    description: context === 'withImpactNumbers'
      ? MESSAGING.organizationDescription.withImpactNumbers
      : MESSAGING.organizationDescription.nonPoliticalResearchFraming,
  }
}

/** Type-safe helper for composing impact messages */
export const composeImpactMessage = (options: {
  includeLivesSaved?: boolean
  includeSufferingPrevented?: boolean
  includeTimeCommitment?: boolean
  includeMechanism?: boolean
}) => {
  const parts: string[] = []

  if (options.includeLivesSaved) parts.push(MESSAGING.impact.perVote.livesSaved)
  if (options.includeSufferingPrevented) parts.push(MESSAGING.impact.perVote.sufferingYearsPrevented)

  let message = parts.join(' + ')

  if (options.includeTimeCommitment) message += ` (${MESSAGING.timeCommitment.votingTakesThirtySeconds})`
  if (options.includeMechanism) message += ` through ${MESSAGING.mechanism.pragmaticTrials}`

  return message
}

/** Example usage:
 *
 * import { MESSAGING, composeImpactMessage } from './messaging'
 *
 * // In email signature:
 * `Help ${MESSAGING.impact.vision.makeSufferingOptional}: ${MESSAGING.callToAction.votePhrase.short}`
 *
 * // In share template:
 * `Your vote = ${composeImpactMessage({
 *   includeLivesSaved: true,
 *   includeSufferingPrevented: true,
 *   includeTimeCommitment: true
 * })}`
 * // → "{lives} lives saved + {years} years of suffering prevented (30 seconds)"
 *
 * // In OG image description:
 * MESSAGING.callToAction.votePhrase.full
 * // → "Vote to make suffering optional through pragmatic clinical trials"
 *
 * // Getting cures to patients sooner:
 * MESSAGING.impact.curesArriveXYearsSooner.full
 * // → "getting new cures to patients at least 8.2 years sooner"
 */
