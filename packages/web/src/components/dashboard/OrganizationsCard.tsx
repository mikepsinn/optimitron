"use client"

import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import Link from "next/link"
import { Building2, CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react"
import type { DashboardOrganization } from "@/types/dashboard"

interface OrganizationsCardProps {
  organizations: {
    created: DashboardOrganization[]
  }
}

export function OrganizationsCard({ organizations }: OrganizationsCardProps) {
  const { created } = organizations

  if (created.length === 0) {
    return null
  }

  const statusColors = {
    PENDING: "bg-brutal-yellow text-brutal-yellow-foreground",
    APPROVED: "bg-brutal-cyan text-brutal-cyan-foreground",
    REJECTED: "bg-brutal-pink text-brutal-pink-foreground",
  }

  const statusIcons = {
    PENDING: <Clock className="w-5 h-5" />,
    APPROVED: <CheckCircle2 className="w-5 h-5" />,
    REJECTED: <XCircle className="w-5 h-5" />,
  }

  const totalMembers = created.reduce((sum, org) => sum + org.memberCount, 0)

  return (
    <Card className="bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 stroke-[3px]" />
          <h2 className="text-2xl font-black uppercase">Your Organizations</h2>
        </div>
      </div>

      {/* Total Impact Summary */}
      {totalMembers > 0 && (
        <div className="bg-brutal-yellow text-brutal-yellow-foreground border-4 border-primary p-4 mb-6 flex items-center gap-4">
          <TrendingUp className="w-6 h-6" />
          <div>
            <div className="text-2xl font-black">{totalMembers} MEMBERS</div>
            <div className="text-sm font-bold">Across your organizations</div>
          </div>
        </div>
      )}

      {/* Organizations List */}
      <div className="space-y-4">
        {created.map((org) => (
          <div
            key={org.id}
            className="border-4 border-primary p-4 bg-background hover:bg-brutal-yellow/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black uppercase">{org.name}</h3>
                  <div
                    className={`${statusColors[org.status as keyof typeof statusColors] || "bg-background"} border-4 border-primary px-3 py-1 text-xs font-black uppercase flex items-center gap-2`}
                  >
                    {statusIcons[org.status as keyof typeof statusIcons]}
                    {org.status}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm font-bold">
                  <div>
                    <span className="text-muted-foreground">Members: </span>
                    <span className="text-brutal-pink text-lg font-black">{org.memberCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/organizations/${org.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-4 border-primary font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all uppercase"
                  >
                    VIEW
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
