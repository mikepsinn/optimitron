import type { ReferendumSiteContent } from "./types";

export const onePercentTreatyContent: ReferendumSiteContent = {
  key: "onePercentTreaty",
  metadata: {
    home: {
      title: "1% Treaty — Redirect 1% of Military Spending to Curing Disease",
      description:
        "Read the treaty, sign it, and endorse it as an organization.",
    },
    treaty: {
      title: "Treaty — 1% Treaty",
      description:
        "Read the full 1% Treaty and record your position on redirecting 1% of military spending to curing disease.",
    },
    tasks: {
      title: "Tasks — 1% Treaty",
      description:
        "See the accountability list behind the 1% Treaty campaign.",
    },
    endorse: {
      title: "Endorse — 1% Treaty",
      description:
        "Submit your organization's official endorsement of the 1% Treaty.",
    },
    supporters: {
      title: "Supporters — 1% Treaty",
      description:
        "Organizations that have officially endorsed the 1% Treaty.",
    },
    why: {
      title: "Why — 1% Treaty",
      description:
        "The numbers behind the 1% Treaty: 604:1, 443 years, 310 million dead.",
    },
    legal: {
      title: "Legal — 1% Treaty",
      description:
        "Legal analysis of nonprofit endorsement of the 1% Treaty: not lobbying, no domestic legislation, no candidates.",
    },
    impact: {
      title: "Impact — 1% Treaty",
      description:
        "Cost-effectiveness and impact analysis for redirecting 1% of military spending to curing disease.",
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
    titleLines: [
      "Redirect 1% of military spending",
      "to curing disease.",
    ],
    intro: "That is the whole treaty. One percent. Not ten. Not fifty. One.",
    individualCountLabel: "Individual signatures",
    organizationCountLabel: "Endorsing organizations",
    primaryCtaLabel: "Read and sign the treaty",
    secondaryCtaLabel: "Endorse as an organization",
    closingLead:
      "On Earth, the ratio of military to medical research spending is six hundred and four to one.",
    closingBody:
      "On my planet, we round that down to zero. It takes about four minutes.",
    closingCtaLabel: "See the full case →",
  },
  supporters: {
    eyebrow: "Official endorsers",
    title: "Supporters of the 1% Treaty",
    description:
      "Organizations that have formally resolved to support redirecting 1% of military spending to curing disease.",
    emptyTitle: "No endorsements published yet.",
    emptyBody:
      "Be the first. If your organization supports the 1% Treaty, submit an official position.",
    ctaLabel: "Add your organization",
  },
  endorse: {
    eyebrow: "Organizational endorsement",
    title: "Endorse the 1% Treaty",
    description:
      "Submit your organization's official position. An administrator will verify and publish it on the supporters page.",
    signInTitle: "Sign in to endorse",
    signInDescription:
      "Official endorsements are tied to a verified account. Sign in to submit your organization's position.",
    signInLabel: "Sign in",
    existingSupportersLabel: "Supporters",
  },
  why: {
    eyebrow: "The case",
    title: "Why the 1% Treaty",
    intro:
      "Redirect one percent of global military spending to curing disease. That is the whole ask. The math below is why.",
    facts: [
      {
        number: "604 : 1",
        label: "Military to medicine",
        body: "Every dollar your species spends to cure disease is matched by six hundred and four dollars spent on the means of killing each other. It's almost a hobby at this point.",
      },
      {
        number: "443 years",
        label: "Waiting list",
        body: "At current medical research funding levels, curing the known diseases will take until roughly the year twenty-four hundred and sixty-nine. The humans who have them now will be long dead. Their children too. Their grandchildren probably also.",
      },
      {
        number: "310,000,000",
        label: "Killed by war in the last century",
        body: "Not a typo. Three hundred and ten million humans. In the same century, your species also claims to value human life. Both things cannot be true.",
      },
      {
        number: "15 / year",
        label: "Diseases we could be curing",
        body: "With a twelve-point-three-times larger medical research budget, the world could complete fifteen full disease cures every year. Instead it completes roughly zero. It is not subtle.",
      },
      {
        number: "850",
        label: "Bullets per capita in the American stockpile",
        body: "For every man, woman, and child in the United States, the military has eight hundred and fifty bullets ready to fire. It keeps ordering more. You can check.",
      },
    ],
    closingLead: "One percent. Not ten. Not fifty. One.",
    closingBody:
      "If that is too much to ask, the species has a branding problem about what it actually values.",
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
    builtByLabel: "Built by Optimitron",
  },
  notFound: {
    title: "Page not found.",
    description: "This page is not part of the 1% Treaty coalition site.",
    ctaLabel: "Return home",
  },
};
