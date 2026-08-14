import { requireAdmin } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getSiteConfig } from "@/lib/site-config"
import { VotePosition } from "@optimitron/db"

export const metadata = {
  title: `Admin - Page Scorecard | ${getSiteConfig().title}`,
  description: "Which pages convert — votes, donations, pledges grouped by sourceUrl",
}

// Votes + donations + pledges grouped by sourceUrl. Answers the question:
// "which pages are actually converting?" The key signal for page-level EV measurement.
async function getScorecardData() {
  const [voteBuckets, donationBuckets] = await Promise.all([
    prisma.$queryRaw<Array<{
      source_url: string | null
      total: bigint
      yes_count: bigint
      avg_allocation: number | null
    }>>`
      SELECT
        "originUrl" AS source_url,
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE "answer" = ${VotePosition.YES}::"VotePosition")::bigint AS yes_count,
        NULL::float AS avg_allocation
      FROM "ReferendumVote"
      WHERE "deletedAt" IS NULL
      GROUP BY "originUrl"
      ORDER BY total DESC
    `,
    prisma.$queryRaw<Array<{
      source_url: string | null
      total: bigint
      total_amount_cents: bigint
    }>>`
      SELECT
        NULL::text AS source_url,
        COUNT(*)::bigint AS total,
        COALESCE(SUM("amountCents"), 0)::bigint AS total_amount_cents
      FROM "TaskFundingPayment"
      WHERE "status" = 'PAID'
      GROUP BY 1
    `,
  ])

  const pledgeBuckets: Array<{
    source_url: string | null
    total: bigint
    total_amount_cents: bigint
  }> = []

  // Union by sourceUrl.
  type Row = {
    sourceUrl: string | null
    votes: number
    yesVotes: number
    avgAllocation: number | null
    donations: number
    donationAmountCents: number
    pledges: number
    pledgeAmountCents: number
  }
  const byUrl = new Map<string | null, Row>()
  const get = (url: string | null): Row => {
    if (!byUrl.has(url)) {
      byUrl.set(url, {
        sourceUrl: url,
        votes: 0,
        yesVotes: 0,
        avgAllocation: null,
        donations: 0,
        donationAmountCents: 0,
        pledges: 0,
        pledgeAmountCents: 0,
      })
    }
    return byUrl.get(url)!
  }

  for (const b of voteBuckets) {
    const r = get(b.source_url)
    r.votes = Number(b.total)
    r.yesVotes = Number(b.yes_count)
    r.avgAllocation = b.avg_allocation !== null ? Number(b.avg_allocation) : null
  }
  for (const b of donationBuckets) {
    const r = get(b.source_url)
    r.donations = Number(b.total)
    r.donationAmountCents = Number(b.total_amount_cents)
  }
  for (const b of pledgeBuckets) {
    const r = get(b.source_url)
    r.pledges = Number(b.total)
    r.pledgeAmountCents = Number(b.total_amount_cents)
  }

  return Array.from(byUrl.values()).sort((a, b) => b.votes - a.votes)
}

function formatDollars(cents: number): string {
  if (cents === 0) return "$0"
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export default async function PageScorecardPage() {
  await requireAdmin()
  const rows = await getScorecardData()

  const totalVotes = rows.reduce((sum, r) => sum + r.votes, 0)
  const totalDonations = rows.reduce((sum, r) => sum + r.donations, 0)
  const totalDonationAmount = rows.reduce((sum, r) => sum + r.donationAmountCents, 0)
  const totalPledges = rows.reduce((sum, r) => sum + r.pledges, 0)
  const totalPledgeAmount = rows.reduce((sum, r) => sum + r.pledgeAmountCents, 0)

  return (
    <SectionContainer bgColor="background" borderPosition="none" padding="sm" className="min-h-screen">
      <Container>
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase mb-2">Page Scorecard</h1>
          <p className="text-base font-bold text-muted-foreground">
            Conversions grouped by the page where they happened. Rows with <code>null</code>{" "}
            sourceUrl are historical (pre-attribution) or embed-only pledges.
          </p>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-brutal-cyan border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">{totalVotes.toLocaleString()}</div>
            <div className="text-xs font-black uppercase">Total Votes</div>
          </Card>
          <Card className="bg-brutal-yellow border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">{totalDonations.toLocaleString()}</div>
            <div className="text-xs font-black uppercase">
              Donations ({formatDollars(totalDonationAmount)})
            </div>
          </Card>
          <Card className="bg-brutal-pink border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">{totalPledges.toLocaleString()}</div>
            <div className="text-xs font-black uppercase">
              Pledges ({formatDollars(totalPledgeAmount)})
            </div>
          </Card>
          <Card className="bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-3xl font-black">{rows.length}</div>
            <div className="text-xs font-black uppercase">Distinct Source URLs</div>
          </Card>
        </div>

        {/* Mobile cards + desktop table */}
        <Card className="overflow-hidden border-4 border-primary bg-background p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="divide-y-2 divide-primary lg:hidden">
            {rows.length === 0 && (
              <div className="px-4 py-8 text-center font-bold text-muted-foreground">
                No data yet. Run the migration and wait for conversions.
              </div>
            )}
            {rows.map((row, i) => {
              const yesPct = row.votes > 0 ? (row.yesVotes / row.votes) * 100 : 0
              return (
                <article key={i} className="space-y-4 p-4">
                  <div>
                    <div className="text-[10px] font-black uppercase text-muted-foreground">
                      Source URL
                    </div>
                    <div className="break-all font-mono text-xs">
                      {row.sourceUrl ?? <em className="opacity-60">(null)</em>}
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-[10px] font-black uppercase text-muted-foreground">Votes</dt>
                      <dd className="font-black">{row.votes.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-black uppercase text-muted-foreground">Yes</dt>
                      <dd className="font-bold">{row.votes > 0 ? `${yesPct.toFixed(0)}%` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-black uppercase text-muted-foreground">Average military allocation</dt>
                      <dd className="font-bold">
                        {row.avgAllocation !== null ? `${row.avgAllocation.toFixed(0)}%` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-black uppercase text-muted-foreground">Donations</dt>
                      <dd className="font-bold">
                        {row.donations > 0
                          ? `${row.donations} (${formatDollars(row.donationAmountCents)})`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-black uppercase text-muted-foreground">Pledges</dt>
                      <dd className="font-bold">
                        {row.pledges > 0
                          ? `${row.pledges} (${formatDollars(row.pledgeAmountCents)})`
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                </article>
              )
            })}
          </div>

          <table className="hidden w-full text-sm lg:table">
            <thead className="bg-foreground text-background">
              <tr>
                <th className="text-left px-4 py-3 font-black uppercase">Source URL</th>
                <th className="text-right px-4 py-3 font-black uppercase">Votes</th>
                <th className="text-right px-4 py-3 font-black uppercase">YES %</th>
                <th className="text-right px-4 py-3 font-black uppercase">Avg Mil %</th>
                <th className="text-right px-4 py-3 font-black uppercase">Donations</th>
                <th className="text-right px-4 py-3 font-black uppercase">Pledges</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-bold text-muted-foreground">
                    No data yet. Run the migration and wait for conversions.
                  </td>
                </tr>
              )}
              {rows.map((row, i) => {
                const yesPct = row.votes > 0 ? (row.yesVotes / row.votes) * 100 : 0
                return (
                  <tr key={i} className="border-t-2 border-primary">
                    <td className="px-4 py-2 font-mono text-xs break-all">
                      {row.sourceUrl ?? <em className="opacity-60">(null)</em>}
                    </td>
                    <td className="px-4 py-2 text-right font-black">{row.votes.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-bold">
                      {row.votes > 0 ? `${yesPct.toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      {row.avgAllocation !== null ? `${row.avgAllocation.toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      {row.donations > 0
                        ? `${row.donations} (${formatDollars(row.donationAmountCents)})`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">
                      {row.pledges > 0
                        ? `${row.pledges} (${formatDollars(row.pledgeAmountCents)})`
                        : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </Container>
    </SectionContainer>
  )
}
