import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  fmtParamValueOnly,
  fmtRaw,
} from "@optimitron/data/parameters";
import type { ReferendumSiteContent } from "./types";

const apocalypseCount = fmtParamValueOnly(NUCLEAR_WINTER_OVERKILL_FACTOR);
const reducedApocalypseCount = fmtRaw(
  NUCLEAR_WINTER_OVERKILL_FACTOR.value * 0.99,
);
const diseaseAcceleration = fmtParamValueOnly(DFDA_TRIAL_CAPACITY_MULTIPLIER);
const statusQuoQueueYears = Math.round(
  STATUS_QUO_QUEUE_CLEARANCE_YEARS.value,
).toLocaleString("en-US");
const dfdaQueueYears = Math.round(
  DFDA_QUEUE_CLEARANCE_YEARS.value,
).toLocaleString("en-US");
const campaignName = "International Campaign to End War and Disease";
const treatyTradePosition = `humanity should trade one of its ${apocalypseCount} apocalypses of mass-murder capacity to compress the disease-eradication timeline from ${statusQuoQueueYears} years to ${dfdaQueueYears} years`;

export const onePercentTreatyContent: ReferendumSiteContent = {
  key: "onePercentTreaty",
  metadata: {
    home: {
      title: "1% Treaty — Take 30 Seconds to End War and Disease",
      description: `Humanity currently spends enough on mass murder capacity for ${apocalypseCount} apocalypses. This proposes we settle for ${reducedApocalypseCount} and use the savings to eradicate disease ${diseaseAcceleration} times faster.`,
    },
    treaty: {
      title: "Treaty — 1% Treaty",
      description:
        "The entire text, then a box to sign it. It is shorter than your last software update.",
    },
    dashboard: {
      title: "Dashboard — 1% Treaty",
      description:
        "Your signature, your link, and a list of leaders who are still late on a thirty-second task.",
    },
    tasks: {
      title: "Tasks — 1% Treaty",
      description:
        "The humans your species gives $36 trillion a year to promote the general welfare. Sorted by how late they are.",
    },
    endorse: {
      title: "Sign as Organization — 1% Treaty",
      description: `Sign the 1% Treaty as an organization: ${treatyTradePosition}.`,
    },
    signatories: {
      title: "Signatories — 1% Treaty",
      description:
        "Organizations and humans who publicly signed the 1% Treaty.",
    },
    supporters: {
      title: "Organizational Signatories — 1% Treaty",
      description: `Organizations that signed the 1% Treaty: ${treatyTradePosition}.`,
    },
    why: {
      title: "Why — 1% Treaty",
      description:
        "The numbers. 604 to 1. 443 years. 150,000 per day. The species does not like to look at them.",
    },
    legal: {
      title: "Legal — 1% Treaty",
      description:
        "For boards and counsel: joining is not lobbying, not election campaigning, and not domestic legislation.",
    },
    impact: {
      title: "Impact — 1% Treaty",
      description:
        "Cost-effectiveness of keeping humans alive, in the spreadsheet format your species requires before doing anything.",
    },
  },
  navItems: [
    { label: "Treaty", href: "/treaty" },
    { label: "Sign as Organization", href: "/endorse" },
    { label: "Signatories", href: "/signatories" },
    { label: "Tasks", href: "/tasks" },
    { label: "Why", href: "/why" },
    { label: "Legal", href: "/legal" },
  ],
  home: {
    eyebrow: "1% Treaty",
    heroTitle: "Please Take 30 Seconds to End War and Disease",
    titleLines: [
      "Redirect one percent of military spending",
      "to finding out which medicines actually work.",
    ],
    intro: "",
    primaryCtaLabel: "Read and sign the treaty",
    secondaryCtaLabel: "Sign as Organization",
    treatyEyebrow: "Treaty text",
    signTitle: "Sign the treaty now",
    signBody:
      "Read it. Sign it. Then go remind your late employees — the ones your species pays to promote the general welfare — that their thirty-second task is overdue.",
    signBoxTitle: "Sign the 1% Treaty",
    lateEmployeesEyebrow: "Late employees",
    lateEmployeesTitle:
      "Your late employees still have overdue Earth Optimization Tasks.",
    lateEmployeesBody:
      "These are the subtasks under Ratify the 1% Treaty. They are the humans you hired to promote the general welfare. They are late. The task is a pen.",
    lateEmployeesCtaLabel: "See every late employee",
  },
  dashboard: {
    welcomeTitle: "You signed. Thank you.",
    welcomeBody:
      "Your signature produces one more receipt to wave at the leaders who are still late on a thirty-second task.",
    shareTitle: "Share your signature",
    shareBody:
      "Start with your link. Then use the overdue task list below to remind specific humans that delay is measured in corpses and squandered paperwork-with-presidents-on-it.",
    shareText:
      "I signed the 1% Treaty to redirect 1% of military spending to finding out which medicines work. Sign it, then pressure the leaders who haven't:",
    shareEmailSubject: "I signed the 1% Treaty",
    shareCtaLabel: "See who still needs reminders",
    urgencyTitle: "Unsigned leaders are still costing lives and money.",
    urgencyBody:
      "Each overdue task below shows the damage from delay and includes the share-and-contact buttons you need to apply pressure until the wrist movement occurs.",
    statsLeadersLabel: "Leaders still unsigned",
    statsDeathsLabel: "Deaths from delay",
    statsMoneyLabel: "Economic value evaporated",
    tasksTitle: "Outstanding leader tasks",
    tasksBody:
      "Sort by deaths or wasted money. Then share the overdue tasks until the responsible humans stop pretending not to notice.",
    fullDashboardLabel: "Open your Earth Optimization dashboard",
  },
  supporters: {
    eyebrow: "Organizational signatories",
    title: "Organizational Signatories",
    description: `Organizations that publicly signed the 1% Treaty through the ${campaignName}.`,
    emptyTitle: "No organizational signatories yet.",
    emptyBody: `Be the first organization willing to put this on the record: ${treatyTradePosition}.`,
    ctaLabel: "Sign as Organization",
  },
  endorse: {
    eyebrow: "Organizational signature",
    title: "Sign as an Organization",
    signInTitle: "Sign in to sign",
    signInDescription:
      "Organization signatures use verified accounts so nobody signs your organization for you.",
    signInLabel: "Sign in",
    existingSupportersLabel: "organizational signatories",
  },
  why: {
    eyebrow: "The case",
    title: "Why the 1% Treaty",
    intro:
      "Redirect one percent of global military spending to finding out which medicines actually work. That is the whole ask. The math below is why your species will eventually agree.",
    facts: [
      {
        number: "604 : 1",
        label: "Weapons to medicine",
        body: "For every dollar your species spends testing which medicines actually work, it spends six hundred and four on weapons designed to make humans stop being alive. It is almost a hobby at this point.",
      },
      {
        number: "443 years",
        label: "The queue to not die",
        body: "At current clinical trial funding, finishing treatments for the known diseases takes until roughly the year twenty-four sixty-nine. Everyone currently alive will be dead before that queue clears. Their children too. Their grandchildren probably also.",
      },
      {
        number: "150,000 / day",
        label: "The daily deletion event",
        body: "One hundred and fifty thousand humans permanently stop every twenty-four hours from diseases that are, fundamentally, bugs in your meat software. That is one Holocaust every forty days, with fewer Nazis and more insurance paperwork.",
      },
      {
        number: "8.2 years",
        label: "Delay after a drug is proven safe",
        body: "Eight years between 'this drug will not kill you' and 'you may have this drug.' The drug passes the safety test. Everyone agrees it will not kill you. But you cannot have it because a committee needs almost a decade to be sure it works well enough while you do not.",
      },
      {
        number: "13,000",
        label: "Nuclear warheads on standby",
        body: "Enough to end your civilization thirteen times, in case the first twelve apocalypses fail to take. Your species keeps ordering more. Rocks have managed to live peacefully alongside different-colored rocks for thousands of years without any of this.",
      },
    ],
    closingLead: "One percent. Not ten. Not fifty. One.",
    closingBody:
      "If that is too much to ask, your species has a branding problem about what it actually values, and the branding problem is now killing approximately one hundred and four humans per minute.",
    ctaLabel: "Read and sign the treaty",
  },
  legal: {
    eyebrow: "For boards and counsel",
    title: "Legal analysis for organizational signatories",
    sections: [
      {
        heading: "Summary",
        paragraphs: [
          "Signing the 1% Treaty as an organization is not lobbying under U.S. tax law, does not involve participation in an election campaign, and does not constitute support for any specific domestic legislation. It is an expression of institutional support for an international policy principle.",
        ],
      },
      {
        heading: "Why this is not lobbying",
        paragraphs: [
          "Under IRC §4911 and Treasury Regulations, lobbying requires a communication that refers to specific legislation and expresses a view on it. The 1% Treaty is not pending legislation in any jurisdiction. It is a proposed international framework principle. Publicly expressing support for a policy idea does not meet the definition of a lobbying communication.",
        ],
      },
      {
        heading: "Why this is not election campaign activity",
        paragraphs: [
          "501(c)(3) organizations may not participate in, or intervene in, any political campaign on behalf of or in opposition to any candidate for public office. Joining this campaign names no candidate, takes no position for or against any candidate, and does not coordinate with any candidate campaign. It is policy advocacy in the broad sense permitted to charitable organizations.",
        ],
      },
      {
        heading: "Historical precedent",
        paragraphs: [
          "Charitable organizations have long signed international policy declarations — from the Universal Declaration of Human Rights to more recent global health frameworks — without implicating their tax-exempt status. The 1% Treaty signature follows the same pattern.",
        ],
      },
      {
        heading: "What signing commits your organization to",
        paragraphs: [],
        bullets: [
          "Public display of your organization's name and logo on the organizational signatories page.",
          "A single optional public statement (up to a few sentences) that appears beside your logo.",
          "No ongoing obligations. No financial contributions. No signatures on unrelated documents.",
        ],
      },
      {
        heading: "Withdrawal",
        paragraphs: [
          "An organization may withdraw its signature at any time by contacting the site administrator. Removal is processed within seven days.",
        ],
      },
      {
        heading: "Full treaty text",
        paragraphs: [
          "The canonical treaty text is available at /treaty. Counsel should review the full text before signing.",
        ],
      },
    ],
  },
  impactUrl: "https://warondisease.org/impact",
  notFound: {
    title: "This page is not here.",
    description:
      "Your species has 1.6 billion websites. This particular URL is not on the campaign site. Try one of the others.",
    ctaLabel: "Return home",
  },
};
