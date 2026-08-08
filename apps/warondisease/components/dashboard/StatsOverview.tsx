import { Card, CardContent } from "@/components/ui/card"
import { Users, Share2, Globe, TrendingUp } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DashboardStats } from "@/types/dashboard"
import { ImpactExplainer } from "@/components/shared/ImpactExplainer"
import { cn } from "@/lib/utils"

type MetricType = "referrals" | "shares" | "reach" | "rank"

interface StatsOverviewProps {
  stats: DashboardStats
  onMetricClick: (type: MetricType) => void
  className?: string
}

export function StatsOverview({ stats, onMetricClick, className }: StatsOverviewProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <p className="text-xl font-black uppercase text-primary">
          Battlefield Stats
          </p>
        <ImpactExplainer className="h-8 w-8" label="Show impact math" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        className="border-2 border-primary cursor-pointer hover:border-brutal-pink hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        onClick={() => onMetricClick("referrals")}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-muted-foreground">Referrals</p>
              <p data-testid="referral-count" className="text-4xl font-black text-brutal-pink">{stats.referrals}</p>
            </div>
            <Users className="h-12 w-12 text-brutal-pink" />
          </div>
        </CardContent>
      </Card>

      <Card
        className="border-2 border-primary cursor-pointer hover:border-brutal-cyan hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        onClick={() => onMetricClick("shares")}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-muted-foreground">Total Shares</p>
              <p className="text-4xl font-black text-brutal-cyan">{stats.shares}</p>
            </div>
            <Share2 className="h-12 w-12 text-brutal-cyan" />
          </div>
        </CardContent>
      </Card>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="border-2 border-primary cursor-pointer hover:border-brutal-yellow hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase text-muted-foreground">Hearts & Minds Reached</p>
                    <p className="text-4xl font-black text-brutal-yellow">{stats.reach.toLocaleString()}</p>
                  </div>
                  <Globe className="h-12 w-12 text-brutal-yellow" />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm">
            <p className="font-bold text-sm">
              Estimated reach based on your referrals and shares. Each referral generates an average of 265 social media
              impressions.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Card
        className="border-2 border-primary cursor-pointer hover:border-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        onClick={() => onMetricClick("rank")}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-muted-foreground">Global Ranking</p>
              <p className="text-4xl font-black text-primary">#{stats.rank}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  )
}
