import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"
import type { DashboardCampaigns } from "@/types/dashboard"
import { ROUTES } from '@/lib/routes'
import { cn } from "@/lib/utils"

interface CampaignsCardProps {
  campaigns: DashboardCampaigns
  className?: string
}

const formatCurrency = (cents: number, currency: string) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
  })

export function CampaignsCard({ campaigns, className }: CampaignsCardProps) {
  return (
    <Card className={cn("border-2 border-primary mb-6", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
          <Target className="h-6 w-6" />
          YOUR CAMPAIGNS
        </CardTitle>
        <CardDescription className="font-bold">Manage your campaigns and pledges</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {campaigns.created.length > 0 && (
            <div>
              <h3 className="font-black uppercase text-sm mb-3">Campaigns You Created</h3>
              <div className="space-y-3">
                {campaigns.created.map((campaign) => {
                  const progress = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)

                  return (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.slug}/manage`}
                      className="block border-2 border-primary p-4 hover:border-brutal-pink hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-black text-lg">{campaign.title}</h4>
                            <span
                              className={`text-xs font-black px-2 py-1 border-2 border-primary ${
                                campaign.status === "ACTIVE"
                                  ? "bg-brutal-cyan"
                                  : campaign.status === "DRAFT"
                                    ? "bg-brutal-yellow"
                                    : "bg-muted"
                              }`}
                            >
                              {campaign.status}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-bold">
                              <span>{formatCurrency(campaign.currentAmount, campaign.currency)}</span>
                              <span className="text-muted-foreground">
                                of {formatCurrency(campaign.goalAmount, campaign.currency)}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-muted border-2 border-primary overflow-hidden">
                              <div className="h-full bg-brutal-pink" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                              <span>{campaign.backerCount} backers</span>
                              <span>{Math.round(progress)}% funded</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-2 border-primary font-bold">
                          Manage
                        </Button>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <Link href={ROUTES.campaignsCreate} className="block mt-3">
                <Button variant="outline" className="w-full border-2 border-primary font-bold">
                  Create New Campaign
                </Button>
              </Link>
            </div>
          )}

          {campaigns.pledged.length > 0 && (
            <div>
              <h3 className="font-black uppercase text-sm mb-3">Campaigns You Backed</h3>
              <div className="space-y-3">
                {campaigns.pledged.map((pledge) => (
                  <Link
                    key={pledge.id}
                    href={`/campaigns/${pledge.campaign.slug}`}
                    className="block border-2 border-primary p-4 hover:border-brutal-cyan hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-black text-sm mb-1">{pledge.campaign.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium">{pledge.campaign.status}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-brutal-pink">
                          {formatCurrency(pledge.amount, pledge.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {new Date(pledge.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

