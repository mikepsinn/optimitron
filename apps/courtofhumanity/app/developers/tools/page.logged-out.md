# /developers/tools

## Metadata

- Page title: MCP Tool Reference | Court of Humanity
- Meta description: Court of Humanity MCP tools, parameters, and access rules.
- Canonical: https://courtofhumanity.org/developers/tools
- Open Graph title: The Court of Humanity
- Open Graph description: The public court where humanity brings cases against institutions that harm people. Inspect the evidence, register plaintiffs, and render a verified verdict.
- Open Graph image: https://courtofhumanity.org/assets/courtofhumanity/courtofhumanity-og-1200x630.png
- Twitter title: The Court of Humanity
- Twitter description: The public court where humanity brings cases against institutions that harm people. Inspect the evidence, register plaintiffs, and render a verified verdict.

## Visible Page Copy

## COURT MCP TOOL REFERENCE
- These eight tools run on Court of Humanity. Each requires an authenticated connection with earthdata:write. Case ownership and record privacy apply to every call.
- To moderate someone else’s public case, an administrator also needs earthdata:admin. Private records remain restricted to their owner.
- [Connection instructions](/mcp) · [JSON catalog](/api/mcp/tools)
### upsertCourtCase
- Create or update a Court of Humanity case root record.
### addCourtCaseParty
- Attach a plaintiff, respondent, class, beneficiary, or amicus Subject to a Court of Humanity case.
### addCourtCaseClaim
- Add a structured allegation or requested finding to a Court of Humanity case.
### addCourtCaseHarm
- Add a quantified or qualitative harm catalog row to a Court of Humanity case.
### addCourtCaseEvidence
- Attach public non-sensitive evidence to a Court of Humanity case, claim, or harm.
### addCourtCaseRemedy
- Add a requested remedy that can point at an existing enforcement Task.
### getCourtCase
- Fetch a Court of Humanity case with parties, claims, harms, evidence, remedies, and jury referendum.
### openCourtCaseJuryVote
- Open or update the public referendum used as a Court of Humanity jury vote.
