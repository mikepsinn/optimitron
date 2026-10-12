import snapshot from "./state-trials.json"
import { US_STATES, type StateName } from "./us-states"

/**
 * Drug and biologic trials recruiting in each state, for the conditions on the state pages, from a
 * ClinicalTrials.gov snapshot (scripts/state-trials.ts writes lib/state-trials.json).
 *
 * A trial counts for a state when it is an interventional trial recruiting at the study level, at least
 * one of its interventions is a drug, biologic, gene therapy or drug-device combination, and one of its
 * sites in that state is recruiting. ClinicalTrials.gov's own search counts observational studies,
 * device and behavioral trials, and sites that have closed or not opened, which overstates what a
 * patient could join several times over.
 */

// A trial's conditions as its sponsor listed them, and the MeSH terms ClinicalTrials.gov derived from them.
type TrialTerms = { listed: string[]; mesh: string[] }

const listedMatch = (pattern: RegExp) => ({ listed }: TrialTerms) => listed.some(condition => pattern.test(condition))

/**
 * The conditions the state pages show, and how a trial matches each. Matching uses the conditions the sponsor
 * listed: ClinicalTrials.gov's derived MeSH terms are too loose (it maps "Amyloid" to Alzheimer Disease, so heart
 * amyloidosis trials matched). Cancer also accepts the Neoplasms MeSH term, which catches cancers listed only by
 * abbreviation, such as NSCLC or AML.
 */
export const TRIAL_CONDITIONS = {
  diabetes: { label: "Diabetes", matches: listedMatch(/diabet/i) },
  kidney: {
    label: "Chronic kidney disease",
    matches: listedMatch(/chronic kidney|\bckd\b|renal insufficiency, chronic|kidney failure, chronic|end[- ]stage (renal|kidney)|\besrd\b/i),
  },
  depression: {
    label: "Depression",
    matches: ({ listed }: TrialTerms) =>
      listed.some(condition => /\bdepress(ion|ive)\b/i.test(condition) && !/respiratory/i.test(condition)),
  },
  cancer: {
    label: "Cancer",
    matches: ({ listed, mesh }: TrialTerms) =>
      mesh.includes("Neoplasms") ||
      listed.some(condition => /cancer|carcinoma|lymphoma|leuka?emia|myeloma|melanoma|sarcoma|glioma|blastoma|tumou?r|neoplasm|malignan/i.test(condition)),
  },
  copd: { label: "COPD", matches: listedMatch(/\bcopd\b|chronic obstructive (pulmonary|lung)/i) },
  alzheimers: { label: "Alzheimer's disease", matches: listedMatch(/alzheimer/i) },
} as const

export type TrialConditionId = keyof typeof TRIAL_CONDITIONS

const DRUG_INTERVENTIONS = new Set(["DRUG", "BIOLOGICAL", "GENETIC", "COMBINATION_PRODUCT"])

/** Above this many trials, the snapshot keeps only the count, and the link opens a broader search. */
export const MAX_LISTED_TRIALS = 100

/** The parts of a ClinicalTrials.gov API v2 study the counts read. */
export interface CtgovStudy {
  protocolSection: {
    identificationModule: { nctId: string }
    conditionsModule?: { conditions?: string[] }
    armsInterventionsModule?: { interventions?: { type?: string }[] }
    contactsLocationsModule?: { locations?: { state?: string; status?: string; country?: string }[] }
  }
  derivedSection?: { conditionBrowseModule?: { meshes?: { term: string }[]; ancestors?: { term: string }[] } }
}

export interface StateConditionTrials {
  count: number
  /** The trials, when there are no more than MAX_LISTED_TRIALS. */
  ids?: string[]
}

export type StateTrialCounts = Record<StateName, Record<TrialConditionId, StateConditionTrials>>

const stateNames = new Set<string>(US_STATES.map(([name]) => name))

/** Counts each state's drug and biologic trials per condition, from recruiting interventional studies. */
export function tallyStateTrials(studies: CtgovStudy[]): StateTrialCounts {
  const ids = new Map<string, Set<string>>()
  for (const study of studies) {
    const { protocolSection: protocol, derivedSection } = study
    const interventions = protocol.armsInterventionsModule?.interventions ?? []
    if (!interventions.some(intervention => DRUG_INTERVENTIONS.has(intervention.type ?? ""))) continue
    const browse = derivedSection?.conditionBrowseModule
    const terms: TrialTerms = {
      listed: protocol.conditionsModule?.conditions ?? [],
      mesh: [...(browse?.meshes ?? []), ...(browse?.ancestors ?? [])].map(term => term.term),
    }
    const conditions = (Object.keys(TRIAL_CONDITIONS) as TrialConditionId[]).filter(id => TRIAL_CONDITIONS[id].matches(terms))
    if (!conditions.length) continue
    const states = new Set(
      (protocol.contactsLocationsModule?.locations ?? [])
        .filter(location => location.country === "United States" && location.status === "RECRUITING")
        .map(location => location.state ?? "")
        .filter(state => stateNames.has(state)),
    )
    for (const state of states) {
      for (const condition of conditions) {
        const key = `${state}|${condition}`
        if (!ids.has(key)) ids.set(key, new Set())
        ids.get(key)!.add(protocol.identificationModule.nctId)
      }
    }
  }
  return Object.fromEntries(US_STATES.map(([state]) => [
    state,
    Object.fromEntries((Object.keys(TRIAL_CONDITIONS) as TrialConditionId[]).map(condition => {
      const trials = [...(ids.get(`${state}|${condition}`) ?? [])].sort()
      return [condition, trials.length <= MAX_LISTED_TRIALS ? { count: trials.length, ids: trials } : { count: trials.length }]
    })),
  ])) as StateTrialCounts
}

export interface StateTrialsSnapshot {
  /** The day the snapshot was taken, as YYYY-MM-DD. */
  asOf: string
  states: StateTrialCounts
}

export const STATE_TRIALS = snapshot as StateTrialsSnapshot

/**
 * The ClinicalTrials.gov page that shows a count's trials: exactly those trials when the snapshot lists
 * them, or else the broader search for recruiting interventional trials of the condition in the state.
 */
export function stateTrialsUrl(state: StateName, condition: TrialConditionId): string {
  const trials = STATE_TRIALS.states[state][condition]
  if (trials.ids?.length) {
    return `https://clinicaltrials.gov/search?term=${encodeURIComponent(trials.ids.join(" OR "))}`
  }
  const query = new URLSearchParams({
    cond: TRIAL_CONDITIONS[condition].label,
    country: "United States",
    state,
    aggFilters: "status:rec,studyType:int",
  })
  return `https://clinicaltrials.gov/search?${query}`
}
