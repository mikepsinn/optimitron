"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  ExternalLink,
  MailCheck,
  MailX,
  Search,
  ShieldCheck,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { buildRoute, ROUTES } from "@/lib/routes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type UserAdminFilter = "ADMINS" | "UNVERIFIED"

type AdminUser = {
  id: string
  email: string
  name: string | null
  username: string | null
  isAdmin: boolean
  emailVerified: Date | null
  newsletterSubscribed: boolean
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  organization: { id: string; name: string } | null
  _count: {
    createdOrganizations: number
    socialAccounts: number
  }
}

interface AdminUsersClientProps {
  users: AdminUser[]
  counts: {
    total: number
    admins: number
    unverified: number
  }
  currentFilter?: UserAdminFilter
  currentAdminId: string
}

type SortKey = "name" | "email" | "organization" | "createdAt" | "orgsCreated" | "verified"
type SortDir = "asc" | "desc"

export function AdminUsersClient({
  users,
  counts,
  currentFilter,
  currentAdminId,
}: AdminUsersClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const getFilterUrl = (filter?: UserAdminFilter) =>
    filter ? `${ROUTES.adminUsers}?filter=${filter}` : ROUTES.adminUsers

  const handleAdminChange = async (userId: string, isAdmin: boolean) => {
    setIsUpdating(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update user")
      router.refresh()
    } catch (error) {
      console.error("Error updating user:", error)
      alert(error instanceof Error ? error.message : "Failed to update user. Please try again.")
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
      ? users.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            u.name?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q) ||
            u.organization?.name.toLowerCase().includes(q)
        )
      : users

    const sorted = [...filtered].sort((a, b) => {
      let av: string | number = ""
      let bv: string | number = ""
      switch (sortKey) {
        case "name":
          av = (a.name || a.username || a.email).toLowerCase()
          bv = (b.name || b.username || b.email).toLowerCase()
          break
        case "email":
          av = a.email.toLowerCase()
          bv = b.email.toLowerCase()
          break
        case "organization":
          av = (a.organization?.name || "").toLowerCase()
          bv = (b.organization?.name || "").toLowerCase()
          break
        case "createdAt":
          av = new Date(a.createdAt).getTime()
          bv = new Date(b.createdAt).getTime()
          break
        case "orgsCreated":
          av = a._count.createdOrganizations
          bv = b._count.createdOrganizations
          break
        case "verified":
          av = a.emailVerified ? 1 : 0
          bv = b.emailVerified ? 1 : 0
          break
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return sorted
  }, [users, search, sortKey, sortDir])

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header + search */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-2">USER MANAGEMENT</h1>
            <p className="text-lg font-bold text-muted-foreground">
              Search accounts and manage admin access with server-side safeguards
            </p>
          </div>
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search email, name, username, org..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10 border-4 border-primary font-bold"
            />
          </div>
        </div>

        <Card className="border-4 border-primary mb-4 bg-brutal-yellow">
          <CardContent className="py-3">
            <p className="font-bold text-sm">
              Admin access changes are server-gated. You cannot remove your own admin access, and
              the last remaining admin cannot be demoted.
            </p>
          </CardContent>
        </Card>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip
            active={!currentFilter}
            onClick={() => router.push(getFilterUrl())}
            label={`All (${counts.total})`}
            icon={<Users className="h-3 w-3" />}
          />
          <FilterChip
            active={currentFilter === "ADMINS"}
            onClick={() =>
              router.push(
                currentFilter === "ADMINS" ? getFilterUrl() : getFilterUrl("ADMINS")
              )
            }
            label={`Admins (${counts.admins})`}
            color="cyan"
            icon={<ShieldCheck className="h-3 w-3" />}
          />
          <FilterChip
            active={currentFilter === "UNVERIFIED"}
            onClick={() =>
              router.push(
                currentFilter === "UNVERIFIED" ? getFilterUrl() : getFilterUrl("UNVERIFIED")
              )
            }
            label={`Unverified (${counts.unverified})`}
            color="pink"
            icon={<MailX className="h-3 w-3" />}
          />
          <div className="ml-auto text-xs font-bold text-muted-foreground self-center">
            {sortedAndFiltered.length} shown
          </div>
        </div>

        {/* Table */}
        <Card className="border-4 border-primary p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-foreground text-background">
              <tr>
                <th className="text-left px-3 py-3"><SortHeader label="Name" k="name" /></th>
                <th className="text-left px-3 py-3"><SortHeader label="Email" k="email" /></th>
                <th className="text-left px-3 py-3"><SortHeader label="Verified" k="verified" /></th>
                <th className="text-left px-3 py-3"><SortHeader label="Organization" k="organization" /></th>
                <th className="text-right px-3 py-3"><SortHeader label="Orgs" k="orgsCreated" /></th>
                <th className="text-left px-3 py-3"><SortHeader label="Joined" k="createdAt" /></th>
                <th className="text-left px-3 py-3 font-black uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center font-bold text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                sortedAndFiltered.map((user) => {
                  const displayName = user.name || user.username || user.email.split("@")[0]
                  const isCurrentAdmin = user.id === currentAdminId
                  return (
                    <tr
                      key={user.id}
                      className="border-t-2 border-primary hover:bg-brutal-yellow/20"
                    >
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-black">{displayName}</span>
                          {user.isAdmin && (
                            <Badge className="bg-brutal-cyan border-2 border-primary font-black text-[10px]">
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> ADMIN
                            </Badge>
                          )}
                        </div>
                        {user.username && (
                          <div className="text-[11px] font-mono text-muted-foreground">
                            @{user.username}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top font-bold truncate max-w-[220px]">
                        {user.email}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {user.emailVerified ? (
                          <Badge className="bg-brutal-yellow border-2 border-primary font-black text-[10px]">
                            <MailCheck className="h-2.5 w-2.5 mr-0.5" /> YES
                          </Badge>
                        ) : (
                          <Badge className="bg-brutal-pink border-2 border-primary font-black text-[10px]">
                            <MailX className="h-2.5 w-2.5 mr-0.5" /> NO
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top font-bold">
                        {user.organization ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {user.organization.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top font-bold text-right">
                        {user._count.createdOrganizations}
                      </td>
                      <td className="px-3 py-3 align-top font-bold whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {user.username && user.isPublic && (
                            <Link
                              href={buildRoute.userProfile(user.username)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-2 border-primary font-bold h-8"
                                title="View public profile"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            onClick={() => handleAdminChange(user.id, !user.isAdmin)}
                            disabled={isUpdating === user.id || isCurrentAdmin}
                            size="sm"
                            className={cn(
                              "border-2 border-primary font-bold h-8 text-xs",
                              user.isAdmin
                                ? "bg-brutal-pink text-foreground hover:bg-brutal-pink/80"
                                : "bg-brutal-cyan text-foreground hover:bg-brutal-cyan/80"
                            )}
                            title={
                              isCurrentAdmin
                                ? "You can't change your own admin status"
                                : user.isAdmin
                                ? "Remove admin"
                                : "Make admin"
                            }
                          >
                            {isCurrentAdmin
                              ? "You"
                              : isUpdating === user.id
                              ? "…"
                              : user.isAdmin
                              ? "Demote"
                              : "Promote"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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
