# The patient journey: presentation script

The single source for the Care-Integrated Clinical Trials patient journey deck and the explainer
video in [`videos/care-integrated-clinical-trials`](../../../../videos/care-integrated-clinical-trials/README.md).
Change the story here first, then rebuild the deck and the video from it.

The deck is the web app page `/present/patient-journey`
([slides](../../components/present/patient-journey/slides.tsx)). It reads each slide's eyebrow,
title (or headline), subtitle, Say and If asked lines and source line from this file, so edits to
those show up on the next build. The rest of each slide's text is in its component. Keep slide numbers in
step: the page fails to build if a slide here has no component or a component has no slide here.
Keys: arrows or space move between slides, N shows the speaker notes, F goes full screen, and
printing saves a PDF with one page per slide. The notes are public, because this repository is.

**This version:** improved draft 2, for legislators and advocates (October 3, 2026), with plainer
slide text. The deck and this script moved here from the decentralized-fda prototype
(mikepsinn/dfda, `apps/web`) on October 6, 2026. Its history has the earlier versions: the original
deck, "Right to Trial: The Patient Journey" (October 1, 2026, in
[`original/`](https://github.com/mikepsinn/dfda/tree/d0db04b51e/apps/web/content/patient-journey/original)),
transcribed as it was, then the deck as published on claude.ai.

Each slide has:

- **Purpose:** the question the slide answers for the audience.
- **On screen:** the slide's text, top to bottom.
- **Visual:** what the slide shows, for whoever rebuilds it.
- **Say:** what the presenter says. On slides the video uses, it is also the video's narration,
  marked with its video line ("Say (video line 7)"). See "Video cut" at the end.
- **If asked:** background and answers to likely questions. The presenter does not read it out.
- **Source line:** the citation printed on the slide, if any.

Recurring design: the web app's theme and font (Inter), with a soft purple gradient on content
slides and the app's dark theme for the title, the statistics slide and the close. Purple is the
primary color and amber the highlight. A "patient path" (a dotted zigzag line through six icon
circles, one per step, ending in an amber star) stands for the six steps. Slides showing the
prototype render the app's own components with its data, not screenshots.

## Brief

- **Audience:** state legislators, their staff, and the patient advocates and caregivers who talk
  to them. Smart non-experts. They will ask: does it work, is it safe, who pays, what does it cost
  the state, and who is against it?
- **They should leave knowing three things:**
  1. Many cheap existing drugs might help patients like Margaret, but nobody tests them: nobody
     can profit from it, and nobody records what happens to patients who take them.
  2. Building trials into everyday care already works (RECOVERY).
  3. The act lets any patient get a screened treatment through their own doctor, lets clinics
     charge enough to offer it, and publishes every result.
- **They should feel:** that this is common sense, safe and proven. Calm confidence, not fear or
  outrage.
- **The close:** "Learn more at acceleratedmedicine.org", with no ask on the slides or in the
  video. The initiative is a 501(c)(3). Describing the act is education. When the deck is presented
  to a legislator, the presenter makes the ask in person, from a private presenter brief kept
  outside this public repository; that is direct lobbying, which is allowed within limits. Asking
  the public to contact legislators would be grassroots lobbying, so the public materials do not.
  Confirm with counsel.
- **No state:** the deck, the video and the handout name no state, so any state can use them.
- **Tone:** plain and factual. No music in the video and no dramatic openers.
- **Numbers:** only sourced, checkable figures in the main story, each shown against today where
  that tells its size ("82 times less than a typical trial"). Model estimates go in the backup
  slides, labeled as model estimates.
- **Slide text:** say why in one plain sentence ("X, so Y"). Cut what does not change the meaning,
  such as ages, places, dates and "estimate", and leave it to the speaker notes. Eyebrows name the
  idea ("Proof pragmatic trials work", not "Proof it works").
- **Words:** "care-integrated clinical trials". Use "try" only for the federal Right to Try law,
  and describe that law accurately ("life-threatening", not "dying").

## Open items

- **Title wording** (slide 1).
- **Bill text:** check slide 18 against the bill text. Confirm the price and liability provisions
  (slides 12 and 18).
- **Real people:** a real patient or caregiver could join or replace Margaret later.
- **Length:** 19 main slides. For a 10-minute meeting, candidates to cut are 3, 7, 12 and 16.

---

## 1. Title

**Purpose:** Name the initiative and the idea in one line.

**On screen**

- Eyebrow: THE CARE-INTEGRATED CLINICAL TRIALS INITIATIVE
- Title: Every patient's treatment can help the next patient
- Subtitle: Radically accelerating medical discovery by letting any patient join trials of the
  most promising treatments.

**Visual:** Dark. The patient path runs across the top. Amber eyebrow, large white title and a
muted subtitle, left-aligned in the lower half.

**Say:** Every patient's treatment can help the next patient. This is what care-integrated clinical
trials would mean for one patient, Margaret, and why they would help everyone after her.

## 2. Meet Margaret

**Purpose:** Make the problem concrete with one person.

**On screen**

- Eyebrow: MEET MARGARET
- Margaret, 68
- Margaret has Alzheimer's disease. Researchers have identified 573 existing drugs that might help
  her. Few have ever been tested for Alzheimer's.
- Card "TODAY": No evidence. No approved drug has helped her, and no trial is open near her. Her
  doctor has no evidence for any of the 573, and if she takes one, nobody records what happens.
- Card "WITH CARE-INTEGRATED TRIALS": Treatment through her own doctor. Her doctor can recommend a
  screened treatment at a local clinic, and her result helps the next patient.

**Visual:** Left, a large white card with a round cartoon avatar of an older woman (grey hair,
glasses, purple top), her name in large type, and the body text with "573 existing drugs" and "Few have
ever been tested" in bold. Right, two stacked cards: a white "Today" card with a lock icon, and a
lavender "With care-integrated trials" card.

**If asked:** Margaret's situation is common: a progressive disease, approved drugs that did not help, and many promising generic
drugs that nobody sponsors. A ten-year review (Frontiers in Pharmacology, 2023) found 573 existing,
prescribable drugs proposed for Alzheimer's; few have been tested in trials. Expect the objection
that her doctor can already prescribe approved drugs off-label. That is true, but without trial
evidence few doctors will, insurers often won't pay, and nobody records what happens, so nobody
learns which drugs work.

**Say (video line 1):** Margaret is 68 and has Alzheimer's. Researchers have identified 573 existing
drugs that might help her. Few have ever been tested for Alzheimer's, so her doctor has no evidence
to recommend any of them. And if she takes one anyway, nobody records what happens.

**Source line:** Frontiers in Pharmacology, 2023, ten-year review of drug repurposing for
Alzheimer's.

## 3. Millions of patients

**Purpose:** Show that Margaret stands for millions, with checkable numbers.

**On screen**

- Title: Millions of patients are waiting
- 7.4M: Americans with Alzheimer's
- 30M: Americans with a rare disease
- 2.1M: Americans diagnosed with cancer each year
- 95%: of rare diseases have no FDA-approved treatment

**Visual:** Dark. Under the title, a band of faint dots suggesting a crowd. Four columns, each
with an amber rule above a large amber number and a white label.

**Say:** Margaret is one of millions of patients who are waiting: 7.4 million Americans with
Alzheimer's, 30 million with a rare disease, and 2.1 million diagnosed with cancer each year. And
95% of rare diseases have no approved treatment.

**If asked:** An estimated 7.4 million Americans aged 65 or older live with Alzheimer's
(Alzheimer's Association, 2026 Facts and Figures), about 30 million Americans live with a rare
disease (NIH), and about 2.11 million new cancer cases are projected in the U.S. in 2026 (American
Cancer Society, Cancer Statistics 2026). Fewer than 5% of more than 10,000 known rare diseases
have an approved treatment.

**Source line:** Sources: Alzheimer's Association, 2026 Facts and Figures; NIH; American Cancer
Society, Cancer Statistics 2026.

## 4. Why promising treatments go untested

**Purpose:** Explain the causes, so the fix makes sense.

**On screen**

- Title: Why promising treatments go untested
- No one pays to test old drugs. 573: drugs proposed for Alzheimer's are mostly untested, because
  no company can profit from testing a drug it can't patent.
- No one learns from patients. 99.8%: of Alzheimer's patients are in no study, so nothing is
  learned from their treatment.
- Right to Try gives makers no incentive. $0: profit allowed under Right to Try: makers may charge
  only their costs, so few offer their drugs.

**Visual:** Three white cards side by side, each with a heading, a large purple number and
one sentence.

**If asked:** One: no financial incentive. Many of the 573 drugs are off patent, so no company
can earn back the cost of a trial. Two: no learning. Only about 12,000 of about 7.4 million
Americans with Alzheimer's join a trial each year (USC Schaeffer Center; Alzheimer's Association,
2026), so about 99.8% are treated outside any study, and nobody records, pools or publishes their
results. Three: the federal Right to Try Act (2018) lets a patient with a life-threatening illness,
who has used up approved options and cannot join a trial, ask a maker for a drug that has passed
Phase I and is still in development. The maker does not have to agree, may charge only its direct
costs, and sends the FDA a yearly summary of doses supplied, patients treated, uses, and serious side
effects and their outcomes (21 CFR 300.200), but not whether patients improved. The FDA's yearly summaries count only 12 drugs and biologics
with Right to Try use reported from May 30, 2018 through 2022, 4 in 2023, 5 in 2024 and 6 in 2025:
products whose outcome data the FDA did not use in a marketing review, counted per period rather than
as a running total. They do not say how many patients got them
(https://www.fda.gov/patients/learn-about-expanded-access-and-other-treatment-options/right-try-annual-reporting-summary). It does not cover
existing drugs like the 573 at all.

**Say (video line 2):** There are three reasons. Old drugs can't be patented, so no company pays to
test them. Almost no Alzheimer's patients are in any study, so nobody learns from their treatment.
And the federal Right to Try law lets drug makers charge only their costs, so they have no reason
to take part: only 21 drugs have been made available in over six years.

**Source line:** Sources: Frontiers in Pharmacology, 2023; USC Schaeffer Center; Alzheimer's
Association, 2026 Facts and Figures; Right to Try Act, 2018.

## 5. It has worked before

**Purpose:** Prove that trials built into everyday care work, quickly and cheaply.

**On screen**

- Eyebrow: PROOF PRAGMATIC TRIALS WORK
- Title: A trial built into everyday care saved a million lives
- How RECOVERY worked: any NHS hospital could enroll patients during their normal care, with little
  extra paperwork, and outcomes came from routine health records.
- 89 days: to show that a cheap steroid cuts deaths among the sickest COVID patients by up to a
  third. Typical trials take years.
- 4: treatments found that save lives, out of more than a dozen tested side by side.
- $500: per patient, 82 times less than the $41,000 of a typical trial.

**Visual:** Cream. The "How RECOVERY worked" line as a caption, then three white cards side by
side, each with a large number and one sentence: "89 days" and "4" in purple, "$500" in amber.

**If asked:** RECOVERY (Randomised Evaluation of COVID-19 Therapy) was a pragmatic trial: it
was built into normal hospital care across the NHS. Any hospital could join, enrolling a patient
took little extra work, and outcomes such as death came from routine NHS records, so patients
needed no extra visits. The first patient joined on March 19, 2020, about nine days after the
protocol was drafted, and over 11,000 had joined by early June. On June 16, 89 days after the
first patient, it showed that dexamethasone, an inexpensive steroid used for decades, cut deaths by
a third in patients on ventilators and by a fifth in those on oxygen. It was in NHS treatment
guidance within hours, and NHS England estimates it saved about a million lives worldwide by March
2021. RECOVERY tested treatments side by side, dropping those that failed and adding new ones. Of
more than a dozen tested for COVID-19, four save lives: dexamethasone, tocilizumab, baricitinib and
an antibody combination (casirivimab and imdevimab). Others, including hydroxychloroquine, did
not help. It cost about $500 per patient, 82 times less than the median of about $41,000 per
patient in the trials behind new FDA approvals. Care-integrated clinical trials apply the same idea
to everyday care, for every disease.

**Say (video line 3):** It doesn't have to be this way. In 2020, Britain built a clinical trial into
ordinary hospital care. In under three months, it showed that dexamethasone, a cheap steroid used
for decades, cut deaths among the sickest COVID patients by up to a third. It saved about a million
lives.

**Source line:** Sources: RECOVERY Collaborative Group, New England Journal of Medicine, 2021;
NHS England, 2021; Manhattan Institute, 2023; Moore et al., JAMA Internal Medicine, 2018.

## 6. The idea

**Purpose:** State the fix in three parts before the walkthrough.

**On screen**

- Eyebrow: CARE-INTEGRATED CLINICAL TRIALS
- Title: Do the same for every disease, in everyday care
- **Any patient** can get the most promising treatments through their own doctor, after
  independent review and with written consent.
- **Clinics can charge for treatment,** so they have a reason to offer treatments nobody else will
  fund.
- **Every result is published,** good or bad, so the next patient chooses better.

**Visual:** Three columns, each with a round purple icon (a person, a clinic, a document) above a
bold lead-in and one sentence. The same icons return on the closing slide.

**Say (video line 4):** Care-integrated clinical trials would do the same for every disease, in
everyday care. Here's Margaret's year.

**If asked:** Is this like RECOVERY, which was randomized? The bill also lets ordinary doctors enroll
patients in centrally run randomized trials, as RECOVERY did, alongside treatments an independent
board has screened.

## 7. How it works

**Purpose:** Show the whole journey before the detail.

**On screen**

- Eyebrow: HOW IT WORKS
- Title: Six steps that help the next patient
- 1 Explore options: Compare treatment rankings and outcome labels
- 2 Talk with your doctor: Get a recommendation and decide on a treatment plan
- 3 Consent and cost: Decide in writing, knowing the price
- 4 Treatment and tracking: Share good and bad outcomes
- 5 Results reported: De-identified, in a public registry
- 6 Rankings and labels improve: The next patient chooses better
- Then it starts again, with better data

**Visual:** Six numbered cards in a U-shaped flow joined by purple arrows: steps 1 to 3 left to
right on the top row, down to step 4, then right to left through 5 and 6 on the bottom row. Step 6
is filled purple with an orange star. An orange arrow leads from step 6 back up to step 1, labeled
"Then it starts again, with better data".

**Say:** Her year has six steps. She compares her options, talks with her doctor, consents knowing
the cost, and is treated and tracked. Then her results are published, de-identified, and everyone's
pooled results improve the rankings and labels, so the next patient chooses better.

## 8. Step 1: explore options

**Purpose:** Show what Margaret sees, in the working prototype.

**On screen**

- Eyebrow: STEP 1 · EXPLORE OPTIONS
- Title: Margaret starts by comparing her options
- Rankings and outcome labels: compare benefits, side effects and costs.
- Public directory: every participating clinic, with location and status.
- Tag: Prototype

**Visual:** The prototype tag, then the prototype's own ranking cards for the top three Alzheimer's treatments,
large enough to read: Donanemab (effectiveness 57, safety 48, $38,000 a year), Lecanemab (55, 50,
$36,500) and Donepezil (45, 60, $525). The two features run along the bottom with lavender
icons.

**If asked:** This is the working prototype. It ranks Alzheimer's treatments by estimated
effectiveness and safety. Today it lists approved drugs. In a care-integrated system, screened
experimental and repurposed treatments would appear beside them, with their evidence strength
shown. A public directory lists every participating clinic, with its review board, protocol and
status.

**Say (video line 5):** She starts by comparing her options: treatments ranked side by side, each
with an outcome label showing who improved, the side effects, the cost and how strong the evidence
is.

## 9. Outcome labels

**Purpose:** Show what an outcome label is, with real data.

**On screen**

- Eyebrow: OUTCOME LABELS
- Title: A label that gets better with every patient
- Where the evidence comes from: Clinical trials, including the ones that failed. Every treated
  patient's real-world outcome. Side-effect reports from clinics and doctors.

**Visual:** Lecanemab's outcome label as paired bars, a purple bar for lecanemab above a gray bar
for placebo. On the left, decline over 18 months on three measures, each with its percentage less
decline: dementia severity (CDR-SB) 1.21 against 1.66 points, 27% less; thinking and memory
(ADAS-Cog14) 4.14 against 5.58, 26% less; daily activities (ADCS-MCI-ADL) 3.5 against 5.5, 37%
less. On the right, the share of patients with each side effect: infusion reactions 26% against 7%,
brain swelling (ARIA-E) 13% against 2%, small brain bleeds (ARIA-H) 17% against 9%, headache 11%
against 8%. The three evidence sources run along the bottom with amber icons, and one source line
names the FDA label.

**Say:** This is the prototype's outcome label for lecanemab, built from its FDA label. Today a label
draws on trials alone. With care-integrated trials, every treated patient's outcome is added, so the
label gets better with every patient, even for old drugs that nobody would fund a trial for.

**If asked:** An outcome label puts what is known about a treatment on one page: how much it helps
and compared with what, its side effects, its cost, and how strong the evidence is. Lecanemab's
values come from its FDA prescribing information: Study 2 (Clarity AD), 1,795 patients over 18
months. Decline is the adjusted mean change from baseline in each arm (Table 8); the side effects
are the share of patients in each arm (sections 5.1 and 5.3). Each decline's bars are drawn to
scale, with placebo's at full length; the side-effect bars share one scale.

**Source line:** Source: Leqembi (lecanemab) FDA prescribing information, 2023, Study 2.

## 10. Independent treatment review

**Purpose:** Answer "who decides a treatment is safe enough to offer?"

**On screen**

- Eyebrow: INDEPENDENT TREATMENT REVIEW
- Title: An independent board approves every treatment first
- Who reviews: Five or more members, including a physician, a researcher and an ethicist. A
  non-scientist and an outside member. No financial ties to the clinic or maker. Flat fees, never
  paid per approval.
- What they check: The evidence. The treatment plan. Each provider's competence. Conflicts of
  interest. The consent form.
- What qualifies: Early safety testing in people. Or a documented record of safe use in people. Or
  a well-understood biological method with lab or animal data. Or device-specific evidence.

**Visual:** Three white cards side by side, each with a small round icon, a heading and a
bulleted list.

**If asked:** Margaret never has to do this herself: every treatment is screened before it is
offered to any patient. The Experimental Treatment Review Board, or ETRB, has at least five
members, including a physician, an outcomes researcher, an ethicist, a non-scientist and a member
unaffiliated with the providers and manufacturers it reviews, with no financial ties to them. One approval can cover many qualified clinics. Qualifying pathways: early
safety testing in people (Phase I or a comparable early study), a documented record of safe use in
people, a well-understood biological method with lab or animal data (such as a well-characterized
platform or a treatment made for one patient), or device-specific evidence.

**Say (video line 6):** An independent board has already screened every option.

## 11. Step 2: talk with your doctor

**Purpose:** Show how simple access is for the patient.

**On screen**

- Eyebrow: STEP 2 · TALK WITH YOUR DOCTOR
- Title: Her own doctor recommends it, even by video
- Required: Her doctor's recommendation. Her written consent, which she can sign online.
- Not required: A life-threatening illness. Being unable to join a trial. Using up approved drugs
  first.

**Visual:** Left, an illustration of a laptop showing a video call between a doctor and a patient.
Middle, a lavender "Required" card with a check icon. Right, a white "Not required" card with an
orange prohibition sign.

**If asked:** The bar is deliberately simple: a treating physician's recommendation plus
written consent, which can happen by telemedicine and be signed electronically. No diagnosis,
medical necessity, severity, terminal condition, treatment purpose, trial ineligibility, or
exhaustion of approved options is required. The slide shows the three that federal Right to Try
requires. A doctor who only recommends or discusses the treatment does not have to register or
appear in the directory.

**Say (video line 7):** Her own doctor recommends one over a video visit, and she signs a
plain-language consent: the risks, the unknowns, who pays, and that it's experimental.

## 12. Step 3: consent and cost

**Purpose:** Show that she decides with the full picture, including the price.

**On screen**

- Eyebrow: STEP 3 · CONSENT AND COST
- Title: She decides in writing, knowing the price
- Form header: CONSENT FORM · EXPERIMENTAL TREATMENT
- 1 The exact treatment. 2 Her doctor's view of realistic outcomes. 3 Other options, including
  none. 4 Known and unknown risks. 5 Who pays, and what she may owe. 6 What data is collected, and
  how it's protected.
- Chip: If she can't consent, a legal representative can.

**Visual:** A wide white form card with the six items in a numbered three-by-two grid, and a
rounded chip with a small icon beneath it.

**Say (video line 7):** A charity helps her pay, and no insurer or state program has to.

**If asked:** The written consent covers: the specific treatment; the doctor's view of realistic outcomes; alternatives, including no treatment; known
risks and benefits; unknown risks, regulatory status, and that early evidence does not prove
safety or effectiveness; that the choice is voluntary; who pays and what she may owe; what outcome
data is collected, coded and published only de-identified; and a clear statement that this is
experimental treatment. Recording needs separate agreement. If a patient cannot consent, a legal
representative consents for her.

## 13. Step 4: treatment and tracking

**Purpose:** Show that care happens close to home and outcomes are measured.

**On screen**

- Eyebrow: STEP 4 · TREATMENT AND TRACKING
- Title: Care close to home, with outcomes measured
- What her clinic records: 1 Her treatment and dose. 2 Her starting condition. 3 Better, same,
  worse, stopped or died, on a set schedule. 4 Side effects. 5 A coded ID, not her name.
- OPTIONAL · Easier tracking: Phone check-ins. Wearables. AI calls or texts.
- No required app or vendor. Normal medical records count.

**Visual:** Left, a white card with the numbered list. Right, a lavender card with a phone icon
showing a small bar chart, the optional tools as bullets, and the bold footer line.

**If asked:** The required outcome record is short and can come straight from ordinary
medical records, with no duplicate entry. Tools like a tracking app, wearable integration and AI
check-ins are optional extras that can make tracking easier and richer.

**Say (video line 8):** Her first dose is in week two, at a clinic near home. Memory tests and quick
phone check-ins track how she's doing.

## 14. Safety net

**Purpose:** Answer "what happens if something goes wrong?"

**On screen**

- Eyebrow: SAFETY NET
- Title: If something goes wrong, the system reacts
- 1 Serious side effect: Reported to the board within five days.
- 2 Board reassesses: Also if a trial elsewhere stops for safety.
- 3 New patients paused: Until a serious safety problem is resolved.
- 4 Current patients protected: They can continue if stopping is riskier.
- Every protocol is also reviewed at least once a year.

**Visual:** Four numbered step cards in a row joined by orange arrows, each with a small orange
icon. Below, a full-width dark navy banner with a clock icon holding the last line.

**Say (video line 8):** Any serious side effect reaches the board within days, and it can pause new
patients.

**If asked:** Serious side effects go to the review board and the state health department within five days. The board must
reassess if a trial of the same treatment elsewhere stops for safety or lack of effect, and an
unresolved serious safety finding immediately stops treatment of new patients. Current patients
may continue if stopping suddenly is more dangerous.

## 15. Step 5: results go public

**Purpose:** Show that every result, good or bad, is published.

**On screen**

- Eyebrow: STEP 5 · RESULTS GO PUBLIC
- Title: Every result is published
- EXAMPLE ANNUAL BOARD REPORT · 48 PATIENTS: Improved 21 · 44%. No real change 14 · 29%.
  Worsened 6 · 13%. Stopped 4 · 8%. Died 0 · 0%. Lost to follow-up 3 · 6%. Serious side effects
  2 · 4%.
- Nothing hidden: Bad and unclear results must be published too.
- Privacy first: Small groups are combined so no one can be identified.

**Visual:** Left, a white report card with a horizontal bar per outcome (purple for improved and
no change, orange and brown for worsened, stopped and serious side effects, grey for lost to
follow-up). Right, two small cards with round icons.

**If asked:** Each review board publishes a de-identified annual report for each protocol:
how many improved, had no real change, worsened, stopped, died, had side effects, or were lost to
follow-up. Boards may not omit bad, null or unclear results. The numbers here are made up to show
the format.

**Say (video line 9):** At six months her outcome is recorded, good, bad or no change, then
de-identified and published. Nothing is hidden.

## 16. Step 6: from reports to labels

**Purpose:** Show how one result becomes shared evidence.

**On screen**

- Eyebrow: STEP 6 · RANKINGS AND LABELS IMPROVE
- Title: How one result becomes shared evidence
- Her clinic: Data stays with her doctor → Outcome report: Coded and de-identified → Board report:
  Yearly public results → Evidence system: Combines all clinics → Rankings and Outcome labels:
  Compare benefits and harms
- Her result improves the next patient's decision
- Every clinic reports in one open format, so any evidence system can combine the results.

**Visual:** Five boxes in a row joined by purple arrows; the last is filled purple with an orange
star. An orange dashed arrow loops from the last box back to the first, labeled with the
"next patient" line.

**Say (video line 9):** Pooled with every other clinic, it updates the label. The next patient starts
with better data than Margaret had.

**If asked:** Each clinic files
standardized, de-identified outcome reports in an open format. Evidence systems pool the reports
across all clinics and publish outcome labels and treatment rankings, which the next patient uses
at step 1.

## 17. Margaret's first year

**Purpose:** Put the journey on one timeline.

**On screen**

- Eyebrow: MARGARET'S FIRST YEAR
- Title: One patient's path, start to finish
- Week 0 Explores: Compares labels; video visit with her doctor.
- Week 1 Consents: Signs the form; a charity helps pay.
- Week 2 First dose: At a clinic near home.
- Months 1-6 Tracked: Memory tests and phone check-ins.
- Month 6 Recorded: Coded outcome filed, good or bad.
- Year 1 Label updated: Her result joins the evidence.
- Margaret got treatment through her own doctor, and the next patient learns from her.

**Visual:** A horizontal timeline with six icon stops; the line runs purple, then orange into the
final orange star stop. Below, Margaret's small avatar beside the closing line in italics.

**Say:** That is Margaret's first year. Within two weeks she compares options, talks with her doctor,
consents and starts treatment. She is tracked for six months, and her outcome is recorded whether it
is good, bad or neutral, so the evidence shows what really happens.

## 18. What the act does

**Purpose:** For legislators, what changes in law, on one slide.

**On screen**

- Eyebrow: THE CARE-INTEGRATED CLINICAL TRIALS ACT
- Title: What the act does
- Review: An independent board approves each treatment, clinic and consent form.
- Access: A treating doctor's documented recommendation and written consent are all a patient needs.
- Payment: Clinics may charge for treatment. No insurer or state program has to pay.
- Safety: Serious side effects are reported within five days, and an unresolved safety finding stops new patients.
- Results: Every outcome is reported in one open format and published, de-identified.

**Visual:** A single white card with five rows, each a small purple icon, a bold lead-in and one
sentence.

**Say:** The act does five things. An independent board approves each treatment, clinic and consent
form. A doctor's documented recommendation and written consent are all a patient needs. Clinics may
charge for treatment, and no insurer or state program has to pay. Serious side effects reach the board within
days. And every result is published, de-identified.

**If asked:** Who pays: no insurer or state program is required to. The patient, family, charities,
employers, research sponsors, and insurers that choose to can pay. Clinics can charge for treatment,
so they have a reason to offer new treatments, and one board approval can cover many clinics. Under
federal Right to Try, by contrast, the drug maker may charge only its direct costs (21 CFR
312.8(d)(1)), so almost nobody offers drugs. Expect the concern that charging patients for
experimental treatment invites exploitation, as with unproven stem-cell clinics. The safeguards:
the board approves each protocol and each clinic that offers it; the consent form says the
treatment is experimental and that insurance does not have to pay; an unresolved serious safety
problem stops new patients; and every result,
including failures, is published, so a clinic cannot hide poor results. Liability:
the bill limits liability under state law for the people who review, provide or give a treatment
under the act. The limit does not cover gross negligence, reckless or willful misconduct, intentional
harm, fraud, concealing safety information, or a material violation of the act. Makers stay liable under ordinary state law. Federal law still applies, and federal Right to Try's protections cover only patients who meet its rules. Other payment
options: installments or memberships, crowdfunding, patient-aid groups, free supply from the
maker, and lower prices for patients who agree to share more data than the required outcome record.

## 19. Close

**Purpose:** Restate the three changes and say where to learn more.

**On screen**

- Headline: Every patient's experience becomes evidence for the next.
- **Any patient can get** the most promising treatments through their own doctor.
- **Clinics can charge fairly,** so they offer treatments nobody else will fund.
- **Every result is published,** producing treatment rankings and outcome labels.
- Learn more at acceleratedmedicine.org

**Visual:** Dark, with the patient path across the top. A large white headline; three lines below
it with bold lead-ins and the icons from slide 6. At the bottom, an amber-outlined panel with the
web address.

**Say (video line 10):** Any patient can get treatment through their own doctor. Clinics can afford to
offer it. Every result is published, and the next patient learns from Margaret. Learn more at
acceleratedmedicine.org.

---

# Backup slides

For questions about scale and cost. Not in the main story or the video.

## B1. The untested frontier

**Purpose:** Answer "how much is left untested?"

**On screen**

- Eyebrow: MODEL ESTIMATE
- Title: We have tested 0.34% of what we already have
- 9,500 compounds with a human safety record × 1,000 diseases = 9.5 million possible drug-disease
  pairs
- Legend: Tested: about 32,500 pairs (0.34%). Never tested: about 9.47 million. Over 2,000 years
  at today's pace.
- Card: Most pairs will not work. If only 1 in 1,000 works, that is about 9,500 treatments nobody
  is looking for.
- Card: What care-integrated trials change. Doctors can already use approved drugs off-label, but
  nobody tracks the results. Care-integrated trials add drugs still in testing and track every
  outcome.

**Visual:** The equation in large purple numerals across the top. Below, a wide grid of 300 small
beige squares with a single purple square (the tested part). A legend with an orange clock icon,
then two white cards.

**Say:** This is a model estimate. About 9,500 compounds already have a human safety record, and
there are about 1,000 diseases to test them against: about 9.5 million pairs. Only about 0.34% have
ever been tested. Most pairs will not work, but if only 1 in 1,000 does, that is about 9,500
treatments nobody is looking for.

**If asked:** About 9,500 compounds (range 7,000 to 12,000) already have a human safety
record: approved drug ingredients, investigational compounds that passed Phase I, and GRAS
substances. The roughly 14,000 ICD-10 diagnosis codes group into about 1,000 diseases that trials
can target. 9,500 times 1,000 gives about 9.5 million possible drug-disease pairs. Only about
32,500 pairs have ever been tested (range 15,000 to 50,000), which is 0.34%. Each square in the
grid is about 31,700 pairs, so one square of 300 is the whole tested part. At about 3,300 to 4,400
completed trials a year, testing every pair one trial at a time would take 2,000 to 2,900 years.
Expect the objection that most pairs make no sense. That is true, and it does not matter: if only
1 in 1,000 pairs works, that is about 9,500 treatments that nobody is testing. Most of these
compounds are off patent, so no company has a reason to pay for the tests. Expect the objection
that doctors can already prescribe approved drugs off-label. That is true, but nobody tracks what
happens, so nobody learns which uses work. Care-integrated trials do two things here: they let
patients get compounds that passed Phase I but are not yet approved, and they record the outcome of
every treatment so the evidence builds. Source:
https://manual.warondisease.org/knowledge/problem/untapped-therapeutic-frontier.html

**Source line:** Source: How to End War and Disease, "The Untapped Therapeutic Frontier" (FDA, GRAS,
ICD-10 and ClinicalTrials.gov data).

## B2. When every disease could have a first treatment

**Purpose:** Answer "what would the act do at scale?" without overstating it.

**On screen**

- Eyebrow: MODEL ESTIMATE
- Title: When will every untreated disease have a first treatment?
- 6,650 diseases have no treatment today. At today's pace, the last of them gets its first
  treatment in about 443 years. If every state adopted the act, in about 81.
- At today's pace (15 diseases a year): 443 years
- If every state adopts the act (about 82 diseases a year): 81 years
- 181 years sooner, on average: for a disease's first treatment
- 44× lower cost per patient: $41,000 to under $1,000
- 8 years less waiting after safety tests: available after board review

**Visual:** Two horizontal bars: a long grey bar for 443 years and a short purple bar for 81
years. Three white stat cards beneath, each with a large purple figure.

**Say:** This is also a model estimate. 6,650 diseases have no treatment today. At today's pace, the
last of them gets a first treatment in about 443 years. If every state adopted the act, the model
says about 81, and the average disease gets its first treatment 181 years sooner.

**If asked:** What the numbers mean: 443 years is when the last untreated disease would get its
first treatment at today's pace. It is not when diseases get cured, and most would get a first
treatment much sooner. About 6,650 diseases have no approved treatment, and today about 15 get
their first treatment each year, so the last one would get it about 443 years from now. The
average untreated disease waits about half that, 222 years. The model assumes that if every state
adopted the act and a pooled pragmatic-trial system operated, first treatments would arrive about
5.5 times faster, about 82 a year. That is an assumption, not an observed effect, and its 90% range
is wide (79 to 332 years sooner). The backlog then clears in about 81 years, and the average wait
falls from 222 to about 41 years: 181 years sooner. Cost: a traditional Phase III trial costs about
$41,000 per patient; embedded pragmatic trials such as RECOVERY (about $500) and ADAPTABLE (about
$929) cost under $1,000, about 44 times less. Waiting: today a treatment that passes Phase I safety
testing waits about 8.2 years for efficacy proof; here, patients can choose it after independent
board review. The impact page on acceleratedmedicine.org lets anyone change the 5.5 times
assumption. Source:
https://papers.acceleratedmedicine.org/right-to-trial-impact.html

**Source line:** Assumes every state adopts the act and first treatments arrive 5.5 times faster.
Source: Patient's Right to Trial Act impact paper, papers.acceleratedmedicine.org.

## B3. Value for money

**Purpose:** Answer "is it worth the cost?"

**On screen**

- Eyebrow: MODEL ESTIMATE
- Title: A year of healthy life for under $10
- Cost per year of healthy life: $9.50 (Care-integrated trials; at global scale, in everyday care). $184
  (Malaria bed nets; one of the best charities known). $100,000+ (A typical new drug; at the usual
  U.S. price limit).
- Bar strip: Care-integrated trials, $9.50: too small to see at this scale. Malaria bed nets,
  $184: about 2 pixels wide. A typical new drug, $100,000+.
- About 19 times cheaper than bed nets. Over 10,000 times cheaper than a typical new drug.

**Visual:** Three cards: a purple-filled "$9.50" card, then "$184" in orange and "$100,000+" in
navy on white. Beneath, a to-scale bar strip in which only the drug's dark bar is visible.

**Say:** And a model estimate of value for money. Run at global scale, care-integrated trials would
cost about $9.50 per year of healthy life. That is far less than malaria bed nets, one of the best charities
known, and over 10,000 times less than a typical new drug.

**If asked:** This is the standard cost-effectiveness test every new drug must pass: what it
costs to gain one year of healthy life (one disability-adjusted life year, or DALY: a year without
early death or disability). Lower is better. The bar strip is drawn to scale: if the drug bar is
1,220 pixels, bed nets are about 2 pixels and care-integrated trials about one tenth of a pixel,
so the empty space is the point. Care-integrated trials at scale, meaning pragmatic trials built
into everyday care: about $9.50 per healthy year. The cost counts the full research cost of the
trials, whoever pays, in the impact paper's global scenario: about 23.4 million patients a year at
about $929 each, for the 36 years that scenario takes to give every untreated disease a first
treatment. That is a larger scenario than slide B2's 50-state model, and B3 is not recomputed for
that model: it has only a launch cost and an assumed discovery rate, with no patient numbers or trial
spending to compute a research cost from. The act's own model counts only its $65 million launch
cost, so the impact page shows a far smaller cost per healthy year for it. The benefit is the healthy years gained
because treatments arrive sooner (Ubiquitous Pragmatic Trial Impact Analysis). Both costs and health are
discounted at the standard 3% a year. With no discounting at all, it is about $1.39 per
healthy year. The impact paper's headline of $0.84 discounts costs but not health, so we do not
lead with it. Malaria bed nets: about $184 per healthy year (90% range $113 to $252), GiveWell's
estimate as cited in How to End War and Disease. That is about 19 times more than $9.50. A typical new drug: the usual U.S. limit is $100,000 to $150,000
per quality-adjusted life year (Institute for Clinical and Economic Review). $100,000 divided by
$9.50 is about 10,500, so over 10,000 times more. Even if only half of disease deaths can ever be
avoided (the manual's low estimate), the cost is still about $17.50 per healthy year. Source:
https://papers.acceleratedmedicine.org/dfda-impact.html

**Source line:** Pragmatic trials at global scale (about 23 million patients a year), not the 50-state
model on slide B2. A year of healthy life = one year without early death or disability, discounted 3%
a year. Sources: Ubiquitous Pragmatic Trial Impact Analysis, papers.acceleratedmedicine.org; ICER.

---

# Video cut

About 2:10, calm, narrated, captioned, no music. The video opens on Margaret and uses these slides
in order: 2, 4, 5, 6 (with the patient path from slide 7), 8, 10, 11 and 12, 13 and 14, 15 and
16, and 19, ending on an acceleratedmedicine.org end card.

Its narration is the "Say (video line N)" lines, joined in slide order, so the deck and the video
say the same words. A test compares them with the words recorded in the video's `audio_meta.json`.
To change one of those lines, edit it here, run `pnpm --filter @apps/acceleratedmedicine
video:narration` to copy the lines into the video's `SCRIPT.md` and `STORYBOARD.md`, and re-record
that video line (see the video's README).
