import { requireOrganizationAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { ReferralLinkCard } from "@/components/shared/ReferralLinkCard"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, XCircle, Clock, ExternalLink, Users, TrendingUp, TrendingDown, Trophy, Minus, Code, Link as LinkIcon, Globe, Wrench } from "lucide-react"
import { OrganizationEmailSignatureCard } from "@/components/dashboard/OrganizationEmailSignatureCard"
import { getSiteConfig, getBaseUrl } from "@/lib/site-config"
import { getOrganizationShareTemplates } from "@/lib/share-copy"
import { ROUTES } from '@/lib/routes'

interface OrganizationPageProps {
  params: {
    slug: string
  }
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  try {
    // URL uses slug; auth check keys on id (immutable DB key) — look up slug first, then gate.
    const org = await prisma.organization.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    })
    if (!org) {
      redirect("/dashboard")
    }
    const { organization, user } = await requireOrganizationAccess(org.id)
    const config = getSiteConfig()
    const baseUrl = getBaseUrl()
    const surveyLink = `${baseUrl}/survey/${organization.slug}`
    const embedCode = organization.slug
      ? `<iframe src="${surveyLink}" width="100%" height="800" frameborder="0" title="${organization.name} Clinical Trial Abundance Survey"></iframe>`
      : null

    // Calculate stats (ReferendumVote, not DIH Vote)
    const votes = organization.referendumVotes
    const totalVotes = votes.length
    const yesVotes = votes.filter((v) => v.answer === "YES").length
    const noVotes = votes.filter((v) => v.answer === "NO").length
    const averageAllocation = 0

    // Time-bucketed counts + week-over-week trend
    const now = Date.now()
    const DAY_MS = 24 * 60 * 60 * 1000
    const sinceToday = now - DAY_MS
    const sinceWeek = now - 7 * DAY_MS
    const sinceMonth = now - 30 * DAY_MS
    const sincePrevWeek = now - 14 * DAY_MS

    const todayVotes = votes.filter((v) => v.createdAt.getTime() >= sinceToday).length
    const weekVotes = votes.filter((v) => v.createdAt.getTime() >= sinceWeek).length
    const monthVotes = votes.filter((v) => v.createdAt.getTime() >= sinceMonth).length
    const prevWeekVotes = votes.filter(
      (v) => v.createdAt.getTime() >= sincePrevWeek && v.createdAt.getTime() < sinceWeek,
    ).length

    // Week-over-week % change. Undefined when no baseline — avoids /0 and misleading "∞%" displays.
    const weekTrendPct =
      prevWeekVotes > 0 ? Math.round(((weekVotes - prevWeekVotes) / prevWeekVotes) * 100) : null

    // Rank among orgs by treaty vote count
    const orgVoteCounts = await prisma.referendumVote.groupBy({
      by: ["organizationId"],
      where: { organizationId: { not: null }, deletedAt: null },
      _count: { _all: true },
    })
    const sortedOrgs = orgVoteCounts
      .map((g) => ({ organizationId: g.organizationId as string, count: g._count._all }))
      .sort((a, b) => b.count - a.count)
    const rankIndex = sortedOrgs.findIndex((g) => g.organizationId === organization.id)
    const rank = rankIndex >= 0 ? rankIndex + 1 : null
    const totalRankedOrgs = sortedOrgs.length

    const statusColors = {
      PENDING: "bg-brutal-yellow",
      APPROVED: "bg-brutal-cyan",
      REJECTED: "bg-brutal-pink",
    }

    const statusIcons = {
      PENDING: <Clock className="w-6 h-6" />,
      APPROVED: <CheckCircle2 className="w-6 h-6" />,
      REJECTED: <XCircle className="w-6 h-6" />,
    }

    return (
      <SectionContainer bgColor="background" borderPosition="none" padding="sm" className="min-h-screen">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <Link href={ROUTES.dashboard}>
              <Button
                variant="outline"
                className="mb-4 border-4 border-primary font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
              >
                ← BACK TO DASHBOARD
              </Button>
            </Link>
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-4">
              {organization.name}
            </h1>
            <div className="flex items-center gap-4">
              <div
                className={`${statusColors[organization.status]} border-4 border-primary px-4 py-2 font-black uppercase flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
              >
                {statusIcons[organization.status]}
                {organization.status}
              </div>
              {organization.status === "APPROVED" && organization.slug && (
                <Link href={`/survey/${organization.slug}`} target="_blank">
                  <Button
                    variant="outline"
                    className="border-4 border-primary font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all flex items-center gap-2"
                  >
                    VIEW SURVEY PAGE
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Primary stats: time buckets + rank */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="bg-brutal-cyan border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black mb-2">{todayVotes}</div>
              <div className="text-sm font-bold uppercase">Votes Today</div>
            </Card>

            <Card className="bg-brutal-yellow border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-4xl font-black">{weekVotes}</div>
                {weekTrendPct !== null && (
                  <div
                    className={`flex items-center gap-1 text-sm font-black ${
                      weekTrendPct > 0
                        ? "text-foreground"
                        : weekTrendPct < 0
                        ? "text-brutal-pink"
                        : "text-foreground/60"
                    }`}
                  >
                    {weekTrendPct > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : weekTrendPct < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    {weekTrendPct > 0 ? "+" : ""}
                    {weekTrendPct}%
                  </div>
                )}
              </div>
              <div className="text-sm font-bold uppercase">Votes This Week</div>
              {weekTrendPct === null && prevWeekVotes === 0 && weekVotes > 0 && (
                <div className="text-[10px] font-bold uppercase text-foreground/60 mt-1">
                  First week with activity
                </div>
              )}
            </Card>

            <Card className="bg-brutal-pink border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black mb-2">{monthVotes}</div>
              <div className="text-sm font-bold uppercase">Votes This Month</div>
            </Card>

            <Card className="bg-foreground text-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-brutal-yellow" />
                <div className="text-4xl font-black">
                  {rank !== null ? `#${rank}` : "—"}
                </div>
              </div>
              <div className="text-sm font-bold uppercase">
                {rank !== null ? `of ${totalRankedOrgs} orgs` : "Unranked (no votes yet)"}
              </div>
            </Card>
          </div>

          {/* Secondary stats: cumulative vote breakdown */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black mb-2">{totalVotes}</div>
              <div className="text-sm font-bold uppercase">Total (All Time)</div>
            </Card>

            <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black mb-2">{yesVotes}</div>
              <div className="text-sm font-bold uppercase">Yes Votes</div>
            </Card>

            <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black mb-2">{noVotes}</div>
              <div className="text-sm font-bold uppercase">No Votes</div>
            </Card>

            <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl font-black mb-2">{averageAllocation}%</div>
              <div className="text-sm font-bold uppercase">Avg Military %</div>
            </Card>
          </div>

          {/* Organization Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-black uppercase mb-4">Organization Details</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase">Type</div>
                  <div className="font-bold">{organization.type}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase">Category</div>
                  <div className="font-bold">{organization.type}</div>
                </div>
                {organization.website && (
                  <div>
                    <div className="text-sm font-bold text-muted-foreground uppercase">Website</div>
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-brutal-cyan hover:underline flex items-center gap-1"
                    >
                      {organization.website}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase">Contact Email</div>
                  <div className="font-bold">{organization.contactEmail}</div>
                </div>
                {organization.slug && (
                  <div>
                    <div className="text-sm font-bold text-muted-foreground uppercase">Survey URL</div>
                    <div className="font-bold font-mono text-sm break-all">
                      {config.domain}/survey/{organization.slug}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-black uppercase mb-4">Description</h2>
              <p className="font-bold whitespace-pre-wrap">{organization.description}</p>
            </Card>
          </div>

          {/* Share Resources - Only show for approved organizations with slug */}
          {organization.status === "APPROVED" && organization.slug && (
            <>
              <Card id="setup" className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <Wrench className="w-8 h-8" />
                  <h2 className="text-3xl font-black uppercase">Embed or Share Your Survey</h2>
                </div>
                <p className="text-lg font-bold text-muted-foreground mb-6 max-w-3xl">
                  Best default: use the direct link in email and social, and use the iframe on a homepage,
                  get-involved page, or campaign landing page where supporters already expect to take action.
                </p>

                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  <Card className="bg-brutal-yellow border-4 border-primary p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="w-5 h-5" />
                      <h3 className="text-xl font-black uppercase">Embed Code</h3>
                    </div>
                    <div className="bg-background border-2 border-primary p-3 mb-4 overflow-x-auto">
                      <code className="text-xs font-bold break-all">{embedCode}</code>
                    </div>
                    <p className="font-bold text-sm">
                      Use this when you want supporters to answer without leaving your site.
                    </p>
                  </Card>

                  <Card className="bg-brutal-cyan border-4 border-primary p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <LinkIcon className="w-5 h-5" />
                      <h3 className="text-xl font-black uppercase">Direct Link</h3>
                    </div>
                    <div className="bg-background border-2 border-primary p-3 mb-4 overflow-x-auto">
                      <code className="text-xs font-bold break-all">{surveyLink}</code>
                    </div>
                    <p className="font-bold text-sm">
                      Use this in newsletters, social posts, supporter emails, and any CMS flow where iframe code is a pain.
                    </p>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <Card className="bg-background border-4 border-primary p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5" />
                      <h3 className="text-xl font-black uppercase">WordPress</h3>
                    </div>
                    <p className="font-bold text-sm">
                      Use a Custom HTML block for the iframe. If WordPress strips iframe code or your web team prefers
                      a safer path, use the direct link or a normal button block instead.
                    </p>
                  </Card>

                  <Card className="bg-background border-4 border-primary p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ExternalLink className="w-5 h-5" />
                      <h3 className="text-xl font-black uppercase">Live Demo</h3>
                    </div>
                    <p className="font-bold text-sm mb-4">
                      Preview what the embedded survey looks like before adding it to your site.
                    </p>
                    <a
                      href={`${baseUrl}/survey/demo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black uppercase underline decoration-4 underline-offset-4 decoration-brutal-pink hover:text-brutal-pink transition-colors"
                    >
                      Open Demo
                    </a>
                  </Card>

                  <Card className="bg-background border-4 border-primary p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5" />
                      <h3 className="text-xl font-black uppercase">More Instructions</h3>
                    </div>
                    <p className="font-bold text-sm mb-4">
                      Need the full public explainer for your team or partners? The institutes page has the why, how,
                      demo preview, and platform notes.
                    </p>
                    <Link
                      href={ROUTES.institutes}
                      className="font-black uppercase underline decoration-4 underline-offset-4 decoration-brutal-cyan hover:text-brutal-cyan transition-colors"
                    >
                      View Institutes Guide
                    </Link>
                  </Card>
                </div>
              </Card>

              <div className="mb-6">
                <h2 className="text-3xl font-black uppercase mb-4">Share Your Survey</h2>
                <p className="text-lg font-bold text-muted-foreground mb-6">
                  Use these tools to spread your survey and grow your impact
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <ReferralLinkCard
                  referralLink={surveyLink}
                  shareTemplates={getOrganizationShareTemplates(organization.name, surveyLink)}
                  introText={`Choose a message, copy it, and share ${organization.name}'s survey with supporters.`}
                  copyLinkLabel="COPY SURVEY LINK"
                  linkContentType="survey_link"
                />

                <OrganizationEmailSignatureCard
                  surveyLink={surveyLink}
                  organizationName={organization.name}
                  userName={user.person?.displayName || user.email || "Team Member"}
                />
              </div>
            </>
          )}

          {/* Impact Message */}
          {organization.status === "APPROVED" && totalVotes > 0 && (
            <Card className="bg-brutal-yellow border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
              <div className="flex items-center gap-4 mb-4">
                <TrendingUp className="w-8 h-8" />
                <h2 className="text-3xl font-black uppercase">Your Impact</h2>
              </div>
              <p className="text-xl font-bold leading-relaxed">
                Through your organization's survey page, you've helped{" "}
                <span className="text-brutal-pink">{totalVotes} people</span> join the movement to
                make suffering optional and accelerate cures by 8 years. Keep sharing your survey link to
                grow the movement!
              </p>
            </Card>
          )}

          {/* Pending Status Message */}
          {organization.status === "PENDING" && (
            <Card className="bg-brutal-cyan border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4 mb-4">
                <Clock className="w-8 h-8" />
                <h2 className="text-3xl font-black uppercase">Pending Approval</h2>
              </div>
              <p className="text-xl font-bold leading-relaxed">
                Your organization application is currently under review. You'll receive an email at{" "}
                <span className="text-brutal-pink">{organization.contactEmail}</span> once it's been
                reviewed. This usually takes 1-2 business days.
              </p>
            </Card>
          )}

          {/* Rejected Status Message */}
          {organization.status === "REJECTED" && (
            <Card className="bg-brutal-pink border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4 mb-4">
                <XCircle className="w-8 h-8" />
                <h2 className="text-3xl font-black uppercase">Application Not Approved</h2>
              </div>
              <p className="text-xl font-bold leading-relaxed mb-4">
                Unfortunately, your organization application was not approved. If you have questions
                or would like to submit a revised application, please contact us.
              </p>
              <Link href={ROUTES.institutes}>
                <Button className="bg-background text-foreground border-4 border-primary font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all uppercase">
                  SUBMIT NEW APPLICATION
                </Button>
              </Link>
            </Card>
          )}
        </Container>
      </SectionContainer>
    )
  } catch (error: any) {
    // Handle unauthorized access
    if (error.message?.includes("Unauthorized") || error.message?.includes("not found")) {
      redirect("/dashboard")
    }
    throw error
  }
}
