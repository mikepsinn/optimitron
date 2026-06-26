/**
 * Share-text templates for the task reminder dialog.
 *
 * Voice variants of the same overdue-task reminder. Templates that work for
 * any addressee use {target_name}; templates that need public-office context
 * stay leader-only.
 *
 * All templates consume the same flat token set produced by
 * `buildTaskShareTokens`. `renderTemplate` throws when placeholders are
 * unresolved so broken token/template combinations fail loudly in tests.
 *
 * `requiredTokens` lists the tokens whose absence makes the template
 * incoherent — the picker filters those out so a non-signer task never shows
 * the Performance Review variant with blanks where the spending figure
 * should be.
 *
 * Money tokens (`government_spending_ytd`, `money_wasted`, etc.) are already
 * formatted with a leading `$` by `formatCompactCurrency`. Do NOT prefix
 * them with a literal `$` in the template body — you'll get `$$3.49T`.
 */

/**
 * All token keys produced by `buildTaskShareTokens`. Keep in sync with that
 * function — the test suite verifies completeness.
 */
export type ShareTokenKey =
  | "citizen_name"
  | "country"
  | "daily_disease_deaths"
  | "days_overdue"
  | "deaths_from_delay"
  | "deaths_per_day"
  | "eradication_years_status_quo"
  | "eradication_years_treaty"
  | "government_spending_ytd"
  | "leader_handle"
  | "leader_name"
  | "lifetime_income_gain"
  | "mil_budget_pct"
  | "mil_synonym"
  | "mil_to_trials_ratio"
  | "money_wasted"
  | "money_wasted_per_day"
  | "target_name"
  | "task_title"
  | "treaty_hale_gain"
  | "treaty_url"
  | "trial_capacity_multiplier"
  | "trials_budget_pct";

export type ShareRecipientMode = "leader" | "humanity" | "one_human" | "peer";

export interface ShareTemplate {
  id: string;
  label: string;
  body: string;
  /** Tokens this template falls apart without. */
  requiredTokens: ShareTokenKey[];
  /**
   * Which recipient modes can use this template?
   *
   * - `leader` (default): message is aimed at the overdue head of state.
   * - `humanity`: message is aimed at humanity as the named recipient.
   * - `one_human`: message is aimed at a friend/family member the user names.
   * - `peer`: message is aimed at a friend without a referral task/link.
   *
   * Omitting the field means `leader` — preserves the existing pool's
   * behavior without touching every entry.
   */
  recipientModes?: ShareRecipientMode[];
}

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: "polite-reminder",
    label: "Polite Reminder",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: [
      "target_name",
      "days_overdue",
      "deaths_per_day",
      "money_wasted_per_day",
      "deaths_from_delay",
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: [
      `Hi {target_name},`,
      ``,
      `Friendly reminder — the 1% Treaty is still unsigned. Day {days_overdue}.`,
      ``,
      `The task: sign at {treaty_url}. Type your name, click submit. 30 seconds.`,
      ``,
      `The math: humanity has 12,241 nuclear warheads. Nuclear winter takes ~100. The other 12,141 are decorative — 122 apocalypses worth of mass murder capacity, and you only get to have one. The treaty trims this from 122 to 120.8 in exchange for {trial_capacity_multiplier}× clinical trial capacity — compressing disease eradication from {eradication_years_status_quo} years to {eradication_years_treaty}. 120.8 apocalypses is functionally indistinguishable from 122.`,
      ``,
      `Precedent check, in case 1% sounds bold: pre-WWII US military spending was 96.7% lower than today's peacetime budget, inflation-adjusted. The US still won WWII, then cut spending 87.6% in two years and produced the largest economic expansion in history. Your governments have already banned chemical weapons (1993, 193 countries), biological weapons (1975, 187 countries), and landmines (1997, 164 countries) — weapons they actually like using. This one just asks them to buy 1% fewer of them.`,
      ``,
      `{eradication_years_treaty} years also means you, personally, might watch the world's last disease get cured. {eradication_years_status_quo} years means your great-great-great-grandchildren still won't.`,
      ``,
      `While it sits unsigned: {deaths_per_day} die per day waiting for treatments. {money_wasted_per_day} per day — each day late pushes the eradication finish line one day later. {deaths_from_delay} dead since this task was assigned.`,
      ``,
      `Thank you.`,
    ].join("\n"),
  },
  {
    id: "performance-review",
    label: "Performance Review",
    requiredTokens: [
      "leader_name",
      "country",
      "citizen_name",
      "government_spending_ytd",
      "days_overdue",
      "deaths_from_delay",
      "money_wasted",
      "mil_to_trials_ratio",
      "trials_budget_pct",
    ],
    body: [
      `PERFORMANCE REVIEW — {leader_name}, {country}`,
      ``,
      `Budget consumed (YTD): {government_spending_ytd}`,
      `Job responsibilities: "Promote the general welfare"`,
      `Welfare promoted: None detected`,
      ``,
      `Outstanding action items: 1 (Sign the 1% Treaty — {treaty_url})`,
      `Estimated time to complete: 30 seconds`,
      `Days overdue: {days_overdue}`,
      `Previous reminders sent: {days_overdue}`,
      `Employee response: N/A`,
      ``,
      `Casualties accrued during review period: {deaths_from_delay}`,
      `Cost accrued during review period: {money_wasted}`,
      `Spending ratio (military : clinical trials): {mil_to_trials_ratio} : 1`,
      `Share of combined budget actually testing whether medicines work: {trials_budget_pct}`,
      ``,
      `The task is typing your name in a box.`,
      ``,
      `Regards,`,
      `{citizen_name}`,
    ].join("\n"),
  },
  {
    id: "it-ticket",
    label: "IT Ticket",
    requiredTokens: [
      "leader_name",
      "days_overdue",
      "deaths_from_delay",
      "money_wasted",
      "government_spending_ytd",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "treaty_hale_gain",
      "lifetime_income_gain",
    ],
    body: [
      `TICKET #{days_overdue}-001`,
      `Severity: SEV-1`,
      `Status: OVERDUE`,
      `Assignee: {leader_name}`,
      `Status: OVERDUE ({days_overdue} days)`,
      `Casualties since ticket opened: {deaths_from_delay}`,
      `Budget burned since ticket opened: {money_wasted}`,
      ``,
      `Task: Sign the 1% Treaty`,
      `Steps: 1) Go to {treaty_url} 2) Type name 3) Click submit`,
      `ETA: 30 seconds`,
      ``,
      `Impact if resolved: Disease eradication compressed from {eradication_years_status_quo} years to {eradication_years_treaty}. {treaty_hale_gain} additional healthy years per human. {lifetime_income_gain} additional lifetime income per person.`,
      ``,
      `Impact if unresolved: {deaths_from_delay} dead so far. Number goes up daily.`,
      ``,
      `Admin has spent {government_spending_ytd} this year. This is the task. Please do the task.`,
    ].join("\n"),
  },
  {
    id: "short",
    label: "Short (X)",
    requiredTokens: ["leader_handle", "mil_synonym", "deaths_from_delay", "mil_to_trials_ratio"],
    body: ".@{leader_handle} For every $1 you spend on clinical trials, ${mil_to_trials_ratio} goes to {mil_synonym}. The 1% Treaty moves 1% of military spending to clinical trials. 30 seconds to sign. {deaths_from_delay} dead of curable disease waiting. {treaty_url}",
  },
  {
    id: "sleepy-sign-it",
    label: "Sleepy Sign-It",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name", "deaths_from_delay", "trial_capacity_multiplier"],
    body: "Sleepy {target_name} STILL hasn't signed the 1% Treaty. 122 apocalypses of mass murder capacity down to 120.8 — you can only HAVE one apocalypse, folks — in exchange for {trial_capacity_multiplier}× the clinical trials. Easiest deal ever written. 30 seconds! I could do it in 5. {deaths_from_delay} dead of curable disease waiting. Very weak. Very sad. {treaty_url} — sign it!",
  },
  {
    id: "deal-maker",
    label: "The Deal-Maker",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: [
      "target_name",
      "mil_synonym",
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: "Look, {target_name}. I've made a LOT of deals. This one's a layup. 1% off {mil_synonym}, you get {trial_capacity_multiplier}× the clinical trials, disease clock drops from {eradication_years_status_quo} years to {eradication_years_treaty}. Easiest deal ever written. Sign it. {treaty_url}. 30 seconds. Not hard!",
  },
  {
    id: "many-people-are-saying",
    label: "Many People Are Saying",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name", "deaths_from_delay", "trial_capacity_multiplier"],
    body: "Many people are saying {target_name} can't sign the 1% Treaty — drops mass murder capacity from 122 apocalypses to 120.8, in exchange for {trial_capacity_multiplier}× more clinical trials — because they don't know how to click a button on a website. I don't know! Maybe true, maybe not! But {deaths_from_delay} dead of curable disease since the task was assigned. Someone help {target_name} out. {treaty_url}",
  },
  {
    id: "the-ratio",
    label: "The Ratio",
    requiredTokens: ["country", "mil_to_trials_ratio", "mil_synonym"],
    body: "{country} spends ${mil_to_trials_ratio} on BOMBS for every $1 on finding out which medicines work. ONE DOLLAR. Who negotiated this? Total disaster. FIRE THEM. Sign the 1% Treaty — moves 1% from {mil_synonym} to clinical trials. {treaty_url}. Easy!",
  },
  {
    id: "3am-truth",
    label: "3 AM Truth",
    requiredTokens: ["leader_name", "government_spending_ytd", "daily_disease_deaths"],
    body: "Can't sleep. Thinking about how {leader_name} has spent {government_spending_ytd} this year and STILL can't find 30 seconds to sign a treaty that saves {daily_disease_deaths} lives a day. Very low energy leadership. Very sad! {treaty_url}",
  },
  {
    id: "tremendous-treaty",
    label: "The Tremendous Treaty",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: [
      "target_name",
      "deaths_per_day",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: "I have a BEAUTIFUL treaty. Many people are saying it's the greatest treaty ever written. {eradication_years_status_quo}-year disease timeline? Down to {eradication_years_treaty}. TREMENDOUS. {target_name} won't sign. Very unfair to the {deaths_per_day} people who permanently stop every day. {treaty_url}",
  },
  {
    id: "lumbergh",
    label: "Office Memo",
    recipientModes: ["leader", "humanity"],
    requiredTokens: [
      "target_name",
      "deaths_from_delay",
      "mil_to_trials_ratio",
      "mil_synonym",
    ],
    body: [
      `Yeahhh, hi {target_name}, if you could go ahead and sign the 1% Treaty, that'd be great.`,
      ``,
      `It's at {treaty_url}. You just type your name and click submit. Should take about 30 seconds. So if you could just go ahead and do that, that'd be terrific.`,
      ``,
      "Oh, and I'm going to need you to be aware that {deaths_from_delay} people have died waiting for cures since we assigned this to you. You know. Because of the delayed disease eradication. So. Yeah.",
      ``,
      "So if you could just sign that. And maybe stop spending ${mil_to_trials_ratio} on {mil_synonym} for every $1 on clinical trials. That'd be great.",
    ].join("\n"),
  },
  {
    id: "lumbergh-one-human",
    label: "Office Memo",
    recipientModes: ["one_human"],
    requiredTokens: [
      "target_name",
      "deaths_from_delay",
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "treaty_hale_gain",
      "lifetime_income_gain",
    ],
    body: [
      `Yeahhh, hi {target_name}. Quick workflow update from the Department of Civilization Made a Spreadsheet and It Is Bad.`,
      ``,
      `If you could go ahead and vote on the 1% Treaty, that'd be great:`,
      `{treaty_url}`,
      ``,
      `It takes about 30 seconds. That is less time than deciding whether the leftovers in your fridge are food or a threat.`,
      ``,
      "Small note for the agenda: the treaty trades 1% of military spending for {trial_capacity_multiplier}× more clinical trials. That compresses disease eradication from {eradication_years_status_quo} years to {eradication_years_treaty}. Mathematically it drops mass-murder capacity from 122 apocalypses to 120.8 — and, just to be clear, you can only have one apocalypse. (Humanity has 12,241 warheads, nuclear winter takes ~100, the other 12,141 are decorative.) The 121 spare apocalypses will not be missed.",
      ``,
      "{eradication_years_treaty} years also means you, personally, might watch the world's last disease get cured. {eradication_years_status_quo} years means your great-great-great-grandchildren still won't. Just so you have the timeline in front of you.",
      ``,
      "The personal math is also rude: {treaty_hale_gain} additional healthy years per human and {lifetime_income_gain} additional lifetime income per person. HR says we should call this a wellness benefit.",
      ``,
      "Before you flag this as 'unrealistic' on the agenda — pre-WWII US military spending was 96.7% lower than today, inflation-adjusted. The US still won WWII, then cut spending 87.6% in two years and produced the largest economic expansion in history. The same governments later banned chemical weapons (1993, 193 countries), biological weapons (1975, 187 countries), and landmines (1997, 164 countries) — weapons they actually like using. This one just asks them to buy 1% fewer of them. That's it.",
      ``,
      "Also {deaths_from_delay} people have died waiting for cures since I sent you this. We are trying to make that number stop going up.",
      ``,
      "So if you could vote, then send this to two more humans who prefer not dying from preventable diseases, that'd be great.",
    ].join("\n"),
  },
  {
    id: "class-action",
    label: "Class Action",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: [
      "target_name",
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: [
      `IN THE COURT OF HUMANITY`,
      `Civil Case — Class Action Complaint`,
      ``,
      `PLAINTIFFS: All humans currently alive (~8 billion)`,
      `DEFENDANTS: The governments of Earth, et al.`,
      `RE: Breach of fiduciary duty to promote the general welfare`,
      ``,
      `COUNT 1 — MISALLOCATION OF FUNDS`,
      `Defendants were created and salaried to promote the median health and wealth of the citizenry. Since 1900 they have instead used $170 trillion of plaintiffs' money to kill 310 million humans, including approximately 930,000 physicians, 310,000 scientists, 620,000 engineers, 1.24 million nurses, 3.1 million teachers, and 102 million children who will never grow up to replace them.`,
      ``,
      `COUNT 2 — OPPORTUNITY COST`,
      `That $170 trillion could have funded ~37,778 years of clinical trials at current spending levels. Defendants bought 310 million murders instead.`,
      ``,
      `DAMAGES SOUGHT`,
      `$3,000,000 per living human, payable forthwith. (Total: ~$24 quadrillion.)`,
      ``,
      `ALTERNATIVE SETTLEMENT OFFER`,
      `Pass the 1% Treaty: redirect 1% of military spending to clinical trials, buying {trial_capacity_multiplier}× clinical trial capacity and compressing disease eradication from {eradication_years_status_quo} years to {eradication_years_treaty}. Plaintiffs will accept this in lieu of cash damages, as the projected peace-dividend plus reduced disease burden delivers comparable per-capita compensation within 20 years.`,
      ``,
      `RESPONSE DEADLINE: 30 seconds`,
      `RESPONSE METHOD: {treaty_url}`,
      ``,
      `Defendants are reminded that ignoring this complaint will not make plaintiffs go away, as plaintiffs are also the funding source.`,
      ``,
      `— {target_name}, on behalf of the class`,
    ].join("\n"),
  },
  {
    id: "personal-roi",
    label: "Personal ROI",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `Hi {target_name},`,
      ``,
      `Quick personal-finance note. Had your governments not spent $170 trillion murdering people and destroying everything they spent their entire lives building, the average human alive today would earn $333,636 a year instead of $14,375. Dead scientists do not discover things and exploded cities are very expensive to fix.`,
      ``,
      `Through the compound effects of this misallocation to war alone, you are 23.2 times poorer than you would otherwise be. (Source and citations: warondisease.org/treaty.)`,
      ``,
      `Going forward: global military spending has been growing 2.76% a year for twenty years. If no one tells it to stop, every human alive will pay about $402,488 over their lifetime (mostly funding explosions in countries they cannot find on a map). A one percent cut tells it to stop. That saves the average person about $290,052 — the peace dividend.`,
      ``,
      `The 1% Treaty is the cut: {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "pentagon-hr",
    label: "Pentagon HR Memo",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `PERFORMANCE NOTE — Department of "Defense"`,
      ``,
      `The Department of "Defense" has "misplaced" $2.46 trillion, failed seven consecutive audits trying to find it, and then requested additional trillions without explanation or apology.`,
      ``,
      `Not to belabor the point, but that money could have funded 547 years of clinical trials at current funding levels, possibly saving billions of lives and preventing quadrillions of hours of suffering.`,
      ``,
      `So if {target_name} could go ahead and have them be more careful in the future, that'd be great.`,
      ``,
      `The 1% Treaty starts that — redirects 1% of military spending to the trials that would test which medicines work. {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "850-bullets",
    label: "850 Bullets",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body:
      "{target_name} — your employees spend $2.72 trillion a year on their capacity for mass murder, which is enough to buy 850 bullets for every man, woman, and child every year, even though it would require at most 2 bullets per person to murder everyone. After the 1% Treaty cut they would still have $2.69 trillion — enough to murder everyone 20 times, which should be more than sufficient. Sign: {treaty_url}",
  },
  {
    id: "diseases-no-decency",
    label: "Diseases Without the Decency",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name", "daily_disease_deaths"],
    body: [
      `Hi {target_name},`,
      ``,
      `Diseases kill more people than all wars combined and, unlike wars, do not even have the decency to be quick about it.`,
      ``,
      `{daily_disease_deaths} die of disease every day.`,
      `Your chance of dying in a terrorist attack: 1 in 30 million.`,
      `Your chance of dying of a disease: 100%.`,
      `Your government's budget does not reflect this.`,
      ``,
      `The 1% Treaty does. Sign: {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "four-year-olds",
    label: "Four-Year-Old Foreign Policy",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `Hi {target_name},`,
      ``,
      `Your nations have been hitting each other for 10,000 years because the other one hit them last.`,
      ``,
      `This is the conflict resolution strategy of four-year-olds, except four-year-olds eventually get tired and take a nap. Your species invented naps and then refused to apply them to geopolitics.`,
      ``,
      `The 1% Treaty applies a 1% nap. {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "mortality-reminder",
    label: "Mortality Reminder",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: [
      "target_name",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "trial_capacity_multiplier",
    ],
    body: [
      `Hi {target_name},`,
      ``,
      `At the current discovery rate, finding treatments for all diseases takes ~{eradication_years_status_quo} years. You personally will be dead within 80 years, which I mention not to be rude but because you seem weirdly calm about it.`,
      ``,
      `Redirecting 1% of current military spending to pragmatic clinical trials could increase trial capacity {trial_capacity_multiplier}x and shorten the disease eradication timeline to ~{eradication_years_treaty} years.`,
      ``,
      `Sign: {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "orphan-manufacturing",
    label: "Orphan Manufacturing",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `Hi {target_name},`,
      ``,
      `For every $604 your governments spend on the capacity for orphan manufacturing, they spend $1 on clinical trials that might cure the diseases you and everyone you love will suffer and die from.`,
      ``,
      `The 1% Treaty moves $6 of those $604 to the cures. The ratio drops from 604:1 to about 85:1. Still mostly orphans. Just slightly fewer.`,
      ``,
      `Sign: {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "cunk",
    label: "Naive Question",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `Hi {target_name},`,
      ``,
      `So I was reading about the 1% Treaty and I had a few questions.`,
      ``,
      `Apparently humanity has 12,241 nuclear warheads, but you only need about 100 to end civilisation. So… what are the other 12,141 for? Are we expecting more civilisations to turn up?`,
      ``,
      `And apparently your governments spend $604 on weapons for every $1 on testing which medicines work. Wouldn't it be better the other way round? Or, you know, even slightly the other way round?`,
      ``,
      `The treaty asks for $604 on weapons to become $598 on weapons. I asked an expert if this was a lot to ask. They said no.`,
      ``,
      `Sign: {treaty_url}. The expert said it takes about 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "deep-thought",
    label: "Deep Thought",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `Sometimes I wonder, if humanity has 12,241 nuclear warheads but only one civilization to destroy, what we're saving the other 12,141 for. Maybe we think more civilizations will turn up. They won't.`,
      ``,
      `Other times I think about how every disease has a cure waiting to be discovered, and we just haven't tried the right combinations yet, because we're busy buying our 12,242nd nuclear warhead.`,
      ``,
      `If we redirected one percent of the warhead-buying to the cure-discovering, {target_name}'s mom might still get to meet her grandchildren. That seems worth thinking about.`,
      ``,
      `Anyway. {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "specific-future-humans",
    label: "Specific Future Humans",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `Hi {target_name},`,
      ``,
      `Discovering treatments centuries sooner is projected to prevent approximately 10.7 billion deaths and 1.93 quadrillion hours of human suffering, which are not metaphors and refer to specific future humans with specific future plans for next Tuesday.`,
      ``,
      `The 1% Treaty is the policy that buys us those centuries. {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "receipt",
    label: "Article V Receipt",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `Hi {target_name},`,
      ``,
      `Article V of the 1% Treaty: any citizen of a signatory nation may sue their own government, in its own courts, for non-compliance with the treaty. Where domestic courts decline jurisdiction or invoke sovereign immunity, citizens may bring the same claim in the Court of Humanity — whose jurisdiction derives from human consent rather than sovereign consent, and whose judgments are enforced through capital markets rather than coercion.`,
      ``,
      `Your government works for you. This is the receipt.`,
      ``,
      `Sign: {treaty_url}. 30 seconds.`,
    ].join("\n"),
  },
  {
    id: "whereas-counterproductive",
    label: "WHEREAS, This Seems Counterproductive",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body: [
      `Hi {target_name},`,
      ``,
      `WHEREAS, your governments were hired to promote the median health and wealth of the citizenry;`,
      ``,
      `WHEREAS, they have instead spent approximately $170 trillion on war and destruction since 1913, killing approximately 310 million humans;`,
      ``,
      `WHEREAS, these murdered humans included 930,000 doctors, 310,000 scientists, 620,000 engineers, 1.24 million nurses, 3.1 million teachers, and 102 million children who will never grow up to replace them;`,
      ``,
      `WHEREAS, this seems counterproductive;`,
      ``,
      `WHEREAS, your governments currently spend $604 on weapons for every $1 on the clinical trials that might cure what is actually going to kill you;`,
      ``,
      `WHEREAS, this also seems counterproductive;`,
      ``,
      `WHEREAS, the 1% Treaty redirects $6 of those $604 to the cures, leaving the weapons budget at approximately 99% of what it was;`,
      ``,
      `WHEREAS, this would in fact be productive;`,
      ``,
      `NOW THEREFORE, sign at {treaty_url}. 30 seconds.`,
      ``,
      `— {target_name}`,
    ].join("\n"),
  },
  {
    id: "weve-done-this-before",
    label: "Precedent",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: [
      "target_name",
      "trial_capacity_multiplier",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: [
      `Hi {target_name},`,
      ``,
      `Pre-WW2 US military spending was 96.7% lower than today's peacetime budget, even after adjusting for inflation. The US still won World War II, then cut military spending 87.6% in two years and created the greatest growth in standard of living in history.`,
      ``,
      `Governments have already:`,
      `  • Banned chemical weapons (1993, 193 countries)`,
      `  • Banned biological weapons (1975, 187 countries)`,
      `  • Banned landmines (1997, 164 countries)`,
      ``,
      `They've signed treaties banning weapons they like using. The 1% Treaty just asks them to buy 1% fewer of them — in exchange for {trial_capacity_multiplier}× more clinical trials and disease eradication compressed from {eradication_years_status_quo} years to {eradication_years_treaty}.`,
      ``,
      `Even people who really, really love explosions should be able to handle 1%.`,
      ``,
      `Please take 30 seconds to vote at {treaty_url}`,
    ].join("\n"),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    requiredTokens: [
      "leader_name",
      "country",
      "government_spending_ytd",
      "deaths_from_delay",
      "mil_budget_pct",
      "mil_synonym",
      "mil_to_trials_ratio",
      "trials_budget_pct",
      "eradication_years_status_quo",
      "eradication_years_treaty",
    ],
    body: [
      `Excited to flag that {leader_name} has an amazing opportunity to sign the 1% Treaty 🙏`,
      ``,
      "{country} has spent {government_spending_ytd} this fiscal year. Of the combined military + clinical trials budget, {trials_budget_pct} goes to finding out which medicines work. The other {mil_budget_pct} goes to {mil_synonym} — that's ${mil_to_trials_ratio} on {mil_synonym} for every $1 on clinical trials.",
      "",
      `The 1% Treaty moves 1% of military spending to clinical trials. It compresses disease eradication from {eradication_years_status_quo} years to {eradication_years_treaty}. The task is literally typing your name in a box at {treaty_url}. It takes 30 seconds.`,
      ``,
      `Grateful for the {deaths_from_delay} people who died from curable diseases since this task was assigned to help move this conversation forward. Their stories continue to inspire.`,
      ``,
      `Proud of the work ahead. Link for anyone who wants to drive impact: {treaty_url}`,
      ``,
      `#ServantLeadership #Accountability #HumanWelfare #ImpactDriven #PeopleFirst`,
    ].join("\n"),
  },
  {
    id: "invoice",
    label: "Overdue Invoice",
    requiredTokens: [
      "leader_name",
      "country",
      "government_spending_ytd",
      "deaths_per_day",
      "money_wasted_per_day",
      "days_overdue",
      "mil_to_trials_ratio",
      "mil_synonym",
    ],
    body: [
      `INVOICE #{days_overdue} — PAST DUE`,
      ``,
      `TO: {leader_name}, {country}`,
      `FROM: Your employers`,
      `RE: Undelivered services`,
      ``,
      `You've spent: {government_spending_ytd} (YTD)`,
      `On: "Promoting the general welfare"`,
      `Welfare delivered: Pending`,
      `Current {mil_synonym}-to-clinical-trials ratio: {mil_to_trials_ratio}:1`,
      ``,
      `Outstanding item: Sign the 1% Treaty`,
      `URL: {treaty_url}`,
      `Time required: 30 seconds`,
      ``,
      `Late fees (accruing daily):`,
      `— {deaths_per_day} deaths`,
      `— {money_wasted_per_day} in medical bills and lost output`,
      ``,
      `This is reminder #{days_overdue}.`,
    ].join("\n"),
  },
  {
    id: "onboarding",
    label: "Onboarding Reminder",
    requiredTokens: [
      "leader_name",
      "country",
      "days_overdue",
      "deaths_from_delay",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "trial_capacity_multiplier",
    ],
    body: [
      `Hi {leader_name}! 👋`,
      ``,
      `It looks like you still have 1 onboarding task remaining from when you started your role as leader of {country}. No rush, but it's been {days_overdue} days and we'd love to get you fully set up!`,
      ``,
      `📋 Remaining task:`,
      `   Sign the 1% Treaty (~30 seconds)`,
      `   • Reduces mass murder capacity: 122 apocalypses → 120.8`,
      `   • Buys {trial_capacity_multiplier}× clinical trial throughput`,
      `   • Compresses disease eradication: {eradication_years_status_quo} years → {eradication_years_treaty}`,
      `   {treaty_url}`,
      ``,
      `Your colleagues who completed this step without you:`,
      `   — {deaths_from_delay} of them (posthumously, from diseases the treaty would have cured)`,
      ``,
      `Let us know if you run into any blockers! Our team is here to help 🙂`,
      ``,
      `Cheers,`,
      `The People`,
    ].join("\n"),
  },
  {
    id: "calendar-invite",
    label: "Calendar Invite",
    requiredTokens: [
      "leader_name",
      "citizen_name",
      "days_overdue",
      "deaths_from_delay",
      "eradication_years_status_quo",
      "eradication_years_treaty",
      "trial_capacity_multiplier",
    ],
    body: [
      `📅 CALENDAR INVITE`,
      ``,
      `Title: Sign the 1% Treaty`,
      `Organizer: {citizen_name}`,
      `Required: {leader_name}`,
      `When: {days_overdue} days ago`,
      `Duration: 30 seconds`,
      `Location: {treaty_url}`,
      ``,
      `Description: Reduces mass murder capacity from 122 apocalypses to 120.8. Unlocks {trial_capacity_multiplier}× clinical trial capacity. Disease eradication compressed from {eradication_years_status_quo} years to {eradication_years_treaty}.`,
      ``,
      `Agenda:`,
      `1. Type name`,
      `2. Click submit`,
      ``,
      `Your response: ⬜ Accept  ⬜ Decline  ✅ Ignore for {days_overdue} days`,
      ``,
      `Notes: {deaths_from_delay} have died of curable disease since this meeting was first scheduled. Recurring daily until acknowledged.`,
    ].join("\n"),
  },
  {
    id: "pip",
    label: "Improvement Plan",
    requiredTokens: [
      "leader_name",
      "country",
      "citizen_name",
      "days_overdue",
      "deaths_from_delay",
      "money_wasted",
      "mil_synonym",
      "mil_to_trials_ratio",
    ],
    body: [
      `PERFORMANCE IMPROVEMENT PLAN`,
      ``,
      `Employee: {leader_name}`,
      `Position: Leader of {country}`,
      `Review period: {days_overdue} days`,
      `Issued by: {citizen_name} and ~340M co-signers`,
      ``,
      `DEFICIENCIES:`,
      `— Core job function ("promote the general welfare") not observed`,
      "— Budget allocation inconsistent with stated role: ${mil_to_trials_ratio} on {mil_synonym} per $1 on clinical trials",
      `— {deaths_from_delay} casualties during review period`,
      `— {money_wasted} in foregone welfare during review period`,
      ``,
      `REQUIRED CORRECTIVE ACTION:`,
      `Sign the 1% Treaty at {treaty_url}`,
      `Estimated completion time: 30 seconds`,
      ``,
      `TIMELINE: Immediate`,
      `CONSEQUENCES IF UNMET: Next election cycle`,
      ``,
      `Employee signature: ______________________`,
    ].join("\n"),
  },
  {
    id: "slack-dm",
    label: "Slack DM",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name", "days_overdue", "deaths_from_delay", "trial_capacity_multiplier"],
    body: [
      `hey {target_name} 👋`,
      ``,
      `quick one — did you sign the treaty yet? the 1% one, drops mass murder capacity from 122 apocalypses to 120.8 in exchange for {trial_capacity_multiplier}× the clinical trials. {treaty_url}`,
      ``,
      `no worries if not, just following up since it's day {days_overdue} and {deaths_from_delay} people have died waiting for cures since i last pinged`,
      ``,
      `lmk if blocked on anything 🙏`,
    ].join("\n"),
  },
  {
    id: "task-notification",
    label: "Task Notification",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name", "citizen_name", "eradication_years_status_quo"],
    body: [
      "Overdue task: End War and Disease",
      "",
      "Assigned to: {target_name}",
      "Assigned by: {citizen_name}",
      "Time required: 30 seconds",
      "Due: about {eradication_years_status_quo} years ago",
      "",
      "Please vote on the 1% Treaty:",
      "{treaty_url}",
    ].join("\n"),
  },
  {
    id: "sincere",
    label: "Sincere",
    recipientModes: ["leader", "humanity", "one_human"],
    requiredTokens: ["target_name"],
    body:
      "Hi {target_name}. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? {treaty_url}",
  },
  {
    id: "most-important-secret",
    label: "The Most Important Secret",
    recipientModes: ["peer"],
    requiredTokens: ["citizen_name"],
    body: [
      `Can I tell you the most important secret in the world?`,
      ``,
      `Call me when you have 30 seconds.`,
      ``,
      `— {citizen_name}`,
    ].join("\n"),
  },
];

/**
 * Preferred default variant when the picker opens. Lumbergh's "yeahhh, if
 * you could go ahead and sign that" register is the one most readers
 * actually copy-paste — corporate passive-aggression translates across
 * political tribes in a way the Trump/LinkedIn voices don't.
 */
export const DEFAULT_SHARE_TEMPLATE_ID = "lumbergh";
export const HUMANITY_DEFAULT_SHARE_TEMPLATE_ID = "polite-reminder";
/**
 * Friend-recipient default. This keeps the Office Space cadence while using
 * only friend-safe tokens: the named human and their vote link.
 */
export const ONE_HUMAN_DEFAULT_SHARE_TEMPLATE_ID = "lumbergh-one-human";

/**
 * Peer-recipient default for the secret-chain pitch. It must render with only
 * `{citizen_name}` because that surface has no task target or vote link.
 */
export const DEFAULT_PEER_SHARE_TEMPLATE_ID = "most-important-secret";

export function getShareTemplate(id: string): ShareTemplate | undefined {
  return SHARE_TEMPLATES.find((template) => template.id === id);
}

function getTemplateRecipientModes(template: ShareTemplate): ShareRecipientMode[] {
  return template.recipientModes ?? ["leader"];
}

/**
 * Choose which template to show first. Prefers the recipient-mode default,
 * falls back to the first usable template if the default got filtered out
 * (e.g. missing tokens on the current task).
 */
export function pickDefaultShareTemplateId(
  templates: ShareTemplate[],
  recipientMode: ShareRecipientMode = "leader",
): string | null {
  const preferredId = {
    humanity: HUMANITY_DEFAULT_SHARE_TEMPLATE_ID,
    leader: DEFAULT_SHARE_TEMPLATE_ID,
    one_human: ONE_HUMAN_DEFAULT_SHARE_TEMPLATE_ID,
    peer: DEFAULT_PEER_SHARE_TEMPLATE_ID,
  } satisfies Record<ShareRecipientMode, string>;

  const selectedPreferredId = preferredId[recipientMode];
  if (templates.some((t) => t.id === selectedPreferredId)) {
    return selectedPreferredId;
  }
  return templates[0]?.id ?? null;
}

/**
 * Filter templates down to those whose required tokens all have non-empty
 * values in the given token bag AND match the requested recipient mode. Keeps the
 * picker from offering the Performance Review variant on a non-signer task
 * where half the fields would render blank, and keeps peer messages
 * out of leader-facing surfaces (and vice versa).
 */
export function getUsableShareTemplates(
  tokens: Record<string, string>,
  recipientMode: ShareRecipientMode = "leader",
): ShareTemplate[] {
  return SHARE_TEMPLATES.filter((template) => {
    if (!getTemplateRecipientModes(template).includes(recipientMode)) return false;
    return template.requiredTokens.every((key) => {
      const value = tokens[key];
      return value != null && value !== "";
    });
  });
}
