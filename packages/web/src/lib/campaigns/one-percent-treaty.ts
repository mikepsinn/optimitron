function formatCompactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 1,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

function round(value: number, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

interface TreatyCopyInput {
  actorLabel: string;
  annualRedirectAmountUsd: number;
  governmentName: string;
  militaryBudgetShareRatio: number;
}

/**
 * Canonical action-link target for treaty-signer tasks. A head of state
 * clicking through lands on the public treaty page; the actual signing flow
 * (when it lands) will be at `/treaty/sign?signer=<iso2>`. Citizens who claim
 * a reminder subtask append `?ref=<their-referralCode>` so attribution flows
 * back to them when the signer signs.
 */
export const TREATY_SIGN_URL = "https://1percenttreaty.org/treaty";
export const TREATY_SIGN_LABEL = "Sign the treaty";

export function buildTreatySignerContactTemplate() {
  return [
    "Your employee has not finished {{taskTitle}}. It is a thirty-second task. One signature. A wrist movement.",
    "It has been sitting on a desk for {{delayLabel}}. A desk. Not a war. A desk.",
    "Delay body count so far: {{humanLives}} humans have permanently stopped, {{sufferingHours}} hours of suffering accumulated, {{economicLoss}} evaporated. While the paperwork waited.",
    "The pen is here: {{taskUrl}}",
  ].join(" ");
}

export function buildTreatyAcceptanceCriteria(input: {
  actorLabel: string;
  governmentName: string;
}) {
  return [
    `${input.actorLabel} is handed an instrument — treaty, executive order, whatever your species uses to turn a promise into paperwork.`,
    `${input.actorLabel} signs it. In public. Where other humans can see it and remember it happened.`,
    `${input.governmentName} names the specific human responsible for moving the 1%. A human with a name, not a committee with a logo.`,
    "First implementation step announced within 90 days. No studies about studies. No task forces about task forces.",
  ];
}

export function buildTreatyTaskDescription(input: TreatyCopyInput) {
  const sharePct = round(input.militaryBudgetShareRatio * 100);
  return [
    `Your employee ${input.actorLabel} has a pen and thirty seconds.`,
    `If they use them on the 1% Treaty, ${input.governmentName} redirects about ${formatCompactUsd(input.annualRedirectAmountUsd)} a year from weapons designed to make humans stop being alive into trials that find out which medicines keep humans alive.`,
    `This office controls roughly ${sharePct}% of global military spending in the 2024 SIPRI snapshot. Statistically relevant, then.`,
    "Your species currently spends 604 times more on weapons than on testing which medicines work. The ask is 1%. If that sounds rude, consider the current ratio.",
  ].join(" ");
}

export function buildTreatyImpactStatement(input: Pick<TreatyCopyInput, "annualRedirectAmountUsd">) {
  return [
    `${formatCompactUsd(input.annualRedirectAmountUsd)} per year moves from the murder budget to the medicine budget the moment ink touches paper.`,
    "Thirty seconds of wrist movement for the signer. Approximately 104 humans permanently stop every minute the wrist does not move.",
  ].join(" ");
}

export function buildTreatyBlockerCallout() {
  return "Your employee needs a pen and thirty seconds. Every day they do not combine these two items, the small pieces of paper with presidents on them continue flowing toward weapons, and approximately 150,000 humans permanently stop. This is not a difficult task. It is a desk and a pen.";
}
