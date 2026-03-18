import type { CivicRepresentative } from "./civic-data";
import type { BillCBA } from "./civic-cba";

export interface RepresentativeLetter {
  subject: string;
  body: string;
  contactUrl: string;
}

/**
 * Generate a plain-text letter for a citizen to send to their representative
 * about a bill they voted on.
 */
export function buildRepresentativeLetter(
  vote: {
    billId: string;
    billTitle: string;
    position: string;
    reasoning?: string;
    cba?: BillCBA;
  },
  representative: CivicRepresentative,
): RepresentativeLetter {
  const positionVerb = vote.position === "YES" ? "support" : "oppose";
  const positionLabel = vote.position === "YES" ? "in favor of" : "against";

  const cbaSection = vote.cba?.llm
    ? `\n\nCost-benefit analysis suggests: ${vote.cba.llm.summary}\n`
    : "";

  const reasoningSection = vote.reasoning
    ? `\n\nMy reasoning: ${vote.reasoning}\n`
    : "";

  const body = `Dear ${representative.title} ${representative.name},

I am writing as a constituent to express my position ${positionLabel} ${vote.billTitle} (${vote.billId}).

I ${positionVerb} this legislation.${reasoningSection}${cbaSection}

Thank you for considering the views of your constituents. I look forward to seeing how you vote on this important matter.

Sincerely,
A Concerned Constituent

---
Generated via Optimitron Civic Engagement Platform`;

  const contactUrl = representative.contactUrl
    ?? `https://www.congress.gov/member/${encodeURIComponent(representative.name.toLowerCase().replace(/\s+/g, "-"))}/${representative.bioguideId}`;

  return {
    subject: `Constituent Position on ${vote.billTitle}`,
    body,
    contactUrl,
  };
}
