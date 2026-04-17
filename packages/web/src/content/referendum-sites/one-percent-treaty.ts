import type { ReferendumSiteContent } from "./types";

export const onePercentTreatyContent: ReferendumSiteContent = {
  key: "onePercentTreaty",
  metadata: {
    home: {
      title: "1% Treaty — End War and Disease in Thirty Seconds",
      description:
        "One percent. One signature. Your species has named harder things 'Tuesday.'",
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
      title: "Endorse — 1% Treaty",
      description:
        "Your organization puts its name next to 'against war and disease.' Controversial, apparently.",
    },
    supporters: {
      title: "Supporters — 1% Treaty",
      description:
        "Organizations willing to go on record opposing death. A remarkably short list so far.",
    },
    why: {
      title: "Why — 1% Treaty",
      description:
        "The numbers. 604 to 1. 443 years. 150,000 per day. The species does not like to look at them.",
    },
    legal: {
      title: "Legal — 1% Treaty",
      description:
        "For boards and counsel: endorsing is not lobbying, not a campaign, and not domestic legislation.",
    },
    impact: {
      title: "Impact — 1% Treaty",
      description:
        "Cost-effectiveness of keeping humans alive, in the spreadsheet format your species requires before doing anything.",
    },
  },
  navItems: [
    { label: "Treaty", href: "/treaty" },
    { label: "Endorse", href: "/endorse" },
    { label: "Supporters", href: "/coalition" },
    { label: "Tasks", href: "/tasks" },
    { label: "Why", href: "/why" },
    { label: "Legal", href: "/legal" },
  ],
  home: {
    eyebrow: "1% Treaty",
    heroTitle:
      "Please quickly skim and sign to end war and disease.",
    titleLines: [
      "Redirect one percent of military spending",
      "to finding out which medicines actually work.",
    ],
    intro: "",
    primaryCtaLabel: "Read and sign the treaty",
    secondaryCtaLabel: "Endorse as an organization",
    treatyEyebrow: "Treaty text",
    signTitle: "Sign the treaty now",
    signBody:
      "Read it. Sign it. Then go remind your late employees — the ones your species pays to promote the general welfare — that their thirty-second task is overdue.",
    signBoxTitle: "Sign the 1% Treaty",
    lateEmployeesEyebrow: "Late employees",
    lateEmployeesTitle: "Your late employees still have overdue treaty tasks.",
    lateEmployeesBody:
      "These are the subtasks under Ratify the 1% Treaty. They are the humans you hired to promote the general welfare. They are late. The task is a pen.",
    lateEmployeesCtaLabel: "Open the full late-employee list",
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
    shareCtaLabel: "Open the full accountability list",
    urgencyTitle: "Unsigned leaders are still costing lives and money.",
    urgencyBody:
      "Each overdue task below shows the damage from delay and includes the share-and-contact buttons you need to apply pressure until the wrist movement occurs.",
    statsLeadersLabel: "Leaders still unsigned",
    statsDeathsLabel: "Deaths from delay",
    statsMoneyLabel: "Economic value evaporated",
    tasksTitle: "Outstanding leader tasks",
    tasksBody:
      "Sort by deaths or wasted money. Then share the overdue tasks until the responsible humans stop pretending not to notice.",
    fullDashboardLabel: "Open the full Optimitron dashboard",
  },
  supporters: {
    eyebrow: "Official endorsers",
    title: "Supporters of the 1% Treaty",
    description:
      "Organizations that have formally resolved that curing disease is preferable to dying from it. An astonishingly non-obvious position, apparently.",
    emptyTitle: "No endorsements published yet.",
    emptyBody:
      "Be the first organization willing to go on record opposing preventable death. It should not be a bold stance.",
    ctaLabel: "Add your organization",
  },
  endorse: {
    eyebrow: "Organizational endorsement",
    title: "Endorse the 1% Treaty",
    description:
      "Submit your organization's official position. An administrator verifies it, then publishes it on the supporters page. No committees. No studies about studies.",
    signInTitle: "Sign in to endorse",
    signInDescription:
      "Endorsements are tied to a verified account, because your species requires this before believing anything.",
    signInLabel: "Sign in",
    existingSupportersLabel: "Supporters",
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
    title: "Legal analysis of organizational endorsement",
    sections: [
      {
        heading: "Summary",
        paragraphs: [
          "Endorsement of the 1% Treaty by a 501(c)(3) organization is not lobbying under U.S. tax law, does not involve participation in a political campaign, and does not constitute support for any specific domestic legislation. It is an expression of institutional support for an international policy principle.",
        ],
      },
      {
        heading: "Why this is not lobbying",
        paragraphs: [
          "Under IRC §4911 and Treasury Regulations, lobbying requires a communication that refers to specific legislation and expresses a view on it. The 1% Treaty is not pending legislation in any jurisdiction. It is a proposed international framework principle. Publicly expressing support for a policy idea does not meet the definition of a lobbying communication.",
        ],
      },
      {
        heading: "Why this is not campaign activity",
        paragraphs: [
          "501(c)(3) organizations may not participate in, or intervene in, any political campaign on behalf of or in opposition to any candidate for public office. The 1% Treaty endorsement names no candidate, takes no position for or against any candidate, and does not coordinate with any campaign. It is policy advocacy in the broad sense permitted to charitable organizations.",
        ],
      },
      {
        heading: "Historical precedent",
        paragraphs: [
          "Charitable organizations have long signed onto international policy declarations — from the Universal Declaration of Human Rights to more recent global health frameworks — without implicating their tax-exempt status. The 1% Treaty endorsement follows the same pattern.",
        ],
      },
      {
        heading: "What endorsement commits your organization to",
        paragraphs: [],
        bullets: [
          "Public display of your organization's name and logo on the supporters page.",
          "A single optional public statement (up to a few sentences) that appears beside your logo.",
          "No ongoing obligations. No financial contributions. No signatures on unrelated documents.",
        ],
      },
      {
        heading: "Withdrawal",
        paragraphs: [
          "An organization may withdraw its endorsement at any time by contacting the site administrator. Removal is processed within seven days.",
        ],
      },
      {
        heading: "Full treaty text",
        paragraphs: [
          "The canonical treaty text is available at /treaty. Counsel should review the full text before approving endorsement.",
        ],
      },
    ],
  },
  impactUrl: "https://impact.acceleratedmedicine.org",
  footer: {
    builtByLabel: "Brought to you by Wishonia",
  },
  notFound: {
    title: "This page is not here.",
    description: "Your species has 1.6 billion websites. This particular URL is not on the coalition site. Try one of the others.",
    ctaLabel: "Return home",
  },
};
