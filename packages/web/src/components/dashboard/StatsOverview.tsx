import { Card, CardContent } from "@/components/ui/card"
import { Users, BarChart3, Award, TrendingUp } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DashboardStats } from "@/types/dashboard"

interface StatsOverviewProps {
  stats: DashboardStats
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="mb-8">
      <p className="text-xl font-black uppercase text-primary mb-4">
        Impact Stats
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-4 border-primary hover:border-brutal-pink hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-muted-foreground">Referrals</p>
                <p className="text-4xl font-black text-brutal-pink">{stats.referrals}</p>
              </div>
              <Users className="h-12 w-12 text-brutal-pink" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-primary hover:border-brutal-cyan hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-muted-foreground">Comparisons</p>
                <p className="text-4xl font-black text-brutal-cyan">{stats.comparisons}</p>
              </div>
              <BarChart3 className="h-12 w-12 text-brutal-cyan" />
            </div>
          </CardContent>
        </Card>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="border-4 border-primary hover:border-brutal-yellow hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase text-muted-foreground">Badges</p>
                      <p className="text-4xl font-black text-brutal-yellow">{stats.badges}</p>
                    </div>
                    <Award className="h-12 w-12 text-brutal-yellow" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="bg-background border-4 border-primary p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm">
              <p className="font-bold text-sm">
                Proof you did something. Comparisons, referrals, deposits, and not being a bot.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Card className="border-4 border-primary hover:border-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
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
