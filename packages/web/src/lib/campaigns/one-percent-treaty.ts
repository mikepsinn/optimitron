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

export function buildTreatySignerContactTemplate() {
  return [
    "Tell your employee to take 30 seconds to finish {{taskTitle}}.",
    "This blocking task is already {{delayLabel}}.",
    "Estimated delay cost so far: {{humanLives}} lives, {{sufferingHours}} suffering hours, and {{economicLoss}}.",
    "Public task page: {{taskUrl}}",
  ].join(" ");
}

export function buildTreatyAcceptanceCriteria(input: {
  actorLabel: string;
  governmentName: string;
}) {
  return [
    `A treaty instrument, executive order, or equivalent commitment is prepared for ${input.actorLabel}.`,
    `${input.actorLabel} publicly signs or commits to the 1% Treaty.`,
    `${input.governmentName} publicly names the implementation authority for the 1% redirect.`,
    "A first implementation step is announced within 90 days of signature.",
  ];
}

export function buildTreatyTaskDescription(input: TreatyCopyInput) {
  return [
    `Tell your employee ${input.actorLabel} to take 30 seconds to sign the 1% Treaty.`,
    `If completed, ${input.governmentName} redirects about ${formatCompactUsd(input.annualRedirectAmountUsd)} per year into pragmatic clinical trials and disease-eradication work.`,
    `This office controls about ${round(input.militaryBudgetShareRatio * 100)}% of global military spending in the 2024 SIPRI snapshot.`,
  ].join(" ");
}

export function buildTreatyImpactStatement(input: Pick<TreatyCopyInput, "annualRedirectAmountUsd">) {
  return [
    `${formatCompactUsd(input.annualRedirectAmountUsd)} per year redirected if completed.`,
    "Thirty seconds for the signer. Large global downside from delay.",
  ].join(" ");
}

export function buildTreatyBlockerCallout() {
  return "Tell your employee to take 30 seconds to sign. Every extra day keeps the money in weapons while disease kills people.";
}
