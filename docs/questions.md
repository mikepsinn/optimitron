# 1% Treaty — Vote + Share Flow

Full vote and share sequence for 1percenttreaty.org / warondisease.org. Each section is a full-screen treaty-style screen on mobile. Some persuasion screens have a dismissive button and an advance button; when present, **both buttons advance the flow** and the dismissive path sets the alt-opener on the next screen. 

**Progressive disclosure:** High-level claims are visible by default. Dense derivations live behind a single **Check the math** full-screen dialog on the 10.7 billion screen; other screens may still use a small `<details>` fold where the fold itself is part of the joke or pacing. Users opening math/detail views = engaged and skeptical (track it).

---

## Context: before this flow

1. **Landing hero** — headline, CTA to engage
2. **Pre-vote: Apology** — disarm before showing emotional content. See below.
3. **Pre-vote: Grandma** — face of disease. See below.
4. **Pre-vote: Apocalypse framing** — "you have 122 apocalypses, trade one for medicine." See below.
5. **Slider** — drag to allocate between military and clinical trials. See below.
6. **Vote question** — reality check + Yes/No, on a single card after the slider submits. See below.
7. **Verification** — required. See below.
8. **Post-vote share sequence begins** — The Stakes screen.

**YES voters** see the default opener on The Stakes. **NO voters** see the NO-voter variant, then the same flow. The math doesn't care how they voted.

## Pre-vote: Apology

**Default:**

> I'm very sorry to bother you, but this is kind of the most important thing in the universe and it will only take a few moments of your time.

Buttons: **[ Go to hell ]** ・ **[ Fine ]**

Both buttons advance to the Grandma screen. "Go to hell" sets the alt flag for the next screen.

---

## Pre-vote: Grandma

**Default:**

> [Photo of grandma]
>
> This is my grandmother. She's really nice.
>
> Her brain is turning into mush. The money that would have paid for the clinical trials to find a cure was busy turning into missiles.

**Alt (if user clicked "Go to hell" on Apology):**

> Sorry. Grandma's in this part.
>
> [same body]

Buttons: **[ I don't care ]** ・ **[ I'm sorry about your grandmother ]**

Both buttons advance to the Apocalypse screen. "I don't care" sets the alt flag for the next screen.

Asset: photo lives at `packages/web/public/img/grandma.jpg`.

---

## Pre-vote: Apocalypse framing

**Default:**

> 100 nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans.
>
> Humanity has about 12,000 nuclear weapons. That's 122 apocalypses of mass murder capacity.
>
> You can only ruin Earth once. The other 121 are just wasteful.
>
> The 1% Treaty asks you to trade one apocalypse for something slightly nicer.

**Alt (if dismissive on Apology or Grandma):**

> Fair. One more math thing though.
>
> [same body]

Buttons: **[ Take me to the vote ]**

Numbers: `FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD`, `FLOW_GLOBAL_WARHEAD_COUNT`, `FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR`, `FLOW_WASTEFUL_APOCALYPSES`. Display via `ParameterValue`.

---

## Slider

> How do you think global governments should allocate between military spending and high efficiency pragmatic clinical trials to cure and treat disease?

"{n}% Military & Weapons" / "{100-n}% Clinical Trials" with the slider underneath.

Button: **[ Submit ]** (only appears after the user has dragged the slider at least once).

---

## Vote question

> Your governments spend **${ratio}** on weapons and military systems for every $1 spent on clinical trials.
>
> That's **99.8%** to military and **0.2%** to clinical trials.
>
> Moving 1% of military spending to pragmatic clinical trials would mean **12.3× more medical research** — the same dollars test 23 million patients per year instead of 1.9 million.

> Should all nations allocate just 1% of military spending to clinical trials to treat and cure disease together, making the world safer and ensuring no country is at a disadvantage?

Buttons: **[ ☐ YES ]** ・ **[ ☐ NO ]**

Numbers: `MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO` for `${ratio}`, `DFDA_TRIAL_CAPACITY_MULTIPLIER` for 12.3×, `DFDA_PATIENTS_FUNDABLE_ANNUALLY` for 23 million, `CURRENT_TRIAL_SLOTS_AVAILABLE` for 1.9 million. Display via `ParameterValue`.

---

## Verification (required)

Verification is required to proceed. Framed as protecting the vote, not creating an account. Never use "sign up" / "log in" / "create an account."

**Copy:**

> **Vote counted.**
>
> Governments won't listen to bot votes. They barely listen to human ones, but at least yours will be on file.
>
> Verify you're a real human so yours counts in the final tally.
>
> [ email input ]
>
> [ Verify → magic link ]

What verification enables (all of this is now guaranteed for every user in the flow):
- Vote counts in the official submitted tally
- Inverse Kills Score tracked across sessions
- Email notification when friends vote (pending → confirmed)
- Overdue task-reminder emails if opted in at Depth Hook
- Monthly scorecard
- Full dashboard with referral tree

**No skip option.** If someone won't verify, they don't enter the flow. Their vote still counts on the public counter (unverified bucket), but they don't see the share sequence.

---

## The Stakes

**Default (YES voters):**

> Statistically, you and/or someone you love will get a horrible disease. 95% of diseases have zero FDA-approved treatments. 9,500 known-safe compounds sit on shelves, and 99.7% of their potential uses have never been tested — because the money was busy turning into missiles.

**NO-voter variant (prepended to the body):**

> You voted no. Totally fine. The math doesn't change.
>
> [same body]

**Alt (prior dismissive click):**

> I'm sorry but I still have to tell you this anyway.
>
> [same body]

Buttons: **[ I have chosen disease ]** ・ **[ Okay, go on ]**

---

## How We Get to 10.7 Billion

Each beat shows the high-level claim by default. Keep the main screen clean. The single **Check the math** button opens a full-screen treaty-style math dialog with every derivation expanded. Every source lives on manual.warondisease.org.

**Default:**

> **1% of global military spending = $27.2 billion per year.**
>
> **Pragmatic clinical trials cost $929/patient, not $41,000. So $27.2B funds 23 million patients per year — instead of today's 1.9 million.**
>
> **That's 12x more clinical trial capacity. Disease eradication compresses from 443 years to 36.**
>
> **10.7 billion people don't die of a curable disease while waiting. Plus 1.93 quadrillion hours of suffering doesn't happen.**
>
> Every number above has a citation. This math is not my opinion.

**Alt:**

> Fine, show your work:
>
> [same high-level claims]

Buttons: **[ Check the math ]** ・ **[ Okay, I buy it ]**

Implementation: **Check the math** opens a full-screen modal/dialog. It does not advance the persuasion flow. The modal includes a close button, an **Open Manual** link to https://manual.warondisease.org (`target="_blank"`), and all of the derivations below expanded by default:

> **Military spending to treaty funding**
>
> Global military spending 2024 = $2.72 trillion (SIPRI). 1% of that = $27.2B.
>
> **Trial capacity funding**
>
> Traditional Phase 3 trials: median $41,000/patient (FDA data). Pragmatic trials: $929/patient (ADAPTABLE trial real-world cost). Meta-analysis of 64 pragmatic trials finds median $97/patient (Ramsberg & Platt 2018). Using conservative $929. $27.2B × 80% allocated to patient subsidies = $21.8B ÷ $929 = 23.4M patients tested per year. Current global trial participation: 1.9M patients/year (IQVIA 2022).
>
> **Queue clearance compression**
>
> 23.4M funded patients ÷ 1.9M current = 12.3x multiplier. 6,650 diseases currently have no effective treatment (95% of ~7,000 rare diseases per Orphanet 2024). At today's rate, first-ever treatments emerge for 15 new diseases/year. 6,650 ÷ 15 = **443 years** to clear the queue. With 12.3x capacity: 443 ÷ 12.3 = **36 years**.
>
> **Lives and suffering prevented**
>
> Average treatment arrival accelerates by 212 years (204 from more trials + 8.2 from eliminating FDA's efficacy-testing lag). Over that window: global disease deaths (~55M/year) × avoidable fraction × years = 10.7 billion deaths prevented (95% CI: 7.4B–16.2B). Suffering: 1.93 quadrillion hours (95% CI: 1.36Q–2.62Q) from DALY YLD component × hours per year. Full calculation at manual.warondisease.org.

---

## Wouldn't That Be Neat

**Default:**

> Imagine you triggered a chain reaction that got a majority of humans on Earth — 4 billion people — to collectively agree:
>
> "Yes, we are willing to sacrifice one apocalypse of our 122 apocalypse capacity in exchange for eradicating disease within our lifetimes."
>
> Wouldn't that be neat?

**Alt:**

> Respect. Still, imagine:
>
> You trigger a chain reaction that gets a majority of humans on Earth — 4 billion people — to collectively agree: "Yes, we are willing to sacrifice one apocalypse of our 122 apocalypse capacity in exchange for eradicating disease within our lifetimes."
>
> Wouldn't that be neat?

Buttons: **[ Not neat ]** ・ **[ Neat ]**

---

## Only Two Humans

**Default:**

> Tell 2 friends. They tell 2 friends. 32 rounds reaches 4 billion humans (a majority of humanity). That's 32 days at one per day, 8 months at one per week.
>
> Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck if you broke the chain. If this chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.
>
> <details>
> <summary>Has a chain letter ever actually worked?</summary>
>
> In 1935, a billion people handwrote letters, bought stamps, and mailed actual money to strangers because a piece of paper promised them $1,562.50 that didn't exist. The promise was a lie. The threat was fake. Some of them probably died driving to the post office.
>
> This one requires touching a glowing rectangle a few times. It costs nothing. There are no stamps. And the threat — that you and everyone you love will suffer and die of curable diseases if nobody funds the research — is not a superstition. It is an epidemiological fact.
>
> So it should probably do fine.
> </details>

**Alt:**

> Fair. But here's the math:
>
> Tell 2 friends. They tell 2. 32 rounds reaches 4 billion. 8 months at one per week.
>
> Yes, this is technically a chain letter. The old ones threatened 7 years of bad luck if you broke the chain. If this chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.

Buttons: **[ Still too much ]** ・ **[ Okay, two humans ]**

---

## The Per-Vote Math

**Default:**

> **One vote = 1 full human lifetime of suffering prevented.** (55 years of it.)
>
> **One vote = 2.7 lives saved.**
>
> <details>
> <summary>Show the math</summary>
> Getting a majority of humans on Earth (4 billion people) to agree the treaty is a good idea makes it politically unstoppable. 10.7 billion deaths prevented ÷ a majority of humans on Earth (4 billion people) = **2.675 lives per vote**. 1.93 quadrillion hours of suffering prevented ÷ a majority of humans on Earth (4 billion people) = **482,500 hours per vote**. At 8,760 hours/year = **~55 person-years** = roughly one full human lifetime.
> </details>
>
> Your vote already did this. Every person you get to vote adds another lifetime to your Inverse Kills Score.

**Alt:**

> I know. Math again. Last one that matters:
>
> A majority of humans on Earth (4 billion) agreeing the 1% Treaty is a good idea makes it politically unstoppable.
>
> **One vote = 1 lifetime of suffering prevented. One vote = 2.7 lives saved.**
>
> Every person you get to vote adds another lifetime to your Inverse Kills Score.

Buttons: **[ I reject mathematics ]** ・ **[ Show me mine ]**

---

## Send Loop

Mini sub-flow, **repeats per person**. Four screens (Name → Format → Message → Impact), then loop back or exit to Depth Hook.

**All users are verified.** Every send gets full attribution, every recipient gets the email sequence, every confirmation triggers the B2 dopamine email.

### Name & Contact

**Default (first):**

> Who do you want to tell first?
>
> First name: [ _______ ]
>
> Their email (optional — we'll send task reminders so you don't have to): [ _______ ]

**Default (second+):**

> Who's next?
>
> First name: [ _______ ]
>
> Their email (optional): [ _______ ]

**Alt:**

> One at a time. Bear with me.
>
> First name: [ _______ ]
>
> Their email (optional — we'll send task reminders so you don't have to): [ _______ ]

Buttons: **[ Let me just copy ]** ・ **[ Continue ]**

### Message Format Choice

**Shown once (first iteration), then remembered for subsequent sends. User can change later. Current UI is a two-position toggle: `Love mode` on the left and `Bossy mode` on the right. Internal format values remain `SINCERE` and `TASK_NOTIFICATION`.**

> How do you want to tell [Jake]?

**Bossy mode concept sketch (ASCII illustration for ideation, not necessarily exact production rendering):**

> ┌──────────────────────────────────────┐
> │ ⚠️ [OVERDUE] End War and Disease     │
> │                                      │
> │ TASK: End War and Disease             │
> │ ASSIGNED BY: [Your name]              │
> │ STATUS: Overdue (by approximately     │
> │         443 years)                    │
> │ PRIORITY: Critical                    │
> │ ESTIMATED TIME: 30 seconds            │
> │                                       │
> │ ACTION REQUIRED: Vote on the          │
> │ 1% Treaty at warondisease.org         │
> │                                       │
> │ NOTE: This task was originally due     │
> │ several centuries ago but kept         │
> │ getting deprioritized in favor of      │
> │ building 122 apocalypses worth of      │
> │ nuclear weapons. Management            │
> │ apologizes for the delay.              │
> └──────────────────────────────────────┘

**Current production Bossy mode preview:** clean task-card styling with task, assigned-by, time, due, and action fields. Production copied/sent text should be plain shareable text, not box-drawing characters.

**Love mode preview:**

> "Hi Jake. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? warondisease.org"

Buttons: **[ Continue ]**

**On second+ iteration:** keep the previously selected mode by default. If the user chooses to switch, show the same Love mode / Bossy mode toggle again.

Implementation: format choice determines which email template the recipient gets throughout their sequence. Track per-send for analytics. Keep visible labels human-facing (`Love mode`, `Bossy mode`) even if internal enum names stay technical.

### Message & Send

**If Bossy mode chosen:**

> Here's [Jake]'s task assignment:
>
> End War and Disease is overdue.
>
> [Your name] assigned you one Earth optimization task: take 30 seconds to vote on the 1% Treaty.
>
> The task is late by approximately 443 years because humanity kept funding 122 apocalypses worth of nuclear weapons instead of disease eradication.
>
> Complete it here: warondisease.org

**If Love mode chosen:**

> Here's your message to [Jake]:
>
> "Hi Jake. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? warondisease.org"

Buttons (email provided): **[ Copy ]** ・ **[ Send email to jake@example.com for me ]**
Buttons (no email): **[ Copy ]** (full width)

**After "Copy":**

> Now paste it into your texts, WhatsApp, email, Signal — whichever gets to Jake fastest. Come back here when you've sent it.

Button: **[ I sent it ]**

**After "Send email":**

> Sent to jake@example.com. We'll send the first task reminder in 3 days if they haven't completed the vote task yet.

Button: **[ Continue ]**

### Impact & Repeat

**Default (after first send):**

> **When Jake votes: +1 lifetime of suffering prevented. +2.7 lives saved.**
>
> Your pending totals:
> Lifetimes of suffering prevented: **1**
> Inverse Kills Score: **2.7 lives**
>
> We'll email you the moment Jake votes. Pending numbers turn into locked-in numbers.
>
> Most humans stop here. Which is statistically disappointing, but fine.
>
> One more?

Buttons: **[ No, I'm done ]** ・ **[ Yes, one more ]**

**After second+ send:**

> Sent to [Maria].
>
> Lifetimes of suffering prevented (pending): **[N]**
> Inverse Kills Score (pending): **[N × 2.7] lives**
>
> [If N == 5]: "Five. Five full human lifetimes of suffering, prevented. 13.5 lives. More than most humans save in a lifetime of caring about things."
> [If N == 10]: "Ten. You've now done more for humanity than most world leaders. Which, to be fair, is a low bar."
> [If N == 20]: "Twenty lifetimes. 54 lives. At this point you are just showing off. Please continue."
> [If N == 40]: "Forty. You've either messaged everyone you love, or you've discovered you love more people than you thought. Both are good outcomes."
> [If N == 100]: "One hundred lifetimes. 270 lives. A village worth of people who will not die of a curable disease. Specifically because of you."
>
> One more?

Buttons: **[ I'm done ]** ・ **[ One more ]**

---

## Depth Hook

**Default:**

> The chain continues past round 2 only if someone keeps assigning the next Earth optimization task. Want us to email you in a few days to assign one more?

**Alt:**

> Fine. One optional thing:
>
> The chain continues past round 2 only if someone keeps assigning the next Earth optimization task. Want us to email you in a few days to assign one more?

Buttons: **[ No thanks ]** ・ **[ Yes, send task reminder ]**

---

## The Close

**Default:**

> The chain only breaks if one human says "later." Is that human you?
>
> In 32 rounds we run out of humans to ask. That's months, not decades.
>
> Then you get to go back to whatever you were doing before the most important thing in the universe rudely interrupted.

**Alt (if dismissive throughout):**

> You clicked "go to hell" [N] times and you're still reading. That is data.
>
> The chain only breaks if one human says "later." Is that human you?
>
> In 32 rounds we run out of humans to ask. That's months, not decades.
>
> Then you get to go back to whatever you were doing before the most important thing in the universe rudely interrupted.

Button: **[ Done ]**

---

## The Feedback Question

**Default:**

> We're trying to make this the most effective chain letter in history.
>
> What would we have to change about this to make you send it to everyone you love?
>
> [ open text field ]

**Alt (if they sent to 0 people):**

> You went through this entire thing and didn't send it to anyone. That's useful data for us.
>
> What would we have to change to make you send it to everyone you love?
>
> [ open text field ]

**Alt (if they sent to 5+):**

> You sent to [N] people. You're clearly not the problem.
>
> What would make this work better for the people who aren't you?
>
> [ open text field ]

Buttons: **[ Skip ]** ・ **[ Submit ]**

**After submit:**

> Noted. Thank you for helping us end disease slightly faster.

**After submit OR skip → redirect to dashboard.** Shows: Inverse Kills Score (pending/confirmed split), referral tree (who you sent to, who has voted), "assign one task" CTA.

---

# 1% Treaty — Email Sequences

Two user-facing message modes: **Bossy mode** and **Love mode**. Sender chooses per-send. The chosen mode determines which email variant the recipient gets throughout the sequence. Internal names may remain `TASK_NOTIFICATION` and `SINCERE`.

**From address for all system emails:** War on Disease <noreply@warondisease.org>
**From address for share emails:** [Sender name] via War on Disease <noreply@warondisease.org>

**Unsubscribe:** required on every email, one-click, no guilt trip on the unsub page.

---

## Sequence A: Recipient Emails (sent to Jake)

4 emails max, hard cap. Format determined by sender's choice on the Message Format Choice screen.

---

### A1. The Share (Day 0)

#### A1-BOSSY (Bossy mode / Task Notification format)

**Subject:** [OVERDUE] Task assigned to you: End War and Disease

**Body:**

> ⚠️ **[OVERDUE] End War and Disease**
>
> TASK: End War and Disease
> ASSIGNED BY: [Sender name]
> STATUS: Overdue (by approximately 443 years)
> PRIORITY: Critical
> ESTIMATED TIME: 30 seconds
> ACTION REQUIRED: Vote on the 1% Treaty
>
> [BUTTON: COMPLETE TASK → warondisease.org]
>
> NOTE: This task was originally due several centuries ago but kept getting deprioritized in favor of building 122 apocalypses worth of nuclear weapons. Management apologizes for the delay.
>
> — The Humanity Project Management System

#### A1-LOVE (Love mode / Sincere format)

**Subject:** [Sender name] wants you to not die of a horrible disease

**Body:**

> Hi Jake,
>
> [Sender name] asked us to send you this:
>
> "I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease?"
>
> [BUTTON: Take the 30-second survey → warondisease.org]
>
> That's it. 30 seconds. One question. No account required.
>
> If you're wondering why this matters, the short version: 95% of diseases have zero treatments, and redirecting 1% of military spending to clinical trials could fix that in 36 years instead of 443. The math is at manual.warondisease.org if you want to check it.
>
> — warondisease.org

---

### A2. First Overdue Task Reminder (Day 3, if no vote)

#### A2-BOSSY

**Subject:** REMINDER: Task "End War and Disease" is still incomplete

**Body:**

> ⚠️ **TASK OVERDUE — 3 DAYS**
>
> TASK: End War and Disease
> ASSIGNED BY: [Sender name]
> STATUS: Incomplete
> ESTIMATED TIME: 30 seconds
> DAYS OVERDUE: 3 (plus the original 443 years)
>
> [BUTTON: COMPLETE TASK → warondisease.org]
>
> Your project manager ([Sender name]) has been notified of this delay. They seem disappointed. Not angry, just disappointed.
>
> — The Humanity Project Management System

#### A2-LOVE

**Subject:** [Sender name] is still hoping you don't die

**Body:**

> Hi Jake,
>
> Three days ago, [Sender name] asked you to take a 30-second survey about redirecting 1% of military spending to clinical trials.
>
> You haven't taken it yet, which is fine. But statistically, you or someone you love will get a disease with no available treatment. That part isn't fine.
>
> [BUTTON: 30 seconds → warondisease.org]
>
> — warondisease.org

---

### A3. The Escalation (Day 7, if no vote)

#### A3-BOSSY

**Subject:** ESCALATION: Task "End War and Disease" flagged for review

**Body:**

> ⚠️ **TASK ESCALATED**
>
> TASK: End War and Disease
> ASSIGNED BY: [Sender name]
> STATUS: Blocked (by you)
> DAYS OVERDUE: 7 (plus the original 443 years)
> BLOCKER: Jake has not clicked a button
>
> This task has been escalated to your project manager (all of humanity). Continued inaction may result in you and everyone you love suffering and dying of curable diseases.
>
> This is technically a chain letter. The old ones threatened 7 years of bad luck. This one threatens the above, which is also bad luck.
>
> [BUTTON: COMPLETE TASK → warondisease.org]
>
> We'll stop sending task reminders after this if you don't respond.
>
> — The Humanity Project Management System

#### A3-LOVE

**Subject:** This is technically a chain letter

**Body:**

> Hi Jake,
>
> The old chain letters threatened 7 years of bad luck if you broke the chain. If this chain breaks, you and everyone you love will suffer and die of curable diseases. Which is also bad luck.
>
> The difference: this one is free, takes 30 seconds, and the threat is not a superstition. It is an epidemiological fact.
>
> [BUTTON: 30 seconds → warondisease.org]
>
> [Sender name] asked us to send this because they care about you. We'll stop emailing after this if you don't respond.
>
> — warondisease.org

---

### A4. Final (Day 14, if no vote)

#### A4-BOSSY

**Subject:** Task "End War and Disease" will be reassigned

**Body:**

> Jake,
>
> Final notice. Task will be reassigned to someone who prefers not dying of a curable disease.
>
> [BUTTON: COMPLETE TASK → warondisease.org]
>
> — The Humanity Project Management System

#### A4-LOVE

**Subject:** Last one

**Body:**

> Jake,
>
> [Sender name] loves you and asked us to ask you one more time.
>
> 30 seconds. One question. Then we stop.
>
> [BUTTON: warondisease.org]
>
> — warondisease.org

After A4, no more emails regardless of outcome. Hard cap. Promise honored.

---

## Sequence B: Sender Emails (sent to the person who voted and shared)

These go to the verified user who completed the flow.

---

### B1. Vote Confirmed (Day 0, post-verification)

**Subject:** Vote counted. Here's what it's worth.

**Body:**

> Your vote for the 1% Treaty was verified.
>
> What that means, if the treaty passes:
> **1 human lifetime of suffering prevented. 2.7 lives saved.**
>
> That's your share of 10.7 billion deaths prevented, divided across a majority of humans on Earth.
>
> [BUTTON: See your dashboard → warondisease.org/dashboard]
>
> If you shared with anyone during the flow, their status is on your dashboard. We'll email you the moment any of them vote.
>
> — warondisease.org

---

### B2. [Name] Just Voted (triggered, whenever it happens)

**Subject:** [Recipient name] just voted

**Body:**

> [Recipient name] voted for the 1% Treaty.
>
> **+2.7 lives confirmed. +1 lifetime of suffering prevented.**
>
> Your Inverse Kills Score:
> Confirmed: **[Y] lives**
> Pending: **[X] lives**
>
> [BUTTON: See your dashboard → warondisease.org/dashboard]
>
> — warondisease.org

Send IMMEDIATELY when the recipient votes. Delay kills the dopamine.

---

### B3. Overdue Task Reminder to Assign One More (Day 7, if opted in at Depth Hook)

**Subject:** One more?

**Body:**

> You messaged [N] people. [X] of them have voted so far.
>
> The chain continues past round 2 only if someone keeps assigning the next Earth optimization task.
>
> [BUTTON: Assign one more Earth optimization task → warondisease.org/send]
>
> Your Inverse Kills Score: **[Y] confirmed, [X] pending.**
>
> — warondisease.org

---

### B4. Second Overdue Task Reminder (Day 14, if opted in)

**Subject:** Still [X] pending

**Body:**

> [X] of your [N] referrals haven't voted yet.
>
> You can't make them. But you can assign one more Earth optimization task and improve your odds.
>
> [BUTTON: Assign one more Earth optimization task → warondisease.org/send]
>
> — warondisease.org

---

### B5. Monthly Scorecard (Day 30, then monthly)

**Subject:** Your Inverse Kills Score: [total] lives

**Body:**

> Monthly update:
>
> **Confirmed:** [Y] lives saved, [Y÷2.7] lifetimes of suffering prevented
> **Pending:** [X] lives, waiting on [names]
> **Your referral chain:** [N] people you sent to → [M] of them voted → [K] of those shared further
>
> Total chain depth from you: [D] rounds
>
> [BUTTON: See full dashboard → warondisease.org/dashboard]
>
> The chain only breaks if one human says "later."
>
> — warondisease.org

---

## Sequence C: Re-engagement (YES voters who verified but never shared)

### C1. You Forgot the Important Part (Day 1)

**Subject:** You voted but didn't tell anyone

**Body:**

> You voted for the 1% Treaty yesterday. That's worth 2.7 lives and 1 lifetime of suffering prevented.
>
> But only if the chain keeps going. Right now your vote is a fact with no momentum.
>
> It takes 15 seconds to assign one task. The message is already written for you.
>
> [BUTTON: Assign one task → warondisease.org/send]
>
> — warondisease.org

---

## Implementation rules

- **Total email cap per recipient:** 4 emails maximum. Hard cap. No exceptions.
- **Format consistency:** if sender chose Bossy mode, all 4 recipient emails use the bossy/task variants. If they chose Love mode, all 4 recipient emails use the sincere/love variants. Don't mix formats within a recipient's sequence.
- **Total task reminder cap per sender:** 2 task-reminder emails (B3-B4) plus monthly scorecards.
- **Re-engagement:** 1 email (C1). One shot.
- **No images, no HTML formatting beyond the button and the task "card" styling.** Bossy emails can use task-card styling. Love emails stay plain text.
- **Deep links matter.** "Assign one more Earth optimization task" should drop the user directly into the Name & Contact screen, pre-authenticated. Never send them back to the landing page.

---

# Treaty Math Implementation Appendix

## Math Inputs And Parameter Rules

Use generated parameters from `packages/data/src/parameters/parameters-calculations-citations.ts`; do not hardcode these values in the flow, emails, dashboard, or impact cards. Display visible JSX values with `ParameterValue` and its `figures` prop when the copy needs a specific significant-figure display. Use `formatParameter()`, `fmtParamValueOnly()`, or Optimitron's treaty share-flow parameter helpers for strings, email bodies, task previews, and other non-JSX contexts.

Use the flow copy in this document verbatim for user-facing text. Some generated variable names still contain the older source wording; keep those names in code, but do not expose that wording in product copy.

**Source-of-truth imports**

```ts
import {
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_REGISTERED_VOTERS,
  GLOBAL_COORDINATION_TARGET_PCT,
  GLOBAL_POPULATION_2024,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS,
  DFDA_TRIAL_SUBSIDIES_ANNUAL,
  DIH_TREASURY_TRIAL_SUBSIDIES_PCT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  DRUG_DISCOVERY_TO_APPROVAL_YEARS,
  EFFICACY_LAG_YEARS,
  EVENTUALLY_AVOIDABLE_DEATH_PCT,
  EVENTUALLY_AVOIDABLE_DALY_PCT,
  GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES,
  GLOBAL_ANNUAL_DALY_BURDEN,
  GLOBAL_DISEASE_DEATHS_DAILY,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_WARHEAD_COUNT,
  GLOBAL_YLD_PROPORTION_OF_DALYS,
  HOURS_PER_YEAR,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT,
  PHASE_1_SAFETY_DURATION_YEARS,
  RARE_DISEASES_COUNT_GLOBAL,
  SAFE_COMPOUNDS_COUNT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_ANNUAL_FUNDING,
  TREATY_REDUCTION_PCT,
  UNEXPLORED_RATIO,
} from "@optimitron/data/parameters"
```

**Implementation constants**

```ts
const majorityHumanityDenominator = GLOBAL_REGISTERED_VOTERS.value

const impactPerVote = {
  lives: VOTER_LIVES_SAVED.value,
  sufferingHours: VOTER_SUFFERING_HOURS_PREVENTED.value,
  sufferingYears: VOTER_SUFFERING_HOURS_PREVENTED.value / HOURS_PER_YEAR.value,
  economicValue:
    DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value /
    majorityHumanityDenominator,
}
```

Current generated parameter result: `~2.6` lives and `~53` years of suffering prevented per vote. The flow copy in this document deliberately displays `2.7` lives and `55` years from a rounded 4 billion denominator; do not replace those visible copy strings with generated parameter output unless the source parameters are updated to the same denominator.

**Flow-visible wrapper exports**

Use these UI-only wrapper parameters from `packages/web/src/lib/treaty-share-flow-parameters.ts` when the flow copy needs the rounded visible values:

| Variable | Formula | Use |
| --- | --- | --- |
| `FLOW_MAJORITY_OF_HUMANS_ON_EARTH` | `roundToSigFigs(GLOBAL_REGISTERED_VOTERS, 1)` | Displays the 4 billion majority-of-humans-on-Earth target. |
| `FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT` | `DISEASES_WITHOUT_EFFECTIVE_TREATMENT / RARE_DISEASES_COUNT_GLOBAL` | Displays the 95% untreated-disease stakes claim. |
| `FLOW_TOTAL_LIVES_SAVED` | `roundToSigFigs(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED, 3)` | Displays the 10.7 billion deaths-prevented numerator. |
| `FLOW_TOTAL_SUFFERING_HOURS` | `roundToSigFigs(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS, 3)` | Displays the 1.93 quadrillion suffering-hours numerator. |
| `FLOW_VOTER_LIVES_SAVED` | `FLOW_TOTAL_LIVES_SAVED / FLOW_MAJORITY_OF_HUMANS_ON_EARTH` | Displays the exact 2.675 lives-per-vote derivation. |
| `FLOW_VOTER_LIVES_SAVED_ROUNDED` | `roundToSigFigs(FLOW_VOTER_LIVES_SAVED, 2)` | Displays the 2.7 lives-per-vote headline and pending-score math. |
| `FLOW_VOTER_SUFFERING_HOURS_PREVENTED` | `FLOW_TOTAL_SUFFERING_HOURS / FLOW_MAJORITY_OF_HUMANS_ON_EARTH` | Displays the 482,500 suffering-hours-per-vote derivation. |
| `FLOW_VOTER_SUFFERING_YEARS_PREVENTED` | `FLOW_VOTER_SUFFERING_HOURS_PREVENTED / HOURS_PER_YEAR` | Displays the 55 suffering-years-per-vote headline. |
| `FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR` | `round(NUCLEAR_WINTER_OVERKILL_FACTOR)` | Displays the 122 apocalypse-capacity claim. |
| `FLOW_WASTEFUL_APOCALYPSES` | `FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR - 1` | Displays the 121 wasteful-apocalypses claim. |
| `FLOW_NUCLEAR_WINTER_WARHEAD_THRESHOLD` | `round(NUCLEAR_WINTER_WARHEAD_THRESHOLD)` | Displays the 100-warhead apocalypse threshold. |
| `FLOW_GLOBAL_WARHEAD_COUNT` | `roundToSigFigs(GLOBAL_WARHEAD_COUNT, 2)` | Displays the 12,000 global-warhead count. |

**Majority target / progress denominator**

| Variable | Formula | Use |
| --- | --- | --- |
| `GLOBAL_REGISTERED_VOTERS` | source/input parameter | Denominator for per-vote impact and the share-flow target. Current generated value: `4,128,142,495`. |
| `GLOBAL_POPULATION_2024` | source/input parameter | Population denominator for progress-as-share-of-Earth calculations. |
| `GLOBAL_COORDINATION_TARGET_PCT` | `GLOBAL_REGISTERED_VOTERS / GLOBAL_POPULATION_2024` | Progress target when UI stores current progress as percent of global population. |
| `MAJORITY_OF_HUMANS_ON_EARTH` | display alias over `GLOBAL_REGISTERED_VOTERS` in `packages/web/src/lib/majority-humanity-target.ts` | UI wrapper for `ParameterValue` popovers so the visible label says majority of humans. |
| `MAJORITY_OF_HUMANS_SHARE_OF_EARTH` | optional display alias over `GLOBAL_COORDINATION_TARGET_PCT`; derive in app code if needed | Optional UI-only wrapper for share-of-Earth display. |

**Do not use as denominator for this flow**

| Variable | Generated formula | Why not |
| --- | --- | --- |
| `GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT` | source/input parameter | Chenoweth context only. |
| `THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION` | `GLOBAL_POPULATION_2024 × GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT` | Old 3.5% denominator; not the new majority-humanity denominator. |

**Per-vote impact variables**

| Variable | Generated formula | Use |
| --- | --- | --- |
| `VOTER_LIVES_SAVED` | `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED ÷ GLOBAL_REGISTERED_VOTERS` | Canonical generated lives-saved-per-vote value. Use this directly for per-vote lives. |
| `VOTER_SUFFERING_HOURS_PREVENTED` | `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS ÷ GLOBAL_REGISTERED_VOTERS` | Canonical generated suffering-hours-prevented-per-vote value. Use this directly for per-vote suffering hours. |
| `VOTER_SUFFERING_HOURS_PREVENTED / HOURS_PER_YEAR` | derived in app code | Suffering years per vote. Current generated values produce `~53` years. |
| `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED` | `GLOBAL_DISEASE_DEATHS_DAILY × 365 × DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS × EVENTUALLY_AVOIDABLE_DEATH_PCT` | Numerator for lives per vote. Use the generated total directly. |
| `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS` | `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS × GLOBAL_YLD_PROPORTION_OF_DALYS × HOURS_PER_YEAR` | Numerator for suffering hours per vote. Use the generated total directly. |
| `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE` | `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS × STANDARD_ECONOMIC_QALY_VALUE_USD` | Numerator for economic value per vote. Use the generated total directly. |
| `HOURS_PER_YEAR` | source/input parameter | Convert suffering hours to years. |
| `STANDARD_ECONOMIC_QALY_VALUE_USD` | source/input parameter | Supports the economic-value derivation. |

**Treatment acceleration variables**

| Variable | Generated formula | Use |
| --- | --- | --- |
| `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS` | `DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS + EFFICACY_LAG_YEARS` | Total timeline shift used in lives, DALYs, and suffering calculations. |
| `DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS` | `STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT × (1 - 1/DFDA_TRIAL_CAPACITY_MULTIPLIER)` | Timeline shift from more trial capacity. |
| `EFFICACY_LAG_YEARS` | `DRUG_DISCOVERY_TO_APPROVAL_YEARS - PHASE_1_SAFETY_DURATION_YEARS` | Additional patient access acceleration from removing the efficacy-testing lag. |
| `STATUS_QUO_AVG_YEARS_TO_FIRST_TREATMENT` | `STATUS_QUO_QUEUE_CLEARANCE_YEARS ÷ 2` | Input to treatment acceleration. |

**Disease burden variables**

| Variable | Generated formula | Use |
| --- | --- | --- |
| `GLOBAL_DISEASE_DEATHS_DAILY` | source/input parameter | User-facing daily-death stakes copy. |
| `GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES` | source/input parameter | Annual disease-death burden reference. |
| `EVENTUALLY_AVOIDABLE_DEATH_PCT` | `1 - FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT` | Avoidable share for lives-saved derivations. |
| `FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT` | `Σ(DISEASE_BURDEN[cat] × (1 - RESEARCH_ACCELERATION_POTENTIAL[cat]))` | Supports avoidable-share calculation. |
| `GLOBAL_ANNUAL_DALY_BURDEN` | source/input parameter | DALY numerator basis. |
| `EVENTUALLY_AVOIDABLE_DALY_PCT` | `1 - FUNDAMENTALLY_UNAVOIDABLE_DEATH_PCT` | Avoidable DALY share. |
| `GLOBAL_YLD_PROPORTION_OF_DALYS` | source/input parameter | Converts DALYs into suffering-hour component. |
| `DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS` | `GLOBAL_ANNUAL_DALY_BURDEN × EVENTUALLY_AVOIDABLE_DALY_PCT × DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS` | Numerator behind suffering hours and economic value. |

**Therapeutic frontier variables**

| Variable | Generated formula | Use |
| --- | --- | --- |
| `SAFE_COMPOUNDS_COUNT` | source/input parameter | "Known-safe compounds sit on shelves" stakes copy. |
| `UNEXPLORED_RATIO` | `1 - EXPLORATION_RATIO` | "99.7% of potential uses have never been tested" stakes copy. |

**Funding / patient-capacity variables**

| Variable | Generated formula | Use |
| --- | --- | --- |
| `GLOBAL_MILITARY_SPENDING_ANNUAL_2024` | source/input parameter | Base for the 1% treaty funding claim. |
| `TREATY_REDUCTION_PCT` | source/input parameter | The 1% share. |
| `TREATY_ANNUAL_FUNDING` | `GLOBAL_MILITARY_SPENDING_ANNUAL_2024 × TREATY_REDUCTION_PCT` | Annual funding produced by the treaty. |
| `DFDA_ANNUAL_TRIAL_FUNDING` | source/input parameter | Trial funding pool before operating cost subtraction. |
| `DFDA_ANNUAL_OPEX` | `PLATFORM_MAINTENANCE + STAFF + INFRASTRUCTURE + REGULATORY + COMMUNITY` | Annual operating cost. |
| `DFDA_TRIAL_SUBSIDIES_ANNUAL` | `DFDA_ANNUAL_TRIAL_FUNDING - DFDA_ANNUAL_OPEX` | Dollars available for patient subsidies. |
| `DIH_TREASURY_TRIAL_SUBSIDIES_PCT` | `DFDA_TRIAL_SUBSIDIES_ANNUAL / TREATY_ANNUAL_FUNDING` | Display the ~80% patient-subsidy allocation in the pragmatic-trial derivation. |
| `DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT` | source/input parameter | Conservative pragmatic trial cost per patient. |
| `TRADITIONAL_PHASE3_COST_PER_PATIENT` | source/input parameter | Contrast against conventional trial cost. |
| `PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT` | source/input parameter | Lower-cost pragmatic-trial benchmark. |
| `DFDA_PATIENTS_FUNDABLE_ANNUALLY` | `DFDA_TRIAL_SUBSIDIES_ANNUAL / DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT` | Fundable annual trial slots. |
| `CURRENT_TRIAL_SLOTS_AVAILABLE` | source/input parameter | Current annual trial-slot baseline. |
| `DFDA_TRIAL_CAPACITY_MULTIPLIER` | `DFDA_PATIENTS_FUNDABLE_ANNUALLY ÷ CURRENT_TRIAL_SLOTS_AVAILABLE` | Capacity multiplier. |

**Disease queue variables**

| Variable | Generated formula | Use |
| --- | --- | --- |
| `RARE_DISEASES_COUNT_GLOBAL` | source/input parameter | Base disease count. |
| `DISEASES_WITHOUT_EFFECTIVE_TREATMENT` | `RARE_DISEASES_COUNT_GLOBAL × 0.95` | Untreated disease queue. |
| `NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR` | source/input parameter | Status-quo discovery rate. |
| `STATUS_QUO_QUEUE_CLEARANCE_YEARS` | `DISEASES_WITHOUT_EFFECTIVE_TREATMENT ÷ NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR` | Status-quo queue length. |
| `DFDA_QUEUE_CLEARANCE_YEARS` | `STATUS_QUO_QUEUE_CLEARANCE_YEARS ÷ DFDA_TRIAL_CAPACITY_MULTIPLIER` | Queue length under the treaty. |

**Nuclear / treaty stakes variables**

| Variable | Generated formula | Use |
| --- | --- | --- |
| `GLOBAL_WARHEAD_COUNT` | source/input parameter | Nuclear weapons count. |
| `NUCLEAR_WINTER_WARHEAD_THRESHOLD` | source/input parameter | 100-warhead apocalypse threshold. |
| `NUCLEAR_WINTER_OVERKILL_FACTOR` | `GLOBAL_WARHEAD_COUNT / NUCLEAR_WINTER_WARHEAD_THRESHOLD` | Apocalypse-capacity multiple. |

---
