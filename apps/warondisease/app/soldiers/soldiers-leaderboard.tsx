"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Trophy, Target, Users, Calendar } from "lucide-react"
import { VoteOrShareButton } from "@/components/shared/VoteOrShareButton"
import { ImpactExplainer } from "@/components/shared/ImpactExplainer"
import { IMPACT_PER_VOTE } from "@/lib/impact-ledger"
import { ROUTES } from '@/lib/routes'

interface Soldier {
  id: string
  name: string
  username: string | null
  location: string
  story: string
  inverseKills: number
  referrals: number
  joinDate: string
  badges: string[]
  avatar: string
}

interface SoldiersLeaderboardProps {
  soldiers: Soldier[]
  totalSoldiers: number
  totalReferrals: number
  totalInverseKills: number
}

export function SoldiersLeaderboard({
  soldiers,
  totalSoldiers,
  totalReferrals,
  totalInverseKills,
}: SoldiersLeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "top10" | "month">("all")

  const filteredSoldiers = soldiers.filter((soldier) => {
    const matchesSearch =
      soldier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      soldier.location.toLowerCase().includes(searchQuery.toLowerCase())

    if (filter === "top10") {
      const rank = soldiers.indexOf(soldier) + 1
      return matchesSearch && rank <= 10
    }
    if (filter === "month") {
      const joinDate = new Date(soldier.joinDate)
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      return matchesSearch && joinDate >= oneMonthAgo
    }
    return matchesSearch
  })

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-brutal-yellow border-8 border-primary"
    if (rank === 2) return "bg-gray-200 border-6 border-primary"
    if (rank === 3) return "bg-orange-200 border-4 border-primary"
    return "bg-white border-4 border-primary"
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return `#${rank}`
  }

  const isImageUrl = (avatar: string) => {
    return avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')
  }

  return (
    <div className="min-h-screen bg-brutal-beige">
      {/* Hero Section */}
      <section className="bg-brutal-pink border-b-4 border-primary py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-black text-5xl md:text-7xl mb-6 text-white uppercase tracking-tight">
              Soldiers in the War on Disease
            </h1>
            <p className="text-xl md:text-2xl font-bold mb-8 text-white">
              Meet the warriors fighting to eradicate preventable disease. Ranked by lives saved through their
              referrals.
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-primary">
              <div className="bg-white border-4 border-primary p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-3xl font-black">{totalSoldiers}</div>
                <div className="text-sm font-bold uppercase">Active Soldiers</div>
              </div>
              <div className="bg-white border-4 border-primary p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-3xl font-black">{totalReferrals}</div>
                <div className="text-sm font-bold uppercase">Total Recruits</div>
              </div>
              <div className="bg-white border-4 border-primary p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-3xl font-black">
                  {totalInverseKills.toLocaleString()}
                </div>
                <div className="text-sm font-bold uppercase flex items-center gap-2 justify-center">
                  Lives Saved
                  <ImpactExplainer className="h-6 w-6 border-primary text-primary" size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What are Inverse Kills */}
      <section className="py-12 bg-brutal-yellow border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-black text-3xl text-primary uppercase">What are Inverse Kills?</h2>
              <ImpactExplainer className="h-8 w-8 border-primary text-primary" size={16} />
            </div>
            <p className="text-lg font-bold mb-4 text-primary">
              Every voter you recruit to the 1% Treaty movement brings us closer to a majority of humans on Earth.
            </p>
            <p className="text-lg font-bold text-primary">
              Each referral you make is projected to save ~{IMPACT_PER_VOTE.lives.toFixed(1)} lives by speeding up medical
              research. We call these &apos;inverse kills&apos;—lives saved instead of lost.
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-white border-b-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setFilter("all")}
                  variant={filter === "all" ? "default" : "outline"}
                  className="font-black uppercase"
                >
                  All Soldiers
                </Button>
                <Button
                  onClick={() => setFilter("top10")}
                  variant={filter === "top10" ? "default" : "outline"}
                  className="font-black uppercase"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Top 10
                </Button>
                <Button
                  onClick={() => setFilter("month")}
                  variant={filter === "month" ? "default" : "outline"}
                  className="font-black uppercase"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  This Month
                </Button>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search soldiers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-4 border-primary font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {filteredSoldiers.length === 0 ? (
              <div className="bg-white border-4 border-primary p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-lg font-bold text-primary">
                  No soldiers found. {searchQuery && "Try a different search term."}
                </p>
              </div>
            ) : (
              filteredSoldiers.map((soldier) => {
                const rank = soldiers.indexOf(soldier) + 1
                return (
                  <div
                    key={soldier.id}
                    className={`${getRankStyle(rank)} p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Rank and Avatar */}
                      <div className="flex md:flex-col items-center gap-4 md:gap-2">
                        <div className="text-4xl md:text-5xl font-black text-primary">{getRankBadge(rank)}</div>
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-primary border-4 border-primary flex items-center justify-center overflow-hidden">
                          {isImageUrl(soldier.avatar) ? (
                            <Image
                              src={soldier.avatar}
                              alt={soldier.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl md:text-3xl font-black text-white">{soldier.avatar}</span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                          <div>
                            {soldier.username ? (
                              <Link href={`/u/${soldier.username}`}>
                                <h3 className="font-black text-2xl text-primary mb-1 hover:underline">
                                  {soldier.name}
                                </h3>
                              </Link>
                            ) : (
                              <h3 className="font-black text-2xl text-primary mb-1">{soldier.name}</h3>
                            )}
                            <p className="font-bold text-primary opacity-75">📍 {soldier.location}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-primary">
                              {soldier.inverseKills.toLocaleString()}
                            </div>
                            <div className="text-sm font-bold text-primary uppercase">Inverse Kills</div>
                          </div>
                        </div>

                        <p className="text-lg font-bold text-primary mb-4 italic">&quot;{soldier.story}&quot;</p>

                        {soldier.badges.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {soldier.badges.map((badge) => (
                              <Badge
                                key={badge}
                                className="bg-white border-2 border-primary text-primary font-black uppercase text-xs"
                              >
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm font-bold text-primary">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {soldier.referrals} Referrals
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Joined {new Date(soldier.joinDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brutal-pink border-t-4 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Target className="w-16 h-16 mx-auto mb-6 text-white" />
            <h2 className="font-black text-4xl md:text-5xl mb-6 text-white uppercase">Become a Warrior</h2>
            <p className="text-xl font-bold mb-8 text-white">
              Your turn. Answer the question, share your link, and start saving lives. Every referral is a victory.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <VoteOrShareButton
                variant="default"
                size="lg"
                className="text-xl"
              />
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-4 border-primary font-black text-xl uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-primary hover:bg-white"
              >
                <Link href={ROUTES.dashboard}>View Your Stats</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
