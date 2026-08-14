"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import type { Prisma } from "@optimitron/db"
import { OrgStatus } from "@optimitron/db/enums"
import { getSiteConfig } from "@/lib/site-config"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Organization = Prisma.OrganizationGetPayload<{
  select: {
    id: true
    name: true
    slug: true
    status: true
    type: true
    website: true
    contactEmail: true
    createdAt: true
    updatedAt: true
  }
}>

interface AdminOrganizationsClientProps {
  organizations: Organization[]
  counts: {
    pending: number
    approved: number
    rejected: number
  }
  currentFilter?: OrgStatus
}

type SortKey = "name" | "status" | "type" | "contactEmail" | "createdAt"
type SortDir = "asc" | "desc"

export function AdminOrganizationsClient({
  organizations,
  counts,
  currentFilter,
}: AdminOrganizationsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const handleStatusChange = async (orgId: string, newStatus: OrgStatus) => {
    setIsUpdating(orgId)
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update organization")
      router.refresh()
    } catch (error) {
      console.error("Error updating organization:", error)
      alert("Failed to update organization. Please try again.")
    } finally {
      setIsUpdating(null)
    }
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedAndFiltered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const filtered = q
      ? organizations.filter(
          (org) =>
            org.name.toLowerCase().includes(q) ||
            org.slug?.toLowerCase().includes(q) ||
            org.contactEmail?.toLowerCase().includes(q) ||
            org.type?.toLowerCase().includes(q)
        )
      : organizations

    const sorted = [...filtered].sort((a, b) => {
      let av: string | number = ""
      let bv: string | number = ""
      switch (sortKey) {
        case "name":
          av = a.name.toLowerCase()
          bv = b.name.toLowerCase()
          break
        case "status":
          av = a.status
          bv = b.status
          break
        case "type":
          av = a.type || ""
          bv = b.type || ""
          break
        case "contactEmail":
          av = (a.contactEmail || "").toLowerCase()
          bv = (b.contactEmail || "").toLowerCase()
          break
        case "createdAt":
          av = new Date(a.createdAt).getTime()
          bv = new Date(b.createdAt).getTime()
          break
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [organizations, search, sortKey, sortDir])

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  const StatusBadge = ({ status }: { status: OrgStatus }) => {
    switch (status) {
      case OrgStatus.PENDING:
        return (
          <Badge className="bg-brutal-yellow border-2 border-primary font-black">
            <Clock className="h-3 w-3 mr-1" /> PENDING
          </Badge>
        )
      case OrgStatus.APPROVED:
        return (
          <Badge className="bg-brutal-cyan border-2 border-primary font-black">
            <CheckCircle className="h-3 w-3 mr-1" /> APPROVED
          </Badge>
        )
      case OrgStatus.REJECTED:
        return (
          <Badge className="bg-brutal-pink border-2 border-primary font-black">
            <XCircle className="h-3 w-3 mr-1" /> REJECTED
          </Badge>
        )
    }
  }

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => {
    const active = sortKey === k
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown
    return (
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={cn(
          "inline-flex items-center gap-1 font-black uppercase text-xs hover:text-brutal-pink transition-colors",
          active && "text-brutal-pink"
        )}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    )
  }

  const renderActions = (org: Organization) => (
    <div className="flex flex-wrap gap-2">
      {org.slug && (
        <Link href={`/organizations/${org.slug}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-2 border-primary font-bold"
          >
            Manage
          </Button>
        </Link>
      )}
      {org.status === OrgStatus.PENDING && (
        <>
          <Button
            aria-label={`Approve ${org.name}`}
            onClick={() => handleStatusChange(org.id, OrgStatus.APPROVED)}
            disabled={isUpdating === org.id}
            size="sm"
            className="h-8 border-2 border-primary bg-brutal-cyan font-bold text-foreground hover:bg-brutal-cyan/80"
          >
            <CheckCircle className="h-3 w-3" />
          </Button>
          <Button
            aria-label={`Reject ${org.name}`}
            onClick={() => handleStatusChange(org.id, OrgStatus.REJECTED)}
            disabled={isUpdating === org.id}
            size="sm"
            className="h-8 border-2 border-primary bg-brutal-pink font-bold text-foreground hover:bg-brutal-pink/80"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        </>
      )}
      {org.status === OrgStatus.APPROVED && org.slug && (
        <Link href={`/survey/${org.slug}`} target="_blank">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-2 border-primary font-bold"
            title="View survey page"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header + search */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-2">
              PARTNER ORGANIZATIONS
            </h1>
            <p className="text-lg font-bold text-muted-foreground">
              Manage partner organization applications
            </p>
          </div>
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search name, slug, email, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-4 border-primary font-bold"
            />
          </div>
        </div>

        {/* Status filter chips (compact, not big cards) */}
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip
            active={!currentFilter}
            onClick={() => router.push("/admin/organizations")}
            label={`All (${counts.pending + counts.approved + counts.rejected})`}
          />
          <FilterChip
            active={currentFilter === OrgStatus.PENDING}
            onClick={() =>
              router.push(
                currentFilter === OrgStatus.PENDING
                  ? "/admin/organizations"
                  : "/admin/organizations?status=PENDING"
              )
            }
            label={`Pending (${counts.pending})`}
            color="yellow"
            icon={<Clock className="h-3 w-3" />}
          />
          <FilterChip
            active={currentFilter === OrgStatus.APPROVED}
            onClick={() =>
              router.push(
                currentFilter === OrgStatus.APPROVED
                  ? "/admin/organizations"
                  : "/admin/organizations?status=APPROVED"
              )
            }
            label={`Approved (${counts.approved})`}
            color="cyan"
            icon={<CheckCircle className="h-3 w-3" />}
          />
          <FilterChip
            active={currentFilter === OrgStatus.REJECTED}
            onClick={() =>
              router.push(
                currentFilter === OrgStatus.REJECTED
                  ? "/admin/organizations"
                  : "/admin/organizations?status=REJECTED"
              )
            }
            label={`Rejected (${counts.rejected})`}
            color="pink"
            icon={<XCircle className="h-3 w-3" />}
          />
          <div className="ml-auto text-xs font-bold text-muted-foreground self-center">
            {sortedAndFiltered.length} shown
          </div>
        </div>

        {/* Mobile cards + desktop table */}
        <Card className="overflow-hidden border-4 border-primary p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="divide-y-2 divide-primary md:hidden">
            {sortedAndFiltered.length === 0 ? (
              <div className="px-4 py-12 text-center font-bold text-muted-foreground">
                No organizations found
              </div>
            ) : (
              sortedAndFiltered.map((org) => (
                <article key={org.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-black">{org.name}</h2>
                      {org.slug && (
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {getSiteConfig().domain}/survey/{org.slug}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={org.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-[10px] font-black uppercase text-muted-foreground">Type</dt>
                      <dd className="font-bold">{org.type || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-black uppercase text-muted-foreground">Applied</dt>
                      <dd className="font-bold">{formatDate(org.createdAt)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] font-black uppercase text-muted-foreground">Contact</dt>
                      <dd className="break-all font-bold">{org.contactEmail || "—"}</dd>
                    </div>
                  </dl>
                  {renderActions(org)}
                </article>
              ))
            )}
          </div>

          <table className="hidden w-full text-sm md:table">
            <thead className="bg-foreground text-background">
              <tr>
                <th className="text-left px-3 py-3"><SortHeader label="Name" k="name" /></th>
                <th className="text-left px-3 py-3"><SortHeader label="Status" k="status" /></th>
                <th className="text-left px-3 py-3"><SortHeader label="Type" k="type" /></th>
                <th className="text-left px-3 py-3"><SortHeader label="Contact" k="contactEmail" /></th>
                <th className="text-left px-3 py-3"><SortHeader label="Applied" k="createdAt" /></th>
                <th className="text-left px-3 py-3 font-black uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center font-bold text-muted-foreground">
                    No organizations found
                  </td>
                </tr>
              ) : (
                sortedAndFiltered.map((org) => (
                  <tr key={org.id} className="border-t-2 border-primary hover:bg-brutal-yellow/20">
                    <td className="px-3 py-3 align-top">
                      <div className="font-black">{org.name}</div>
                      {org.slug && (
                        <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[260px]">
                          {getSiteConfig().domain}/survey/{org.slug}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <StatusBadge status={org.status} />
                    </td>
                    <td className="px-3 py-3 align-top font-bold">{org.type || "—"}</td>
                    <td className="px-3 py-3 align-top font-bold">{org.contactEmail}</td>
                    <td className="px-3 py-3 align-top font-bold whitespace-nowrap">
                      {formatDate(org.createdAt)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {renderActions(org)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  color,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: "yellow" | "cyan" | "pink"
  icon?: React.ReactNode
}) {
  const bg = active
    ? color === "yellow"
      ? "bg-brutal-yellow"
      : color === "cyan"
      ? "bg-brutal-cyan"
      : color === "pink"
      ? "bg-brutal-pink"
      : "bg-foreground text-background"
    : "bg-background"
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 border-4 border-primary px-3 py-1.5 font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all",
        bg
      )}
    >
      {icon}
      {label}
    </button>
  )
}
