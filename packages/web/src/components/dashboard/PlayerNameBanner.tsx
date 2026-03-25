"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { Input } from "@/components/retroui/Input"
import { Pencil, X, Check, Gamepad2 } from "lucide-react"
import type { DashboardUser } from "@/types/dashboard"

const STORAGE_KEY = "playerNameBannerDismissed"

interface PlayerNameBannerProps {
  user: DashboardUser
  referralLink: string
  onUserChange: (user: DashboardUser) => void
  onRefresh: () => void
}

export function PlayerNameBanner({
  user,
  referralLink,
  onUserChange,
  onRefresh,
}: PlayerNameBannerProps) {
  const [dismissed, setDismissed] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(user.username || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true")
  }, [])

  useEffect(() => {
    setDraft(user.username || "")
  }, [user.username])

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setDismissed(true)
  }

  const handleDraftChange = (value: string) => {
    setDraft(value.replace(/[^a-zA-Z0-9_-]/g, ""))
    setError(null)
  }

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (trimmed.length < 3 || trimmed.length > 24) {
      setError("Must be 3-24 characters.")
      return
    }

    try {
      setSaving(true)
      setError(null)
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update player name")
      }

      onUserChange({ ...user, username: trimmed })
      onRefresh()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="relative bg-brutal-yellow border-4 border-primary p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 hover:bg-foreground/10 rounded-sm transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5 stroke-[3px]" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Gamepad2 className="h-6 w-6 stroke-[3px]" />
        <p className="text-sm font-black uppercase tracking-widest">
          Your Player Name
        </p>
      </div>

      {!editing ? (
        <>
          <p className="text-3xl sm:text-4xl font-black uppercase mb-2">
            {user.username || "NOT SET"}
          </p>
          <p className="font-bold text-sm mb-1">
            This is your referral code. Share it to recruit voters and earn VOTE tokens.
          </p>
          <p className="font-bold text-xs text-muted-foreground mb-4 break-all">
            {referralLink}
          </p>
          <Button
            onClick={() => setEditing(true)}
            className="border-4 border-primary bg-background hover:bg-background/80 text-foreground font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Pencil className="h-4 w-4 mr-2 stroke-[3px]" />
            Change It
          </Button>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-2">
            <Input
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              className="border-4 border-primary bg-background font-black text-lg uppercase"
              placeholder="your-player-name"
              maxLength={24}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave()
                if (e.key === "Escape") setEditing(false)
              }}
            />
            <Button
              onClick={handleSave}
              disabled={saving}
              className="border-4 border-primary bg-brutal-pink hover:bg-brutal-pink/80 text-brutal-pink-foreground font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0"
            >
              <Check className="h-4 w-4 mr-1 stroke-[3px]" />
              {saving ? "..." : "Lock It In"}
            </Button>
          </div>
          <p className="font-bold text-xs text-muted-foreground">
            3-24 characters. Letters, numbers, hyphens, and underscores.
          </p>
          {error && (
            <p className="font-bold text-sm text-destructive mt-2">{error}</p>
          )}
        </>
      )}
    </Card>
  )
}
