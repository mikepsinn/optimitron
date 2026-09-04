/**
 * Court of Humanity referendum body.
 *
 * Hand-edited because `parameters-calculations-citations.ts` is
 * AUTO-GENERATED from QMD source files in the manual repo
 * (`disease-eradication-plan/knowledge/...`), and the Python generator
 * does not yet pull `court-of-humanity.qmd` into its source list. Putting
 * the body here lets us ship without a cross-repo PR.
 *
 * When the Python generator catches up and `shareableSnippets.courtOfHumanityText`
 * starts appearing in the auto-generated file, this module can be deleted
 * and the import in `apps/optimitron/src/config/referendums.ts` switched to
 * `shareableSnippets.courtOfHumanityText`. Keep the export shape compatible
 * (`{ markdown, sourceFile, originalName }`) to make that migration trivial.
 *
 * Treaty body (`onePercentTreatyText`) intentionally stays in the
 * auto-generated file because the QMD pipeline already produces it.
 */
export const COURT_OF_HUMANITY_QUESTION =
  "If a government kills, injures, or harms you or your family, should you have the same right to sue it that you would have if a corporation did the same?";

export const COURT_OF_HUMANITY_TEXT = {
  markdown: `The Court of Humanity is a public court for claims against institutions that affect human welfare. It operates independently of governments.

By joining, you support a process in which people can inspect claims and evidence, register affected humans as plaintiffs, and cast one verified verdict per person.

**Article I**: Each case must state its claims, cite its evidence, and give named defendants a clear opportunity to respond.

**Article II**: Any verified human may join the Court. One human may hold one membership and cast one vote on each case.

**Article III**: Verdicts record the verified opinions of participating members. They do not create legal liability or replace proceedings in a court with lawful jurisdiction.

**Article IV**: Joining does not file a lawsuit, create an attorney-client relationship, waive legal rights, or enroll a member in another campaign.

By adding my name below, I join the Court of Humanity and support public cases decided through open evidence and verified human votes.
`,
  sourceFile: "knowledge/solution/court-of-humanity.qmd",
  originalName: "court-of-humanity-text",
} as const;
