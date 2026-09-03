import { ContentVisibility, OrgStatus } from "@optimitron/db"
import { prisma } from "@/lib/prisma"
import { ROUTES } from "@/lib/routes"
import {
  getSearchTerms,
  scoreSearchRecord,
  type SearchTerms,
} from "@/lib/site-search-ranking"

/**
 * Campaign-scoped search for warondisease.org.
 *
 * Optimitron's /search covers the whole governance platform: tasks, encyclopedia
 * content, and the manual, resolved through a 2,031-line route registry and the
 * task subsystem. None of that is reachable from this domain, so this is a
 * scoped reimplementation over the three things a campaign visitor is actually
 * looking for — a campaign page, a person who signed, or an organization that
 * endorsed. The relevance scoring is the shared one in site-kit; only the
 * corpora differ.
 */

export type CampaignSearchScope = "pages" | "people" | "organizations"

export interface CampaignSearchResult {
  description: string
  emoji: string
  href: string
  meta: string | null
  scope: CampaignSearchScope
  score: number
  title: string
}

export interface CampaignSearchResults {
  organizations: CampaignSearchResult[]
  pages: CampaignSearchResult[]
  people: CampaignSearchResult[]
  query: string
  totalResults: number
}

interface CampaignPageDocument {
  description: string
  emoji: string
  href: string
  keywords: string[]
  section: string
  title: string
}

/**
 * The campaign's own public pages.
 *
 * Deliberately a hand-written list rather than a read of each page's exported
 * `metadata`: several of those descriptions are template literals built from
 * live parameters, and importing every page module here would pull their server
 * dependencies into the search route. `campaign-search.test.ts` walks
 * `app/*\/page.tsx` and fails when a new public page is added without an entry,
 * so the list cannot silently fall behind.
 */
const CAMPAIGN_PAGES: CampaignPageDocument[] = [
  {
    description:
      "The one-question referendum: trade one apocalypse for disease eradication.",
    emoji: "🗳️",
    href: ROUTES.home,
    keywords: ["home", "campaign", "1% treaty", "war on disease"],
    section: "Start here",
    title: "War on Disease",
  },
  {
    description:
      "Cast your vote on the 1% Treaty. Thirty seconds, one question.",
    emoji: "✅",
    href: ROUTES.vote,
    keywords: ["vote", "referendum", "ballot", "yes", "sign"],
    section: "Start here",
    title: "Vote",
  },
  {
    description:
      "Read the treaty text and add your signature at the bottom.",
    emoji: "📜",
    href: ROUTES.treaty,
    keywords: ["treaty", "sign", "text", "agreement", "1 percent"],
    section: "Start here",
    title: "Sign the Treaty",
  },
  {
    description:
      "The ranked list of humans and organizations who have signed.",
    emoji: "🏆",
    href: ROUTES.signatories,
    keywords: ["signatories", "signers", "leaderboard", "who signed"],
    section: "The campaign",
    title: "People Who Ended War and Disease",
  },
  {
    description:
      "The referral leaderboard: who recruited the most voters.",
    emoji: "🎖️",
    href: ROUTES.soldiers,
    keywords: ["soldiers", "leaderboard", "referrals", "ranking", "recruiters"],
    section: "The campaign",
    title: "Soldiers",
  },
  {
    description:
      "Bring your organization in and run the Global Survey with your members.",
    emoji: "🤝",
    href: ROUTES.join,
    keywords: ["join", "organization", "endorse", "partner", "coalition"],
    section: "The campaign",
    title: "Join as an Organization",
  },
  {
    description:
      "How the 1% Treaty gets from a referendum to redirected budgets.",
    emoji: "🗺️",
    href: ROUTES.thePlan,
    keywords: ["plan", "strategy", "roadmap", "how"],
    section: "The campaign",
    title: "The Plan",
  },
  {
    description:
      "Print flyers with your referral code and hang them where people walk.",
    emoji: "📄",
    href: ROUTES.poster,
    keywords: ["poster", "flyer", "print", "hang", "qr code"],
    section: "Recruit",
    title: "Hang Up Flyers",
  },
  {
    description:
      "Print the YES sheet and register the neighbours the internet missed.",
    emoji: "🚪",
    href: ROUTES.doorToDoor,
    keywords: ["door to door", "canvass", "canvassing", "neighbors", "print"],
    section: "Recruit",
    title: "Go Door to Door",
  },
  {
    description:
      "Write the math on a shirt. The joke that recruits the closet's owner.",
    emoji: "👕",
    href: ROUTES.joke,
    keywords: ["joke", "shirt", "prank", "closet", "funny"],
    section: "Recruit",
    title: "The Joke",
  },
  {
    description:
      "Spend an hour a day with one person ending war and disease.",
    emoji: "💘",
    href: ROUTES.love,
    keywords: ["love", "date", "dating", "partner", "hour"],
    section: "Recruit",
    title: "Earth Optimization Date",
  },
  {
    description:
      "Find someone you would not mind ending war and disease with, and spend one useful hour on it together.",
    emoji: "❤️",
    href: ROUTES.missions,
    keywords: ["missions", "date", "dating", "match", "hour", "together"],
    section: "Recruit",
    title: "Earth Optimization Missions",
  },
  {
    description:
      "Send one more 1% Treaty invitation to someone who has not voted.",
    emoji: "📨",
    href: ROUTES.send,
    keywords: ["send", "invite", "invitation", "share", "referral"],
    section: "Recruit",
    title: "Send One More",
  },
  {
    description:
      "Ask the major AI models how to end war and disease, then correct them.",
    emoji: "🤖",
    href: ROUTES.fixAi,
    keywords: ["ai", "chatgpt", "claude", "model", "prompt", "train"],
    section: "Recruit",
    title: "Train the AIs",
  },
  {
    description:
      "Every head of government who has not signed the 1% Treaty, and the message to send them.",
    emoji: "🏛️",
    href: ROUTES.employees,
    keywords: [
      "employees",
      "presidents",
      "leaders",
      "remind",
      "overdue",
      "accountability",
    ],
    section: "Fund and pressure",
    title: "Remind Presidents",
  },
  {
    description:
      "Shareholder letters, board pressure, and the expected lives saved.",
    emoji: "🏛️",
    href: ROUTES.foundations,
    keywords: ["foundations", "shares", "board", "contractors", "grants"],
    section: "Fund and pressure",
    title: "Foundations",
  },
  {
    description: "Fund the campaign.",
    emoji: "💵",
    href: ROUTES.donate,
    keywords: ["donate", "donation", "give", "fund", "money"],
    section: "Fund and pressure",
    title: "Donate",
  },
  {
    description:
      "Institutes for Accelerated Medicine and the Global Survey behind them.",
    emoji: "🔬",
    href: ROUTES.institutes,
    keywords: ["institutes", "survey", "research", "accelerated medicine"],
    section: "Fund and pressure",
    title: "Institutes",
  },
  {
    description:
      "The evidence and calculations behind the 1% Treaty's projected clinical-trial capacity.",
    emoji: "📊",
    href: ROUTES.research,
    keywords: ["research", "evidence", "math", "calculations", "clinical trials"],
    section: "About",
    title: "Research",
  },
  {
    description: "Who runs this campaign and why.",
    emoji: "ℹ️",
    href: ROUTES.about,
    keywords: ["about", "who", "team", "nonprofit", "mission"],
    section: "About",
    title: "About",
  },
  {
    description: "Answers to the questions people ask before they sign.",
    emoji: "❓",
    href: ROUTES.faq,
    keywords: ["faq", "questions", "answers", "help"],
    section: "About",
    title: "FAQ",
  },
  {
    description: "Reach a human on the campaign.",
    emoji: "✉️",
    href: ROUTES.contact,
    keywords: ["contact", "email", "reach", "support"],
    section: "About",
    title: "Contact",
  },
  {
    description:
      "Tell us what is confusing, irritating, broken, or missing on this site.",
    emoji: "❗",
    href: ROUTES.feedback,
    keywords: ["feedback", "complaint", "bug", "broken", "confusing", "suggest"],
    section: "About",
    title: "Feedback",
  },
  {
    description: "What we collect and what we do not.",
    emoji: "🔒",
    href: ROUTES.privacy,
    keywords: ["privacy", "data", "policy", "gdpr"],
    section: "Legal",
    title: "Privacy Policy",
  },
  {
    description: "The terms you agree to by using this site.",
    emoji: "📋",
    href: ROUTES.terms,
    keywords: ["terms", "conditions", "legal", "service"],
    section: "Legal",
    title: "Terms of Service",
  },
]

/** Exported for the coverage test; not part of the search API. */
export const CAMPAIGN_PAGE_HREFS = CAMPAIGN_PAGES.map((page) => page.href)

const PAGE_LIMIT = 8
const PERSON_LIMIT = 8
const ORGANIZATION_LIMIT = 8

function searchPages(searchTerms: SearchTerms): CampaignSearchResult[] {
  return CAMPAIGN_PAGES.map((page) => ({
    description: page.description,
    emoji: page.emoji,
    href: page.href,
    meta: page.section,
    scope: "pages" as const,
    score: scoreSearchRecord(searchTerms, page),
    title: page.title,
  }))
    .filter((result) => result.score > 0)
    .sort((left, right) =>
      right.score === left.score
        ? left.title.localeCompare(right.title)
        : right.score - left.score,
    )
    .slice(0, PAGE_LIMIT)
}

async function searchPeople(
  searchTerms: SearchTerms,
): Promise<CampaignSearchResult[]> {
  const query = searchTerms.normalizedQuery

  // Same visibility gate the /soldiers leaderboard uses. A person who has not
  // made their profile public must not become findable by typing their name.
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      person: {
        // /soldiers gates on `person.isPublic` alone. Search adds
        // `deletedAt: null` on top: the leaderboard renders a fixed roster,
        // while search answers "does this person exist here?" for an arbitrary
        // typed name, and a soft-deleted person should answer no.
        deletedAt: null,
        isPublic: true,
        OR: [
          { displayName: { contains: query, mode: "insensitive" } },
          { handle: { contains: query, mode: "insensitive" } },
        ],
      },
    },
    select: {
      city: true,
      countryCode: true,
      person: {
        select: {
          bio: true,
          countryCode: true,
          displayName: true,
          handle: true,
        },
      },
    },
    // `take` without `orderBy` lets the database return any matching rows it
    // likes, so which candidates reach the scorer would vary between identical
    // requests. Ordering by name keeps the truncation deterministic; `id` is
    // the tiebreak because displayName is not unique.
    orderBy: [{ person: { displayName: "asc" } }, { id: "asc" }],
    take: PERSON_LIMIT * 3,
  })

  return users
    .flatMap((user) => {
      const person = user.person
      // The `where` clause cannot match a user whose person is null, but the
      // generated type still allows it, and a handle is what builds the href.
      if (!person?.handle) return []

      const title = person.displayName || person.handle
      const location =
        [user.city, user.countryCode ?? person.countryCode]
          .filter(Boolean)
          .join(", ") || null

      return [
        {
          description: person.bio?.trim() || "Signed the 1% Treaty.",
          emoji: "🧑",
          href: `/u/${person.handle}`,
          meta: location,
          scope: "people" as const,
          score: scoreSearchRecord(searchTerms, {
            description: person.bio,
            href: `/u/${person.handle}`,
            keywords: [person.handle],
            title,
          }),
          title,
        },
      ]
    })
    .filter((result) => result.score > 0)
    .sort((left, right) =>
      right.score === left.score
        ? left.title.localeCompare(right.title)
        : right.score - left.score,
    )
    .slice(0, PERSON_LIMIT)
}

async function searchOrganizationRecords(
  searchTerms: SearchTerms,
): Promise<CampaignSearchResult[]> {
  const organizations = await prisma.organization.findMany({
    // site-kit's `searchOrganizations` filters on status alone because it
    // backs the typeahead inside the org-claim flow. A public discovery
    // surface needs the full predicate the schema indexes together
    // (`@@index([visibility, status, deletedAt])`), or a private or
    // soft-deleted organization becomes findable by name.
    where: {
      deletedAt: null,
      name: { contains: searchTerms.normalizedQuery, mode: "insensitive" },
      status: OrgStatus.APPROVED,
      visibility: ContentVisibility.PUBLIC,
    },
    select: {
      description: true,
      name: true,
      slug: true,
      type: true,
    },
    // Same reason as the person query above: deterministic truncation.
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: ORGANIZATION_LIMIT * 3,
  })

  return organizations
    .map((organization) => ({
      description:
        organization.description?.trim() || "Endorsed the 1% Treaty.",
      emoji: "🏢",
      href: `/organizations/${organization.slug}`,
      meta: organization.type ? String(organization.type) : null,
      scope: "organizations" as const,
      score: scoreSearchRecord(searchTerms, {
        description: organization.description,
        href: `/organizations/${organization.slug}`,
        title: organization.name,
      }),
      title: organization.name,
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) =>
      right.score === left.score
        ? left.title.localeCompare(right.title)
        : right.score - left.score,
    )
    .slice(0, ORGANIZATION_LIMIT)
}

export async function searchCampaign(
  rawQuery: string,
): Promise<CampaignSearchResults> {
  const searchTerms = getSearchTerms(rawQuery)
  const empty: CampaignSearchResults = {
    organizations: [],
    pages: [],
    people: [],
    query: searchTerms.normalizedQuery,
    totalResults: 0,
  }

  // Two characters is the shortest query the organization lookup has ever
  // accepted, and a one-character `contains` scans the whole table for nothing.
  if (searchTerms.normalizedQuery.length < 2) return empty

  const pages = searchPages(searchTerms)
  const [people, organizations] = await Promise.all([
    searchPeople(searchTerms),
    searchOrganizationRecords(searchTerms),
  ])

  return {
    organizations,
    pages,
    people,
    query: searchTerms.normalizedQuery,
    totalResults: pages.length + people.length + organizations.length,
  }
}
