import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/impact-params/parameters"

export interface ShareTemplateOption {
  label: string
  text: string
}

const nuclearWinterWarheads = Math.round(NUCLEAR_WINTER_WARHEAD_THRESHOLD.value).toLocaleString()
const apocalypseBudget = (Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value / 10) * 10).toLocaleString()
const proposedApocalypseBudget = (Math.round(NUCLEAR_WINTER_OVERKILL_FACTOR.value / 10) * 10 - 1).toLocaleString()
const trialCapacityMultiplier = DFDA_TRIAL_CAPACITY_MULTIPLIER.value.toFixed(1)
const statusQuoTimelineYears = Math.round(STATUS_QUO_QUEUE_CLEARANCE_YEARS.value).toLocaleString()
const redirectedTimelineYears = Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value).toLocaleString()

export const SHARE_COPY_FACTS = {
  nuclearWinterWarheads,
  apocalypseBudget,
  proposedApocalypseBudget,
  trialCapacityMultiplier,
  statusQuoTimelineYears,
  redirectedTimelineYears,
} as const

export const SHARE_COPY = {
  subject: "Take 30 seconds to eradicate disease",
  coreNarrative:
    `It takes only ${nuclearWinterWarheads} nuclear weapons to trigger a nuclear winter. ` +
    `Humanity budgets for ${apocalypseBudget} apocalypses. ` +
    `Redirecting 1% of military spending to clinical trials could increase capacity ${trialCapacityMultiplier}x, potentially compressing the time to disease eradication from ${statusQuoTimelineYears} years to ${redirectedTimelineYears} years.`,
  socialShareText:
    `It takes only ${nuclearWinterWarheads} nuclear weapons to trigger a nuclear winter. ` +
    `Humanity budgets for ${apocalypseBudget} apocalypses. ` +
    `Redirecting 1% to clinical trials could increase capacity ${trialCapacityMultiplier}x, potentially compressing the time to disease eradication from ${statusQuoTimelineYears} years to ${redirectedTimelineYears} years. ` +
    `Take 30 seconds to eradicate disease.`,
} as const

export function getShareWebsiteLabel(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function buildShareCta(url: string): string {
  return `Take 30 seconds to eradicate disease at ${url}`
}

export function buildShareMessage(url: string): string {
  return `${SHARE_COPY.coreNarrative} ${buildShareCta(url)}`
}

export function buildOrganizationShareMessage(organizationName: string, url: string): string {
  return `${organizationName} is asking supporters to weigh a simple tradeoff. ${SHARE_COPY.coreNarrative} ${buildShareCta(url)}`
}

export function getDefaultShareTemplates(url: string) {
  return [
    {
      label: "You Are Going to Die",
      text:
        `Your chance of dying from terrorism: 1 in 30 million. ` +
        `Your chance of dying from disease: 100%. ` +
        `Redirecting 1% of military spending to clinical trials could increase capacity ${trialCapacityMultiplier}x, potentially compressing the time to disease eradication from ${statusQuoTimelineYears} years to ${redirectedTimelineYears} years. ${url}`,
    },
    {
      label: "One Holocaust Every 40 Days",
      text:
        `150,000 humans die every 24 hours from curable diseases. ` +
        `That's one Holocaust every 40 days. ` +
        `Fifty 9/11s every single day. ` +
        `Nobody invades anyone about it because diseases don't have oil. ` +
        `Take 30 seconds to fix it: ${url}`,
    },
    {
      label: "You'll Be Dead First",
      text:
        `6,650 diseases have zero FDA-approved treatments. ` +
        `At the current discovery rate, finding treatments for all of them will take 443 years. ` +
        `You'll be dead first. ` +
        `Redirect 1% of military spending to clinical trials: ${url}`,
    },
    {
      label: "We Already Did This After WW2",
      text:
        `After WW2, governments cut military spending 87.6% in two years and stumbled into the greatest economic boom in history. ` +
        `1% of that could increase clinical trial capacity ${trialCapacityMultiplier}x, potentially compressing the time to disease eradication from ${statusQuoTimelineYears} years to ${redirectedTimelineYears} years. ${url}`,
    },
    {
      label: "How Many Apocalypses Do You Need?",
      text:
        `${nuclearWinterWarheads} nuclear weapons = nuclear winter. ` +
        `Humanity budgets for ${apocalypseBudget} apocalypses. ` +
        `Settle for ${proposedApocalypseBudget} and redirect 1% to clinical trials, which could increase capacity ${trialCapacityMultiplier}x and potentially compress the time to disease eradication from ${statusQuoTimelineYears} years to ${redirectedTimelineYears} years. ${url}`,
    },
    {
      label: "If Cancer Had Oil",
      text:
        `If cancer had oil reserves, we'd have cured it by 2003. ` +
        `Instead, governments spend 604x more on weapons than on testing which medicines work. ` +
        `Redirect 1% of military spending to clinical trials. Take 30 seconds: ${url}`,
    },
  ] satisfies ShareTemplateOption[]
}

export function getOrganizationShareTemplates(organizationName: string, url: string) {
  return [
    {
      label: "You Are Going to Die",
      text:
        `${organizationName}: your chance of dying from terrorism is 1 in 30 million. ` +
        `Your chance of dying from disease is 100%. ` +
        `Redirecting 1% of military spending to clinical trials could increase capacity ${trialCapacityMultiplier}x, potentially compressing the time to disease eradication from ${statusQuoTimelineYears} years to ${redirectedTimelineYears} years. ${url}`,
    },
    {
      label: "One Holocaust Every 40 Days",
      text:
        `${organizationName}: 150,000 humans die every 24 hours from curable diseases. ` +
        `That's one Holocaust every 40 days. ` +
        `Fifty 9/11s every single day. ` +
        `Nobody invades anyone about it because diseases don't have oil. ${url}`,
    },
    {
      label: "You'll Be Dead First",
      text:
        `${organizationName}: 6,650 diseases have zero FDA-approved treatments. ` +
        `At the current discovery rate, finding treatments for all of them will take 443 years. ` +
        `You'll be dead first. Redirect 1% of military spending to clinical trials: ${url}`,
    },
    {
      label: "We Already Did This After WW2",
      text:
        `${organizationName}: After WW2, governments cut military spending 87.6% in two years and stumbled into the greatest economic boom in history. ` +
        `1% of that could increase clinical trial capacity ${trialCapacityMultiplier}x, potentially compressing the time to disease eradication from ${statusQuoTimelineYears} years to ${redirectedTimelineYears} years. ${url}`,
    },
    {
      label: "How Many Apocalypses Do You Need?",
      text:
        `${organizationName}: ${nuclearWinterWarheads} nuclear weapons = nuclear winter. ` +
        `Humanity budgets for ${apocalypseBudget} apocalypses. ` +
        `Settle for ${proposedApocalypseBudget} and redirect 1% to clinical trials, which could increase capacity ${trialCapacityMultiplier}x and potentially compress the time to disease eradication from ${statusQuoTimelineYears} years to ${redirectedTimelineYears} years. ${url}`,
    },
    {
      label: "If Cancer Had Oil",
      text:
        `${organizationName}: if cancer had oil reserves, we'd have cured it by 2003. ` +
        `Instead, governments spend 604x more on weapons than on testing which medicines work. ` +
        `Redirect 1% of military spending to clinical trials: ${url}`,
    },
  ] satisfies ShareTemplateOption[]
}
