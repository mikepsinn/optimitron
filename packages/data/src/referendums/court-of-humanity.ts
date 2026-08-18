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
  markdown: `This is the question your species never put to itself. The reason is structural: the people who would have called the vote are the people who would have lost it.

WHEREAS, if a hospital kills your mother through negligence, you can sue. If a drug company hides safety data, you can sue. If a private security contractor shoots a child by accident, you can sue. If a government does the exact same thing, you cannot;

WHEREAS, the legal doctrine that protects governments is called sovereign immunity, and it descends, without architectural modification, from the principle that the king can do no wrong;

WHEREAS, your species abolished the divine right of kings in the 18th century. You retained the one part of it that needed abolishing;

WHEREAS, sovereign immunity is waivable. Governments can give it up at any time. The United States has waived it for postal-truck collisions, malpractice at federal hospitals, and slip-and-falls in federal buildings. It has not waived it for invading the wrong country, droning the wrong wedding, or imprisoning the wrong person for thirty years. The exclusion is structural, not accidental;

WHEREAS, governments killed approximately [310 million](https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html) of their own and other governments' citizens in the last century, including approximately [102 million](https://manual.WarOnDisease.org/knowledge/problem/cost-of-war.html) children, and the families of these humans were collectively awarded approximately zero dollars;

WHEREAS, your governments' own actuaries value a statistical human life at \\$13.7 million (DOT) to \\$10 million (other agencies). The wrongful-death exposure on those 310 million humans alone runs to roughly \\$3.1 quadrillion before you count the people they would have grown up to become;

WHEREAS, this number is large because the harm is large, not because the math is wrong;

WHEREAS, allowing governments to kill people without consequence is not a feature of democracy. It is the structural form of organized crime, with the addition of a flag;

WHEREAS, the question for you is not whether sovereign immunity is correct. The question is whether you noticed it exists, and whether, having noticed, you are willing to leave it in place;

WHEREAS, the Court of Humanity does not require any government to consent to its existence. It derives its jurisdiction from human consent — specifically, the consent of any verified human who chooses to join. There are approximately 8 billion of those;

WHEREAS, a court whose jurisdiction is human consent rather than sovereign consent has no problem getting humans to show up. The hard part has always been the other one;

WHEREAS, the [International Criminal Court](https://manual.WarOnDisease.org/knowledge/solution/court-of-humanity.html) does not work because it requires the offending governments to either cooperate with prosecutions of themselves or be ignored when they refuse. The Court of Humanity skips the cooperation problem. Bondholders, insurers, treaty parties, and procurement officers recognize its judgments first. Governments follow because their borrowing rates depend on it, and their own bondholders' lawyers — who are very good — point themselves at them in their own domestic courts;

WHEREAS, those bondholders are aligned with the judgments because the judgments are the asset. Compliance pays. Non-compliance is a default event. Default events trigger cross-default clauses on every other instrument the same government has issued. Sovereign immunity stops at the bond market, where the king has been bowing for centuries;

WHEREAS, the [1% Treaty](https://manual.WarOnDisease.org/knowledge/solution/1-percent-treaty.html) becomes the standing settlement offer. A government facing approximately \\$104 quadrillion in cumulative wrongful-death exposure can accept the Treaty's redirect-1%-to-clinical-trials terms in exchange for capped, prospective liability. This is what your species calls a deal;

WHEREAS, voting no requires saying out loud "I believe my government should be allowed to kill my family with no consequences," which almost no human will say when asked, which is why the question, once asked, wins;

WHEREAS, this also seems suboptimal to leave in place;

NOW, THEREFORE, the undersigned humans, having noticed, hereby join the Court of Humanity, as follows:

**Article I**: The Court of Humanity is composed of the verified humans who have joined it. Membership is the act of recording your name as a member; no further training, dues, or robes are required. As of joining, you are simultaneously the plaintiff class, the jury pool, and the body whose collective consent constitutes the court's jurisdiction.

**Article II**: Each member, by joining, declares that the doctrine of sovereign immunity is hereby waived as to any government that has killed, injured, or unlawfully harmed them or their family without due process. Members may bring claims in any forum that will hear them — domestic courts, international tribunals, the Court of Humanity itself — and shall not have those claims dismissed on sovereign-immunity grounds within the Court's jurisdiction.

**Article III**: Standing extends to any verified human, anywhere, against any government, anywhere, for any wrongful act of killing, injuring, or unlawfully detaining a person. Verification uses proof of personhood. One human, one membership, one vote on cases brought before the jury.

**Article IV**: Judgments are enforced through capital markets, not coercion. Governments that fail to honor judgments find their compliant political opponents funded via the [Political Incentive Fund](https://manual.WarOnDisease.org/knowledge/solution/aligning-incentives.html), and find the [Incentive Alignment Bonds](https://manual.WarOnDisease.org/knowledge/appendix/incentive-alignment-bonds-paper.html) issued against their wrongful conduct selling at a price that reflects the market's view of their continued non-compliance. The court does not need an army; it needs only that bondholders have lawyers, which they do.

**Article V**: The [1% Treaty](https://manual.WarOnDisease.org/knowledge/solution/1-percent-treaty.html) is hereby established as the standing settlement offer. Governments may accept the Treaty's terms — redirecting 1% of annual military spending to pragmatic clinical trials, with bondholder and political-incentive structures attached — in exchange for prospective liability caps on Court of Humanity claims arising from acts predating Treaty ratification. Signing gives them a settlement price. Refusing keeps the claims, judgments, and bondholder lawyers pointed at them.

**Article VI**: Membership in the Court of Humanity is irrevocable for the lifetime of the member, but no member may bind their heirs or descendants. Each subsequent generation joins by their own consent. The Court has no head of state, no annual budget, no dues, and no way to be voted out by anyone other than its own members. In this respect it resembles every other institution your species has ever built that actually works.

IN WITNESS WHEREOF, the undersigned humans, being of sound mind (debatable) and tired of watching their governments kill their families with no consequences, hereby join the Court of Humanity.
`,
  sourceFile: "knowledge/solution/court-of-humanity.qmd",
  originalName: "court-of-humanity-text",
} as const;
