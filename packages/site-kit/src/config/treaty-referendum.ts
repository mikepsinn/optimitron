import { shareableSnippets } from "@optimitron/data/parameters"
import { splitIntoSlides } from "../components/referendum/ReferendumStepper"

/**
 * Reader configuration for the 1% Treaty.
 *
 * Optimitron keeps this in a `config/referendums.ts` registry covering the
 * treaty, the declaration and the court case, with per-referendum vote handlers
 * wired into its own storage and vote model. The campaign apps need two fields
 * of the treaty entry — the intro line and the fallback slides — so those are
 * here rather than dragging a registry whose vote plumbing does not match
 * site-kit's storage API. The court app can port the full registry when it
 * needs the other entries.
 */
export const TREATY_READER_CONFIG = {
  introText:
    "Please end war and disease by quickly skimming and signing the 1% Treaty.",
  get slides(): string[] {
    return splitIntoSlides(shareableSnippets.onePercentTreatyText.markdown)
  },
}
